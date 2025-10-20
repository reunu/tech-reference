# unu-vehicle

## Description

The vehicle service implements the vehicle state machine, managing transitions between states like stand-by, parked, ready-to-drive, and shutting-down. It monitors GPIO inputs (kickstand, brakes, blinker switch, seatbox button), controls PWM outputs (blinker LEDs, seatbox lock), and coordinates with other services via Redis to determine when the vehicle is ready to drive.

## Version

```
unu-vehicle v1.1.0-69-g21f49e0
usk v1.4.0-13-ge899b26
```

## Command-Line Options

```
options:
 -l --log <LEVEL>             Sets the log level upto given argument LEVEL:
                              0=NONE, 1=ERROR, 2=WARN, 3=INFO, 4=DEBUG
 -v --version                 Prints the version info
 -h --help                    Prints this help
 -s --redis_server <ADDRESS>  Redis server address, e.g. localhost
 -p --redis_port <PORT>       Redis server port, e.g. 6379
 -i --input_device <DEVICE>   Sets the input device, e.g. /dev/input/by-path/platform-gpio-keys-event
 -b --blinker_period <PERIOD> Sets the blinker period in seconds, e.g. 0.728
 -P --pwm_frequency <FREQ>    Sets the PWM frequency in Hz, e.g. 2000
 -r --sample_rate <FREQ>      Sets the PWM sample rate in Hz, e.g. 250
```

## Redis Operations

### Hash: `vehicle`

**Fields written:**
- `state` - Vehicle state (see States section below)
- `brake:left` - Left brake state ("on", "off")
- `brake:right` - Right brake state ("on", "off")
- `blinker:state` - Blinker active state ("on", "off")
- `blinker:switch` - Blinker switch position ("left", "right", "both", "off")
- `horn:button` - Horn button state ("on", "off")
- `seatbox:button` - Seatbox button state ("on", "off")
- `seatbox:lock` - Seatbox lock state ("open", "closed")
- `kickstand` - Kickstand position ("up", "down")
- `main-power` - Main power state ("on", "off")
- `handlebar:position` - Handlebar position ("on-place", "off-place")
- `handlebar:lock-sensor` - Handlebar lock sensor ("locked", "unlocked")

**Published channel:** `vehicle`

### Lists consumed (BRPOP)

- `scooter:state` - State change commands ("lock", "unlock", "lock-hibernate")
- `scooter:seatbox` - Seatbox commands ("open")
- `scooter:horn` - Horn commands ("on", "off")
- `scooter:blinker` - Blinker commands ("left", "right", "both", "off")

### Hashes read

- `dashboard` - Reads `ready` field to check if dashboard initialized
- `battery:0` - Reads `present`, `state`, `charge` fields
- `battery:1` - Reads `present`, `state`, `charge` fields
- `keycard-auth` - Reads keycard authentication status
- `scooter-activation` - Reads activation status
- `settings` - Reads behavior settings

## Vehicle States

The service implements the canonical vehicle state machine with these states:

- `unknown` - Initial/uninitialized
- `stand-by` - Powered but motor disabled
- `parked` - Unlocked with kickstand down
- `ready-to-drive` - All conditions met, motor enabled
- `waiting-seatbox` - Waiting for seatbox to close
- `shutting-down` - Transitioning to power down (~5s)
- `updating` - OTA firmware update in progress
- `waiting-hibernation` - Manual hibernation sequence (60s timeout)
- `waiting-hibernation-advanced` - Brakes held for 10s+
- `waiting-hibernation-seatbox` - Hibernation wait with seatbox open
- `waiting-hibernation-confirm` - Hibernation confirmation (3s)

See [States Documentation](../states/README.md) for complete state machine.

## Hardware Interfaces

### GPIO Inputs (via /dev/input)

- **Input device:** Configurable via `-i` option
- **Default:** `/dev/input/by-path/platform-gpio-keys-event`

