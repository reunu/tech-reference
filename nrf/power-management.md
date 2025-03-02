# nRF52840 Power Management Functionality

## Overview

The power management module is responsible for controlling power states, optimizing energy usage, and ensuring stable operation of the system. It implements various power states to support hibernation, suspension, and active modes while coordinating power rails and external components.

## Features

- Multiple power states: Standby, Active, Suspend, and Hibernate (L1/L2).
- Automatic hibernation based on battery levels and system activity.
- Controlled wake-up and reboot mechanisms.
- Power rail management for internal and external components.
- Timers for power transitions and event-driven state changes.
- Intelligent power source selection between batteries.

## Battery Types and Power Sources

The system utilizes three main power sources:

1. **Main Driving Battery**: The high-voltage battery that powers the vehicle's motor and main systems. Its status is detected via the DC/DC converter pin.

2. **CB Battery (Control Battery)**: A control/communication battery that powers the control systems when the main battery is not active. It's monitored by a fuel gauge chip for detailed state of charge tracking.

3. **AUX Battery**: An auxiliary battery that serves as a backup or is used in specific power states.

The system can dynamically select between the CB Battery and AUX Battery for powering the control electronics using a power multiplexer. The main driving battery powers the vehicle's drive systems separately from this muxing system.

### Main Battery Detection

The main driving battery's active state is detected using the DC/DC pin as a proxy:
- When this pin is HIGH: DC converter is on; Main battery is considered ACTIVE
- When this pin is LOW: DC converter is off; Main battery is considered NOT ACTIVE

### Power Flow Between Batteries

The power flow between batteries works as follows:

1. **When Main Driving Battery is Active**:
   - Main battery powers the vehicle's drive systems
   - AUX battery powers the control electronics
   - Main battery charges the AUX battery

2. **When Main Driving Battery is Not Active**:
   - CB battery powers the control electronics
   - System enters power-saving modes based on CB battery state of charge

3. **When CB Battery is Low**:
   - System switches to AUX battery in deep hibernation mode

### Power Source Selection Details

The power source selection logic has additional nuances:
- Power source switching between AUX and CB batteries only occurs when the vehicle is in the OFF state
- When the main battery status changes (becomes active or inactive):
  - If the vehicle is ON (any state other than OFF): No power source switching occurs
  - If the vehicle is OFF and main battery becomes ACTIVE: System switches to AUX battery
  - If the vehicle is OFF and main battery becomes NOT ACTIVE: System switches to CB battery
- Before selecting the CB Battery, the system verifies it reports a valid state of charge

## Power States

The power management system implements several states to optimize power consumption:

### Normal Operation States

1. **Standby Mode**: 
   - Default low-power state with essential subsystems running.
   - The 3.8V, 5.0V, 3.3V, and 1.5V power rails are enabled.
   - The 5.0V USB/DBC power rail is disabled to prevent the DBC from activating.
   - External and internal power rails are enabled.
   - When vehicle is OFF and main driving battery is ACTIVE: AUX battery powers control electronics
   - When vehicle is OFF and main driving battery is NOT ACTIVE: CB battery powers control electronics

2. **Full Power Mode**: 
   - All power rails enabled for full system operation.
   - All power control lines are enabled.
   - External and internal power rails are enabled.
   - Primary supply from AUX battery.

### Power Saving States

3. **Suspend Mode**: 
   - Low-power state where non-essential power rails are disabled.
   - Similar configuration to STANDBY but optimized for power saving.
   - External power rail is enabled, internal power rail is disabled.
   - Primary supply from CB battery.

4. **Suspend with Hibernation Timer**:
   - Same configuration as SUSPEND.
   - System waits for the hibernation timeout (5 minutes) before transitioning to hibernation.

### Hibernation States

1. **Pre-Hibernation Transition**:
   - Transitional state before entering hibernation.
   - Similar to SUSPEND but with external power rail disabled.
   - System waits for iMX6 to power down (20 seconds).

2. **Hibernation Level 1**: 
   - Level 1 hibernation state activated when CB battery reaches 25% SoC.
   - All power control lines are disabled.
   - External and internal power rails are disabled.
   - Primary supply from CB battery.

3. **Hibernation Level 2**: 
   - Level 2 hibernation state activated when CB battery reaches 5% SoC.
   - All power control lines are disabled.
   - External and internal power rails are disabled.
   - Primary supply switches to AUX battery to preserve remaining CB battery charge.

### Hard Reboot States

1. **Reboot Initialization**: Initial state of the reboot sequence.

2. **Processor Notification**: Notifies the iMX6 processor of impending reboot.

3. **Power Rail Shutdown**: Disables all power rails.

4. **Power Rail Restoration**: Re-enables power rails in sequence.

5. **Reboot Completion**: Completes the reboot sequence.

6. **Stabilization Wait**: Waits for system stabilization after reboot.

## Key Components

- **Timers**: Used for transitioning states, hibernation timeout, and reboot sequences.
- **Power Rails**: Controlled via PMIC signals to optimize energy consumption.
- **Battery Monitoring**: Uses ADC to track battery levels and trigger power state changes.
- **External Components**: Interfaces with MDB and board-level sensors to synchronize power states.
- **Power Multiplexer**: Controls which battery source (CB or AUX) powers the system.

## Power Pins and Functions

