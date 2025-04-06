# Dashboard Interface Documentation

## Overview

The Dashboard Controller (DBC) provides the primary user interface for the scooter, displaying critical information such as speed, battery status, and navigation. It runs a Qt/QML-based UI application that communicates with other system components via Redis.

## Display Modes

The dashboard operates in three primary modes, controlled via the `dashboard mode` Redis key:

| Mode | Description | Activation |
|------|-------------|------------|
| speedometer | Default mode showing speed and status | Default at startup |
| navigation | Map view with route guidance | Activated when navigation starts |
| debug | Development diagnostics | Activated by setting `HSET dashboard mode debug` |

**Note:** The navigation-related functionality is not normally accessible and will not be triggered during normal use, but there is vestigial code from an abandoned implementation by unu. Information about navigation functionality is derived from the remaining code in the binary as well as an implementation demo video uploaded by unu's development partner.

**Note:** Debug mode is partially broken, the following documentation is based on binary analysis, but only the FPS / animation metrics have been triggered.

## Debug Mode

The debug mode provides a development and diagnostic interface that is not intended for regular users. It displays:

- System logs and diagnostic messages
- Redis key values in real-time
- Service status information
- Performance metrics (like FPS)
- System version information

### Activating Debug Mode

Debug mode can be activated by:
1. Setting the Redis key: `HSET dashboard mode debug`
2. The dashboard will switch to debug view immediately
3. Debug data is stored in a Redis sorted set with timestamps as scores

### Debug Data Structure

The debug data is stored in a Redis sorted set:
```
ZRANGE dashboard:debug 0 -1 WITHSCORES
```

Each entry contains a diagnostic message with a timestamp score for chronological ordering.

## UI Components

### Central Content

The central display area adapts based on the current mode:

| Mode | Content | Features |
|------|---------|----------|
| speedometer | Speedometer dial | Speed, energy recuperation indicators |
| navigation | Map view | Route visualization, turn instructions |
| debug | Debug information | System diagnostics, logs |

### Speedometer Display

The speedometer shows:
- Current speed (km/h or mph based on user settings)
- Energy recuperation status during braking
- Throttle status indicators
- Battery charge levels

Speed display can adapt to the user's preferred unit system (metric/imperial), but only metric is used in shipped scooters.

### Navigation View

The navigation interface includes:
- Interactive map with route visualization
- Turn-by-turn instruction banners
- Distance to destination
- Estimated arrival information

The view adapts based on vehicle state:
- Parked: Route overview mode
- Driving: Tracking mode with upcoming instructions
- Rerouting: Rerouting status display

### Status Bar

The dashboard features a status bar at the top of the screen displaying:

- Current time (left side)
- Status icons (left-center)
- Total distance/odometer (right side)

#### Status Icons

The status bar displays several icons that indicate system status:

| Icon | Description | States |
|------|-------------|--------|
| Connection Strength | Internet/cloud connectivity | • 0-3 bars based on signal strength and network type<br>• Diagonal line when cloud disconnected but internet connected<br>• No bars when internet disconnected |
| CB Battery | Connectivity Box battery status | • Battery outline with fill level proportional to charge<br>• Red fill when charge ≤ 25%<br>• Lightning bolt overlay when charging |
| Bluetooth | Bluetooth connection status | • Visible when connected<br>• Hidden when disconnected |
| Seat | Seat lock status | • Visible when seat is open<br>• Hidden when seat is closed |

#### Connection Strength Indicator

The connection strength icon adapts based on multiple factors:

| Network Type | Signal Bars | Conditions |
|--------------|-------------|------------|
| 2G (GSM/GPRS/EDGE) | 1 bar | Always shows 1 bar when connected |
| 3G (UMTS/HSPA) | 1-2 bars | • 1 bar when signal < 50%<br>• 2 bars when signal ≥ 50% |
| 4G (LTE) | 1-3 bars | • 1 bar when signal < 25%<br>• 2 bars when signal 25-49%<br>• 3 bars when signal ≥ 50% |
| Any type | 0 bars + diagonal line | When internet connected but cloud disconnected |
| Any type | 0 bars | When internet disconnected |

#### Internet Status Redis Keys

The connection status is determined by these Redis keys:

```
HGET internet status       # "connected" or "disconnected"
HGET internet unu-cloud    # "connected" or "disconnected"
HGET internet signal-quality  # 0-100 signal strength percentage
HGET internet access-tech  # Network type (LTE, UMTS, etc.)
```

### Notification System

The dashboard displays various notifications for:
- Battery status (low charge warnings, charging status)
- System warnings (faults, errors)
- Navigation events
- Vehicle state changes

## Redis Interface

### Dashboard Service Keys

```
HGETALL dashboard
```

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| ready | "true"/"false" | Dashboard initialization status | "true" |
| mode | string | Current display mode | "speedometer" |
| serial-number | string | Dashboard serial number | "379999993" |

### Navigation View States

The navigation view has several states that adapt based on vehicle status:

| View Mode | Activation | Features |
|-----------|------------|----------|
| Idle | Default when parked | Standard map view |
| Driving | When ready-to-drive without navigation | Driver-focused view (current position and surroundings) |
| Tracking | When navigating while driving | Turn instructions, route highlighting |
| RouteOverview | When parked with active route | Full route display |
| Rerouting | When recalculating route | Rerouting status |

### Theme Adaptation

The dashboard automatically switches between:
- Dark theme (Speedometer mode)
- Light theme (Navigation mode)

Theme transitions include animation timing for smooth visual changes.

## Behavior Patterns

### Startup Sequence

1. Dashboard initializes hardware
2. Reads serial number from hardware
3. Sets `HSET dashboard ready true` when initialization completes
4. Defaults to Speedometer mode
5. Subscribes to relevant Redis channels

### Mode Switching Logic

Mode switching occurs when:
- Navigation is started/stopped (via `scooter:navigation` trigger)
- Debug mode is explicitly enabled/disabled

### Navigation Behavior

The navigation system responds to several states:
- Navigation triggered by `scooter:navigation start` (using the Mapbox API - doesn't work anymore)
- Navigation stopped by `scooter:navigation stop`
- Automatic rerouting when deviating from route (doesn't seem work)
- Trip summary displayed upon arrival (assumed from decompilation, could not trigger)

## Notification Types

The dashboard displays various notification types:

| Notification Category | Examples | Behavior |
|-----------------------|----------|----------|
| Battery Status | Low charge warnings, charging status | Timed or persistent based on condition |
| System Warnings | Faults, errors, system status | Persistent until condition resolves |
| Navigation Events | Turn instructions, arrival notices | Context-sensitive, tied to navigation state |
| Vehicle State | Kickstand, handlebar lock, seat status | Condition-based, auto-dismissing |

## Redis Dependencies

The dashboard UI depends on these Redis services:

| Service | Key Pattern | Used For |
|---------|-------------|----------|
| vehicle | vehicle:* | Vehicle state, brake status |
| engine-ecu | engine-ecu * | Speed, throttle, KERS status |
| battery | battery:{0,1} * | Battery charge, status |
| navigation | navigation:* | Navigation status |
| gps | gps:* | Position data for map |
| internet | internet:* | Connection status |