**Monitored inputs:**
- Kickstand position sensor
- Left brake lever sensor
- Right brake lever sensor
- Blinker switch (3-position or 4-position)
- Seatbox button
- Handlebar position sensor
- Handlebar lock sensor

### PWM Outputs

- **Blinker LEDs:** PWM-controlled for blink effect
- **Seatbox lock:** PWM-controlled solenoid
- **PWM frequency:** Configurable via `-P` (default: 2000 Hz)
- **Sample rate:** Configurable via `-r` (default: 250 Hz)
- **Blinker period:** Configurable via `-b` (default: 0.728 seconds)

## Configuration

### Systemd Unit

- **Unit file:** `/usr/lib/systemd/system/unu-vehicle.service`
- **Started by:** systemd at boot
- **Restart policy:** Always

## Observable Behavior

### Startup Sequence

1. Opens GPIO input device
2. Initializes PWM outputs
3. Connects to Redis
4. Reads initial state from other services
5. Determines initial vehicle state
6. Publishes vehicle state to Redis

### State Machine Behavior

#### Ready-to-Drive Conditions

Vehicle enters `ready-to-drive` when ALL are true:
- Dashboard ready (`dashboard ready` = "true")
- Kickstand up
- Seatbox closed
- Not activating
- Handlebar unlocked
- At least one battery on

#### Lock/Unlock Handling

**Lock command** (`LPUSH scooter:state lock`):
1. Transitions to `shutting-down`
2. Turns off batteries (LPUSH battery:N:power off)
3. After ~5 seconds, transitions to `stand-by`
4. Power manager then suspends/hibernates

**Unlock command** (`LPUSH scooter:state unlock`):
1. Authenticates via keycard (if required)
2. Transitions from `stand-by` to `parked` or `ready-to-drive`
3. Turns on batteries if ready to drive

#### Hibernation Sequence

Manual hibernation (`LPUSH scooter:state lock-hibernate`):
1. Both brakes must be pressed
2. Transitions through hibernation states
3. Final state: `shutting-down` with hibernation flag
4. Power manager performs hibernation

#### Blinker Control

The service implements automatic blinker logic:
- PWM-modulated blink pattern
- Configurable period (default 0.728s)
- Responds to blinker switch and Redis commands
- Publishes blinker state changes

#### Seatbox Control

**Open command** (`LPUSH scooter:seatbox open`):
1. Activates seatbox lock PWM
2. Unlocks seatbox
3. Updates `seatbox:lock` field
4. Publishes to `vehicle` channel

### Command Processing

Commands are consumed via BRPOP with timeout:
- `scooter:state` - Priority: state changes
- `scooter:seatbox` - Priority: seatbox control
- `scooter:blinker` - Priority: blinker override

### Battery Power Management

The service controls battery power based on vehicle state:
- **ready-to-drive:** Batteries ON
- **parked/shutting-down:** Batteries OFF
- Commands sent via `LPUSH battery:N:power on/off`

### Fault Detection

Monitors for faults:
- Battery communication failures
- Sensor inconsistencies
- State machine violations

Publishes faults to `vehicle fault` field.

## Log Output

The service logs to journald. Common log patterns:
- State transitions
- Input events (kickstand, brakes, switches)
- Command processing
- Battery power state changes
- Fault conditions

Use `journalctl -u unu-vehicle` to view logs.

## Dependencies

- **GPIO input device** - Must have accessible input event device
- **PWM subsystem** - For blinker LEDs and seatbox lock
- **Redis server** - At specified host:port
- **dashboard** - Waits for `dashboard ready` = "true"
- **batteries** - Monitors battery presence and state
- **keycard** - Checks authentication for unlock

## Related Documentation

- [Vehicle States](../states/README.md) - Complete state machine
- [Redis Operations](../redis/README.md) - Vehicle hash fields
- [Electronic Components](../electronic/README.md) - GPIO and PWM hardware
