# Bluetooth Interface Documentation

## Service Overview

The unu Scooter Pro exposes several Bluetooth LE services for control and monitoring. All services use the base UUID: `xxxx-6e67-5d0d-aab9-ad9126b66f91`

### Control Service (9a590000)

Primary control interface for scooter functions

| Characteristic | Description | Values |
|---------------|-------------|---------|
| 9a590001 | Control Input | - "scooter:state lock"<br>- "scooter:state unlock"<br>- "scooter:seatbox open"<br>- "scooter:blinker right"<br>- "scooter:blinker left"<br>- "scooter:blinker both"<br>- "scooter:blinker off" |
| 9a590002 | Power Control | - "hibernate"<br>- "wakeup" |

### Status Service (9a590020)

Provides scooter state information

| Characteristic | Description | Values |
|---------------|-------------|---------|
| 9a590021 | Operating State | - "stand-by"<br>- "off"<br>- "parked"<br>- "shutting-down"<br>- "ready-to-drive"<br>- "updating" |
| 9a590022 | Seatbox State | - "open"<br>- "closed"<br>- "unknown" |
| 9a590023 | Handlebar Lock | - "locked"<br>- "unlocked" |

### Battery Service (9a590040)

Auxiliary battery monitoring

| Characteristic | Description | Values |
|---------------|-------------|---------|
| 9a590041 | AUX Voltage | 0-15000mV |
| 9a590043 | Charge Status | - "absorption-charge"<br>- "not-charging"<br>- "float-charge"<br>- "bulk-charge" |
| 9a590044 | Charge Level | 0-100% in 25% steps |

### Connectivity Battery Service (9a590060)

CBB status monitoring

| Characteristic | Description | Values |
|---------------|-------------|---------|
| 9a590061 | Charge Level | 0-100% |
| 9a590063 | Remaining Capacity | Integer |
| 9a590064 | Full Capacity | Integer |
| 9a590065 | Cell Voltage | mV |
| 9a590072 | Charge Status | - "not-charging"<br>- "charging"<br>- "unknown" |

### Power State Service (9a5900a0)

System power state monitoring

| Characteristic | Description | Values |
|---------------|-------------|---------|
| 9a5900a1 | Power State | - "booting"<br>- "running"<br>- "suspending"<br>- "suspending-imminent"<br>- "hibernating-imminent"<br>- "hibernating" |

(cf. [State Diagram](../states/README.md))

### Main Battery Service (9a5900e0)

Primary battery monitoring

| Characteristic | Description | Values |
|---------------|-------------|---------|
| 9a5900e2 | Primary State | - "unknown"<br>- "asleep"<br>- "active"<br>- "idle" |
| 9a5900e3 | Primary Present | 0/1 |
| 9a5900e6 | Primary Cycles | Integer |
| 9a5900e9 | Primary SoC | 0-100% |
| 9a5900ee | Secondary State | - "unknown"<br>- "asleep"<br>- "active"<br>- "idle" |
| 9a5900ef | Secondary Present | 0/1 |
| 9a5900f2 | Secondary Cycles | Integer |
| 9a5900f5 | Secondary SoC | 0-100% |

### System Info Service (9a59a000)

| Characteristic | Description | Values |
|---------------|-------------|---------|
| 9a59a001 | nRF Version | Version string (e.g. "v1.12.0") |
| 9a59a021 | Reset Reason | Nordic RESETREAS register value (see below) |
| 9a59a022 | Reset Count | Integer |

#### RESETREAS (Reset Reason Register)

Reset reason register. Cumulative unless cleared. Fields are cleared by writing '1'. If no reset sources are flagged, indicates reset from on-chip reset generator (power-on-reset or brownout reset).

| Field   | Bit(s) | Access | Description | Value | Meaning |
|---------|---------|--------|-------------|--------|---------|
| RESETPIN | 0 | RW | Reset from pin-reset detected | 0<br>1 | Not detected<br>Detected |
| DOG | 1 | RW | Reset from watchdog detected | 0<br>1 | Not detected<br>Detected |
| SREQ | 2 | RW | Reset from soft reset detected | 0<br>1 | Not detected<br>Detected |
| LOCKUP | 3 | RW | Reset from CPU lock-up detected | 0<br>1 | Not detected<br>Detected |
| OFF | 16 | RW | Reset due to wake up from System OFF mode (DETECT signal from GPIO) | 0<br>1 | Not detected<br>Detected |
| LPCOMP | 17 | RW | Reset due to wake up from System OFF mode (ANADETECT signal from LPCOMP) | 0<br>1 | Not detected<br>Detected |
| DIF | 18 | RW | Reset due to wake up from System OFF mode (debug interface mode entry) | 0<br>1 | Not detected<br>Detected |
| NFC | 19 | RW | Reset due to wake up from System OFF mode (NFC field detect) | 0<br>1 | Not detected<br>Detected |
| VBUS | 20 | RW | Reset due to wake up from System OFF mode (VBUS rising into valid range) | 0<br>1 | Not detected<br>Detected |

Register layout has:
- Low bits (0-3): Basic reset sources
- High bits (16-20): System OFF wake-up sources
