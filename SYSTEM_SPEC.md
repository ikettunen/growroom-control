# Growroom Control System — System Specification

**Version:** 1.4  
**Date:** 2026-10-22  
**Project:** growroom-*

---

## 1. Overview

A multi-room growroom/greenhouse automation system. Each physical grow room has a Raspberry Pi that reads sensors and controls relays. A central backend aggregates data from all rooms and calculates fertilizer dosages per room, week and bucket size. A web dashboard lets operators monitor and adjust every room in real time.

---

## 2. Architecture

`
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
    GET  /api/rooms/:id          single room data (incl. scheduled lightOn, growWeek)
    GET  /api/rooms/:id/history  sensor readings time series (?from=&to=, default last 24 h)
    GET  /api/rooms/:id/fertilizer  dosage schedule for the room's current grow week
    PUT  /api/rooms/:id          update control settings + light/grow cycle
    POST /api/rooms/:id/sensors  receive sensor readings from Pi
    GET  /api/fertilizer              list fertilizer families
    GET  /api/fertilizer/schedule    dosage calculation (?family=&bucketSize=&week=)

        ↕ HTTP REST API

[React dashboard] (growroom-dashboard)
  Material UI, Recharts
  Polls backend every 5 s
  Pages: Overview dashboard, per-room control panel
  Per-room controls: light intensity slider, light cycle selector,
    target temperature slider, irrigation timer + trigger button,
    grow cycle start date + fertilizer family selectors
  Fertilizer calculator: per-room current week (or family + week + bucket size) → dosages
  Charts: temperature + humidity history (from GET /api/rooms/:id/history)
  SSH console link to each Pi
`

---

## 3. Components

### 3.1 raspberry-service (Python)

| File | Role |
|---|---|
| ~BT~~main.py~BT~~ | ~BT~~GrowRoomService~BT~~ — main loop, control logic |
| ~BT~~sensor_reader.py~BT~~ | Reads DHT22 via Adafruit_DHT |
| ~BT~~relay_controller.py~BT~~ | RPi.GPIO relay board driver (5 relays) |
| ~BT~~api_client.py~BT~~ | HTTP client — POST sensor data, GET settings |
| ~BT~~config.py~BT~~ | Env-var config (API_URL, ROOM_ID, GPIO pins, poll interval, hysteresis) |
| ~BT~~growroom.service~BT~~ | systemd unit for auto-start |

**Control logic (main.py ~BT~~apply_control_logic~BT~~):**
- Light: on/off from ~BT~~settings.light_on~BT~~, which the backend computes from the room's light cycle (~BT~~lightCycleHours~BT~~ + ~BT~~lightOnAt~BT~~). Fallback to ~BT~~light > 0~BT~~ when unavailable.
- Temperature: exhaust fan on when temp > target + 2 °C; off when temp < target − 2 °C; intake fan on when in range
- Humidity: dehumidifier relay ON when humidity > target + ~BT~~HUMIDITY_HYSTERESIS~BT~~; OFF when humidity < target − ~BT~~HUMIDITY_HYSTERESIS~BT~~; state kept inside the band (prevents relay chatter). Too-dry air is logged only (no humidifier relay wired yet).
- Irrigation: pump follows ~BT~~settings.irrigation~BT~~ boolean directly

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
| ~BT~~src/index.ts~BT~~ | Express app, CORS, port 5000 |
| ~BT~~src/routes/rooms.ts~BT~~ | Room route definitions |
| ~BT~~src/routes/fertilizer.ts~BT~~ | Fertilizer route definitions |
| ~BT~~src/controllers/roomsController.ts~BT~~ | Room request handlers |
| ~BT~~src/controllers/fertilizerController.ts~BT~~ | Fertilizer request handlers |
| ~BT~~src/services/sensorService.ts~BT~~ | DB queries for room/sensor data; records incoming Pi readings (transactional); history/time-series queries; computes ~BT~~growWeek~BT~~ |
| ~BT~~src/services/controlService.ts~BT~~ | DB update for room control setpoints + light/grow cycle |
| ~BT~~src/services/lightScheduler.ts~BT~~ | Computes ~BT~~lightOn~BT~~ from the room's light cycle |
| ~BT~~src/services/fertilizerService.ts~BT~~ | Scales family schedules to a bucket size |
| ~BT~~src/data/fertilizerSchedules.ts~BT~~ | Fertilizer families: week-by-week feeding charts (ml/L, ranges, EC targets, notes) |
| ~BT~~src/db/mysql.ts~BT~~ | MySQL2 connection pool |
| ~BT~~src/types/index.ts~BT~~ | TypeScript interfaces: Room, SensorReading, HistoryPoint, ControlSettings |

