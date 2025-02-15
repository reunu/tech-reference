# nRF52840 Power Management Functionality

## Overview

The power management module is responsible for controlling power states, optimizing energy usage, and ensuring stable operation of the system. It implements various power states to support hibernation, suspension, and active modes while coordinating power rails and external components.

## Features

- Multiple power states: Standby, Active, Suspend, and Hibernate (L1/L2).
- Automatic hibernation based on battery levels and system activity.
- Controlled wake-up and reboot mechanisms.
- Power rail management for internal and external components.
- Timers for power transitions and event-driven state changes.

## Power States

1. **STANDBY**: Default low-power state with essential subsystems running. Primary supply: Main battery, or CBB.
2. **ON**: All power rails enabled for full system operation. Primary supply from AUX.
3. **SUSPEND**: Low-power state where non-essential power rails are disabled. Primary supply from CBB.
4. **HIBERNATION_L1/L2**: Deep sleep states where power rails are disabled based on battery level. Primary supply: CBB (L1), AUX (L2).
5. **HARD_REBOOT**: System reset sequence with controlled power cycling. Primary supply: mostly CBB.

## Key Components

- **Timers**: Used for transitioning states, hibernation timeout, and reboot sequences.
- **Power Rails**: Controlled via PMIC signals to optimize energy consumption.
- **Battery Monitoring**: Uses ADC to track battery levels and trigger power state changes.
- **External Components**: Interfaces with MDB and board-level sensors to synchronize power states.

## PMIC Pins and Functions

The nRF can drive different Power Management Integrated Circuit (PMIC) control pins to manage power rails:

- **GPIO 0 Pin 25**: +3.8V for the modem (`LTE.PWR`)
- **GPIO 0 Pin 26**: +5.0V? Off in standby mode?
- **GPIO 0 Pin 27**: +5.0V, unknown
- **GPIO 0 Pin 28**: +3.3V for BLE, the eMMC, NFC readers, and the ADC for reading battery data
- **GPIO 0 Pin 2**: +1.5V, almost always on, powers the MDB i.MX6 and RAM

The nRF itself always gets +3.3V power that it can toggle itself, but it is normally kept always on.
This 3.3V power also supplies the combined accelerometer/gyroscope/magnetometer sensor.

## Configuration

- **Hibernation Thresholds**:
  - Level 1: CBB 25% SoC
  - Level 2: CBB 5% SoC
  - Wake-up: CBB 10% SoC

- **Timers**:
  - Hibernation timeout: 5 minutes
  - IMX6 power down delay: 20 seconds
  - Hard reboot delay: 10 seconds

## Usage

### Entering Hibernation

The system enters hibernation if:

1. Requested by the user via Bluetooth command.
2. Requested by the user by holding both brake levers for >15s when scooter is ON, then confirming with keycard tap.
3. Requested by the user via cloud uplink.
4. CBB state of charge drops below 25%.

### Waking Up from Hibernation

The system wakes up when:

1. Both brake levers are held for 10s.
2. CBB state of charge drops below the wake-up threshold.
3. Requested via Bluetooth command.

### Performing a Hard Reboot

A hard reboot is triggered if the MDB fails to boot properly or manually initiated by the system. The process includes:

1. Disabling all power rails.
2. Waiting for a reset delay.
3. Re-enabling power rails and booting IMX6.

The nRF also handles the user-initiated reboot brake sequence.
