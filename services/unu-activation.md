# unu-activation

## Description

The activation service handles scooter provisioning and registration with the unu cloud. It performs initial setup including hardware verification, cloud registration, certificate provisioning, and settings download. The service can be triggered manually during manufacturing or automatically during first boot.

## Version

```
unu-activation 1.0.0-22-ga07b79e
```

## Command-Line Options

```
unu Activation Service
Copyright (c) 2020 unu GmbH
options:
 -l --log <LEVEL>             Sets the log level upto given argument LEVEL:
                              0=NONE, 1=ERROR, 2=WARN, 3=INFO, 4=DEBUG (default)
 -s --server <URL>            Use a nondefault upstream url (note: you need to specify the protocol)
                              (otherwise read from redis "settings cloud:url")
 -r --redis_host <URL>        Domain of the redis host
 -p --redis_port <PORT>       Port of the redis host
 -f --provision               Force the activation process, without waiting for keycards
 -c --cloud_key <FILE>        Specify a key file containing the cloud public key
                              (otherwise read from redis "settings cloud:key")
 -m --mdb_sn <NUMBER>         Specify the mdb serialnumber (instead of fetching it from sysfs)
 -t --sysroot <PATH>          Override system root (/) to fetch system files from. Paths are:
                              - /sys/fsl_otp/HW_OCOTP_CFG0           - CPU serial number
                              - /sys/fsl_otp/HW_OCOTP_CFG1           - CPU serial number
 -v --version                 Prints the version info
 -h --help                    Prints this help
```

## Redis Operations

### Hash: `scooter-activation`

**Fields written:**
- `step` - Current activation step (number or status string)
- `error-str` - Error message (if activation fails)

**Published channel:** `scooter-activation`

### Hash: `settings`

**Fields read:**
- `cloud:url` - Cloud API URL (unless overridden by `-s`)
- `cloud:key` - Cloud public key for verification (unless overridden by `-c`)

**Fields written:**
- Various settings received from cloud (customer type, behavior settings, etc.)

## Hardware Interfaces

### System Files Read

**CPU Serial Number:**
- `/sys/fsl_otp/HW_OCOTP_CFG0` - First part of serial (hex)
- `/sys/fsl_otp/HW_OCOTP_CFG1` - Second part of serial (hex)
- Can be overridden with `-m` option or `-t` sysroot option

The service combines these two values to create the MDB serial number.

### Network

- **Cloud API:** HTTPS connection to unu cloud
- **Certificate verification:** Uses cloud public key for TLS verification
- **Protocol:** Likely REST API with JSON payloads

## Configuration

### Systemd Unit

- **Unit file:** `/usr/lib/systemd/system/unu-activation.service`
- **Started by:** systemd (typically on-demand, not at every boot)
- **Type:** Likely oneshot service

## Observable Behavior

### Activation Flow

1. **Read hardware serial number**
   - From `/sys/fsl_otp/HW_OCOTP_CFG0` and `HW_OCOTP_CFG1`
   - Or from `-m` override

2. **Read cloud configuration**
   - Cloud URL from Redis `settings cloud:url` or `-s` option
   - Cloud public key from Redis `settings cloud:key` or `-c` option

3. **Wait for keycard** (unless `-f` flag used)
   - Waits for keycard authentication
   - Ensures legitimate provisioning

4. **Connect to cloud API**
   - HTTPS connection with certificate verification
   - Send hardware serial number and scooter information

5. **Receive provisioning data**
   - Download settings
   - Receive certificates
   - Get customer type configuration

6. **Write settings to Redis**
   - Update `settings` hash with cloud-provided data
   - Write configuration files if needed

7. **Update activation status**
   - Write `scooter-activation step` field with progress
   - Publish to `scooter-activation` channel
   - Write error message to `scooter-activation error-str` if failed

### Force Provision Mode

When started with `-f --provision`:
- Skips keycard authentication requirement
- Immediately starts provisioning
- Used during manufacturing/setup

### Activation Steps

The `step` field in `scooter-activation` tracks progress:
- Numeric values or string status
- Visible to dashboard for user feedback
- Examples: "connecting", "downloading", "complete", "failed"

### Error Handling

On failure:
- Writes error message to `scooter-activation error-str`
- Sets `step` to indicate failure
- Publishes to `scooter-activation` channel
- Exits with error code

## Log Output

The service logs to journald. Common log patterns:
- Serial number read
- Cloud connection attempts
- Authentication status
- Settings download
- Provisioning progress
- Error conditions

Use `journalctl -u unu-activation` to view logs.

## Dependencies

- **Internet connectivity** - Requires working network connection
- **Redis server** - For reading settings and writing status
- **Cloud API** - unu cloud must be reachable
- **Hardware serial number** - Must be readable from sysfs
- **Keycard** (unless `-f` used) - For authentication

## Security Considerations

- **Certificate verification:** Uses cloud public key to verify TLS connection
- **Keycard requirement:** Prevents unauthorized provisioning
- **Serial number binding:** Ties configuration to specific hardware

## Related Documentation

- [Redis Operations](../redis/README.md) - Activation hash fields
- [Dashboard Redis](../dashboard/REDIS.md) - How dashboard displays activation status
- [States](../states/README.md) - How activation status affects vehicle state