**Core types:**
``ts
Room            { id, name, light, humidity, temperature,              // live values
                  lightSetting, humiditySetting, temperatureSetting,  // setpoints
                  irrigation, lightCycleHours, lightOnAt, lightOn,    // schedule
                  cycleStartDate?, fertilizerFamily?, growWeek? }     // grow cycle
SensorReading   { temperature?, humidity?, light? }
HistoryPoint    { timestamp (epoch ms), temperature?, humidity?, light?, irrigation? }
ControlSettings { light, humidity, temperature, irrigation, lightCycleHours?, lightOnAt?,
                  cycleStartDate?, fertilizerFamily? }
``

**Light scheduling:** the backend stores a photoperiod per room (~BT~~light_cycle_hours~BT~~: 0/12/18/24) and a daily on-window start (~BT~~light_on_at~BT~~, server local time). Every ~BT~~GET /api/rooms~BT~~ and ~BT~~GET /api/rooms/:id~BT~~ returns a computed ~BT~~lightOn~BT~~ boolean; the Pi actuates on it. The cycle can wrap midnight. ~BT~~24~BT~~ = always on, ~BT~~0~BT~~ = always off.

**Grow cycle:** each room carries a ~BT~~cycle_start_date~BT~~ (the day the grow cycle started) and a ~BT~~fertilizer_family~BT~~ (id of a schedule family from §3.3). The backend computes ~BT~~growWeek~BT~~ on every room response: week 1 starts on ~BT~~cycle_start_date~BT~~ and advances every 7 days, in server local time. Both fields are settable via ~BT~~PUT /api/rooms/:id~BT~~ (~BT~~cycleStartDate~BT~~ as ~BT~~YYYY-MM-DD~BT~~, ~BT~~fertilizerFamily~BT~~ as a family id). ~BT~~growWeek~BT~~ is ~BT~~null~BT~~ while the room has no ~BT~~cycle_start_date~BT~~.

**Sensor ingestion:** ~BT~~POST /api/rooms/:id/sensors~BT~~ accepts ~BT~~{ temperature?, humidity?, light? }~BT~~, validates numeric values, and writes one row per metric into ~BT~~sensors~BT~~ plus the latest values on ~BT~~rooms~BT~~, in a single transaction. Returns 201; 400 on invalid input, 404 on unknown room, 503 when the DB is unavailable (Pi logs and retries next poll).

**History API:** ~BT~~GET /api/rooms/:id/history?from=&to=~BT~~ returns the recorded ~BT~~sensors~BT~~ rows for the requested window (inclusive) pivoted into one point per reading timestamp: ~BT~~[{ timestamp, temperature, humidity, light }]~BT~~. ~BT~~from~BT~~/~BT~~to~BT~~ accept ISO 8601 dates and default to the last 24 h. Returns 200 (~BT~~[]~BT~~ for an empty range); 400 on invalid/inverted dates, 404 on unknown room, 503 when the DB is unavailable.

**Room fertilizer endpoint:** ~BT~~GET /api/rooms/:id/fertilizer?bucketSize=<L>[&week=<n>][&family=<id>]~BT~~ returns the dosage schedule for the room's *current* grow week, scaled to the bucket size (default 10 L). The family defaults to the room's ~BT~~fertilizerFamily~BT~~ and the week to the room's computed ~BT~~growWeek~BT~~; both can be overridden with query parameters for planning ahead. The response wraps the §3.3 schedule shape in ~BT~~{ room: { id, name, cycleStartDate, growWeek, fertilizerFamily }, schedule }~BT~~. Returns 200; 400 on invalid bucketSize/week, missing room family or missing cycle start date (with a hint to set them via ~BT~~PUT /api/rooms/:id~BT~~ or pass the override), or a week beyond the family's coverage; 404 on unknown room or family; 500 on calculation errors.

**Note:** settings now live in ~BT~~*_setting~BT~~ columns on ~BT~~rooms~BT~~, separate from live values, so readings never overwrite setpoints. The ~BT~~controls~BT~~ table still exists but remains unused by the service layer (candidate for removal or future use).

### 3.3 Fertilizer calculation (backend)

