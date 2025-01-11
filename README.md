# unu Scooter Pro - Technical Documentation

Reverse-engineered technical documentation of the unu Scooter Pro.

## System Architecture

The unu Scooter Pro uses a distributed architecture with several key systems:

### Core Electronics
- **Middle Driver Board (MDB)** - Central control system
  - Manages power distribution and system communications
  - Coordinates motor control and battery management
  - Provides cellular connectivity via SIM7100E module
  - USB gadget, connected to DBC, exposes USB Ethernet
  - Handles wakeup/sleep states

- **Dashboard Controller (DBC)**
  - Freescale i.MX6 processor
  - Manages display and user interface
  - NFC reader for keycard authentication
  - USB host, connected to MDB

- **Electronic Control Unit (ECU)**
  - BOSCH/Lingbo motor controller
    - unu 4kW: 4kW peak / 2.7kW continuous
    - unu 3kW: 3kW peak / 1.9kW continuous
  - Encrypted CAN bus communication
  - Controls motor and regenerative braking

### Power Systems
- **Main Battery System**
  - 14s7p configuration using INR22/71-7 cells
  - 50.8V nominal, 58.2V max charging voltage
  - 35Ah/1778Wh capacity
  - NFC communication for data channel
  - LED status ring

- **Auxiliary Power**
  - 12V auxiliary lead-acid battery for core systems
  - DC/DC converter for system power
  - Connectivity Box Battery (CBB, Lithium-Ion) for cellular/GPS

### Communication Interfaces
- **Bluetooth LE** - Local device connectivity
  - Service UUIDs documented in [Bluetooth Docs](bluetooth/README.md)
  - Device control and status monitoring

- **Cellular** - Remote connectivity
  - SIM7100E module on MDB
  - Remote diagnostics and updates
  - User app connectivity

- **Redis** - Internal communication
  - Runs on 192.168.7.1:6379 (MDB)
  - Inter-process communication
  - System state management
  - [Full Redis documentation](redis/README.md)

### Hardware Details

Detailed documentation available for:
- [Electronic Systems](electronic/README.md)
- [Mechanical Components](mechanical/README.md)
- [Wiring & Connectors](wiring/README.md)

## System States

The scooter operates in several power states:
- Hibernating
- Booting
- Stand-By
- Parked
- Ready
- Shutting Down

State transitions are triggered by:
- User actions (lock/unlock)
- Power management events
- System commands

[Detailed state diagrams and transitions](states/README.md)

## Development Access

- MDB UART, Pin 1 = GND, Pin 2 = TXD, Pin 3 = RXD
- MDB access: 192.168.7.1
- DBC access: 192.168.7.2 - connect via SSH (root@192.168.7.2) from MDB
- Redis: 192.168.7.1:6379
