# Dashboard UI Redis Operations

## Overview

The dashboard UI (dbc-dashboard-ui) is a Qt/QML application that communicates with system services via Redis. It primarily **reads** data from Redis hashes and **subscribes** to Redis pub/sub channels for real-time updates.

## Connection Details

- **Host**: 127.0.0.1 (default, configurable via `-b` option)
- **Port**: 6379 (default, configurable via `-p` option)
- **Client Library**: cpp_redis
- **Keep-alive**: 5 seconds idle timeout, 2 packet count, 3 second intervals
- **Reconnect interval**: 2000ms

## Redis List Operations (BLPOP)

The dashboard uses BLPOP (blocking list pop) to read from these command lists:

### Scooter Command Lists
- `scooter:dashboard-mode` - Dashboard mode control (speedometer/navigation/debug)
- `scooter:navigation` - Navigation control (start/stop) - never written by dashboard
- `scooter:state` - Scooter state commands (lock/unlock) - dashboard only writes "lock"

The dashboard creates separate blocking connections for each command list and continuously polls using BLPOP with timeout 0 (infinite wait).

## Redis Subscriptions (Pub/Sub)

The dashboard subscribes to these channels to receive real-time updates:

- `aux-battery`
- `battery:0`
- `battery:1`
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

## Redis Keys Read (HGET/HGETALL)

**Note:** Properties marked with "Command" flag are read using BLPOP from Redis lists instead of HGET from hashes.

### Auxiliary Battery (`aux-battery`)
- `voltage` - Battery voltage (mV)
- `charge-status` - Charging status string

### Battery Slots (`battery:0`, `battery:1`)
- `state` - Battery state (unknown/asleep/idle/active)
- `present` - Battery presence (boolean)
- `charge` - Charge level (%)
- `charge-valid` - Charge validity flag
- `fault` - Fault codes (RedisSet)

### BLE (`ble`)
- `status` - Connection status (connected/disconnected)
- `pin-code` - Pairing PIN code (temporary)

### CB Battery (`cb-battery`)
- `charge` - Charge level (%)
- `charge-status` - Charging status

### Dashboard (`dashboard`)
- `ready` - Dashboard ready status (boolean)
- `mode` - Display mode (speedometer/navigation/debug)
- `serial-number` - Dashboard hardware serial number
- `debug` - Debug keys (RedisSortedSet via ZRANGE)

### Engine ECU (`engine-ecu`)
- `state` - ECU power state
- `speed` - Vehicle speed (km/h)
- `throttle` - Throttle state (on/off)
- `kers` - KERS state (on/off)
- `kers-reason-off` - Reason KERS is disabled
- `odometer` - Total distance (m)
- `fault` - Fault codes (RedisSet)

### GPS (`gps`)
- `course` - GPS course/heading

### Internet (`internet`)
- `status` - Connection status (connected/disconnected)
- `unu-cloud` - Cloud connection status
- `signal-quality` - Signal strength (0-100)
- `access-tech` - Access technology (LTE, UMTS, etc.)
- `fault` - Fault codes (RedisSet)

### Navigation (`navigation`)
- `status` - Navigation status
- `destination-address` - Destination address string
- `profile` - Navigation profile

### Navigation Coordinates (`navigation:coord`)
- `location` - Current location (packed coordinates)
- `destination` - Destination (packed coordinates)

### Scooter (`scooter`)
- `state` - Scooter state
- `dashboard-mode` - Dashboard mode control
- `navigation` - Navigation control

### Scooter Activation (`scooter-activation`)
- `step` - Activation step
- `error-str` - Error string

### Settings (`settings`)
- `customer:type` - Customer type (D2C, etc.)
- `behavior:must_lock_handlebar` - Must lock handlebar setting (boolean)
- `behavior:poweroff_timeout_with_battery` - Power-off timeout with battery (seconds)
- `behavior:poweroff_timeout_without_battery` - Power-off timeout without battery (seconds)

### System (`system`)
- `mdb-version` - MDB firmware version
- `dbc-version` - DBC firmware version
- `nrf-fw-version` - nRF firmware version

### Vehicle (`vehicle`)
- `state` - Vehicle state (stand-by/parked/ready-to-drive/shutting-down/updating)
- `brake:left` - Left brake state (on/off)
- `brake:right` - Right brake state (on/off)
- `blinker:state` - Blinker active state (on/off)
- `blinker:switch` - Blinker switch position (left/right/both/off)
- `seatbox:button` - Seatbox button state (on/off)
- `seatbox:lock` - Seatbox lock state (open/closed)
- `kickstand` - Kickstand position (up/down)
- `handlebar:position` - Handlebar position (on-place/off-place)
- `handlebar:lock-sensor` - Handlebar lock sensor (locked/unlocked)
- `fault` - Fault codes (RedisSet)

## Redis Keys Written (HSET)

The dashboard writes to these Redis keys (fields marked as "ControlledByDashboard"):

### Dashboard (`dashboard`)
- `ready` - Set to "true" when dashboard initialization completes (only if serial number read succeeds)
- `serial-number` - Hardware serial number read from `/sys/fsl_otp/HW_OCOTP_CFG0` and `/sys/fsl_otp/HW_OCOTP_CFG1` (combined hex value)
- `mode` - Display mode (set based on application state)

