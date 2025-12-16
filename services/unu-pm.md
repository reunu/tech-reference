# unu-pm

## Description

The power manager (unu-pm) controls system power states including suspend, hibernation, and reboot. It coordinates with systemd-logind, monitors service activity via D-Bus inhibitors, tracks busy services via Redis, communicates with the nRF52840 for hibernation control, and implements delays before power transitions. The service manages both automatic and manual hibernation modes with configurable timers.

## Version

```
unu-pm 1.0.0-75-g5410f90
```

## Command-Line Options

```
Copyright (c) 2020 unu GmbH
options:
 -l --log <LEVEL>                  Sets the log level upto given argument LEVEL:
                                   0=NONE, 1=ERROR, 2=WARN, 3=INFO, 4=DEBUG
 -h --help                         Prints this help
 -d --debug                        Normal operation but don't actually issue the system to suspend
 -s --pre_suspend_delay            The delay between the scooter goes to stand-by and a low-power-mode-imminent state is entered
 -p --suspend_imminent_delay       The duration in which a low-power-mode-imminent state is at least held
 -i --inhibitor_duration           The duration the system is held active after a suspend is issued
 -t --hibernation-timer            The duration of the hibernation timer in seconds (if undefined in redis)
 -I --ignore-services              Ignore the state of currently active services when evaluating if
                                   the system can be suspended
 -R --redis_host                   The hostname of the redis instance
 -P --redis_port                   The port of the redis instance
 -D --default_lpm_mode             by default enter this low power mode when possible
                                   0=running, 1=suspending, 2=hibernating, 3=hibernating_manual, 4=reboot, 5=hiberating-timer
 -S --socket_path                  the location of the unix domain socket where blocking inhibitors register themselves
 --dbus_bus                        the dbus bus to use when connecting to logind
 --dbus_path                       the dbus path to use when connecting to logind
 --dbus_interface                  the interface of logind to work with
```

## Redis Operations

### Hash: `power-manager`

**Fields written:**
- `state` - Power manager state (see States section below)
- `wakeup-source` - IRQ number from `/sys/power/pm_wakeup_irq` after system resume

**Published channel:** `power-manager` (published on state changes)

### Hash: `settings`

**Fields read:**
- `hibernation-timer` - Hibernation timer duration in seconds (default: 432,000 = 5 days)

**Subscribed channel:** `settings` (listens for updates to apply new timer value)

### Hash: `power-manager:busy-services`

**Fields written:**
- `<service-name> <reason> <what>` - Value is "block" or "delay" for active D-Bus inhibitors
- Fields are deleted when service inhibitor is released
- Hash is cleared and rebuilt on inhibitor list changes

This hash tracks D-Bus inhibitors from systemd-logind that are blocking suspend/hibernation.

**Published channel:** `power-manager:busy-services` (message: "updated")

### Hash: `vehicle`

**Fields read:**
- `state` - Vehicle state to detect stand-by condition for power transitions

**Subscribed channel:** `vehicle`

### Hash: `battery:0`

**Fields read:**
- `state` - Battery active state (affects suspend eligibility)

**Subscribed channel:** `battery:0`

### Lists consumed

- `scooter:power` - Commands processed via BRPOP:
  - `"run"` - Cancel low-power mode (highest priority)
  - `"suspend"` - Request suspend
  - `"hibernate"` - Request hibernation
  - `"hibernate-manual"` - Request manual hibernation (user-initiated)
  - `"hibernate-timer"` - Request timer-based hibernation
  - `"reboot"` - Request system reboot

Commands follow a priority system where `run` overrides all other modes, and manual hibernation blocks automatic hibernation.

### Lists written

- `scooter:modem` - Issues `LPUSH scooter:modem disable` when modem is the only remaining inhibitor blocking power transition

## Power Manager States

- `booting` - System starting up
- `running` - Normal operation
- `suspending-imminent` - About to suspend (pre-suspend delay active)
- `suspending` - Suspend in progress
- `hibernating-imminent` - About to hibernate
- `hibernating` - Hibernation in progress
- `hibernating-manual` - Manual hibernation requested
- `hibernating-manual-imminent` - Manual hibernation about to occur
- `hibernating-timer` - Timer-based hibernation (after configured delay)
- `hibernating-timer-imminent` - Timer hibernation about to occur
- `reboot` - Reboot in progress
- `reboot-imminent` - About to reboot

See [States Documentation](../states/README.md) for complete state machine.

## Hardware Interfaces

### nRF52840 Communication

The power manager communicates with unu-bluetooth service (which talks to nRF) via Redis:
- Monitors nRF reset information
- Commands hibernation via `scooter:power` list
- nRF firmware handles actual hardware power control

### Hibernation Levels

