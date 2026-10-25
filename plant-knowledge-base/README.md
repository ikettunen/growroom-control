# Plant Knowledge Base — Data

Static, version-controlled crop profiles conforming to `DATA_MODEL.md` (Crop → Variety / GrowPhase → EnvironmentTarget / FertilizerHint / CareNote).

## Files

| File | Contents |
|---|---|
| `cannabis.json` | Cannabis (+ Blue Dream, OG Kush, White Widow, Northern Lights varieties) |
| `vegetables.json` | Fruiting, root, bulb/tuber and brassica crops (41 crops) |
| `leafy-greens.json` | Lettuce, spinach, chard and other greens (8 crops) |
| `herbs.json` | Culinary & medicinal herbs |
| `microgreens.json` | Microgreen species (short lifecycle, fractional-week durations) |
| `fruits.json` | Fruits, berries and tropical perennials |
| `flowers.json` | Ornamental and cut flowers |

Each file is a JSON **array of `Crop`** objects. `src/index.ts` merges them into a single `PlantKnowledgeBase` and validates every crop at startup; `src/export.ts` maps a Crop + Variety + Phase to a `PUT /api/rooms/:id` payload.

## Data provenance & caveats

- Values are **aggregated guideline ranges** for controlled-environment and greenhouse cultivation, compiled from university-extension and industry references (see `sources` per crop). Always cross-check against your seed supplier's cultivar sheet.
- `lightCycleHours` is the recommended indoor photoperiod; outdoor crops still carry temperature/humidity bands usable in greenhouses.
- Microgreen durations use fractional weeks (0.2 ≈ 1.5 days).

## MongoDB import (future home)

Each `Crop` document is self-contained — one line per crop in `mongo/crops.ndjson`:

```bash
mongoimport --db growroom --collection crops --file mongo/crops.ndjson
```

Generated 2026-10-25.
