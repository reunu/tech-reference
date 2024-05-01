# Bluetooth Reference
Documenting Bluetooth services and characteristics of the Unu Scooter Pro

## Overview

| **Service** | **Characteristic** | **Values** | **Description** |
|---|---|---|---|
| 9a590000-6e67-5d0d-aab9-ad9126b66f91 | 9a590001-6e67-5d0d-aab9-ad9126b66f91 | "scooter:state lock"<br>"scooter:state unlock"<br>"scooter:seatbox open"<br>"scooter:blinker right"<br>"scooter:blinker left"<br>"scooter:blinker both"<br>"scooter:blinker off" | Input control channel. Write ASCII-encoded values into this characteristic to control the lock, seatbox lock and blinker |
|                                      | 9a590002-6e67-5d0d-aab9-ad9126b66f91 | "hibernate"<br>"wakeup" | Input control channel for hibernation commands. Only works in corresponding scooter power states: "hibernating", "running", "stand-by".  |
| 9a590020-6e67-5d0d-aab9-ad9126b66f91 | 9a590021-6e67-5d0d-aab9-ad9126b66f91 | "stand-by"<br>"off"<br>"parked"<br>"shutting-down"<br>"ready-to-drive"<br>(Probably more) | Status of the scooter |
|                                      | 9a590022-6e67-5d0d-aab9-ad9126b66f91 | "open"<br>"closed" | Status of the seat box |
|                                      | 9a590023-6e67-5d0d-aab9-ad9126b66f91 | "locked"<br>"unlocked" | Handlebar lock status |
| 9a590040-6e67-5d0d-aab9-ad9126b66f91 | 9a590041-6e67-5d0d-aab9-ad9126b66f91 | int 00000-15000mV | AUX battery voltage |
|                                      | 9a590043-6e67-5d0d-aab9-ad9126b66f91 | "absorption-charge"<br>"not-charging"<br>"float-charge"<br>"bulk-charge"<br>(Probably more) | AUX battery charge status |
|                                      | 9a590044-6e67-5d0d-aab9-ad9126b66f91 | int 0-100% (0%, 25%, 50%, 75%, 100%) | AUX battery charge level in 25% steps |
| 9a590060-6e67-5d0d-aab9-ad9126b66f91 | 9a590061-6e67-5d0d-aab9-ad9126b66f91 | int 0-100% | CB battery charge level in 1% steps |
|                                      | 9a590063-6e67-5d0d-aab9-ad9126b66f91 | int | CB battery remaining capacity (health?) |
|                                      | 9a590064-6e67-5d0d-aab9-ad9126b66f91 | int | CB battery full capacity |
|                                      | 9a590065-6e67-5d0d-aab9-ad9126b66f91 | int | CB battery cell voltage in mV |
|                                      | 9a590072-6e67-5d0d-aab9-ad9126b66f91 | "not-charging"<br>"charging"<br>(Probably more) | CB battery charge status |
| 9a590100-6e67-5d0d-aab9-ad9126b66f91 | 9a590101-6e67-5d0d-aab9-ad9126b66f91 | "cbb"<br>"aux"<br>(Probably more) | Battery type. TBD |
| 9a5900a0-6e67-5d0d-aab9-ad9126b66f91 | 9a5900a1-6e67-5d0d-aab9-ad9126b66f91 | "booting"<br>"running"<br>"suspending"<br>"suspending-imminent"<br>"hibernating-imminent"<br>"hibernating"<br>(Probably more) | Power state |
| 9a5900e0-6e67-5d0d-aab9-ad9126b66f91 | 9a5900e2-6e67-5d0d-aab9-ad9126b66f91 | "unknown"<br>"asleep"<br>"active"<br>"idle" | Primary battery state |
|                                      | 9a5900e3-6e67-5d0d-aab9-ad9126b66f91 | 1 / 0 | Primary battery presence indicator |
|                                      | 9a5900e6-6e67-5d0d-aab9-ad9126b66f91 | int | Primary battery cycle count |
|                                      | 9a5900e9-6e67-5d0d-aab9-ad9126b66f91 | 0-100% | Primary battery state of charge |
|                                      | 9a5900ee-6e67-5d0d-aab9-ad9126b66f91 | "unknown"<br>"asleep"<br>"active"<br>"idle" | Secondary battery state |
|                                      | 9a5900ef-6e67-5d0d-aab9-ad9126b66f91 | 1 / 0 | Secondary battery presence indicator |
|                                      | 9a5900f2-6e67-5d0d-aab9-ad9126b66f91 | int | Secondary battery cycle count |
|                                      | 9a5900f5-6e67-5d0d-aab9-ad9126b66f91 | 0-100% | Secondary battery state of charge |
| 9a59a000-6e67-5d0d-aab9-ad9126b66f91 | 9a59a001-6e67-5d0d-aab9-ad9126b66f91 | "v1.12.0"<br>(Probably more) | nRF version |
| 9a59a020-6e67-5d0d-aab9-ad9126b66f91 | 9a59a021-6e67-5d0d-aab9-ad9126b66f91 | TBD | TBD |
|                                      | 9a59a022-6e67-5d0d-aab9-ad9126b66f91 | TBD | TBD |

TBD = to be defined / verified
