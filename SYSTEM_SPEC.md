# Growroom Control System — System Specification

**Version:** 1.3  
**Date:** 2026-10-22  
**Project:** growroom-*

---

## 1. Overview

A multi-room growroom/greenhouse automation system. Each physical grow room has a Raspberry Pi that reads sensors and controls relays. A central backend aggregates data from all rooms and calculates fertilizer dosages per room, week and bucket size. A web dashboard lets operators monitor and adjust every room in real time.

---

## 2. Architecture

```
[Raspberry Pi per room]
  DHT22 sensor → temperature, humidity
  5x relay board → light, fan-in, fan-out, water pump, dehumidifier
  Python service (raspberry-service) polls sensors every N seconds,
  POSTs readings to backend, GETs control settings, applies control logic

        ↕ HTTP REST API

[Node.js/Express backend] (growroom-backend)
  TypeScript, port 5000
  MySQL database (grow-data/sql/)
  REST endpoints:
    GET  /api/rooms              list all rooms + current values
    GET  /api/rooms/:id          single room data (incl. scheduled lightOn)
    GET  /api/rooms/:id/history  sensor readings time series (?from=&to=, default last 24 h)
    PUT  /api/rooms/:id          update control settings + light schedule
    POST /api/rooms/:id/sensors  receive sensor readings from Pi
    GET  /api/fertilizer              list fertilizer families
    GET  /api/fertilizer/schedule    dosage calculation (?family=&bucketSize=&week=)

        ↕ HTTP REST API

[React dashboard] (growroom-dashboard)
  Material UI, Recharts
  Polls backend every 5 s
  Pages: Overview dashboard, per-room control panel
  Per-room controls: light intensity slider, light cycle selector,
    target temperature slider, irrigation timer + trigger button
  Fertilizer calculator: family + week + bucket size → dosages
  Charts: temperature + humidity history (from GET /api/rooms/:id/history)
  SSH console link to each Pi
```

---

## 3. Components

### 3.1 raspberry-service (Python)

| File | Role |
|---|---|
| `main.py` | `GrowRoomService` — main loop, control logic |
| `sensor_reader.py` | Reads DHT22 via Adafruit_DHT |
| `relay_controller.py` | RPi.GPIO relay board driver (5 relays) |
| `api_client.py` | HTTP client — POST sensor data, GET settings |
| `config.py` | Env-var config (API_URL, ROOM_ID, GPIO pins, poll interval, hysteresis) |
| `growroom.service` | systemd unit for auto-start |

**Control logic (main.py `apply_control_logic`):**
- Light: on/off from `settings.light_on`, which the backend computes from the room's light cycle (`lightCycleHours` + `lightOnAt`). Fallback to `light > 0` when unavailable.
- Temperature: exhaust fan on when temp > target + 2 °C; off when temp < target − 2 °C; intake fan on when in range
- Humidity: dehumidifier relay ON when humidity > target + `HUMIDITY_HYSTERESIS`; OFF when humidity < target − `HUMIDITY_HYSTERESIS`; state kept inside the band (prevents relay chatter). Too-dry air is logged only (no humidifier relay wired yet).
- Irrigation: pump follows `settings.irrigation` boolean directly

**GPIO pin defaults (BCM):**
- Sensor: GPIO 4
- Light relay: GPIO 17
- Fan-in relay: GPIO 27
- Fan-out relay: GPIO 22
- Pump relay: GPIO 23
- Dehumidifier relay: GPIO 24
- Relay board is active-LOW

### 3.2 growroom-backend (Node.js/TypeScript)

| File | Role |
|---|---|
| `src/index.ts` | Express app, CORS, port 5000 |
| `src/routes/rooms.ts` | Room route definitions |
| `src/routes/fertilizer.ts` | Fertilizer route definitions |
| `src/controllers/roomsController.ts` | Room request handlers |
| `src/controllers/fertilizerController.ts` | Fertilizer request handlers |
| `src/services/sensorService.ts` | DB queries for room/sensor data; records incoming Pi readings (transactional); history/time-series queries |
| `src/services/controlService.ts` | DB update for room control setpoints + light schedule |
| `src/services/lightScheduler.ts` | Computes `lightOn` from the room's light cycle |
| `src/services/fertilizerService.ts` | Scales family schedules to a bucket size |
| `src/data/fertilizerSchedules.ts` | Fertilizer families: week-by-week feeding charts (ml/L, ranges, EC targets, notes) |
| `src/db/mysql.ts` | MySQL2 connection pool |
| `src/types/index.ts` | TypeScript interfaces: Room, SensorReading, HistoryPoint, ControlSettings |

**Core types:**
```ts
Room            { id, name, light, humidity, temperature,              // live values
                  lightSetting, humiditySetting, temperatureSetting,  // setpoints
                  irrigation, lightCycleHours, lightOnAt, lightOn }   // schedule
SensorReading   { temperature?, humidity?, light? }
HistoryPoint    { timestamp (epoch ms), temperature?, humidity?, light?, irrigation? }
ControlSettings { light, humidity, temperature, irrigation, lightCycleHours?, lightOnAt? }
```

