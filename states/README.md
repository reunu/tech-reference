# System States Documentation

## Vehicle States

The scooter's operational mode is tracked via the `vehicle:state` Redis key and BLE characteristic 9a590021.

### Canonical Vehicle States

These are the exact string values that appear in Redis and BLE:

- **"unknown"** - Initial/uninitialized state
- **"stand-by"** - Systems powered but motor disabled, ready for authentication
- **"parked"** - Vehicle unlocked with kickstand down or not ready to drive
- **"ready-to-drive"** - Full system power, motor enabled, kickstand up, all conditions met
- **"waiting-seatbox"** - Transitional state waiting for seatbox to close
- **"shutting-down"** - Transitional state before powering down (~5s)
- **"updating"** - OTA firmware update in progress
- **"waiting-hibernation"** - Manual hibernation sequence initiated (60s timeout)
- **"waiting-hibernation-advanced"** - Advanced hibernation wait (brakes held for 10s+)
- **"waiting-hibernation-seatbox"** - Hibernation wait with seatbox open notification
- **"waiting-hibernation-confirm"** - Hibernation confirmation screen (3s)

**Note**: Vehicle states are separate from power manager states (tracked in `power-manager:state`). Vehicle states represent the operational mode of the scooter, while power manager states represent the system's power/suspend state.

### Vehicle State Transitions

```mermaid
stateDiagram-v2
    [*] --> unknown
    unknown --> stand-by: init complete (initial state)
    unknown --> updating: init complete (updating)
    unknown --> ready-to-drive: init complete (default)

    stand-by --> ready-to-drive: keycard auth / unlock request

    ready-to-drive --> parked: kickstand down (after 1s timer)
    ready-to-drive --> ready-to-drive: conditions still met

    parked --> ready-to-drive: kickstand up + all conditions met
    parked --> waiting-seatbox: keycard auth (when not activating)
    parked --> shutting-down: lock request
    parked --> waiting-hibernation-confirm: lock-hibernate request
    parked --> waiting-hibernation: hibernation timer (manual)

    waiting-seatbox --> ready-to-drive: seatbox closed + conditions met
    waiting-seatbox --> parked: seatbox closed (not ready)
    waiting-seatbox --> shutting-down: keycard auth / lock request
    waiting-seatbox --> ready-to-drive: unlock request
    waiting-seatbox --> waiting-hibernation-confirm: lock-hibernate request

    shutting-down --> stand-by: timeout (~5s)

    updating --> shutting-down: update complete / not updating
    updating --> shutting-down: timeout (30min abort)
    updating --> ready-to-drive: keycard auth / unlock request

    waiting-hibernation --> waiting-hibernation-seatbox: keycard tap (seatbox open)
    waiting-hibernation --> waiting-hibernation-advanced: brakes held (10s timer)
    waiting-hibernation --> ready-to-drive: timeout (60s) / kickstand raised / unlock
    waiting-hibernation --> shutting-down: lock request
    waiting-hibernation --> waiting-hibernation-confirm: lock-hibernate request

    waiting-hibernation-advanced --> ready-to-drive: brakes released
    waiting-hibernation-advanced --> waiting-hibernation-confirm: keycard auth

    waiting-hibernation-seatbox --> waiting-hibernation: seatbox closed
    waiting-hibernation-seatbox --> waiting-hibernation-confirm: keycard auth

    waiting-hibernation-confirm --> shutting-down: timeout (3s, then hibernate)
```

### Key Transition Conditions

#### is_ready_to_drive()
Vehicle can enter "ready-to-drive" when ALL conditions are met:
- Dashboard ready
- Kickstand up
- Seatbox lock closed
- Not activating
- Handlebar unlocked
- Battery on

#### Hibernation Sequence
Manual hibernation requires:
1. Both brakes pressed
2. Dashboard ready
3. Not activating

Flow: parked (15s) → waiting-hibernation (brakes held 10s) → waiting-hibernation-advanced → waiting-hibernation-confirm (keycard) → shutting-down (3s) → stand-by (with hibernation flag)

#### Park Protection
1-second timer prevents rapid drive → park → drive oscillations

---

## Power Manager States

The power manager (unu-pm) tracks system power states separately from vehicle states. These are exposed via `power-manager:state` Redis key and BLE characteristic 9a5900a1:

### Power States

- **"booting"** - System starting up
- **"running"** - System fully operational
- **"suspending"** - System entering suspend mode
- **"suspending-imminent"** - Suspend about to occur (pre-suspend delay active)
- **"hibernating"** - System in hibernation
- **"hibernating-imminent"** - Hibernation about to occur
- **"hibernating-manual"** - Manual hibernation requested
- **"hibernating-manual-imminent"** - Manual hibernation about to occur
- **"hibernating-timer"** - Timer-based hibernation (configurable, default 5 days)
- **"hibernating-timer-imminent"** - Timer hibernation about to occur
- **"reboot"** - System reboot
- **"reboot-imminent"** - Reboot about to occur

### State Suffixes

The "-imminent" suffix indicates that a power state change is about to occur but the pre-suspend delay is still active. This gives services time to complete operations and prevents data loss.

### Power State Transitions

```mermaid
stateDiagram-v2
    [*] --> booting
    booting --> running: boot complete (~5s)
    running --> suspending-imminent: suspend request
    suspending-imminent --> suspending: pre-suspend delay (~60s)
    suspending-imminent --> running: abort suspend
    suspending --> hibernating-imminent: low battery / hibernate request
    suspending --> running: wakeup
    hibernating-imminent --> hibernating: iMX6 power down (~20s)
    hibernating-imminent --> running: abort hibernation
    hibernating --> booting: wakeup (brakes/BLE)
    running --> reboot-imminent: reboot request
    reboot-imminent --> reboot: pre-reboot delay
    reboot --> booting: system restart
```

### nRF Hibernation Levels

When in "hibernating" power state, the nRF firmware distinguishes between two hibernation levels based on CB battery charge:

- **L1 (Level 1)** - Triggered at CB battery ≤25% SoC
  - CB battery continues to power control electronics
  - Periodic wakeup checks for brake lever activation
  - Low battery wakeup at 10% SoC

- **L2 (Level 2)** - Triggered at CB battery ≤5% SoC
  - System switches to AUX battery to preserve CB battery
  - Minimal power consumption
  - Wakeup only via brake levers

See [nRF Power Management](../nrf/power-management.md) for details.

---

## Battery States

### Main Battery

Tracked per battery slot (battery:0, battery:1) via Redis and BLE:

- **"unknown"** - State cannot be determined
- **"asleep"** - Lowest power state, NFC wake detection active
- **"idle"** - Systems powered, high current path disabled
- **"active"** - Full power state, high current path enabled, required for driving/charging

### Connectivity Battery (CB)

- **"not-charging"** - Battery discharging
- **"charging"** - Battery charging (current > ~100mA)
- **"unknown"** - State cannot be determined

### Auxiliary Battery (AUX)

Hardware-controlled charging states:

- **"not-charging"** - Not charging
- **"bulk-charge"** - Maximum current charging for depleted battery
- **"absorption-charge"** - Constant voltage as battery approaches full charge
- **"float-charge"** - Maintenance mode for fully charged battery