The nRF controls different Power Management Integrated Circuit (PMIC) control pins to manage power rails:

- **Modem Power Control (GPIO 0 Pin 25)**: Controls +3.8V for the modem (`LTE.PWR`)
- **USB Power Control (GPIO 0 Pin 26)**: Controls +5.0V USB power line (DBC power)
- **5V Rail Control (GPIO 0 Pin 27)**: Controls +5.0V power line, use unknown
- **3.3V Rail Control (GPIO 0 Pin 28)**: Controls +3.3V for BLE, eMMC, NFC readers, and the ADC for reading battery data
- **1.5V Rail Control (GPIO 0 Pin 2)**: Controls +1.5V, almost always on, powers the MDB i.MX6 and RAM

The nRF itself always receives +3.3V power that it can toggle, but it is normally kept always on.
This 3.3V power also supplies the combined accelerometer/gyroscope/magnetometer sensor (BMG160).

## Configuration

### Hibernation Thresholds

- **Level 1 Hibernation**: Triggered when CB battery reaches 25% SoC
- **Level 2 Hibernation**: Triggered when CB battery reaches 5% SoC
- **Wake-up Threshold**: System wakes up once when CB battery is below 10% SoC to send a low battery warning

### Auto-Hibernation Conditions

The system automatically enters hibernation when:
1. The iMX6 processor is in suspended state
2. The CB battery SoC is at or below 25%
3. The main driving battery is not active

### Timers

- **Hibernation timeout**: 5 minutes
- **IMX6 power down delay**: 20 seconds
- **Hard reboot delay**: 10 seconds

## Battery Charging

### Main Driving Battery
- Not managed by the nRF
- Its state is monitored using the DC converter pin as a proxy

### CB Battery
- Monitored by a built-in MAX1730x fuel gauge chip
- Can be in two charging states:
  - Not charging (when discharging)
  - Charging (when current is positive)
- Has detailed monitoring for state of charge, temperature, current, voltage, time to empty/full, cycle count, and state of health
- Current measurement uses a sense resistor
- Charging is detected when current exceeds a threshold (approximately 100 mA)
- Discharging is detected when current is negative

### AUX Battery Charging

The AUX battery charging is controlled by hardware with software monitoring:
- The AUX battery charger is enabled by default
- Charging occurs primarily when the main driving battery is active
- The charging process follows a standard three-stage profile controlled by hardware:
  - Bulk charging: Maximum current for depleted batteries
  - Absorption charging: Constant voltage as battery approaches full charge
  - Float charging: Maintenance mode for fully charged batteries
- The system monitors charging status but doesn't directly control the charging parameters
- Charging can occur regardless of vehicle power mode (even when the vehicle is off)

#### Charging Circuit Control

The AUX battery charging circuit has dedicated control and monitoring:
- Charger Enable/Disable: Controlled via a dedicated pin (active high)
  - LOW (default): Charger enabled
  - HIGH: Charger disabled
- Charging Status: Monitored via dedicated status pins
  - These pins provide hardware feedback on the current charging state
  - The software uses this information for power management decisions but doesn't control the charging profile

## Battery Voltage Monitoring

### AUX Battery
- Voltage is measured via the nRF52840's built-in ADC
- ADC readings are smoothed using a weighted (80/20) moving average
- ADC values are temperature-compensated (factor of 0.6 for delta from 25°C reference point)
- SOC is determined by voltage ranges mapped to specific ADC value thresholds

### CB Battery
- Monitored by MAX1730x fuel gauge chip with high resolution
- The system compares the reported SOC with the voltage-based SOC
- If the difference exceeds a threshold, the system resets the fuel gauge and verifies the SOC

## Usage

### Entering Hibernation

The system enters hibernation if:

1. Requested by the user via Bluetooth command.
2. Requested by the user by holding both brake levers for >15s when scooter is ON, then confirming with keycard tap.
3. Requested by the user via cloud uplink.
4. CB battery state of charge drops below 25% and auto-hibernation conditions are met.

### Waking Up from Hibernation

The system can wake from hibernation through:

1. **Brake Lever Detection**:
   - Both brake levers are held for 10s.
   - In hibernation, the external power rail is periodically enabled to check if brake levers are pressed.

2. **Battery Conditions**:
   - CB battery state of charge drops below the wake-up threshold (10%).
   - This allows the system to wake up once to send a low battery warning.

4. **Remote Activation**:
   - Requested via Bluetooth command.

### Power Source Selection Logic

1. **When Main Driving Battery is Active and Vehicle is OFF**:
   - System uses AUX Battery for control electronics
   - This preserves the CB Battery charge

2. **When Main Driving Battery is Not Active**:
   - CB Battery powers the control electronics
   - If CB Battery SOC drops to ≤ 5%, system switches to deep hibernation (Level 2) and uses AUX Battery

3. **During Hard Reboot Sequences**:
   - System temporarily uses AUX Battery

### Performing a Hard Reboot

A hard reboot is triggered if the MDB fails to boot properly or is manually initiated by the system. The process includes:

1. Notifying the iMX6 processor of the impending reboot.
2. Disabling all power rails in sequence.
3. Waiting for a reset delay.
4. Re-enabling power rails in sequence.
5. Booting the iMX6 processor.
6. Waiting for system stabilization.

The nRF also handles the user-initiated reboot brake sequence.
