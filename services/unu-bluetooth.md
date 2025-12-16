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
  -u --uart <path>     set uart path (default: /dev/ttymxc1)
  -b --baud <rate>     set uart baud rate (default: 115200)
  -d --stream <value>  enable data streaming (0=disable, 1=enable)
  -V --version         prints the version info
  -h --help            display this help and exit
  -l --log <level>     log level (0=NONE, 1=ERROR, 2=WARNING, 3=INFO, 4=DEBUG)
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
- `current` - Current in μA (microamps)
- `remaining-capacity` - Remaining capacity in μAh
- `full-capacity` - Full capacity in μAh
- `cell-voltage` - Cell voltage in μV
- `temperature` - Temperature in °C × 10 (e.g., 235 = 23.5°C)
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

### Sorted Set: `cb-battery:alert`

Stores CB battery alert flags using ZADD with timestamp scores:
- `charge-low` / `charge-high` - Min/max SOC alerts
- `current-low` / `current-high` - Min/max current alerts
- `voltage-low` / `voltage-high` - Min/max voltage alerts
- `temperature-low` / `temperature-high` - Min/max temperature alerts

**Published channel:** `cb-battery:alert`

### Sorted Set: `cb-battery:fault`

Stores CB battery fault flags using ZADD with timestamp scores:
- `discharge-over-current` - Discharge over-current fault
- `charge-over-current` - Charge over-current fault
- `short-circuit` - Short circuit fault
- `discharge-over-temperature` / `discharge-under-temperature` - Discharge temperature faults
- `charge-over-temperature` / `charge-under-temperature` - Charge temperature faults
- `over-voltage` / `under-voltage` - Voltage faults
- `charge-fet-failure` / `discharge-fet-failure` - FET failures
- Fault code `0xFF` indicates no active fault

**Published channel:** `cb-battery:fault`

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

### Hashes Read

The service subscribes to channels and reads fields from:
- `vehicle` (channel: `vehicle`) - Reads `state` (stand-by, parked, ready-to-drive, shutting-down, updating), `seatbox:lock`, `handlebar:lock-sensor`
- `battery:0` (channel: `battery:0`) - Reads `state`, `present`, `charge`, `cycle-count`
- `battery:1` (channel: `battery:1`) - Reads `state`, `present`, `charge`, `cycle-count`
- `power-manager` (channel: `power-manager`) - Reads `state`

Changes detected via pub/sub are forwarded to nRF52840 via UART.

### Lists Consumed (BRPOP)

- `scooter:bluetooth` - BLE control commands:
  - `"advertising-start-with-whitelisting"` - Start BLE advertising with whitelist
  - `"advertising-restart-no-whitelisting"` - Restart advertising without whitelist
  - `"advertising-stop"` - Stop BLE advertising
  - `"delete-all-bonds"` - Clear all bonded devices

### Lists Produced (LPUSH)

The service writes requests to:
- `scooter:state` - State change requests ("lock", "unlock", "lock-hibernate")
- `scooter:power` - Power requests ("hibernate", "hibernate-manual")
- `scooter:seatbox` - Seatbox commands ("open")
- `scooter:blinker` - Blinker commands ("left", "right", "both", "off")

These are triggered by BLE characteristic writes received from nRF52840.

## Hardware Interfaces

### UART Interface

- **Device:** Configurable via `--uart` option (default: `/dev/ttymxc1`)
- **Baud rate:** Configurable via `--baud` option (default: 115200)
- **Protocol:** Custom "usock" protocol with CRC-16 verification and CBOR payloads
- **Frame format:** SYNC1(0xF6) + SYNC2(0xD9) + FrameID + PayloadLen(2) + HeaderCRC(2) + Payload + PayloadCRC(2)
- **Max payload:** 2048 bytes
- **Connected to:** nRF52840 BLE chip

The service runs a dedicated thread for UART reception, processing CRC-verified frames and decoding CBOR payloads.

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