When hibernating, the nRF firmware selects between two levels based on CB battery charge:
- **L1:** CB battery >5%, periodic wakeup checks
- **L2:** CB battery ≤5%, switches to AUX battery, minimal power

See [nRF Power Management](../nrf/power-management.md) for details.

## D-Bus Interface

### Connection Details

- **Bus:** System D-Bus (configurable via `--dbus_bus`)
- **Path:** `/org/freedesktop/login1` (configurable via `--dbus_path`)
- **Interface:** `org.freedesktop.login1.Manager` (configurable via `--dbus_interface`)

The service maintains two D-Bus connections:
- **Async connection:** Monitors signals (`PrepareForSleep`, `PrepareForShutdown`, `PropertiesChanged`)
- **Sync connection:** Makes method calls (`Inhibit`, `ListInhibitors`, `Suspend`, `Reboot`, `PowerOff`)

### Signals Monitored

- `PrepareForSleep(boolean)` - Indicates suspend imminent (true) or resume completed (false)
- `PrepareForShutdown(boolean)` - Indicates shutdown/reboot imminent (true) or canceled (false)
- `PropertiesChanged` - Triggers inhibitor list refresh via `ListInhibitors()`

### Methods Called

- `Inhibit(what, name, why, mode)` - Creates inhibitor, returns file descriptor
  - `what`: `"sleep:shutdown"` (blocks both suspend and shutdown)
  - `mode`: `"block"` or `"delay"`
- `ListInhibitors()` - Returns array of current system inhibitors
- `Suspend(boolean interactive)` - Initiates system suspend
- `PowerOff(boolean interactive)` - Powers off the system
- `Reboot(boolean interactive)` - Reboots the system

## Configuration

### Systemd Unit

- **Unit file:** `/usr/lib/systemd/system/unu-pm.service`
- **Started by:** systemd at boot
- **Restart policy:** Always

### Debug Mode

When started with `-d --debug`, the service:
- Operates normally
- Does NOT actually suspend/hibernate the system
- Useful for testing power management logic

### Delay Configuration

- **Pre-suspend delay** (`-s`, default 60s): Time after stand-by before entering imminent state
- **Suspend imminent delay** (`-p`, default 5s): Minimum duration in imminent state
- **Inhibitor duration** (`-i`, default 500ms): How long system stays active after suspend request

These delays allow services to complete operations before power down. The pre-suspend delay is shortened to suspend-imminent delay for RTC wakeups (IRQ 45).

### Default Low-Power Mode

The `-D` option sets the default power mode:
- `0` = running (no auto-suspend)
- `1` = suspending
- `2` = hibernating
- `3` = hibernating_manual
- `4` = reboot
- `5` = hibernating-timer

### Hibernation Timer

- **Configuration:** Via `-t` option or `settings hibernation-timer` Redis field
- **Default:** 5 days (432,000 seconds)
- **Purpose:** Auto-hibernate after extended inactivity
- **Value 0:** Disables the timer

## Observable Behavior

### Startup Sequence

1. Connects to Redis
2. Connects to D-Bus (systemd-logind, both async and sync connections)
3. Opens Unix domain socket (SOCK_SEQPACKET) at `/tmp/suspend_inhibitor` for inhibitor registration
4. Enables wakeup on serial ports (`/sys/class/tty/ttymxc0/power/wakeup` and `ttymxc1`)
5. Reads hibernation timer from Redis `settings` hash (or uses `-t` value, default 432,000s)
6. Sets initial state to `running`
7. Begins monitoring vehicle state, battery state, and D-Bus inhibitors

### Runtime Behavior

#### Suspend Trigger

When vehicle enters `stand-by` state:
1. Pre-suspend delay timer starts
2. State transitions to `suspending-imminent`
3. Services can register inhibitors to block suspend
4. After suspend-imminent delay, checks if suspend allowed
5. If allowed, sends suspend command to systemd-logind
6. State transitions to `suspending`

#### Hibernation Trigger

**Automatic hibernation:**
- Triggered by low CB battery
- Vehicle service sends `LPUSH scooter:power hibernate`
- Power manager coordinates with nRF via unu-bluetooth

**Manual hibernation:**
- User holds brakes + taps keycard
- Vehicle service sends `LPUSH scooter:power hibernate-manual`
- Special state sequence with user confirmation

**Timer hibernation:**
- After hibernation timer expires (e.g., 5 days of stand-by)
- Automatic hibernation to preserve battery
- State: `hibernating-timer-imminent` → `hibernating-timer`

#### Service Inhibitors

Two types of inhibitors:

