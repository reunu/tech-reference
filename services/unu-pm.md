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
- `nrf-reset-count` - nRF reset count (from unu-bluetooth)
- `nrf-reset-reason` - nRF reset reason register value
- `hibernate-level` - Hibernation level ("L1", "L2")

**Fields read:**
- `hibernation-timer` - Hibernation timer duration in seconds (if set)

**Published channel:** `power-manager`

### Hash: `power-manager:busy-services`

**Fields written:**
- `<service-name>` - "busy" or field deleted when not busy

This hash tracks which services are blocking suspend/hibernation.

**Published channel:** `power-manager:busy-services`

### Lists consumed (BRPOP)

- `scooter:power` - Power commands ("hibernate", "hibernate-manual", "reboot")

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

- **Pre-suspend delay** (`-s`): Time after stand-by before entering imminent state
- **Suspend imminent delay** (`-p`): Minimum duration in imminent state
- **Inhibitor duration** (`-i`): How long system stays active after suspend request

These delays allow services to complete operations before power down.

### Default Low-Power Mode

The `-D` option sets the default power mode:
- `0` = running (no auto-suspend)
- `1` = suspending
- `2` = hibernating
- `3` = hibernating_manual
- `4` = reboot
- `5` = hibernating-timer

### Hibernation Timer

- **Configuration:** Via `-t` option or `power-manager hibernation-timer` Redis field
- **Default:** Not set (no automatic timer hibernation)
- **Purpose:** Auto-hibernate after extended inactivity (e.g., 5 days)

## Observable Behavior

### Startup Sequence

1. Connects to Redis
2. Connects to D-Bus (systemd-logind)
3. Opens Unix domain socket for inhibitor registration
4. Reads hibernation timer from Redis (or uses `-t` value)
5. Sets initial state to `booting`
6. Transitions to `running` after initialization

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
- Standard systemd-logind inhibitors
- Services can call D-Bus method to block suspend
- Automatically released when service exits

**Unix socket inhibitors:**
- Custom inhibitor mechanism
- Services connect to socket and send registration message
- Blocks suspend while connection open
- Automatically released when socket closes

#### Busy Services Tracking

The `power-manager:busy-services` hash shows which services are blocking power transitions:
```
HGETALL power-manager:busy-services
# Example output:
# unu-uplink = "busy"
# unu-modem = "busy"
```

Services are removed from the hash when they become non-busy.

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

### Wakeup from Hibernation

1. User pulls brake lever (or other wakeup source)
2. nRF wakes up
3. nRF powers on iMX6
4. System boots
5. Power manager starts in `booting` state
6. Transitions to `running`

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
