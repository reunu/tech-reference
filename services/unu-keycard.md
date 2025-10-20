# unu-keycard

## Description

The keycard service handles NFC-based authentication for the scooter. It manages the PN7150 NFC reader to detect keycards, verifies card UIDs against an authorized list, maintains a blocklist, and controls the LP5662 LED to provide visual feedback. Authentication status is published to Redis with a 10-second expiration, requiring periodic re-authentication.

## Version

```
unu-keycard 1.0.1-14-g5511cb3
```

## Command-Line Options

```
unu Keycard Service
Copyright (c) 2020 unu GmbH
options:
 -d --loglevel <level> Sets the log level, sets mask upto level given as argument
                       NOLOG=0, ERROR=1, WARNING=2, INFO=3, DEBUG=4
 -V --version          Prints the version info
 -h --help             Prints this help
 -D <dev>              the i2c device where the PN7150 is connected to
 -p <duration>         the poll period (in ms) used to detect tags
 -c <duration>         the duration (in ms) how often to restart the discovery mode
 -l <led_dev>          the i2c device where the LP5662 is connected to
 -C <color>            set leds and exit (green, yellow, red, off)
 -b <block_list_file>  file where the block list is located
 -L                    enable the low power tag detection
```

## Redis Operations

### Hash: `keycard`

**Fields written:**
- `authentication` - Authentication result ("passed", "failed")
- `type` - Keycard type (e.g., "scooter", "factory", "activation")
- `uid` - Keycard UID (hex string)
- **Expiration:** 10 seconds (entire hash auto-expires in Redis)

The 10-second expiration requires users to keep the keycard present during authentication flows.

**Published channel:** `keycard:authentication`

### Hashes read

- `settings` - Reads keycard-related settings
  - `keycard:uid:N` - Authorized keycard UIDs (N=0,1,2...)
  - Block list configuration

## Hardware Interfaces

### NFC Reader

- **Chip:** PN7150 NFC controller
- **Interface:** I2C
- **Device:** Configurable via `-D` option (e.g., `/dev/pn5xx_i2c2`)
- **Supported tags:** ISO14443 Type A/B, MIFARE, etc.

### LED Controller

- **Chip:** LP5662 LED controller
- **Interface:** I2C
- **Device:** Configurable via `-l` option
- **Colors:** Green (success), Yellow (processing), Red (failure), Off

The LED provides visual feedback:
- **Green:** Authentication successful
- **Yellow:** Processing/waiting
- **Red:** Authentication failed (unauthorized card or blocked)
- **Off:** Idle

## Configuration

### Systemd Unit

- **Unit file:** `/usr/lib/systemd/system/unu-keycard.service`
- **Started by:** systemd at boot
- **Restart policy:** Always

### Block List File

- **Location:** Configurable via `-b` option
- **Format:** List of blocked card UIDs (one per line, hex format)
- **Purpose:** Prevent stolen/lost cards from authenticating

### LED Color Override

The `-C` option allows manually setting LED color and exiting:
```bash
unu-keycard -C green   # Set LED to green and exit
unu-keycard -C red     # Set LED to red and exit
unu-keycard -C off     # Turn off LED and exit
```

This is useful for testing or manual LED control.

## Observable Behavior

### Startup Sequence

1. Initializes PN7150 NFC reader (I2C)
2. Initializes LP5662 LED controller (I2C)
3. Loads block list from file
4. Connects to Redis
5. Reads authorized keycard UIDs from `settings` hash
6. Starts NFC tag detection loop
7. Sets LED to off/idle state

### Runtime Behavior

#### Tag Detection

- **Poll period:** Configurable via `-p` (default in milliseconds)
- **Discovery restart:** Configurable via `-c` (periodic restart of NFC discovery)
- **Low-power mode:** Optional via `-L` flag for power-efficient operation

#### Authentication Flow

1. NFC tag detected
2. Read card UID
3. Check against block list
4. If not blocked, check against authorized UIDs from Redis
5. Set LED color:
   - Yellow during processing
   - Green if authorized
   - Red if unauthorized/blocked
6. Write to Redis:
   - `HSET keycard-auth authenticated true/false`
   - `HSET keycard-auth card-uid <UID>`
   - Set expiration to 10 seconds
7. Publish to `keycard-auth` channel

#### Expiration Behavior

The `authenticated` field expires after 10 seconds. This means:
- User must keep keycard present for authentication
- Services polling `keycard-auth` see expired (missing) value if card removed
- Prevents stale authentication status

#### Block List

Cards in the block list are immediately rejected:
- No authentication check performed
- LED shows red
- `authenticated` set to "false"
- Useful for revoking lost/stolen cards

### Low-Power Tag Detection

When started with `-L` flag:
- Uses PN7150 low-power poll mode
- Reduces power consumption
- May slightly increase detection latency

## Log Output

The service logs to journald. Common log patterns:
- Tag detection events
- Authentication success/failure
- Block list hits
- NFC reader errors
- I2C communication issues

Use `journalctl -u unu-keycard` to view logs.

## Dependencies

- **PN7150 NFC reader** - Must be accessible via I2C
- **LP5662 LED controller** - Must be accessible via I2C
- **Redis server** - At default Redis host/port (192.168.7.1:6379)
- **Block list file** - If specified, must exist and be readable
- **Settings in Redis** - Authorized keycard UIDs must be in `settings` hash

## Related Documentation

- [Electronic Components](../electronic/README.md) - PN7150 and LP5662 hardware details
- [Redis Operations](../redis/README.md) - Keycard auth hash and expiration
- [States](../states/README.md) - How keycard auth affects vehicle state
