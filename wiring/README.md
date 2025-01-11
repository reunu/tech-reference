# Wiring Documentation

## Main Wiring Harness

### MDB Connectors
Four 30-pin connectors (CM1, CM3, CM9, CM10) interface with the Middle Driver Board. All use female connectors on the harness side.

#### CM10 Connector (Primary Power)
Key signals:
- +48V ECU/MDB connection 
- Battery supply lines
- CAN bus (H/L)
- CBB interface (SDA/SCL)
- Left/right rear blinker control
- Front blinker control
- NFC reader power (+3.3V)
- Ground connections

#### CM9 Connector (System Control)
Key signals:
- Seat box sensor
- Steering lock state
- Handlebar position
- Side stand sensor
- Turn signal switches
- Brake switches
- Horn control
- LED indicators
- Battery state monitoring
- Ground connections

#### CM3 Connector (Motor Control) 
Key signals:
- Motor phase connections (U/V/W)
- Hall sensor interface
  - Power (+5V)
  - Ground
  - Hall U/V/W signals
- Motor temperature monitoring
- Current sensing
- Protection circuits

#### CM1 Connector (Auxiliary Systems)
Key signals:
- LCD Display interface
- Keypad/button inputs
- Status LED outputs
- Speaker control
- External charging
- NFC communication
- UART interfaces
- Ground connections

### ECU Connections
Main connector:
- Motor phase connections (U/V/W)
- Hall sensor interface:
  - +5V supply
  - U/V/W hall signals
  - Ground
- Throttle input
- Brake signals (left/right)
- Side stand input
- CAN bus (H/L)
- Temperature sensor
- Power input (48V)

### Battery Systems
#### Main Battery Interface
- Power terminals:
  - B+ (50.8V nominal)
  - B- (Ground)
- NFC communication:
  - I2C interface (SDA/SCL)
  - Field detect signal
  - +3.3V supply
- LED control signals
- Temperature sensors

#### Auxiliary Battery (12V)
- Main connection points:
  - B+ with 15A fuse protection
  - B- to system ground
- Charging input from DC/DC
- Voltage monitoring

#### CBB Battery
- Dedicated power rail
- Monitoring interface:
  - Voltage sensing
  - Temperature input
  - State monitoring
- Protection circuitry

## Lighting Circuits
### Front Lighting
- Main headlight:
  - Low beam (12V/8.4W)
  - Position lamp (12V/0.72W)
  - Ground return
- Turn signals:
  - Left indicator (12V/6W)
  - Right indicator (12V/6W)
  - Common ground

### Rear Lighting
- Tail light assembly:
  - Stop lamp (12V/9W)
  - Position lamp (12V/0.84W)
  - Turn indicators (12V/6W)
- License plate light:
  - Power (12V)
  - Ground return

## Control Interfaces
### Handlebar Controls
Left side:
- Seat box release button
- Turn signal switch (3-position)
- Horn button
- Brake switch

Right side:
- Throttle position sensor
- Brake switch
- Ground connections

### Security Systems
- Steering lock actuator:
  - Motor drive (12V)
  - Position sensor
  - Lock state input
- Seat lock:
  - Lock solenoid
  - Position sensing
  - State monitoring

## Antenna Systems
- Main antenna (GSM/GPS)
- Secondary/auxiliary antenna (Pulse Electronics FPC UWB type)
