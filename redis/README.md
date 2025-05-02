# Redis Interface Documentation

## Connection Details

The scooter runs a Redis instance on the MDB accessible at:
- Host: 192.168.7.1  
- Port: 6379

Local connection command:
```bash
redis-cli -h 192.168.7.1 -p 6379
```

## Key Structure

The Redis database uses hash sets for system state storage. All fields default to empty strings ("") when data is unavailable unless otherwise noted.

For potential values, also see the [Bluetooth reference](../bluetooth/README.md).

### Vehicle State (`vehicle`)
```
hgetall vehicle
```

| Field | Type | Description | Example |
|-------|---------|------------|---------|
| handlebar:position | "on-place"/"off-place" | Handlebar position | "on-place" |
| handlebar:lock-sensor | "locked"/"unlocked" | Handlebar lock state | "unlocked" |
| main-power | "on"/"off" | Main power state | "off" |
| kickstand | "up"/"down" | Side stand position | "down" |
| seatbox:button | "on"/"off" | Seat open button state | "off" |
| seatbox:lock | "open"/"closed" | Seat lock state | "closed" |
| horn:button | "on"/"off" | Horn button state | "off" |
| brake:left | "on"/"off" | Left brake state | "off" |
| brake:right | "on"/"off" | Right brake state | "off" |
| blinker:switch | "left"/"right"/"both"/"off" | Blinker switch position | "off" |
| blinker:state | "on"/"off" | Blinker active state | "off" |
| state | "stand-by"/"ready-to-drive"/"off"/"parked"/"booting"/"shutting-down"/"hibernating"/"hibernating-imminent"/"suspending"/"suspending-imminent"/"updating" | Vehicle operating state | "stand-by" |

### Engine ECU (`engine-ecu`)
```
hgetall engine-ecu
```

| Field | Type | Description | Example |
|-------|------|-------------|----------|
| state | "on"/"off" | ECU power state | "off" |
| kers-reason-off | string | Reason KERS is disabled | "none" |
| kers | "on"/"off" | KERS active state | "on" |
| motor:voltage | integer (mV) | Motor voltage | "52140" |
| motor:current | integer (mA) | Motor current | "0" |
| rpm | integer | Motor RPM | "0" |
| speed | integer (km/h) | Vehicle speed | "0" |
| throttle | "on"/"off" | Throttle state | "off" |
| fw-version | hex string | ECU firmware version | "0445400C" |
| odometer | integer (m) | Total distance | "632900" |
| temperature | integer (°C) | ECU temperature | "16" |

### Battery Management (`battery:0` and `battery:1`)
```
hgetall battery:0
hgetall battery:1
```

Note: When battery is not present (`"present": "false"`), all fields will show default values as shown in examples.

| Field | Type | Description | Example |
|-------|------|-------------|----------|
| present | "true"/"false" | Battery presence | "false" |
| state | string | Battery state | "unknown" |
| voltage | integer (mV) | Battery voltage | "0" |
| current | integer (mA) | Battery current | "0" |
| charge | integer (%) | Battery charge level | "0" |
| temperature:0-3 | integer (°C) | Battery temperature sensors | "0" |
| temperature-state | string | Temperature status | "unknown" |
| cycle-count | integer | Battery cycle count | "0" |
| state-of-health | integer (%) | Battery health | "0" |
| serial-number | string | Battery serial number | "" |
| manufacturing-date | string | Manufacturing date | "" |
| fw-version | string | Firmware version | "" |

### Auxiliary Battery (`aux-battery`)
```
hgetall aux-battery
```

| Field | Type | Description | Example |
|-------|------|-------------|----------|
| data-stream-enable | "0"/"1" | Enable data streaming | "0" |
| voltage | integer (mV) | Battery voltage | "11919" |
| charge | integer (%) | Battery charge level | "25" |
| charge-status | string | Charging status | "not-charging" |

### Connectivity Battery (`cb-battery`)
```
hgetall cb-battery
```

| Field | Type | Description | Example |
|-------|------|-------------|----------|
| charge | integer (%) | Battery charge level | "72" |
| current | integer (μA) | Current draw | "-51041" |
| remaining-capacity | integer (μWh) | Remaining capacity | "16830000" |
| temperature | integer (°C) | Battery temperature | "21" |
| cycle-count | integer | Battery cycle count | "5" |
| time-to-empty | integer (sec) | Time until empty | "368634" |
| time-to-full | integer (sec) | Time until full | "368634" |
| cell-voltage | integer (μV) | Cell voltage | "4016328" |
| full-capacity | integer (μWh) | Total capacity | "23270000" |
| state-of-health | integer (%) | Battery health | "94" |
| present | "true"/"false" | Battery presence | "true" |
| charge-status | string | Charging status | "not-charging" |
| part-number | string | Part identification | "MAX17301" |
| serial-number | string | Serial number | "T-CBB 2107245036" |
| unique-id | string | Unique identifier | "420000508ff2c826" |

