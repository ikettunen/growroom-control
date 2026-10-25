# Plant Knowledge Base — Data Model

**Version:** 1.0  
**Date:** 2026-10-25  

---

## 1. Purpose

A structured, exportable knowledge base of crop profiles. Each profile captures everything needed to pre-configure a grow room: environment targets, light schedules, grow phase breakdown, and fertilizer family mapping. Users pick a crop (and optionally a variety/cultivar), review the parameters, and export them directly as a `PUT /api/rooms/:id` payload to the growroom system.

---

## 2. Core Concepts

```
Crop  ─── has many ───▶  Variety
  │                          │
  │                          └── overrides Crop defaults (optional)
  │
  └── has many ───▶  GrowPhase   (ordered: e.g. Seedling → Veg → Bloom → Flush)
        │
        └── carries ──▶  EnvironmentTarget  (temp, humidity, light cycle, CO₂)
                          FertilizerHint     (family id, phase name, notes)
                          CareNote[]         (watering interval, pruning, etc.)
```

A **Crop** is the base species (e.g. Cannabis, Tomato, Basil).  
A **Variety** is a specific cultivar (e.g. Blue Dream, San Marzano, Genovese) that can override any phase parameter from its parent Crop.  
A **GrowPhase** is one stage of the lifecycle. Phases are ordered and each has a duration range (weeks min/max), environment targets, and optional fertilizer hints.  
An **Export** is a snapshot of a Crop+Variety configuration mapped to the growroom API schema.

---

## 3. TypeScript Interfaces

### 3.1 Environment Targets

```ts
interface EnvironmentTarget {
  // Temperature
  tempDayMin:   number;   // °C  — daytime low target
  tempDayMax:   number;   // °C  — daytime high target
  tempNightMin: number;   // °C  — night low (lights-off)
  tempNightMax: number;   // °C  — night high (lights-off)

  // Humidity (RH %)
  humidityMin:  number;
  humidityMax:  number;

  // Vapour Pressure Deficit (informational, kPa)
  vpdMin?:      number;
  vpdMax?:      number;

  // Light
  lightCycleHours: number;   // 0 | 12 | 16 | 18 | 20 | 24
  lightOnAt:       string;   // 'HH:MM:SS' — daily on-window start
  dliTarget?:      number;   // mol/m²/d — informational

  // CO₂ (informational, ppm)
  co2Target?:   number;
}
```

### 3.2 Fertilizer Hint

Links a grow phase to a fertilizer family and provides human guidance.

```ts
interface FertilizerHint {
  familyId?:   string;   // matches a family id in the growroom backend (e.g. 'canna-coco')
  phaseLabel:  string;   // e.g. 'Vegetative', 'Early Bloom'
  ecTarget?:   { min: number; max: number };   // mS/cm
  phTarget?:   { min: number; max: number };
  notes:       string[];
}
```

### 3.3 Care Note

```ts
interface CareNote {
  category: 'watering' | 'pruning' | 'training' | 'pest' | 'harvest' | 'general';
  note: string;
}
```

### 3.4 Grow Phase

```ts
interface GrowPhase {
  id:          string;   // slug: 'seedling' | 'vegetative' | 'bloom' | 'flush' | 'harvest' | 'microgreen'
  label:       string;   // display name: 'Seedling', 'Vegetative', 'Early Bloom', etc.
  order:       number;   // 1-based sort order within the crop lifecycle
  durationWeeksMin: number;
  durationWeeksMax: number;
  environment: EnvironmentTarget;
  fertilizerHint?: FertilizerHint;
  careNotes:   CareNote[];
}
```

### 3.5 Variety (Cultivar)

```ts
interface Variety {
  id:          string;   // slug, unique within parent crop: 'blue-dream', 'san-marzano'
  name:        string;
  description: string;
  origin?:     string;   // breeder / region
  tags:        string[]; // e.g. ['indica-dominant', 'autoflower', 'heirloom']

  // Partial overrides — only phases that differ from the parent Crop
  phaseOverrides?: Partial<Record<string, Partial<GrowPhase>>>;
  // Key = GrowPhase.id, value = partial GrowPhase (only changed fields)
}
```

### 3.6 Crop (Species)

```ts
interface Crop {
  id:          string;          // slug: 'cannabis', 'tomato', 'basil', 'chili', 'lettuce'
  name:        string;          // display: 'Cannabis', 'Tomato', etc.
  scientificName?: string;
  category:    CropCategory;
  description: string;
  tags:        string[];        // ['photoperiod', 'annual', 'herb', 'fruiting', etc.]

  // Full lifecycle phase definitions (the canonical defaults)
  phases:      GrowPhase[];

  // Known varieties / cultivars
  varieties:   Variety[];

  // Metadata
  difficulty:  'beginner' | 'intermediate' | 'advanced';
  indoorSuitable: boolean;
  typicalTotalWeeks: { min: number; max: number };

  // Compatible fertilizer families from the growroom backend
  compatibleFertilizerFamilies: string[];   // e.g. ['canna-coco', 'sensi-coco']

  sources:     string[];   // reference URLs / books
  updatedAt:   string;     // ISO 8601
}

type CropCategory =
  | 'cannabis'
  | 'vegetable'
  | 'herb'
  | 'leafy-green'
  | 'fruit'
  | 'microgreen'
  | 'flower';
```