Fertilizer schedules are modelled as **families** (~BT~~src/data/fertilizerSchedules.ts~BT~~): a week-by-week feeding chart with product dosages stored as **ml per liter**, so any bucket size can be calculated with ~BT~~dosage_ml = ml_per_liter × bucket_liters~BT~~. Manufacturer ranges are preserved as min/max. Weeks are numbered globally from the start of the grow cycle (week 1). Each week carries its phase (rooting / vegetative / generative / flush) and photoperiod, which ties into ~BT~~rooms.light_cycle_hours~BT~~.

Seeded families:

| Family | Manufacturer | Weeks | Source units | Notes |
|---|---|---|---|---|
| ~BT~~canna-coco~BT~~ | CANNA | 11 | ml/10 L (converted to ml/L) | Heavy feeding; EC targets per week; pH 5.5–6.2; PK 13/14 in generative week IV; week 11 = water-only flush |
| ~BT~~sensi-coco~BT~~ | Advanced Nutrients | 12 | mL/L | pH Perfect Sensi Coco Top Shelf; 4 grow weeks @ 18 h + 8 bloom weeks @ 12 h; week 12 = Flawless Finish flush |

**Endpoints:**
- ~BT~~GET /api/fertilizer~BT~~ — list families: id, name, manufacturer, weekCount, phases, products, notes
- ~BT~~GET /api/fertilizer/schedule?family=<id>&bucketSize=<liters>[&week=<n>]~BT~~ — dosages scaled to the bucket; single week or full schedule
- ~BT~~GET /api/rooms/:id/fertilizer~BT~~ — same calculation, but family/week default to the room's grow cycle (see §3.2)

**Schedule response shape:**
`json
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
`
Responses: 200; 400 on missing/invalid family, bucketSize (positive liters, max 1000) or week (1–weekCount); 404 on unknown family.

Families are static, version-controlled data for now — moving them to DB tables (with CRUD) is a future option if you want to add families from the dashboard.

### 3.4 growroom-dashboard (React)

| File | Role |
|---|---|
| ~BT~~src/App.js~BT~~ | Router, navigation |
| ~BT~~src/components/Dashboard.js~BT~~ | Overview — card grid of all rooms (temp, humidity, light, irrigation) |
| ~BT~~src/components/RoomControl.js~BT~~ | Per-room panel — live readings, sliders, irrigation trigger, history chart (GET /:id/history), SSH link |
| ~BT~~src/components/SSHConsole.js~BT~~ | SSH terminal component (stub/WIP) |

*(Not yet in the repository.)*

---

## 4. Database Schema (MySQL)

`sql
rooms    (id, name, light, humidity, temperature,                    -- live values
          light_setting, humidity_setting, temperature_setting,
          irrigation_setting, light_cycle_hours, light_on_at,
          cycle_start_date, fertilizer_family,                       -- grow cycle
          created_at, updated_at)
sensors  (id, room_id, type ENUM[light|humidity|temperature|irrigation],
          value, created_at, updated_at, INDEX(room_id, created_at))
controls (id, room_id, light_setting, humidity_setting,
          temperature_setting, irrigation_setting, created_at, updated_at)  -- unused
`

Seed data defines 4 rooms (A–D) with typical grow-room setpoints, 12/18 h light cycles starting 06:00, and staggered ~BT~~cycle_start_date~BT~~ values (plus a ~BT~~fertilizer_family~BT~~ each) so the demo rooms sit in different grow weeks. Fertilizer schedules are static data in the backend, not DB tables.

Existing databases created before v1.4 need the new columns (or a schema re-run):
`sql
ALTER TABLE rooms
  ADD COLUMN cycle_start_date DATE NULL,
  ADD COLUMN fertilizer_family VARCHAR(64) NULL;
`

---

## 5. Data Flow

