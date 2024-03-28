# Unu Scooter Pro Bluetooth Reference
Documenting Bluetooth services and characteristics of the Unu Scooter Pro

## Overview

| **Service** | **Characteristic** | **Values** | **Description** |
|---|---|---|---|
| 9a590000-6e67-5d0d-aab9-ad9126b66f91 | 9a590001-6e67-5d0d-aab9-ad9126b66f91 | "scooter:state lock"<br>"scooter:state unlock"i<br>"scooter:seatbox open"<br>"scooter:blinker right"<br>"scooter:blinker left"<br>"scooter:blinker both"<br>"scooter:blinker off" | Input control channel. Write ASCII-encoded values into this characteristic to control the lock, seatbox lock and blinker |
| 9a590020-6e67-5d0d-aab9-ad9126b66f91 | 9a590021-6e67-5d0d-aab9-ad9126b66f91 | "stand-by"<br>(Probably more) | Status of the scooter |
|                                      | 9a590022-6e67-5d0d-aab9-ad9126b66f91 | "open"<br>"closed" | Status of the seat box |
|                                      | 9a590023-6e67-5d0d-aab9-ad9126b66f91 | "locked"<br>"unlocked" | Handlebar lock status |
| 9a590060-6e67-5d0d-aab9-ad9126b66f91 |  |  | Characteristics here still need to be figured out, could very well be related to GPS |
| 9a590060-6e67-5d0d-aab9-ad9126b66f91 |  |  | Characteristics here still need to be figured out, could very well be related to GPS |
