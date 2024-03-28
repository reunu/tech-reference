# Unu Scooter Pro Bluetooth Reference
Documenting Bluetooth services and characteristics of the Unu Scooter Pro

## Overview

| **Service** | **Characteristic** | **Values** | **Description** |
|---|---|---|---|
| 9a590000-6e67-5d0d-aab9-ad9126b66f91 | 9a590001-6e67-5d0d-aab9-ad9126b66f91 | "scooter:state lock"<br>"scooter:state unlock"<br>"scooter:seatbox open"<br>"scooter:blinker right"<br>"scooter:blinker left"<br>"scooter:blinker both"<br>"scooter:blinker off" | Input control channel. Write ASCII-encoded values into this characteristic to control the lock, seatbox lock and blinker |
| 9a590020-6e67-5d0d-aab9-ad9126b66f91 | 9a590021-6e67-5d0d-aab9-ad9126b66f91 | "stand-by"<br>(Probably more) | Status of the scooter |
|                                      | 9a590022-6e67-5d0d-aab9-ad9126b66f91 | "open"<br>"closed" | Status of the seat box |
|                                      | 9a590023-6e67-5d0d-aab9-ad9126b66f91 | "locked"<br>"unlocked" | Handlebar lock status |
| 9a590040-6e67-5d0d-aab9-ad9126b66f91 | 9a590041-6e67-5d0d-aab9-ad9126b66f91 | int 00000-15000mV | AUX battery voltage |
|                                      | 9a590043-6e67-5d0d-aab9-ad9126b66f91 | "absorption-charge"<br>(Probably more) | AUX battery charge status |
|                                      | 9a590044-6e67-5d0d-aab9-ad9126b66f91 | int 0-100% | AUX battery charge level |
| 9a590060-6e67-5d0d-aab9-ad9126b66f91 | 9a590061-6e67-5d0d-aab9-ad9126b66f91 | int 0-100% | CB Battery charge level |
|                                      | 9a590063-6e67-5d0d-aab9-ad9126b66f91 | int | CB Battery remaining capacity (health?) |
|                                      | 9a590064-6e67-5d0d-aab9-ad9126b66f91 | int | CB Battery full capacity |
|                                      | 9a590065-6e67-5d0d-aab9-ad9126b66f91 | int | CB Battery cell voltage in mV |
|                                      | 9a590072-6e67-5d0d-aab9-ad9126b66f91 | "not-charging"<br>(Probably more) | CB Battery charge status |
| 9a590100-6e67-5d0d-aab9-ad9126b66f91 |  |  | Characteristics here still need to be figured out, could very well be related to GPS |