1. **Sensor → Backend:** Pi reads DHT22 every ~BT~~POLL_INTERVAL~BT~~ (default 30 s), POSTs ~BT~~{temperature, humidity, light}~BT~~ to ~BT~~POST /api/rooms/:id/sensors~BT~~; backend persists the time series and updates live values.
2. **Settings pull:** Pi GETs ~BT~~GET /api/rooms/:id~BT~~, reads ~BT~~lightSetting / temperatureSetting / humiditySetting / irrigation~BT~~ and the computed ~BT~~lightOn~BT~~.
3. **Control actuator:** Pi compares live sensor vs setpoints and toggles GPIO relays (light from schedule, fans from temperature, dehumidifier from humidity, pump from irrigation flag).
4. **Dashboard poll:** Browser fetches ~BT~~GET /api/rooms~BT~~ every 5 s to refresh the overview (including each room's current ~BT~~growWeek~BT~~).
5. **History chart:** Browser fetches ~BT~~GET /api/rooms/:id/history?from=&to=~BT~~ for the chart time range.
6. **Fertilizer calculation:** Dashboard fetches ~BT~~GET /api/rooms/:id/fertilizer?bucketSize=~BT~~ — the backend resolves the room's family and current grow week automatically; the generic ~BT~~GET /api/fertilizer/schedule?family=&bucketSize=&week=~BT~~ remains available for ad-hoc calculations.
7. **Operator input:** Dashboard sends ~BT~~PUT /api/rooms/:id~BT~~ with updated settings/schedule (including ~BT~~cycleStartDate~BT~~ and ~BT~~fertilizerFamily~BT~~ for the grow cycle); backend persists to MySQL; Pi picks up on next poll.

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

**v1.4 (2026-10-22):**
- Added per-room grow cycle: ~BT~~cycle_start_date~BT~~ and ~BT~~fertilizer_family~BT~~ columns on ~BT~~rooms~BT~~, both settable via ~BT~~PUT /api/rooms/:id~BT~~.
- Every room response now includes a computed ~BT~~growWeek~BT~~ (week 1 starts on ~BT~~cycle_start_date~BT~~, 7-day steps, server local time; ~BT~~null~BT~~ until a start date is set).
- Added ~BT~~GET /api/rooms/:id/fertilizer?bucketSize=[&week=][&family=]~BT~~: the room's current-week fertilizer schedule, scaled to the bucket (default 10 L); family/week default to the room's settings and can be overridden.
- Seed data now staggers cycle start dates so demo rooms sit in different grow weeks.

**v1.3 (2026-10-22):**
- Added the fertilizer calculation section: ~BT~~GET /api/fertilizer~BT~~ (families) and ~BT~~GET /api/fertilizer/schedule?family=&bucketSize=&week=~BT~~ (dosages scaled to any bucket size).
- Seeded two families: CANNA COCO (heavy feeding, 11 weeks, EC targets) and Advanced Nutrients pH Perfect Sensi Coco Top Shelf (12 weeks). Dosages stored per liter; manufacturer ranges preserved; weeks numbered globally from cycle start.

**v1.2 (2026-10-22):**
- Added ~BT~~GET /api/rooms/:id/history?from=&to=~BT~~: time-series endpoint over the recorded sensors rows, pivoted per timestamp; defaults to the last 24 h.

**v1.1 (2026-10-22):**
- Implemented ~BT~~POST /api/rooms/:id/sensors~BT~~: Pi readings are persisted (time series + live values, transactional).
- Added light-cycle scheduling: ~BT~~light_cycle_hours~BT~~ / ~BT~~light_on_at~BT~~ per room, computed ~BT~~lightOn~BT~~ returned by the API and consumed by the Pi.
- Wired humidity setpoint to a dedicated dehumidifier relay with configurable hysteresis.
- Split live values from setpoints on ~BT~~rooms~BT~~ (~BT~~*_setting~BT~~ columns) so readings no longer overwrite setpoints; schema/seed realigned.
- Cleaned up relay state handling in ~BT~~main.py~BT~~ and the active-LOW logic in ~BT~~relay_controller.py~BT~~.

**v1.0:** initial spec.

---

## 8. Known Issues / Gaps

1. **No authentication** — the API and dashboard have no auth layer.
2. **SSH console stub** — ~BT~~SSHConsole.js~BT~~ exists but the ~BT~~/ssh/:id~BT~~ route is not wired up.
3. **No humidifier relay** — too-dry air is detected and logged but not actuated.
4. **~BT~~controls~BT~~ table unused** — kept in the schema but never written.
5. **Dashboard not in the repo** — described in §3.4; the history chart and fertilizer calculator still need wiring there.
6. **No schema migration tooling** — databases created before v1.4 need the §4 ~BT~~ALTER TABLE~BT~~ (or a schema + seed re-run) to gain the grow-cycle columns.

---

## 9. Suggested Next Steps

- Add the dashboard to the repository (or rebuild it against the v1.4 API) and wire the history chart + fertilizer calculator (grow cycle start date and family pickers on the room panel).
- Add JWT or API-key auth on the backend.
- Wire a humidifier relay for too-dry conditions (mirror of the dehumidifier logic).
- Complete the SSH console (xterm.js + ws proxy).
- Either use or drop the ~BT~~controls~BT~~ table.
- Optionally move fertilizer families into DB tables with CRUD so new schedules can be added from the dashboard.