1. Parses command-line arguments (uart path, baud rate, streaming, log level)
2. Connects to Redis at 127.0.0.1:6379 (two connections: synchronous query + asynchronous pub/sub)
3. Subscribes to Redis channels: `vehicle`, `battery:0`, `battery:1`, `power-manager`
4. Watches Redis list: `scooter:bluetooth` via BRPOP
5. Opens UART connection to nRF52840 (default: `/dev/ttymxc1` at 115200 baud)
6. Starts dedicated UART RX thread for frame reception
7. Disables data streaming via UART command
8. Requests nRF firmware version (writes to `system:nrf-fw-version`)
9. Requests BLE MAC address (writes to `ble:mac-address`)
10. Sends initial state to nRF:
    - Vehicle state (state, seatbox lock, handlebar lock sensor)
    - Battery 0 and 1 state (state, presence, charge, cycle count)
    - Power manager state
11. Enables data streaming via UART command
12. Syncs data stream with nRF
13. Enters main loop: sleeps indefinitely while async threads handle messages

### Runtime Behavior

**Threading Model:**
- Main thread: Initialization and sleeps indefinitely
- UART RX thread: Blocking read loop processing CRC-verified frames from nRF
- Redis subscriber thread: libev event loop processing pub/sub messages and BRPOP commands

**Message Processing:**
- **UART → Redis:** Continuous reception and decoding of CBOR messages from nRF, written to Redis hashes
- **Redis → UART:** Changes detected via pub/sub forwarded to nRF as CBOR messages
- **Battery updates:** Publishes CB/AUX battery telemetry, alerts, and faults to Redis channels
- **Vehicle state:** Processes state changes from Redis and forwards to nRF (debug messages not forwarded from nRF to Redis)
- **BLE commands:** Converts UART messages from nRF to Redis LPUSH commands for other services
- **Power state mapping:** Maps multiple Redis power states to simplified nRF states (e.g., hibernating-manual → hibernating)

**Data Streaming Control:**
- Automatically disables streaming during suspend/hibernation states to prevent system wakeup
- Re-enables streaming when returning to running state
- Prevents duplicate power state updates to nRF

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

### nRF Reset Handling

When the nRF52840 sends reset information (message type 0xA020):
1. Service writes reset count to `power-manager:nrf-reset-count`
2. Service writes reset reason to `power-manager:nrf-reset-reason` (published)
3. Service exits with code EX_IOERR (74)
4. Systemd automatically restarts the service
5. Service re-initializes UART connection and Redis state

This ensures the service recovers from nRF firmware crashes or watchdog resets.

### Power State Mapping

The service maps Redis power-manager states to nRF states:
- `running`, `suspending-imminent` → running (0x00)
- `suspending` → suspending (0x01)
- `hibernating`, `hibernating-manual`, `hibernating-timer` → hibernating L1 (0x02)
- `hibernating-l2` → hibernating L2 (0x03)
- `reboot`, `reboot-imminent` → treated as running (not sent to nRF)

States suffixed with `-imminent` use the same nRF state as their non-imminent counterpart.

### Redis Connection Management

The service maintains two Redis connections:
- **Query connection:** Synchronous, used for HSET/ZADD/LPUSH operations, mutex-protected
- **Subscriber connection:** Asynchronous libev event loop for SUBSCRIBE/BRPOP operations

Both connections automatically reconnect on connection loss.

## Log Output

The service logs to journald. Common log patterns include:
- UART frame parsing errors
- CBOR decoding errors
- Redis connection status
- BLE command processing

Use `journalctl -u unu-bluetooth` to view logs.

## Dependencies

- **nRF52840 firmware** - Must be running compatible firmware (v1.12.0+ in production)
- **Redis server** - Must be running at 127.0.0.1:6379
- **UART device** - nRF52840 must be accessible via UART (default: `/dev/ttymxc1`)
- **System libraries** - libserialport for UART, libev for async I/O, hiredis for Redis

## Related Documentation

- [Bluetooth Protocol](../bluetooth/README.md)
- [nRF UART Protocol](../nrf/UART.md)
- [nRF Power Management](../nrf/power-management.md)
- [Redis Operations](../redis/README.md)
