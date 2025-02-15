# nRF52480 functionalities

## Overview

The unu Scooter Pro has a u-blox BMD340 module on the MDB board, which contains a Nordic nRF52480 chipset. It forms the central communication and control hub of the scooter’s electronics, coordinating wireless commands, power management, battery monitoring, and diagnostic data exchange. The nRF communicates uses Bluetooth Low Energy (BLE) and a UART-based interface (referred to as _usock_) to interact with external components and subsystems.

## Communication Interfaces and Protocols

### Bluetooth Low Energy (BLE)

- **Services & Characteristics:**  
  The firmware implements custom BLE services to support scooter operation and power control. Key characteristics include:
  - **Scooter Requests:**  
    - A write-only characteristic that accepts scooter-related commands.
    - A write-only characteristic for power-related requests (e.g., “wakeup” or “hibernate”).
  - **BLE Pairing Management:**  
    - Events to display and remove the pairing PIN are supported, ensuring that external devices can pair and unpair as needed.
  
- **Event Handling:**  
  BLE events trigger callbacks that encode commands using a lightweight protocol and forward them to the UART interface for further processing. For instance, when a BLE characteristic is updated, the data is packaged into a protocol message and sent over _usock_.

[For more details the Bluetooth command layer, see the Bluetooth documentation](../bluetooth/README.md).

### UART Interface (usock)

- **Protocol-Based Communication:**  
  The firmware uses a protocol abstraction to structure messages over the UART interface. This interface is used to:
  - Send commands from remote sources (e.g., DFU requests, data stream controls, version queries).
  - Report various status parameters back (such as battery states, fault signals, and BLE parameters).
  
- **Command Processing:**  
  Incoming UART messages are decoded and handled based on their unique command identifiers. The response messages are then encoded and transmitted back through the same interface.

* [UART/usock documentation](./UART.md)

## Key Functional Modules

### 1. Periodic Timer & Main Loop

- **1-Second Timer:**  
  A periodic timer (with a 1-second interval) drives routine tasks:
  - **BLE Updates:** Calls a tick function that updates BLE parameters based on current power mode, battery data, and board state.
  - **Battery Actions:** Invokes periodic battery actions to update and monitor battery status.
  - **Data Streaming:** Triggers periodic data streaming of diagnostic and operational data via the UART interface.

- **Main Loop:**  
  The infinite main loop continuously:
  - Processes 1-second periodic tasks.
  - Advances the state machines for power management and hard reboot handling.
  - Executes idle state handling, which includes processing pending BLE events and managing power consumption.
  - Feeds the watchdog to maintain system stability.

### 2. BLE Event Handling

- **Characteristic Updates:**  
  When a BLE characteristic is updated (e.g., scooter or power requests), the event callback:
  - Converts the received data into a protocol message.
  - Forwards the message via the UART interface.
  - For power commands, invokes helper routines (such as exiting hibernation or entering low-power modes).

- **Pairing PIN Management:**  
  Specific BLE events are dedicated to displaying or removing the pairing PIN. These events result in protocol messages sent over the UART interface to update the external system accordingly.

### 3. UART (usock) Event Handling

The usock handler decodes incoming messages and executes actions based on the command identifier:

- **DFU (Device Firmware Update):**  
  Commands can trigger a transition to DFU mode by setting appropriate flags and initiating a shutdown sequence.
  
- **Data Streaming Control:**  
  Messages can enable or synchronize auxiliary data streams, ensuring that diagnostic or sensor data is relayed at the desired intervals.
  
- **Version Query:**  
  Responds to version requests by sending back the current firmware version.
  
- **Debug and Fault Reporting:**  
  Processes debug commands (including reset acknowledgments) and reports board fault signals.
  
- **Battery Data Reporting:**  
  Handles both main and auxiliary battery information:
  - Main battery parameters (state, presence, cycle count, remaining charge) are processed and also written back as BLE parameters.
  - Auxiliary battery status, including charger status, is queried from board-specific functions.
  
- **Power Management and Scooter State Updates:**  
  Receives commands to update scooter state (such as seatbox or handlebar status) and to adjust power management parameters. These updates are routed to the respective modules for action.
  
- **BLE Command Forwarding:**  
  Forwards BLE-specific commands to the appropriate BLE routines.

### 4. Power Management

- **State Updates and Requests:**  
  The firmware monitors and updates power states based on both BLE and UART commands:
  - Processes commands to wake up from or enter hibernation.
  - Updates internal power state based on inputs received from the UART protocol.
  
- **Integration with Other Modules:**  
  The power management module interacts with the scooter state updates and the hard reboot handler, ensuring that power transitions are synchronized with overall system behavior.

### 5. Hard Reboot Handling & Watchdog

- **Hard Reboot Module:**  
  This module monitors conditions that may require a system reboot and coordinates with the power management system to initiate a reboot when necessary.
  
- **Watchdog Timer:**  
  The watchdog is initialized at startup and is periodically fed in the main loop to ensure that the system resets in case of a fault or unresponsive behavior. Additionally, the firmware handles non-power-on resets by synchronizing with an external module via a dedicated callback.

## Message Protocol

The firmware uses a simple, custom protocol to encapsulate commands and parameters:

- **Structure:**  
  Messages consist of a command identifier and one or more parameters, which may be integers, strings, or arrays.
  
- **Examples of Commands:**
  - **DFU Command:** Instructs the system to enter Device Firmware Update mode.
  - **Data Stream Controls:** Enable/disable data streaming or request a resynchronization.
  - **Version Request:** Retrieves the firmware version.
  - **BLE Parameter Request:** For example, querying the device’s BLE MAC address.
  - **Fault Reporting:** Requests board fault signals.
  - **Battery Data Requests:** Commands to obtain main or auxiliary battery data.
  - **Power Management Commands:** Update the scooter’s state or request power state changes.
  - **BLE Command Forwarding:** Passes through BLE-specific commands from the UART interface to the BLE module.

Each command is encoded into a byte buffer and transmitted over the UART interface.

## Timing, Scheduling, and Module Interactions

- **Periodic Scheduling:**  
  A dedicated 1-second timer ensures that routine tasks—such as battery monitoring, BLE updates, and data streaming—are executed reliably.

- **Idle Handling:**  
  The firmware processes BLE events and power management tasks during idle periods to optimize power consumption.

- **Inter-Module Communication:**  
  - BLE events trigger protocol messages that are sent over the UART interface.
  - UART (usock) events are decoded and dispatched to update battery data, power management, and board status.
  - Synchronization between the watchdog, hard reboot, and power management modules ensures coordinated recovery actions on fault conditions or non-standard resets.
