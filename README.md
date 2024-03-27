# Unu Scooter Pro Bluetooth Reference
Documenting Bluetooth services and characteristics of the Unu Scooter Pro

## Overview

| **Service** | **Characteristic** | **Values** | **Description** |
|---|---|---|---|
| 9a590000-6e67-5d0d-aab9-ad9126b66f91 | 9a590001-6e67-5d0d-aab9-ad9126b66f91 | "scooter:state lock"<br>"scooter:state unlock" | Write one of these values (encoded from ascii) to this characteristic to lock/unlock the scooter |
| 9a590020-6e67-5d0d-aab9-ad9126b66f91 | 9a590021-6e67-5d0d-aab9-ad9126b66f91 | "stand-by"<br>(Probably more) | Status of the scooter |
|                                      | 9a590022-6e67-5d0d-aab9-ad9126b66f91 | "open"<br>"closed" | Status of the storage box |
|                                      | 9a590023-6e67-5d0d-aab9-ad9126b66f91 | "locked"<br>"unlocked" | Probably handlebar lock status |
| 9a590060-6e67-5d0d-aab9-ad9126b66f91 |  |  | Characteristics here still need to be figured out, could very well be related to GPS |
| 9a590060-6e67-5d0d-aab9-ad9126b66f91 |  |  | Characteristics here still need to be figured out, could very well be related to GPS |