**D-Bus inhibitors:**
- Standard systemd-logind inhibitors via `org.freedesktop.login1.Manager.Inhibit()`
- Services call D-Bus method with parameters: `what`, `name`, `why`, `mode`
- Mode can be "block" (prevents action) or "delay" (briefly delays action)
- Automatically released when service closes file descriptor or exits
- Monitored via `ListInhibitors()` calls triggered by `PropertiesChanged` signals
- Some inhibitors are ignored for compatibility: `handle-lid-switch`, `handle-power-key:handle-suspend-key:handle-hibernate-key`

**Unix socket inhibitors:**
- Custom SOCK_SEQPACKET socket at `/tmp/suspend_inhibitor` (configurable via `-S`)
- Services connect to socket to register as blocking inhibitor
- Power manager sends acknowledgment byte (0x00) on connection
- Blocks suspend while connection remains open
- Automatically released when socket closes
- Used by services that cannot use D-Bus

#### Busy Services Tracking

The `power-manager:busy-services` hash shows D-Bus inhibitors blocking power transitions:
```
HGETALL power-manager:busy-services
# Example output:
# "unu-uplink Uploading logs sleep" = "block"
# "unu-modem Waiting for network sleep:shutdown" = "delay"
```

Field format: `<service-name> <reason> <what>` → `<mode>`

The hash is cleared and rebuilt whenever inhibitor status changes.

#### Modem Special Handling

When the modem is the only remaining inhibitor and timers have elapsed:
- Power manager issues `LPUSH scooter:modem disable` to force modem shutdown
- Allows system to proceed with power transition even if modem doesn't release inhibitor
- Prevents modem from blocking shutdown indefinitely

#### Ignore Services Mode

When started with `-I --ignore-services`:
- Ignores busy service status
- Allows suspend/hibernate even if services are busy
- Used for testing or emergency shutdown

### Hibernation Procedure

1. Power manager receives hibernation command
2. Transitions to `hibernating-imminent`
3. Notifies all services via Redis state change
4. Waits for services to complete operations
5. Sends hibernation request to nRF (via unu-bluetooth → Redis)
6. nRF powers down iMX6 processor
7. nRF enters hibernation mode
8. System powered off

### Wakeup from Suspend/Hibernation

1. System wakes from hardware trigger (brake lever, serial port, RTC, etc.)
2. nRF powers on iMX6 (if hibernated) or kernel resumes (if suspended)
3. System boots or resumes
4. Power manager reads wakeup source from `/sys/power/pm_wakeup_irq`
5. Publishes IRQ number to `power-manager:wakeup-source` Redis field
6. Applies wakeup-specific delays:
   - **IRQ 45 (RTC):** Uses short delay (suspend-imminent delay, default 5s)
   - **Other IRQs:** Uses full pre-suspend delay (default 60s)
7. Transitions to `running` state
8. Monitors for next power transition trigger

The RTC wakeup gets faster re-suspend to support timer-based features that wake the system temporarily.

### Power Mode Priority System

Commands from the `scooter:power` list follow a priority hierarchy:

1. **`run`** (highest) - Cancels any pending power transition, returns to running state
2. **`hibernate-manual`** - User-initiated hibernation, blocks automatic hibernation modes
3. **`hibernate`** - Automatic hibernation (low battery), blocks timer hibernation
4. **`hibernate-timer`** - Timer-based hibernation (after extended inactivity)
5. **`suspend`** / **`reboot`** (lowest) - Can be overridden by hibernation modes

When multiple commands are received, the higher-priority mode takes precedence. For example:
- `run` command cancels all pending hibernation/suspend requests
- `hibernate-manual` overrides automatic `hibernate` or `hibernate-timer`
- `hibernate` overrides `hibernate-timer`

This ensures user-initiated actions (run, manual hibernation) always take precedence over automatic power management.

### Vehicle State Interaction

Power transitions are tied to vehicle state:
- Power transition timers start when vehicle enters `stand-by` state
- If vehicle exits `stand-by` during transition sequence, the power transition is aborted
- Battery state (from `battery:0` hash) also affects suspend eligibility
- System subscribes to `vehicle` and `battery:0` channels for real-time state updates

## Log Output

The service logs to journald. Common log patterns:
- State transitions
- Inhibitor registration/release
- Busy service tracking
- D-Bus communication
- Hibernation commands
- Timer events

Use `journalctl -u unu-pm` to view logs.

## Dependencies

- **systemd-logind** - For suspend/hibernate control
- **D-Bus** - For systemd communication
- **Redis server** - For state coordination
- **unu-bluetooth** - For nRF communication
- **vehicle state** - Monitors `vehicle state` for trigger conditions

## Related Documentation

- [Power Management States](../states/README.md) - Power manager state machine
- [nRF Power Management](../nrf/power-management.md) - Hibernation details
- [Redis Operations](../redis/README.md) - Power manager hash fields
- [Vehicle States](../states/README.md) - How vehicle state affects power management
