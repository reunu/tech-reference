# unu-dashboard-ui

## Description

The dashboard UI service provides the primary user interface for the scooter. Built with Qt/QML, it displays speed, battery status, navigation, and system information. The service subscribes to all other services via Redis pub/sub, displays real-time data, and provides limited control functions (auto-lock on battery timeout).

**Note:** Detailed documentation for the dashboard is available in the [dashboard/](../dashboard/) directory. This page provides a summary and quick reference.

## Version

Not available via command-line (binary name on DBC not confirmed yet).

## Command-Line Options

```
options:
 -b <bindaddress>         Redis server bind address (default: 127.0.0.1)
 -p <redisport>           Redis server port (default: 6379)
 --showFps                Show FPS counter in top bar
 --show-internet-details  Show connection type and signal strength in top bar
 --debug-gps              Show GPS coordinates on screen
 --screenshot <delay>     Take screenshot after startup delay in seconds
 --disable-poweroff       Disable system poweroff during shutdown
```

See [dashboard/README.md](../dashboard/README.md) for complete documentation.

## Redis Operations

### Subscriptions (SUBSCRIBE)

The dashboard subscribes to these channels:
- `aux-battery`
- `battery:0`, `battery:1`
- `ble`
- `cb-battery`
- `dashboard`
- `engine-ecu`
- `gps`
- `internet`
- `navigation`
- `navigation:coord`
- `scooter`
- `scooter-activation`
- `settings`
- `system`
- `vehicle`

### BLPOP Command Lists

The dashboard uses BLPOP to read commands:
- `scooter:dashboard-mode` - Mode control (speedometer/navigation/debug)
- `scooter:navigation` - Navigation commands (never written by dashboard)
- `scooter:state` - State commands (dashboard only writes "lock")

### HGET/HGETALL Reads

The dashboard reads from approximately 16 different Redis hashes. See [dashboard/REDIS.md](../dashboard/REDIS.md) for complete list.

### HSET Writes

The dashboard writes to:
- `dashboard ready` - Set to "true" after serial number read
- `dashboard serial-number` - Hardware serial from sysfs
- `dashboard mode` - Current display mode
- `system dbc-version` - Version from /etc/os-release
- `navigation status` - Navigation status updates
- `scooter state` - Triggered by user actions

### LPUSH Commands

The dashboard only pushes:
- `LPUSH scooter:state lock` - On battery timeout notifications

See [dashboard/REDIS.md](../dashboard/REDIS.md) for complete Redis operations reference.

## Display Modes

- **speedometer** - Default mode showing speed and status
- **navigation** - Map view with route guidance (vestigial, non-functional)
- **debug** - Development diagnostics (partially broken)

Activate debug mode:
```bash
LPUSH scooter:dashboard-mode debug
```

## Hardware Interfaces

### Display

- Integrated display on Dashboard Controller (DBC)
- Resolution and specs vary by hardware version

### System Files Read

**Serial Number:**
- `/sys/fsl_otp/HW_OCOTP_CFG0` - Hardware serial (hex)
- `/sys/fsl_otp/HW_OCOTP_CFG1` - Hardware serial (hex)

**OS Version:**
- `/etc/os-release` - VERSION_ID and BUILD_ID fields

### System Commands

- `poweroff` - Executed during shutdown (unless `--disable-poweroff`)

## Configuration

### Systemd Unit

- **Unit file:** Likely `/usr/lib/systemd/system/unu-dashboard-ui.service` (on DBC)
- **Started by:** systemd at boot
- **Restart policy:** Always

## Observable Behavior

### Startup Sequence

1. Connects to Redis (default 127.0.0.1:6379, or custom via `-b`/`-p`)
2. Subscribes to all service channels
3. Reads OS version from `/etc/os-release`
4. Sets `system dbc-version` to VERSION_ID+BUILD_ID
5. Reads hardware serial from sysfs
6. Sets `dashboard serial-number`
7. Sets `dashboard ready true` (only if serial read succeeds)
8. Starts in speedometer mode
9. Begins polling non-published properties

### Shutdown Behavior

When `vehicle state` becomes "shutting-down":
1. Sets `dashboard ready false`
2. Executes `poweroff` command after 2-second delay
3. Can be disabled with `--disable-poweroff` flag

### Battery Timeout Notifications

When battery charge becomes critically low:
- Dashboard receives timeout notification (AutomaticTurnOffMainBatteryNotification or AutomaticTurnOffAuxBatteryNotification)
- Automatically executes: `LPUSH scooter:state lock`
- This triggers vehicle shutdown

## UI Components

- **Status bar:** Time, connection status, odometer, battery, Bluetooth, seatbox
- **Central display:** Speedometer, navigation, or debug view
- **Notifications:** Battery warnings, system alerts, faults

See [dashboard/README.md](../dashboard/README.md) for UI details.

## Log Output

The dashboard logs to journald. Common messages:
- `"Could not read serial number. NOT setting dashboard:ready = true"`
- `"Could not load translations for any of the languages requested"`
- `"Power off is disabled."`
- `"Could not power off the system!"`
- `"Could not set up keep-alive socket, Redis connection handling might not work properly"`
- `"Could not find enum for [value]"`

Use `journalctl -u unu-dashboard-ui` to view logs (service name may vary).

## Dependencies

- **Redis server** - All other services via Redis
- **Qt/QML runtime** - Graphics framework
- **Display hardware** - Integrated display on DBC
- **Serial number files** - Must be readable from sysfs

## Related Documentation

- **[dashboard/README.md](../dashboard/README.md)** - Complete dashboard documentation
- **[dashboard/REDIS.md](../dashboard/REDIS.md)** - Comprehensive Redis operations reference
- [Redis Operations](../redis/README.md) - Dashboard hash fields
- [States](../states/README.md) - How dashboard displays vehicle states
