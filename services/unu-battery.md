# unu-battery

## Description

The battery service monitors the two main battery slots (battery:0 and battery:1) via NFC readers. Each battery has an NFC tag that provides battery management data including state, charge level, cycle count, and fault codes. The service communicates with batteries through NFC when they are inserted and active.

## Version

```
unu-battery v1.0.0-43-g68f8eb9
usk v1.4.0-13-ge899b26
unu-nfc v1.0.0-18-g6caaa21
```

## Command-Line Options

```
options:
 -v --version                  Prints the version info
 -h --help                     Prints this help
 -s --redis_server <ADDR>      Redis server address, e.g. localhost
 -p --redis_port <PORT>        Redis server port, e.g. 6379
 -o --off_update_time <SEC>    Update time when off in seconds, e.g. 1800
 -b --heartbeat_timeout <SEC>  Heartbeat time in seconds, e.g. 30
 -m --test_main_power          Enables main-power test mode. This checks that the main-power is
                               never off when it should be on, and quits the program if it is.
 -l --log0 <LEVEL>             battery:0 log level: 0=NONE, 1=ERROR, 2=WARN, 3=INFO, 4=DEBUG
 -L --log1 <LEVEL>             battery:1 log level: 0=NONE, 1=ERROR, 2=WARN, 3=INFO, 4=DEBUG
 -d --device0 <DEV>            battery:0 device, e.g. /dev/pn5xx_i2c0
 -D --device1 <DEV>            battery:1 device, e.g. /dev/pn5xx_i2c1
```

## Redis Operations

### Hash: `battery:0` and `battery:1`

**Fields written:**
- `state` - Battery state ("unknown", "asleep", "idle", "active")
- `present` - Battery presence ("true" or "false")
- `charge` - State of charge percentage (0-100)
- `cycle-count` - Battery cycle count
- `temperature:0` - Battery temperature sensor 0 (°C)
- `temperature:1` - Battery temperature sensor 1 (°C)
- `temperature:2` - Battery temperature sensor 2 (°C)
- `temperature:3` - Battery temperature sensor 3 (°C)
- `temperature-state` - Temperature status ("unknown", "cold", "hot", "ideal")
- `current` - Battery current (mA)
- `voltage` - Battery voltage (mV)
- `state-of-health` - Battery health percentage (0-100)
- `serial-number` - Battery serial number
- `manufacturing-date` - Manufacturing date
- `fw-version` - Firmware version

**Published channels:** `battery:0`, `battery:1`

### Lists consumed (BRPOP)

- `battery:0:power` - Battery 0 power commands ("on", "off")
- `battery:1:power` - Battery 1 power commands ("on", "off")

These commands control whether the battery high-current path is enabled.

## Hardware Interfaces

### NFC Readers

- **Device 0:** `/dev/pn5xx_i2c0` (default, configurable via `-d`)
- **Device 1:** `/dev/pn5xx_i2c1` (default, configurable via `-D`)
- **Chip:** PN7150 NFC controller (I2C interface)

Each battery slot has a dedicated NFC reader to communicate with the battery's NFC tag.

### Battery Communication Protocol

- Batteries have NFC tags with battery management data
- Service wakes up batteries from sleep via NFC
- Reads battery parameters via NFC commands
- Monitors battery state transitions

## Configuration

### Systemd Unit

- **Unit file:** `/usr/lib/systemd/system/unu-battery.service`
- **Started by:** systemd at boot
- **Restart policy:** Always

## Observable Behavior

### Startup Sequence

1. Opens NFC device interfaces for both battery slots
2. Connects to Redis
3. Initializes NFC readers (PN7150 chips)
4. Starts periodic battery polling
5. Publishes initial battery state

### Runtime Behavior

#### When Battery Inserted

1. NFC tag detected
2. Battery woken from sleep (if asleep)
3. Battery parameters read via NFC
4. State published to Redis `battery:N` hash
5. Publishes to `battery:N` channel

#### Polling Intervals

- **Active mode:** Frequent polling (subsecond intervals)
- **Off mode:** Slower polling (`--off_update_time` parameter, default 1800 seconds)
- **Heartbeat:** Timeout detection (`--heartbeat_timeout` parameter, default 30 seconds)

#### Battery States

- **unknown:** Cannot determine battery state
- **asleep:** Battery in lowest power mode
- **idle:** Battery systems on, high-current path disabled
- **active:** High-current path enabled, ready for driving/charging

State transitions are triggered by:
- Battery power commands (`LPUSH battery:N:power on/off`)
- Battery internal conditions
- NFC communication status

### Battery Power Commands

The service consumes commands from Redis lists:
```
LPUSH battery:0:power on    # Enable battery 0 high-current path
LPUSH battery:0:power off   # Disable battery 0 high-current path
LPUSH battery:1:power on    # Enable battery 1 high-current path
LPUSH battery:1:power off   # Disable battery 1 high-current path
```

These commands are typically issued by `unu-vehicle` based on vehicle state.

### Test Mode

When started with `-m --test_main_power`, the service verifies that main power is never unexpectedly off. If a violation is detected, the service exits. This is used for debugging power management issues.

### Fault Detection

The service monitors for various battery faults and publishes them as a space-separated list in the `fault` field. Common faults include:
- Communication errors
- Over-temperature
- Over-current
- Cell imbalance

## Log Output

The service logs to journald with separate log levels for each battery slot:
- `--log0` - Battery slot 0 log level
- `--log1` - Battery slot 1 log level

Common log messages include:
- NFC communication errors
- Battery state transitions
- Fault conditions
- Heartbeat timeouts

Use `journalctl -u unu-battery` to view logs.

## Dependencies

- **PN7150 NFC readers** - Must be accessible via I2C
- **Redis server** - Must be running at specified host:port
- **Battery NFC tags** - Batteries must have functional NFC tags

## Related Documentation

- [Electronic Components](../electronic/README.md) - PN7150 NFC reader details
- [Redis Operations](../redis/README.md) - Battery hash fields
- [States](../states/README.md) - Battery state definitions
