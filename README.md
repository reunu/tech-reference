# Tech documentation of Unu Scooter Pro

This repository contains the tech documentation of some of the unu scooter
internals. This is reverse-engineered based on the scooter.

## Scooter states

```mermaid
stateDiagram-v2
    Parked --> Shutting_Down: hibernate
    Parked --> Ready: stand up
    Ready --> Parked: stand down
    Shutting_Down --> Hibernating_Imminent: after ~5s
    Stand_By --> Hibernating_Imminent: hibernate
    Hibernating_Imminent --> Parked: unlock
    Hibernating_Imminent --> Hibernating: after >20s
    Hibernating --> Booting: wakeup
    Booting --> Stand_By: after ~5s
    Stand_By --> Parked: unlock
    Parked --> Stand_By: lock
    
```

## Services

The scooter provides different services which are connected to each other.

### DBC

You can connect to the DBC by using the following IP:

```
192.168.7.2
```

## Other services

* [Bluetooth](bluetooth/)
* [Redis](redis/)
