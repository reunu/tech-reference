# unu-engine-ecu

## Description

The engine ECU service communicates with the motor controller (engine/ECU) via CAN bus. It monitors motor speed, throttle state, KERS (kinetic energy recovery system) status, odometer, and fault codes. The service publishes this data to Redis for consumption by the dashboard and other services.

## Version

```
unu-engine-ecu v1.0.0-41-g0fbf539
usk v1.4.0-13-ge899b26
```

## Command-Line Options

```
options:
 -l --log <LEVEL>             Sets the log level upto given argument LEVEL:
                              0=NONE, 1=ERROR, 2=WARN, 3=INFO, 4=DEBUG
 -v --version                 Prints the version info
 -h --help                    Prints this help
 -s --redis_server <ADDRESS>  Redis server address, e.g. localhost
 -p --redis_port <PORT>       Redis server port, e.g. 6379
 -c --can_device <DEVICE>     Sets the CAN device, e.g. can0
```

## Redis Operations

### Hash: `engine-ecu`

**Fields written:**
- `motor:voltage` - Motor voltage in mV
- `motor:current` - Motor current in mA
- `rpm` - Motor RPM
- `speed` - Vehicle speed in km/h
- `throttle` - Throttle state ("on", "off")
- `temperature` - ECU temperature in °C
- `odometer` - Total distance traveled in meters
- `kers` - KERS (regenerative braking) state ("on", "off")
- `fw-version` - Firmware version (hex formatted)
- `kers-reason-off` - Reason KERS is disabled (string)

**Published channel:** `engine-ecu`

### Lists consumed (BRPOP)

None - the service does not consume command lists. It is read-only from the ECU.

## Hardware Interfaces

### CAN Bus

- **CAN device:** Configurable via `-c` option (e.g., `can0`)
- **Interface type:** SocketCAN
- **Connected to:** Motor controller/ECU

The service uses standard Linux SocketCAN to communicate with the motor controller.

### ECU Communication

- Receives periodic CAN messages from ECU
- Parses speed, throttle, KERS, odometer data
- Monitors ECU power state
- Detects fault conditions

## Configuration

### Systemd Unit

- **Unit file:** `/usr/lib/systemd/system/unu-engine-ecu.service`
- **Started by:** systemd at boot
- **Restart policy:** Always

### CAN Bus Setup

The CAN interface must be configured before the service starts:
```bash
ip link set can0 type can bitrate 250000
ip link set can0 up
```

This is typically done by a systemd service or udev rule.

## Observable Behavior

### Startup Sequence

1. Opens SocketCAN device
2. Connects to Redis
3. Starts CAN message reception loop
4. Publishes initial ECU state

### Runtime Behavior

#### CAN Message Processing

- Continuously receives CAN frames from ECU
- Parses relevant CAN IDs for motor data
- Updates Redis hash on value changes
- Publishes to `engine-ecu` channel on updates

#### Speed Monitoring

- Speed reported in km/h
- Typical range: 0-45 km/h
- High update frequency (multiple times per second)
- Dashboard polls `engine-ecu:speed` when vehicle is ready-to-drive

#### KERS (Regenerative Braking)

- Monitors KERS activation state
- Reports reason when KERS is off:
  - Battery full
  - Battery too cold/hot
  - Low brake pressure
  - System fault

#### Odometer

- Total distance in meters
- Monotonically increasing
- Persisted by ECU (survives power cycles)

#### Fault Detection

The service monitors ECU fault codes and publishes them to the `fault` field. Common faults include:
- Over-temperature
- Over-current
- Communication errors
- Sensor failures

### ECU Power State

Monitors ECU power state:
- `on` - ECU responding to CAN
- `off` - ECU not responding
- `unknown` - State cannot be determined

## Log Output

The service logs to journald. Common log patterns:
- CAN bus errors
- ECU communication failures
- Fault code changes
- State transitions

Use `journalctl -u unu-engine-ecu` to view logs.

## Dependencies

- **CAN device** - Must have configured SocketCAN interface
- **ECU/Motor controller** - Must be powered and responsive on CAN bus
- **Redis server** - At specified host:port

## Related Documentation

- [Redis Operations](../redis/README.md) - Engine ECU hash fields
- [Dashboard Redis](../dashboard/REDIS.md) - How dashboard displays ECU data
- [States](../states/README.md) - Vehicle states that affect motor operation
