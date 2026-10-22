# Growroom Control System — System Specification

**Version:** 1.0  
**Date:** 2026-10-22  
**Project:** growroom-*

---

## 1. Overview

A multi-room growroom/greenhouse automation system. Each physical grow room has a Raspberry Pi that reads sensors and controls relays. A central backend aggregates data from all rooms. A web dashboard lets operators monitor and adjust every room in real time.

---

## 2. Architecture

```
[Raspberry Pi per room]
  DHT22 sensor → temperature, humidity
  4x relay board → light, fan-in, fan-out, water pump
  Python service (raspberry-service) polls sensors every N seconds,
  POSTs readings to backend, GETs control settings, applies control logic

        ↕ HTTP REST API

[Node.js/Express backend] (growroom-backend)
  TypeScript, port 5000
  MySQL database (grow-data/sql/)
  REST endpoints:
    GET  /api/rooms          list all rooms + current values
    GET  /api/rooms/:id      single room data
    PUT  /api/rooms/:id      update control settings
    POST /api/rooms/:id/sensors  receive sensor readings from Pi

        ↕ HTTP REST API

[React dashboard] (growroom-dashboard)
  Material UI, Recharts
  Polls backend every 5 s
  Pages: Overview dashboard, per-room control panel
  Per-room controls: light intensity slider, light cycle selector,
    target temperature slider, irrigation timer + trigger button
  Charts: temperature + humidity history
  SSH console link to each Pi
```

---

## 3. Components

### 3.1 raspberry-service (Python)

| File | Role |
|---|---|
| `main.py` | `GrowRoomService` — main loop, control logic |
| `sensor_reader.py` | Reads DHT22 via Adafruit_DHT |
| `relay_controller.py` | RPi.GPIO relay board driver |
| `api_client.py` | HTTP client — POST sensor data, GET settings |
| `config.py` | Env-var config (API_URL, ROOM_ID, GPIO pins, poll interval) |
| `growroom.service` | systemd unit for auto-start |

**Control logic (main.py `apply_control_logic`):**
- Light: on/off based on `settings.light > 0`
- Temperature: exhaust fan on when temp > target + 2 °C; off when temp < target − 2 °C
- Irrigation: pump follows `settings.irrigation` boolean directly

**GPIO pin defaults (BCM):**
- Sensor: GPIO 4
- Light relay: GPIO 17
- Fan-in relay: GPIO 27
- Fan-out relay: GPIO 22
- Pump relay: GPIO 23
- Relay board is active-LOW

### 3.2 growroom-backend (Node.js/TypeScript)

| File | Role |
|---|---|
| `src/index.ts` | Express app, CORS, port 5000 |
| `src/routes/rooms.ts` | Route definitions |
| `src/controllers/roomsController.ts` | Request handlers |
| `src/services/sensorService.ts` | DB queries for room/sensor data; falls back to mock data if DB unavailable |
| `src/services/controlService.ts` | DB update for room control settings |
| `src/db/mysql.ts` | MySQL2 connection pool |
| `src/types/index.ts` | TypeScript interfaces: Room, SensorData, ControlSettings |

**Core types:**
```ts
Room            { id, name, light, humidity, temperature, irrigation }
SensorData      { roomId, light, humidity, temperature, timestamp }
ControlSettings { light, humidity, temperature, irrigation }
```

**Note:** The `sensors` table stores individual readings by type; the `rooms` table also stores current values and settings directly. A `controls` table exists for dedicated setpoint storage but is not yet used by the service layer.

### 3.3 growroom-dashboard (React)

| File | Role |
|---|---|
| `src/App.js` | Router, navigation |
| `src/components/Dashboard.js` | Overview — card grid of all rooms (temp, humidity, light, irrigation) |
| `src/components/RoomControl.js` | Per-room panel — live readings, sliders, irrigation trigger, history chart, SSH link |
| `src/components/SSHConsole.js` | SSH terminal component (stub/WIP) |

---

## 4. Database Schema (MySQL)

```sql
rooms    (id, name, created_at, updated_at)
sensors  (id, room_id, type ENUM[light|humidity|temperature|irrigation], value, created_at, updated_at)
controls (id, room_id, light_setting, humidity_setting, temperature_setting, irrigation_setting, created_at, updated_at)
```

Seed data defines 4 rooms (A–D) with typical grow-room setpoints.

---

## 5. Data Flow

1. **Sensor → Backend:** Pi reads DHT22 every `POLL_INTERVAL` (default 30 s), POSTs `{temperature, humidity, light}` to `POST /api/rooms/:id/sensors`.
2. **Settings pull:** Pi GETs `GET /api/rooms/:id`, reads `light / temperature / humidity / irrigation` fields.
3. **Control actuator:** Pi compares live sensor vs settings and toggles GPIO relays.
4. **Dashboard poll:** Browser fetches `GET /api/rooms` every 5 s to refresh the overview.
5. **Operator input:** Dashboard sends `PUT /api/rooms/:id` with updated settings; backend persists to MySQL; Pi picks up on next poll.

---

## 6. Environment Variables

### raspberry-service (.env)
| Variable | Default | Description |
|---|---|---|
| API_URL | http://localhost:3000 | Backend base URL |
| ROOM_ID | 1 | Which room this Pi controls |
| POLL_INTERVAL | 30 | Seconds between sensor reads |
| TEMP_SENSOR_TYPE | DHT22 | DHT11 or DHT22 |
| TEMP_SENSOR_PIN | 4 | GPIO BCM pin for sensor |
| RELAY_LIGHT_PIN | 17 | GPIO BCM pin |
| RELAY_FAN_IN_PIN | 27 | GPIO BCM pin |
| RELAY_FAN_OUT_PIN | 22 | GPIO BCM pin |
| RELAY_PUMP_PIN | 23 | GPIO BCM pin |

### growroom-dashboard (.env)
| Variable | Default | Description |
|---|---|---|
| REACT_APP_API_URL | http://localhost:5000 | Backend URL |

---

## 7. Known Issues / Gaps

1. **`POST /api/rooms/:id/sensors` not implemented** — the Pi sends sensor data to this endpoint but it has no route or handler in the backend yet.
2. **`controls` table unused** — `controlService` updates columns on the `rooms` table directly; the separate `controls` table is never written to.
3. **No authentication** — the API and dashboard have no auth layer.
4. **Light cycle scheduling** — the dashboard UI has a 12/18/24 h cycle selector and countdown display but the backend has no scheduler; the light on/off time shown is hardcoded placeholder text.
5. **SSH console stub** — `SSHConsole.js` exists but the `/ssh/:id` route is not wired up.
6. **Humidity control** — the Pi control logic handles temperature (fans) and irrigation (pump) but does not actuate anything for humidity setpoints.
7. **No sensor history API** — `Dashboard.js` and `RoomControl.js` initialise `history` state but never populate it; a time-series endpoint is missing.

---

## 8. Suggested Next Steps

- Implement `POST /api/rooms/:id/sensors` to persist incoming Pi readings.
- Add time-series query endpoint `GET /api/rooms/:id/history?from=&to=` and wire it to the dashboard chart.
- Add a light-cycle scheduler (cron or DB-stored schedule) so the Pi can receive on/off windows rather than a simple boolean.
- Add JWT or API-key auth on the backend.
- Wire up the humidity setpoint to a humidifier/dehumidifier relay.
- Complete the SSH console (xterm.js + ws proxy).
