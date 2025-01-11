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

The Redis database uses hash sets for system state storage:

### Vehicle State (`vehicle`)
```
hgetall vehicle
```

| Field | Values | Description |
|-------|---------|------------|
| handlebar:position | "on-place" | Handlebar position |
| handlebar:lock-sensor | "locked"/"unlocked" | Handlebar lock state |
| main-power | "on"/"off" | Main power state |
| kickstand | "up"/"down" | Side stand position |
| seatbox:button | "on"/"off" | Seat open button state |
| seatbox:lock | "open"/"closed" | Seat lock state |
| horn:button | "on"/"off" | Horn button state |
| brake:left | "on"/"off" | Left brake state |
| brake:right | "on"/"off" | Right brake state |
| blinker:switch | "left"/"right"/"both"/"off" | Blinker switch position |
| blinker:state | "on"/"off" | Blinker active state |
| state | "stand-by"/"ready" | Vehicle operating state |

### Engine ECU (`engine-ecu`)
```
hgetall engine-ecu
```

| Field | Type | Description |
|-------|------|-------------|
| state | "on"/"off" | ECU power state |
| kers-reason-off | string | Reason KERS is disabled |
| kers | "on"/"off" | KERS active state |
| motor:voltage | integer (mV) | Motor voltage |
| motor:current | integer (mA) | Motor current |
| rpm | integer | Motor RPM |
| speed | integer (km/h) | Vehicle speed |
| throttle | "on"/"off" | Throttle state |
| fw-version | hex string | ECU firmware version |
| odometer | integer | Total distance |
| temperature | integer (°C) | ECU temperature |

### Other Keys

- `system` - System status
- `events:pointers` - Event tracking
- `power-manager` - Power management state
- `dashboard` - Dashboard state
- `ota` - Over-the-air update status
- `aux-battery` - Auxiliary battery data
- `power-mux` - Power multiplexing state
- `cb-battery` - Connectivity battery data
- `power-manager:busy-services` - Power management locks
- `navigation` - Navigation state
- `settings` - System settings
- `events:faults` - Fault event log
- `battery:0` - Primary battery data
- `battery:1` - Secondary battery data
- `ble` - Bluetooth state
- `internet` - Internet connectivity state
