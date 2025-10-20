# unu-bluetooth

## Description

The Bluetooth service provides the BLE (Bluetooth Low Energy) interface for the scooter and manages communication with the nRF52840 chip via UART. It exposes BLE GATT characteristics for remote control and monitoring, processes UART messages from the nRF firmware, and publishes battery/vehicle state updates to Redis.

## Version

```
unu-bluetooth 0.10.0-101-gbb896f8
```

## Command-Line Options

```
unu Bluetooth Service
Copyright (c) 2020 unu GmbH
options:
  -u --uart <path>     set uart path
  -b --baud <rate>     set uart baud rate
  -d --stream,         allow uart datastreaming
  -V --version         Prints the version info
  -h --help,           display this help and exit
  -l --log,            log level
```

## Redis Operations

### Hash: `ble`

**Fields written:**
- `mac-address` - Bluetooth MAC address (lowercase with colons)
- `status` - Connection status ("connected", "disconnected")
- `pin-code` - Temporary pairing PIN code (6 digits)

**Published channel:** `ble`

### Hash: `cb-battery`

**Fields written:**
- `charge` - Charge level (0-100%)
- `current` - Current in μA
- `remaining-capacity` - Remaining capacity in μWh
- `full-capacity` - Full capacity in μWh
- `cell-voltage` - Cell voltage in μV
- `temperature` - Temperature in °C
- `cycle-count` - Battery cycle count
- `time-to-empty` - Time until battery is empty in seconds
- `time-to-full` - Time until battery is full in seconds
- `state-of-health` - Battery health percentage (0-100)
- `part-number` - Part identification string
- `serial-number` - Serial number
- `unique-id` - Unique identifier
- `present` - Battery presence ("true", "false")
- `charge-status` - Charging status ("not-charging", "charging")

**Published channel:** `cb-battery`

### Hash: `aux-battery`

**Fields written:**
- `voltage` - Voltage in mV
- `charge` - Charge level in 25% steps (0, 25, 50, 75, 100)
- `charge-status` - Charging status ("absorption-charge", "not-charging", "float-charge", "bulk-charge")
- `data-stream-enable` - Data streaming enable flag ("0", "1")

**Published channel:** `aux-battery`

### Hash: `power-manager`

**Fields written:**
- `nrf-reset-count` - Reset count from nRF
- `nrf-reset-reason` - Nordic RESETREAS register value (hex string)

### Hash: `power-mux`

**Fields written:**
- `selected-input` - Selected power input source ("cb", "aux")

**Published channel:** `power-mux`

### Hash: `system`

**Fields written:**
- `nrf-fw-version` - nRF firmware version string

### Hashes read (not written)

The service reads but does not write to these hashes:
- `battery:0` - Reads battery state and charge
- `battery:1` - Reads battery state and charge
- `vehicle` - Reads vehicle state for nRF synchronization
- `power-manager` - Reads power state

### Lists consumed (BRPOP)

None - service does not consume command lists.

### Lists produced (LPUSH)

The service writes requests to:
- `scooter:state` - State change requests ("lock", "unlock", "lock-hibernate")
- `scooter:power` - Power requests ("hibernate", "hibernate-manual")
- `scooter:seatbox` - Seatbox commands ("open")
- `scooter:blinker` - Blinker commands ("left", "right", "both", "off")

These are triggered by BLE characteristic writes to the Control Service (UUID 9a590000).

## Hardware Interfaces

### UART Interface

- **Device:** Configurable via `--uart` option (default varies)
- **Baud rate:** Configurable via `--baud` option (default: 115200)
- **Protocol:** Custom "usock" protocol with CBOR payloads
- **Connected to:** nRF52840 BLE chip

See [nRF UART Protocol](../nrf/UART.md) for protocol details.

### BLE Interface (via nRF52840)

- **Device name:** "unu Scooter"
- **Company ID:** 0xE50A
- **Services exposed:** See [Bluetooth README](../bluetooth/README.md)

## Configuration

### Systemd Unit

- **Unit file:** `/usr/lib/systemd/system/unu-bluetooth.service`
- **Started by:** systemd at boot
- **Restart policy:** Always

## Observable Behavior

### Startup Sequence

1. Opens UART connection to nRF52840
2. Initializes usock protocol
3. Connects to Redis
4. Disables data streaming
5. Requests nRF firmware version
6. Requests BLE MAC address
7. Enables data streaming
8. Syncs data stream
9. Starts BLE advertising

### Runtime Behavior

- **UART message processing:** Continuous reception of CBOR messages from nRF
- **Battery updates:** Publishes to Redis when CB/AUX battery or main battery state changes
- **Vehicle state:** Forwards vehicle state from nRF to Redis
- **BLE commands:** Processes writes to BLE characteristics and converts to Redis LPUSH commands

### Message Flow

```
BLE App → nRF52840 → UART → unu-bluetooth → Redis → other services
other services → Redis → unu-bluetooth → UART → nRF52840 → BLE App
```

### UART Message Types Processed

See [UART Protocol](../nrf/UART.md) for complete list. Key messages:
- `0x0020` - Vehicle state
- `0x0040` - Auxiliary battery
- `0x0060` - CB battery
- `0x00E0` - Main battery status
- `0xA000` - BLE firmware version
- `0xA020` - BLE reset information
- `0xA080` - BLE parameters (MAC, PIN)

### BLE Control Commands

Commands received via BLE Control Service (9a590001):
- `"scooter:state lock"` → `LPUSH scooter:state lock`
- `"scooter:state unlock"` → `LPUSH scooter:state unlock`
- `"scooter:seatbox open"` → `LPUSH scooter:seatbox open`
- `"scooter:blinker left"` → `LPUSH scooter:blinker left`
- `"scooter:blinker right"` → `LPUSH scooter:blinker right`
- `"scooter:blinker both"` → `LPUSH scooter:blinker both`
- `"scooter:blinker off"` → `LPUSH scooter:blinker off`

### Power Control Commands

Commands received via BLE Power Control (9a590002):
- `"hibernate"` - Triggers automatic hibernation
- `"wakeup"` - Not implemented in observed behavior

Special handling based on seatbox state:
- If seatbox open: `LPUSH scooter:state lock-hibernate`
- Otherwise: `LPUSH scooter:power hibernate-manual`

## Log Output

The service logs to journald. Common log patterns include:
- UART frame parsing errors
- CBOR decoding errors
- Redis connection status
- BLE command processing

Use `journalctl -u unu-bluetooth` to view logs.

## Dependencies

- **nRF52840 firmware** - Must be running compatible firmware (v1.12.0 in production)
- **Redis server** - Must be running at 192.168.7.1:6379
- **UART device** - nRF52840 must be accessible via UART

## Related Documentation

- [Bluetooth Protocol](../bluetooth/README.md)
- [nRF UART Protocol](../nrf/UART.md)
- [nRF Power Management](../nrf/power-management.md)
- [Redis Operations](../redis/README.md)
