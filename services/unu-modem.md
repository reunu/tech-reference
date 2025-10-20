# unu-modem

## Description

The modem service manages the cellular modem (SimCom SIM7100E) for internet connectivity and GPS functionality. It monitors network registration, signal quality, access technology (2G/3G/4G), handles modem power management, manages network connectivity, and provides GPS coordinates. The service also monitors cloud connectivity and performs USB recovery on repeated failures.

## Version

```
unu-modem 0.1.0-168-gd4e5c8b
```

## Command-Line Options

```
unu modem for managing modem and gps
Copyright (c) 2020 unu GmbH
options:
 -l --log <LEVEL>           Sets the log level upto given argument LEVEL:
                            0=NONE, 1=ERROR, 2=WARN, 3=INFO, 4=DEBUG
 -s --redis_server          Address of the redis server
 -p --redis_port            Port of the redis server
 -t --polling_time          polling time for modem and GPS information
 -i --network_interface     The interface from which to fetch the IP address
 -f --internet_check_timer  Periodic timer (seconds) to check for internet when 'disconnected'.
                            When 'connected', `internet_check_timer * 10` is used.
                            Should be larger than 10 (curl timeout).
 -R --recovery_limit <N>    Run the USB device recovery after N modem enable|disable failures
 -V --version               Prints the version info
 -h --help                  Prints this help
```

## Redis Operations

### Hash: `internet`

**Fields written:**
- `modem-state` - Modem state (various status strings including "off", recovery states, etc.)
- `status` - Internet connection status ("connected", "disconnected")
- `ip-address` - Assigned IP address
- `access-tech` - Access technology ("LTE", "UMTS", "HSPA", "EDGE", "GPRS", "GSM", etc.)
- `signal-quality` - Signal strength (0-100)
- `sim-imei` - SIM IMEI identifier
- `sim-iccid` - SIM ICCID identifier

**Published channel:** `internet`

### Hash: `gps`

**Fields written:**
- `latitude` - GPS latitude (decimal degrees)
- `longitude` - GPS longitude (decimal degrees)
- `altitude` - Altitude in meters
- `speed` - GPS speed in km/h
- `course` - GPS course/heading (0-360 degrees)
- `fix` - GPS fix status ("no-fix", "2d", "3d")
- `satellites` - Number of satellites in use
- `hdop` - Horizontal dilution of precision

**Published channel:** `gps`

### Lists consumed (BRPOP)

None - the service does not consume command lists.

## Hardware Interfaces

### Cellular Modem

- **Model:** SimCom SIM7100E
- **Interface:** USB (appears as multiple ttyUSB devices)
- **AT command port:** Typically `/dev/ttyUSB2`
- **Network interface:** Configurable via `-i` option (e.g., `wwan0`, `ppp0`)

### USB Recovery

The service monitors for modem failures and can perform USB device recovery:
- **Recovery limit:** Configurable via `-R` option
- **Trigger:** After N consecutive modem enable/disable failures
- **Action:** Resets USB device to recover from hung state

## Configuration

### Systemd Unit

- **Unit file:** `/usr/lib/systemd/system/unu-modem.service`
- **Started by:** systemd at boot
- **Restart policy:** Always

### Network Configuration

The modem typically uses:
- **APN:** Configured externally (via NetworkManager or similar)
- **Interface:** wwan0 or ppp0
- **DNS:** Provided by mobile operator

## Observable Behavior

### Startup Sequence

1. Initializes modem communication (AT commands)
2. Powers on modem
3. Connects to Redis
4. Reads network interface configuration
5. Starts polling loops:
   - Modem status polling
   - GPS polling
   - Internet connectivity checks
6. Publishes initial state

### Runtime Behavior

#### Modem Polling

- **Poll interval:** Configurable via `-t` option
- **Monitored parameters:**
  - Signal quality (RSSI)
  - Network registration
  - Access technology
  - Operator name
  - IP address

#### Internet Connectivity Checks

- **Check method:** curl to known URL (likely cloud endpoint)
- **Timeout:** 10 seconds (hardcoded in curl)
- **When disconnected:** Check every `internet_check_timer` seconds
- **When connected:** Check every `internet_check_timer * 10` seconds

The service distinguishes between:
- **Internet connected:** General internet access working
- **Cloud connected:** Specific unu cloud endpoint reachable

This allows detecting internet connectivity issues vs. cloud-specific problems.

#### Access Technology Mapping

The service reports human-readable access technology:
- `LTE` - 4G LTE
- `UMTS` - 3G UMTS
- `HSPA` - 3G HSPA/HSPA+
- `EDGE` - 2.5G EDGE
- `GPRS` - 2G GPRS
- `GSM` - 2G GSM

Signal quality and bar display (dashboard) adapt based on access technology.

#### GPS Behavior

- **Poll interval:** Same as modem polling (`-t` option)
- **Data source:** Modem's integrated GNSS receiver
- **Fix types:** no-fix, 2D (lat/long only), 3D (lat/long/altitude)

GPS data is published even without a fix (shows "no-fix" status).

#### Fault Detection

Common faults published to `fault` field:
- Modem communication failure
- Network registration failure
- SIM card errors
- USB device errors
- GPS errors

#### USB Recovery Procedure

When recovery limit is reached:
1. Service detects repeated modem failures
2. Performs USB device reset (via sysfs)
3. Reinitializes modem
4. Resets failure counter on success

This recovers from:
- Modem firmware hangs
- USB communication errors
- Driver issues

## Log Output

The service logs to journald. Common log patterns:
- Modem AT command exchanges
- Network registration events
- Internet connectivity changes
- GPS fix acquisition/loss
- USB recovery events
- Fault conditions

Use `journalctl -u unu-modem` to view logs.

## Dependencies

- **SimCom SIM7100E modem** - Must be connected via USB
- **USB drivers** - qmi_wwan, cdc_wdm, or similar
- **Network interface** - wwan0 or ppp0 must be configured
- **Redis server** - At specified host:port
- **curl** - For internet connectivity checks

## Related Documentation

- [Redis Operations](../redis/README.md) - Internet and GPS hash fields
- [Dashboard Redis](../dashboard/REDIS.md) - How dashboard displays connection status
- [States](../states/README.md) - How internet status affects system behavior