### Navigation (`navigation`)
- `status` - Navigation status (updated by dashboard)

### Scooter (`scooter`)
- `state` - Scooter state (triggered by user actions)

### System (`system`)
- `dbc-version` - Set to VERSION_ID+BUILD_ID from `/etc/os-release` on startup

## Redis Commands (LPUSH)

The dashboard pushes commands to this list:

### Scooter State List (`scooter:state`)
- `lock` - Triggered by battery low timeout notifications (AutomaticTurnOffMainBatteryNotification, AutomaticTurnOffAuxBatteryNotification)

## Debug Mode Operations

When debug mode is enabled (via `LPUSH scooter:dashboard-mode debug`):

### Read Operations
- **ZRANGE** `dashboard:debug` 0 -1 WITHSCORES
  - Reads sorted set of debug keys with timestamp scores
  - Each element contains a Redis key to monitor

### Subscriptions
- Dashboard dynamically subscribes to individual keys from the debug sorted set
- Uses pattern matching to determine fetch method (HGET vs ZRANGE vs other)

## Update Frequency

- **Default polling interval**: Calculated as greatest common divisor of all property update frequencies
- **Properties marked Published**: Only updated on pub/sub notification
- **Properties with expiration**: Continuously polled (e.g., keycard authentication)
- **Typical frequency**: 100-500ms for most real-time properties

## Observable Behavior

### Startup Sequence
1. Connects to Redis at 127.0.0.1:6379 (or custom host/port via command-line options)
2. Subscribes to all service channels listed above
3. Reads OS version from `/etc/os-release` (VERSION_ID and BUILD_ID fields)
4. Sets `system:dbc-version` to VERSION_ID+BUILD_ID format
5. Reads hardware serial number from `/sys/fsl_otp/HW_OCOTP_CFG0` and `/sys/fsl_otp/HW_OCOTP_CFG1`
6. Sets `dashboard:serial-number` to the combined serial number value
7. Sets `dashboard:ready` to "true" (only if serial number read succeeds)
8. Starts periodic polling timer for non-published properties

**Note**: If serial number cannot be read, logs warning "Could not read serial number. NOT setting dashboard:ready = true" and does not set the ready flag.

### Mode Switching
- Responds to `scooter:dashboard-mode` changes via BLPOP
- Updates `dashboard:mode` accordingly
- In debug mode, subscribes to keys from `dashboard:debug` sorted set

### Connection Handling
- Uses TCP keep-alive socket to maintain connection
- Automatic reconnection on disconnect (2000ms interval)
- Separate client and subscriber connections for pub/sub
- Logs warning if keep-alive socket setup fails: "Could not set up keep-alive socket, Redis connection handling might not work properly"

### Shutdown Behavior
- When vehicle state becomes "shutting-down", sets `dashboard:ready` to "false"
- Executes `poweroff` system command after a delay (default 2 seconds)
- Poweroff can be disabled via `--disable-poweroff` command-line flag
- Logs "Power off is disabled." if poweroff is disabled
- Logs "Could not power off the system!" if poweroff command fails

## Command-Line Options

The dashboard UI application accepts these command-line options:

| Option | Description | Observable Effect |
|--------|-------------|-------------------|
| `-b <bindaddress>` | Redis server bind address | Changes Redis connection host (default: 127.0.0.1) |
| `-p <redisport>` | Redis server port | Changes Redis connection port (default: 6379) |
| `--showFps` | Show FPS counter | Displays FPS counter in top bar |
| `--show-internet-details` | Show internet details | Shows connection type and signal strength in top bar |
| `--debug-gps` | Show GPS coordinates | Displays GPS coordinates on screen |
| `--screenshot <delay>` | Take screenshot after startup | Captures screenshot after specified delay in seconds |
| `--disable-poweroff` | Disable system poweroff | Prevents execution of `poweroff` command during shutdown |

## Files Read/Written

### Files Read on Startup
- `/sys/fsl_otp/HW_OCOTP_CFG0` - Hardware serial number (first part, hex format)
- `/sys/fsl_otp/HW_OCOTP_CFG1` - Hardware serial number (second part, hex format)
- `/etc/os-release` - OS version information (VERSION_ID and BUILD_ID fields)

### System Commands Executed
- `poweroff` - Executed during shutdown sequence (unless disabled via `--disable-poweroff`)

## Log Output Examples

Common log messages output by the dashboard UI:

### Warning Messages
- `"Could not read serial number. NOT setting dashboard:ready = true"` - Serial number files not accessible
- `"Could not load translations for any of the languages requested: [language list]"` - Translation file loading failure
- `"Power off is disabled."` - Poweroff attempted but disabled via flag
- `"Could not power off the system!"` - Poweroff command execution failed
- `"Could not set up keep-alive socket, Redis connection handling might not work properly"` - Socket configuration issue
- `"Could not find enum for [value]"` - Redis value doesn't match expected enum

### Application Info
- **Application name**: unu-dashboard-ui