### System Information (`system`)
```
hgetall system
```

| Field | Type | Description | Example |
|-------|------|-------------|----------|
| mdb-version | string | MDB firmware version | "v1.15.0+430538" |
| environment | string | System environment | "production" |
| nrf-fw-version | string | NRF firmware version | "v1.12.0" |
| dbc-version | string | Dashboard computer version | "v1.15.0+430553" |

### Power Management (`power-manager`)
```
hgetall power-manager
```

| Field | Type | Description | Example |
|-------|------|-------------|----------|
| state | string | Current power state | "suspending" |
| wakeup-source | string | Source that woke system | "78" |

### Power Multiplexing (`power-mux`)
```
hgetall power-mux
```

| Field | Type | Description | Example |
|-------|------|-------------|----------|
| selected-input | "cb"/"aux" | Selected power input source | "cb" |

### Internet Connectivity (`internet`)
```
hgetall internet
```

| Field | Type | Description | Example |
|-------|------|-------------|----------|
| modem-state | string | Modem power state | "off" |
| status | string | Connection status | "disconnected" |
| unu-cloud | string | Cloud connection status | "disconnected" |
| ip-address | string | IP address | "1.2.3.4" |
| access-tech | string | Access technology | "LTE" |
| signal-quality | integer | Signal strength (0-100) | "0" |
| sim-imei | string | SIM IMEI | "" |
| sim-iccid | string | SIM ICCID | "" |

### Dashboard Interface (`dashboard`)
```
hgetall dashboard
```

| Field | Type | Description | Example |
|-------|------|-------------|----------|
| ready | "true"/"false" | Dashboard ready state | "false" |
| mode | string | Current display mode | "speedometer" |
| serial-number | string | Dashboard serial number | "379999993" |

See [Dashboard](../dashboard/README.md).

### Bluetooth Interface (`ble`)
```
hgetall ble
```

| Field | Type | Description | Example |
|-------|------|-------------|----------|
| mac-address | string | Bluetooth MAC address (lowercase with colons) | "ce:df:f6:c0:ff:ee" |
| status | string | Connection status | "disconnected" |

### Navigation System
The navigation system uses two related hashes:

Main Navigation Status (`navigation`)
```
hgetall navigation
```

| Field | Type | Description | Example |
|-------|------|-------------|----------|
| status | string | Navigation status | "unset" |

Navigation Coordinates (`navigation:coord`)
```
hgetall navigation:coord
```

| Field | Type | Description | Example |
|-------|------|-------------|----------|
| location | ? | probably packed coords? | "378993323372" |

### GPS Data (`gps`)
```
hgetall gps
```

| Field | Type | Description | Example |
|-------|------|-------------|----------|
| latitude | string | Current latitude (6 decimal places) | "0.000000" |
| longitude | string | Current longitude (6 decimal places) | "0.000000" |
| altitude | string | Current altitude (6 decimal places) | "0.000000" |
| timestamp | string | GPS timestamp (ISO format) | "0000-00-00T00:00:00" |
| speed | string | GPS speed (6 decimal places) | "0.000000" |
| course | string | GPS course (6 decimal places) | "0.000000" |

### Over-the-Air Updates (`ota`)
```
hgetall ota
```

| Field | Type | Description | Example |
|-------|------|-------------|----------|
| system | string | Update system type | "foundries" |
| migration | string | Migration status | "successful" |
| status | string | Update status | "initializing" |
| fresh-update | "true"/"false" | Fresh update flag | "false" |

### Settings (`settings`)
```
hgetall settings
```

| Field | Type | Description | Example |
|-------|------|-------------|----------|
| behavior:poweroff_timeout_with_battery | integer (sec) | Power off timeout with battery | "900" |
| behavior:must_lock_handlebar | "true"/"false" | Must lock handlebar setting | "true" |
| behavior:poweroff_timeout_without_battery | integer (sec) | Power off timeout without battery | "900" |
| notification:timeout_seatbox_open_lock_requested | integer (sec) | Seat open timeout | "30" |
| customer:type | string | Customer type | "D2C" |
| cloud:mqtt-ca | string | MQTT CA certificate path | "/etc/keys/unu-mqtt-production.pub" |
| cloud:url | string | Cloud URL | "cloud-iot-v1.unumotors.com" |
| cloud:key | string | Cloud key path | "/etc/keys/unu-cloud-production.pub" |
| cloud:mqtt-url | string | MQTT server URL | "zeus-iot-v3.unumotors.com:8883" |