**Light scheduling:** the backend stores a photoperiod per room (`light_cycle_hours`: 0/12/18/24) and a daily on-window start (`light_on_at`, server local time). Every `GET /api/rooms` and `GET /api/rooms/:id` returns a computed `lightOn` boolean; the Pi actuates on it. The cycle can wrap midnight. `24` = always on, `0` = always off.

**Sensor ingestion:** `POST /api/rooms/:id/sensors` accepts `{ temperature?, humidity?, light? }`, validates numeric values, and writes one row per metric into `sensors` plus the latest values on `rooms`, in a single transaction. Returns 201; 400 on invalid input, 404 on unknown room, 503 when the DB is unavailable (Pi logs and retries next poll).

**History API:** `GET /api/rooms/:id/history?from=&to=` returns the recorded `sensors` rows for the requested window (inclusive) pivoted into one point per reading timestamp: `[{ timestamp, temperature, humidity, light }]`. `from`/`to` accept ISO 8601 dates and default to the last 24 h. Returns 200 (`[]` for an empty range); 400 on invalid/inverted dates, 404 on unknown room, 503 when the DB is unavailable.

**Note:** settings now live in `*_setting` columns on `rooms`, separate from live values, so readings never overwrite setpoints. The `controls` table still exists but remains unused by the service layer (candidate for removal or future use).

### 3.3 Fertilizer calculation (backend)

Fertilizer schedules are modelled as **families** (`src/data/fertilizerSchedules.ts`): a week-by-week feeding chart with product dosages stored as **ml per liter**, so any bucket size can be calculated with `dosage_ml = ml_per_liter × bucket_liters`. Manufacturer ranges are preserved as min/max. Weeks are numbered globally from the start of the grow cycle (week 1). Each week carries its phase (rooting / vegetative / generative / flush) and photoperiod, which ties into `rooms.light_cycle_hours`.

Seeded families:

| Family | Manufacturer | Weeks | Source units | Notes |
|---|---|---|---|---|
| `canna-coco` | CANNA | 11 | ml/10 L (converted to ml/L) | Heavy feeding; EC targets per week; pH 5.5–6.2; PK 13/14 in generative week IV; week 11 = water-only flush |
| `sensi-coco` | Advanced Nutrients | 12 | mL/L | pH Perfect Sensi Coco Top Shelf; 4 grow weeks @ 18 h + 8 bloom weeks @ 12 h; week 12 = Flawless Finish flush |

**Endpoints:**
- `GET /api/fertilizer` — list families: id, name, manufacturer, weekCount, phases, products, notes
- `GET /api/fertilizer/schedule?family=<id>&bucketSize=<liters>[&week=<n>]` — dosages scaled to the bucket; single week or full schedule

**Schedule response shape:**
```json
{
  "family": "canna-coco",
  "familyName": "CANNA COCO (heavy feeding)",
  "manufacturer": "CANNA",
  "bucketSize": 12,
  "weeks": [
    {
      "week": 3,
      "label": "Week 3 - Vegetative I",
      "phase": "vegetative",
      "lightHours": 12,
      "ec": { "water": 0.4, "nutrition": 2.0, "total": 2.4 },
      "ph": "5.5-6.2",
      "products": [
        { "name": "CANNA COCO A", "mlPerLiter": { "min": 3.75, "max": 3.75 }, "dosageMl": { "min": 45.0, "max": 45.0 } },
        { "name": "CANNABOOST", "mlPerLiter": { "min": 2.0, "max": 2.0 }, "dosageMl": { "min": 24.0, "max": 24.0 } }
      ]
    }
  ],
  "notes": [ "..." ]
}
```
Responses: 200; 400 on missing/invalid family, bucketSize (positive liters, max 1000) or week (1–weekCount); 404 on unknown family.

Families are static, version-controlled data for now — moving them to DB tables (with CRUD) is a future option if you want to add families from the dashboard.

### 3.4 growroom-dashboard (React)

| File | Role |
|---|---|
| `src/App.js` | Router, navigation |
| `src/components/Dashboard.js` | Overview — card grid of all rooms (temp, humidity, light, irrigation) |
| `src/components/RoomControl.js` | Per-room panel — live readings, sliders, irrigation trigger, history chart (GET /:id/history), SSH link |
| `src/components/SSHConsole.js` | SSH terminal component (stub/WIP) |

*(Not yet in the repository.)*

---

## 4. Database Schema (MySQL)

```sql
rooms    (id, name, light, humidity, temperature,                    -- live values
          light_setting, humidity_setting, temperature_setting,
          irrigation_setting, light_cycle_hours, light_on_at,
          created_at, updated_at)
sensors  (id, room_id, type ENUM[light|humidity|temperature|irrigation],
          value, created_at, updated_at, INDEX(room_id, created_at))
controls (id, room_id, light_setting, humidity_setting,
          temperature_setting, irrigation_setting, created_at, updated_at)  -- unused
```

