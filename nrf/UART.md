# UART protocol

The nRF52480 and the MDB communicate through a custom UART protocol called "usock".
Data that is passed through this usock includes:

- Power management communication
- Streaming battery data
- Streaming bluetooth data
- Bluetooth commands that are not handled by the nRF itself

The _usock_ protocol is layered atop Nordic's example UART integration.

## Interface

The scooter configures a UART interface on pins

- rx_pin = GPIO 1 Pin 13
- tx_pin = GPIO 1 Pin 12
- rts_pin = GPIO 0 Pin 30
- cts_pin = GPIO 0 Pin 29

with a baud rate of 115200, no parity, and hardware flow control disabled.

## Frame Structure

```
+------------+------------+---------+-------------+-----------+-------------+
| Sync Byte1 | Sync Byte2 | Frame ID| Payload Len | Header CRC| Payload CRC |
|   0xf6     |   0xd9     |  1 byte | 2 bytes     | 2 bytes   | 2 bytes     |
+------------+------------+---------+-------------+-----------+-------------+
```

1. Fixed synchronization bytes (0xf6, 0xd9) mark the start of each frame
2. Frame components:
   - Sync Bytes (2 bytes)
   - Frame ID (1 byte)
   - Payload Length (2 bytes)
   - Header CRC (2 bytes)
   - Payload (variable length, max 512 bytes)
   - Payload CRC (2 bytes)

## CBOR Payload Encoding

Payloads are encoded using CBOR (Concise Binary Object Representation) format via Intel's [tinycbor](https://github.com/intel/tinycbor) library.

### Payload Structure

Each payload contains a nested CBOR map:
- **Outer map**: Single key = Message Type (16-bit integer, e.g., 0x0060)
- **Inner map**: Keys = Sub-types (16-bit integers, e.g., 0x0061), Values = Data (int, string, array, etc.)

Example:
```
{0x0060: {0x0061: 85}}  // CB Battery charge = 85%
```

### Data Types

CBOR supports multiple data types observed in the protocol:
- **Integers**: CBOR integers (int64/uint64)
- **Strings**: CBOR text strings (UTF-8)
- **Arrays**: CBOR arrays (e.g., `[0x12345678, 42]` for reset info)
- **Bitmasks**: Integer values with individual bits representing status flags

### CRC-16 Algorithm

- **Type**: CRC-16/ARC (also known as CRC-16/LHA)
- **Implementation**: Lookup table-based with 256 entries
- **Seed Parameter**: Standard CRC-16 polynomial

## Observable Message Types

Messages use 16-bit type identifiers organized hierarchically:

### Status & Telemetry (nRF → iMX6)

- **0x0020** - Vehicle State (scooter state, seatbox, handlebar lock)
- **0x0040** - Auxiliary Battery Information
- **0x0060** - CB Battery Information (detailed BMS data)
- **0x00E0** - Battery Status (slots 0 & 1)
- **0x0100** - Power Mux State (internal only - not exposed via BLE)
- **0x0800** - Power Management (hibernation, state changes)
- **0xA000** - BLE Firmware Version
- **0xA020** - BLE Debug / Reset Information
- **0xA080** - BLE Parameters (MAC address, pairing PIN)

### Commands (iMX6 → nRF)

- **0x00C0** - Data Stream Management (enable/disable/sync)
- **0xAA00** - BLE Commands (advertising, bonding)
- **0xA040** - Scooter Info Requests (mileage, software version)

### Sub-Types Examples

Each message type contains sub-types as CBOR map keys:

**CB Battery (0x0060):**
- 0x0061: Charge (%)
- 0x0062: Current (mA)
- 0x0063: Remaining Capacity (mAh)
- 0x0065: Cell Voltage (mV)
- 0x0066: Temperature (°C)
- 0x0072: Charge Status

**Vehicle State (0x0020):**
- 0x0021: Vehicle state (0=stand-by, 1=parked, 2=ready-to-drive, 3=shutting-down, 4=updating)
- 0x0022: Seatbox lock (0=closed, 1=open)
- 0x0023: Handlebar lock (0=locked, 1=unlocked)

**Battery Status (0x00E0):**
- 0x00E2/0x00EE: Battery 0/1 state (0=unknown, 1=asleep, 2=idle, 3=active)
- 0x00E3/0x00EF: Battery 0/1 presence (boolean)
- 0x00E6/0x00F2: Battery 0/1 cycle count
- 0x00E9/0x00F5: Battery 0/1 remaining charge (%)

**Power Management (0x0800):**
- 0x0801: PM State (1=running, 2=suspending, 3=hibernating, etc.)
- 0x0802: Power Request (hibernation level: 0=L1, 1=L2)
- 0x0803: Hibernation Request (0=automatic, 1=manual)

**Power Mux (0x0100):**
- 0x0101: Power Mux State (0=AUX battery, 1=CB battery)

**Reset Information (0xA020):**
- 0xA021: Reset Info array `[reason, count]` - reason is Nordic RESETREAS register value
- 0xA023: Reset ACK (acknowledgment from iMX6)

## Initialization Sequence

Observable startup sequence from iMX6 to nRF:
1. Disable Data Streaming
2. Request BLE Firmware Version
3. Request BLE MAC Address
4. Enable Data Streaming
5. Sync Data Stream
6. Start Advertising

## Key Protocol Mechanisms

- **Finite State Machine (FSM)** for robust frame parsing
- **Dynamic Transmission Management**
  - Enable/disable transmission dynamically
  - "Wake-up" mechanism using sync bytes
  - Ring buffer for efficient data queuing
- **CRC-16** error checking for both header and payload
- **Callbacks** for incoming data

## Protocol Properties

- **Bidirectional**: Both directions use same frame format
- **Asynchronous**: nRF sends unsolicited status updates
- **Little-Endian**: Multi-byte values in frame header
- **Max Payload**: 2048 bytes
- **Sync Pattern**: 0xF6 0xD9 for frame start
- **End Character**: 0xF6 terminates communication sequences