### 3.7 Knowledge Base Root

```ts
interface PlantKnowledgeBase {
  version:   string;
  updatedAt: string;
  crops:     Crop[];
}
```

---

## 4. Export to Growroom API

When a user selects a Crop + optional Variety + phase, the UI produces a `RoomExport` payload that maps directly to `PUT /api/rooms/:id`.

```ts
interface RoomExport {
  // Direct PUT /api/rooms/:id fields
  temperatureSetting:  number;   // midpoint of tempDayMin/Max
  humiditySetting:     number;   // midpoint of humidityMin/Max
  lightCycleHours:     number;
  lightOnAt:           string;
  fertilizerFamily:    string | null;
  cycleStartDate:      string | null;   // set to today on export

  // UI-only metadata (not sent to API, shown in the export preview)
  _meta: {
    cropId:       string;
    varietyId:    string | null;
    phaseName:    string;
    ecTarget:     { min: number; max: number } | null;
    phTarget:     { min: number; max: number } | null;
    careNotes:    CareNote[];
    totalWeeksEstimate: { min: number; max: number };
  };
}
```

---

## 5. File Layout

```
plant-knowledge-base/
  DATA_MODEL.md               ← this file
  schema/
    types.ts                  ← TypeScript interfaces (source of truth)
  data/
    cannabis.json
    tomato.json
    chili.json
    herbs.json                ← basil, mint, coriander, parsley, thyme
    lettuce-microgreens.json
  src/
    index.ts                  ← loads + validates all data, exports PlantKnowledgeBase
    export.ts                 ← buildRoomExport(cropId, varietyId?, phaseId?) → RoomExport
    validate.ts               ← JSON schema validation at startup
  README.md
```

---

## 6. Phase ID Vocabulary

Standard phase IDs used across all crops (custom phases allowed with namespaced ids):

| id | Typical crops |
|---|---|
| `seedling` | Cannabis, Tomato, Chili |
| `clone` | Cannabis (clone start) |
| `vegetative` | Cannabis, Tomato, Chili |
| `early-bloom` | Cannabis, Chili |
| `bloom` | Cannabis, Tomato, Chili |
| `late-bloom` | Cannabis |
| `flush` | Cannabis, Tomato |
| `harvest` | All fruiting crops |
| `propagation` | Herbs (cutting/seed start) |
| `establishment` | Herbs, Lettuce |
| `growth` | Herbs, Lettuce, Microgreens |
| `microgreen-germination` | Microgreens |
| `microgreen-growth` | Microgreens |
| `microgreen-harvest` | Microgreens |

---

## 7. Crop Summary (initial dataset)

| Crop | Category | Phases | Varieties (initial) | Total weeks |
|---|---|---|---|---|
| Cannabis | cannabis | seedling → vegetative → early-bloom → bloom → late-bloom → flush | Blue Dream, OG Kush, White Widow, Northern Lights (auto) | 10–20 |
| Tomato | vegetable | seedling → vegetative → bloom → harvest | San Marzano, Cherry, Beefsteak | 12–20 |
| Chili | vegetable | seedling → vegetative → bloom → harvest | Jalapeño, Habanero, Bird's Eye, Carolina Reaper | 14–24 |
| Herbs | herb | propagation → establishment → growth | Basil (Genovese, Thai), Mint, Coriander, Parsley, Thyme | 4–8 |
| Lettuce & Microgreens | leafy-green / microgreen | germination → growth → harvest | Butterhead, Romaine, Arugula, Sunflower (micro), Pea Shoots | 1–8 |

---

## 8. Design Decisions

1. **Phases are per-crop canonical defaults.** Varieties only carry `phaseOverrides` for what actually differs (duration, temperature, humidity). This keeps the data lean.

2. **Temperature stored as min/max, not a single setpoint.** The export maps `(min+max)/2` as the room setpoint, which fits the backend. The min/max are preserved for display.

3. **FertilizerHint is advisory, not prescriptive.** It suggests a `familyId` from the growroom's existing catalog. The user confirms before export. This avoids hard-coupling the knowledge base to a specific fertilizer product.

4. **CycleStartDate is always set to today on export.** The knowledge base does not pre-fill a date — that's the operator's decision at export time.

5. **No database required for v1.** All data is static JSON files, loaded and validated at startup by `src/index.ts`. Moving to a DB (with full CRUD) is a natural v2 step.

6. **Compatible with the existing growroom backend without schema changes.** The export payload uses only fields already accepted by `PUT /api/rooms/:id`.
