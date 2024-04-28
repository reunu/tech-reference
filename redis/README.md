# Redis Reference
Documenting Redis DB

## Overview

| **Service** | **Characteristic** | **Values** | **Description** |
|---|---|---|---|
| TBD | TBD | TBD | TBD |

TBD = to be defined / verified

## Redis instance

You can connect to the [redis](https://redis.io) instance via:

| **IP**      | **Port** |
|-------------|----------|
| 192.168.7.1 | 6379     |

You can use the following command locally:

```
redis-cli -h 192.168.7.1 -p 6379
```

## Keys

```
 1) "system"
 2) "events:pointers"
 3) "power-manager"
 4) "dashboard"
 5) "ota"
 6) "aux-battery"
 7) "power-mux"
 8) "cb-battery"
 9) "power-manager:busy-services"
10) "navigation"
11) "settings"
12) "events:faults"
13) "engine-ecu"
14) "battery:0"
15) "ble"
16) "internet"
17) "vehicle"
18) "battery:1"
```

## Key description

### Vehicle

```
> hgetall vehicle
 1) "handlebar:position"
 2) "on-place"
 3) "handlebar:lock-sensor"
 4) "locked"
 5) "main-power"
 6) "on"
 7) "kickstand"
 8) "down"
 9) "seatbox:button"
10) "off"
11) "seatbox:lock"
12) "closed"
13) "horn:button"
14) "off"
15) "brake:left"
16) "off"
17) "brake:right"
18) "off"
19) "blinker:switch"
20) "off"
21) "state"
22) "stand-by"
23) "blinker:state"
24) "off"
```

## ecu-engine

```
> hgetall engine-ecu
 1) "state"
 2) "off"
 3) "kers-reason-off"
 4) "none"
 5) "kers"
 6) "off"
 7) "motor:voltage"
 8) "55770"
 9) "motor:current"
10) "0"
11) "rpm"
12) "0"
13) "speed"
14) "0"
15) "throttle"
16) "off"
17) "fw-version"
18) "0445400C"
19) "odometer"
20) "1002400"
21) "temperature"
22) "24"
```