Seed data defines 4 rooms (A–D) with typical grow-room setpoints and 12/18 h light cycles starting 06:00. Fertilizer schedules are static data in the backend, not DB tables.

---

## 5. Data Flow

1. **Sensor → Backend:** Pi reads DHT22 every `POLL_INTERVAL` (default 30 s), POSTs `{temperature, humidity, light}` to `POST /api/rooms/:id/sensors`; backend persists the time series and updates live values.
2. **Settings pull:** Pi GETs `GET /api/rooms/:id`, reads `lightSetting / temperatureSetting / humiditySetting / irrigation` and the computed `lightOn`.
3. **Control actuator:** Pi compares live sensor vs setpoints and toggles GPIO relays (light from schedule, fans from temperature, dehumidifier from humidity, pump from irrigation flag).
4. **Dashboard poll:** Browser fetches `GET /api/rooms` every 5 s to refresh the overview.
5. **History chart:** Browser fetches `GET /api/rooms/:id/history?from=&to=` for the chart time range.
6. **Fertilizer calculation:** Dashboard fetches `GET /api/fertilizer/schedule?family=&bucketSize=&week=` and shows per-product dosages for the selected week and bucket.
7. **Operator input:** Dashboard sends `PUT /api/rooms/:id` with updated settings/schedule; backend persists to MySQL; Pi picks up on next poll.

---

## 6. Environment Variables

### raspberry-service (.env)
| Variable | Default | Description |
|---|---|---|
| API_URL | http://localhost:3000 | Backend base URL (backend listens on 5000) |
| ROOM_ID | 1 | Which room this Pi controls |
| POLL_INTERVAL | 30 | Seconds between sensor reads |
| TEMP_SENSOR_TYPE | DHT22 | DHT11 or DHT22 |
| TEMP_SENSOR_PIN | 4 | GPIO BCM pin for sensor |
| RELAY_LIGHT_PIN | 17 | GPIO BCM pin |
| RELAY_FAN_IN_PIN | 27 | GPIO BCM pin |
| RELAY_FAN_OUT_PIN | 22 | GPIO BCM pin |
| RELAY_PUMP_PIN | 23 | GPIO BCM pin |
| RELAY_HUMIDITY_PIN | 24 | GPIO BCM pin (dehumidifier) |
| HUMIDITY_HYSTERESIS | 5 | ± % RH band around the humidity target |

### growroom-dashboard (.env)
| Variable | Default | Description |
|---|---|---|
| REACT_APP_API_URL | http://localhost:5000 | Backend URL |

---

## 7. Changelog

**v1.3 (2026-10-22):**
- Added the fertilizer calculation section: `GET /api/fertilizer` (families) and `GET /api/fertilizer/schedule?family=&bucketSize=&week=` (dosages scaled to any bucket size).
- Seeded two families: CANNA COCO (heavy feeding, 11 weeks, EC targets) and Advanced Nutrients pH Perfect Sensi Coco Top Shelf (12 weeks). Dosages stored per liter; manufacturer ranges preserved; weeks numbered globally from cycle start.

**v1.2 (2026-10-22):**
- Added `GET /api/rooms/:id/history?from=&to=`: time-series endpoint over the recorded sensors rows, pivoted per timestamp; defaults to the last 24 h.

**v1.1 (2026-10-22):**
- Implemented `POST /api/rooms/:id/sensors`: Pi readings are persisted (time series + live values, transactional).
- Added light-cycle scheduling: `light_cycle_hours` / `light_on_at` per room, computed `lightOn` returned by the API and consumed by the Pi.
- Wired humidity setpoint to a dedicated dehumidifier relay with configurable hysteresis.
- Split live values from setpoints on `rooms` (`*_setting` columns) so readings no longer overwrite setpoints; schema/seed realigned.
- Cleaned up relay state handling in `main.py` and the active-LOW logic in `relay_controller.py`.

**v1.0:** initial spec.

---

## 8. Known Issues / Gaps

1. **No authentication** — the API and dashboard have no auth layer.
2. **SSH console stub** — `SSHConsole.js` exists but the `/ssh/:id` route is not wired up.
3. **No humidifier relay** — too-dry air is detected and logged but not actuated.
4. **`controls` table unused** — kept in the schema but never written.
5. **Dashboard not in the repo** — described in §3.4; the history chart and fertilizer calculator still need wiring there.
6. **Fertilizer weeks are manual** — the current week is a request parameter; rooms have no cycle start date yet, so the backend cannot compute "current grow week" per room automatically.

---

## 9. Suggested Next Steps

- Add the dashboard to the repository (or rebuild it against the v1.3 API) and wire the history chart + fertilizer calculator.
- Add a `cycle_start_date` per room so the backend can compute the current grow week (and thus today's fertilizer schedule) automatically per room.
- Add JWT or API-key auth on the backend.
- Wire a humidifier relay for too-dry conditions (mirror of the dehumidifier logic).
- Complete the SSH console (xterm.js + ws proxy).
- Either use or drop the `controls` table.
