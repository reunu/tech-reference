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

## Payload Structure

Payloads appear to be encoded in a subset of CBOR, most likely using intel's [tinycbor](https://github.com/intel/tinycbor)

## Key Protocol Mechanisms

- **Finite State Machine (FSM)** for robust frame parsing
- **Dynamic Transmission Management**
  - Enable/disable transmission dynamically
  - "Wake-up" mechanism using sync bytes
  - Ring buffer for efficient data queuing
- **CRC-16** error checking for both header and payload
- **Callbacks** for incoming data
