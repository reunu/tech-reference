# Electronic Systems Documentation

## Core Systems

### Middle Driver Board (MDB)
- Part Number: MDB-PCB-01-003 Rev. F
- Main Processor: Freescale i.MX6 UL
- Core system controller
- Manages:
  - Power distribution
  - System communications
  - Battery management
  - Motor control interface

#### Key Components
- SIM7100E cellular module
  - CE certified
  - GSM/GPRS connectivity
- Power management ICs
- Multiple 30-pin edge connectors
  - CM1: Left edge
  - CM3: Right edge  
  - CM9: Bottom edge
  - CM10: Top edge

#### Features
- 4+ layer PCB design
- Controlled impedance traces
- Ground plane isolation
- Thermal management
- EMI protection structures
- Professional assembly quality

### Dashboard Controller (DBC)
- Part Number: DBC-PCB-01-009 Rev. E
- Main Processor: MCIMX6U7CVM08AC (Freescale i.MX6)
- Components:
  - NAND Flash Memory
  - RAM modules
  - Power management
- Interfaces:
  - Mini-USB connector
  - Molex 8x2 connector
  - Test points (ONOFF, BM1, BM0)

### Motor Controller (ECU)
- Manufacturer: BOSCH/Lingbo
- Power Rating:
  - unu 4kW: 4kW peak / 2.7kW continuous
  - unu 3kW: 3kW peak / 1.9kW continuous
- Features:
  - Encrypted CAN bus
  - Regenerative braking control
  - Temperature monitoring
  - Current limiting

## Battery Systems

### [Main Battery](../battery/README.md)
- Configuration: 14s7p using INR22/71-7 cells
- Specifications:
  - Nominal voltage: 50.8V
  - Max charging voltage: 58.2V
  - Nominal capacity: 35Ah/1778Wh
  - ~5000mAh per cell
- Features:
  - NFC communication
  - Built-in status LEDs
  - Protection circuits
  - Battery Management System

### Auxiliary Battery (AUX)
- 12V lead-acid battery
- Used for core system power
- Charged via DC/DC converter

### Connectivity Battery (CBB)
- Lithium-ion battery
- Powers connectivity systems
- Features protection circuitry
- Dedicated power management

### DC/DC Converter
- Input: Main battery voltage (50.8V)
- Output: 12V system power
- Powers vehicle electronics

## Communication Systems

### Battery NFC System
- NT3H2111 NFC chip
- Features:
  - 64-byte SRAM
  - 888-byte EEPROM  
  - Field detection signal
  - I²C interface
- Used for:
  - Battery authentication

### Keycard NFC System
- Used for:
  - Authentication (unlocking/locking)

### CAN Bus
- Used for motor control
- Encrypted protocol
- Real-time control data

### Cellular Module
- SIM7100E modem
- Features:
  - 4G connectivity
  - GPS/GNSS
- MFF2 SIM soldered to MDB
