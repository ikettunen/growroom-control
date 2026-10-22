/**
 * Fertilizer feeding schedules ("families").
 *
 * Each family is a week-by-week feeding chart. All dosages are stored as
 * ml per liter so any bucket size can be calculated with:
 *     dosage_ml = ml_per_liter * bucket_liters
 * Some products are given as a range (min/max) by the manufacturer.
 *
 * Week numbering is global from the start of the grow cycle (week 1).
 *
 * Sources:
 * - canna-coco:   CANNA COCO feeding schedule (Heavy feeding, tank 10 L,
 *                 dosage units ml/10 L, converted to ml/L; EC water 0.4;
 *                 recommended pH 5.5-6.2)
 * - sensi-coco:   Advanced Nutrients pH Perfect Sensi Coco Top Shelf recipe
 *                 (mL/L; grow 4 weeks @ 18 h light, bloom 8 weeks @ 12 h)
 */

export interface Dosage {
  min: number;
  max: number;
}

export type FertilizerPhase = 'rooting' | 'vegetative' | 'generative' | 'flush';

export interface FertilizerWeek {
  /** Display label, e.g. 'Week 3 - Vegetative I' */
  label: string;
  phase: FertilizerPhase;
  /** Photoperiod for this week; ties into rooms.light_cycle_hours */
  lightHours: number;
  /** Product dosages in ml/L (0 entries omitted) */
  products: Record<string, Dosage>;
  /** EC targets in mS/cm (CANNA charts) */
  ec?: { water: number; nutrition: number; total: number };
  ph?: string;
  note?: string;
}

export interface FertilizerFamily {
  id: string;
  name: string;
  manufacturer: string;
  notes: string[];
  weeks: FertilizerWeek[];
}

/** Dosage helper: d(2) -> fixed, d(2, 4) -> range. */
function d(min: number, max?: number): Dosage {
  return { min, max: max ?? min };
}

// ---------------------------------------------------------------------------
// CANNA COCO — 11 weeks, dosages converted from ml/10 L to ml/L
// ---------------------------------------------------------------------------

const CANNA_BASE_MID = { 'CANNA COCO A': d(3.75), 'CANNA COCO B': d(3.75) };
const CANNA_BASE_EARLY = { 'CANNA COCO A': d(3.35), 'CANNA COCO B': d(3.35) };

const cannaCoco: FertilizerFamily = {
  id: 'canna-coco',
  name: 'CANNA COCO (heavy feeding)',
  manufacturer: 'CANNA',
  notes: [
    'Source chart: CANNA COCO, tank size 10 L, heavy feeding, dosage units ml/10 L (converted to ml/L here).',
    'EC water: 0.4 mS/cm. Recommended pH between 5.5 and 6.2.',
    'CANNABOOST ranges (20-40 ml/10 L): use the lower rate from the start, the higher rate for heavier feeding.',
    'CANNAZYM 25-50 ml/10 L in the late weeks (*) per the source chart.'
  ],
  weeks: [
    {
      label: 'Week 1 - Rooting I (D1-5)',
      phase: 'rooting',
      lightHours: 18,
      products: { 'CANNA COCO A': d(3.35), 'CANNA COCO B': d(3.35), 'CANNA RHIZOTONIC': d(4.0) },
      ec: { water: 0.4, nutrition: 1.8, total: 2.2 },
      ph: '5.5-6.2'
    },
    {
      label: 'Week 2 - Rooting II (D6-25)',
      phase: 'rooting',
      lightHours: 18,
      products: { 'CANNA COCO A': d(3.35), 'CANNA COCO B': d(3.35), 'CANNA RHIZOTONIC': d(2.0), CANNAZYM: d(2.5) },
      ec: { water: 0.4, nutrition: 1.8, total: 2.2 },
      ph: '5.5-6.2'
    },
    {
      label: 'Week 3 - Vegetative I',
      phase: 'vegetative',
      lightHours: 12,
      products: {
        'CANNA COCO A': d(3.75), 'CANNA COCO B': d(3.75),
        'CANNA RHIZOTONIC': d(2.0), CANNAZYM: d(2.5), CANNABOOST: d(2.0)
      },
      ec: { water: 0.4, nutrition: 2.0, total: 2.4 },
      ph: '5.5-6.2'
    },
    {
      label: 'Week 4 - Vegetative II',
      phase: 'vegetative',
      lightHours: 12,
      products: {
        'CANNA COCO A': d(3.75), 'CANNA COCO B': d(3.75),
        'CANNA RHIZOTONIC': d(2.0), CANNAZYM: d(2.5), CANNABOOST: d(2.0)
      },
      ec: { water: 0.4, nutrition: 2.0, total: 2.4 },
      ph: '5.5-6.2'
    },
    {
      label: 'Week 5 - Generative I',
      phase: 'generative',
      lightHours: 12,
      products: {
        'CANNA COCO A': d(3.75), 'CANNA COCO B': d(3.75),
        'CANNA RHIZOTONIC': d(0.5), CANNAZYM: d(2.5), CANNABOOST: d(2.0, 4.0)
      },
      ec: { water: 0.4, nutrition: 2.0, total: 2.4 },
      ph: '5.5-6.2'
    },
    {
      label: 'Week 6 - Generative II',
      phase: 'generative',
      lightHours: 12,
      products: {
        'CANNA COCO A': d(3.75), 'CANNA COCO B': d(3.75),
        'CANNA RHIZOTONIC': d(0.5), CANNAZYM: d(2.5), CANNABOOST: d(2.0, 4.0)
      },
      ec: { water: 0.4, nutrition: 2.0, total: 2.4 },
      ph: '5.5-6.2'
    },
    {
      label: 'Week 7 - Generative III',
      phase: 'generative',
      lightHours: 12,
      products: {
        'CANNA COCO A': d(3.75), 'CANNA COCO B': d(3.75),
        'CANNA RHIZOTONIC': d(0.5), CANNAZYM: d(2.5), CANNABOOST: d(2.0, 4.0)
      },
      ec: { water: 0.4, nutrition: 2.0, total: 2.4 },
      ph: '5.5-6.2'
    },
    {
      label: 'Week 8 - Generative IV',
      phase: 'generative',
      lightHours: 12,
      products: {
        'CANNA COCO A': d(3.75), 'CANNA COCO B': d(3.75),
        'CANNA RHIZOTONIC': d(0.5), CANNAZYM: d(2.5), CANNABOOST: d(2.0, 4.0),
        'CANNA PK 13/14': d(1.5)
      },
      ec: { water: 0.4, nutrition: 2.5, total: 2.9 },
      ph: '5.5-6.2'
    },
    {
      label: 'Week 9 - Generative V',
      phase: 'generative',
      lightHours: 12,
      products: {
        'CANNA COCO A': d(3.35), 'CANNA COCO B': d(3.35),
        'CANNA RHIZOTONIC': d(0.5), CANNAZYM: d(2.5, 5.0), CANNABOOST: d(2.0, 4.0)
      },
      ec: { water: 0.4, nutrition: 1.8, total: 2.2 },
      ph: '5.5-6.2'
    },
    {
      label: 'Week 10 - Generative VI',
      phase: 'generative',
      lightHours: 12,
      products: {
        'CANNA COCO A': d(3.35), 'CANNA COCO B': d(3.35),
        'CANNA RHIZOTONIC': d(0.5), CANNAZYM: d(2.5, 5.0), CANNABOOST: d(2.0, 4.0)
      },
      ec: { water: 0.4, nutrition: 1.8, total: 2.2 },
      ph: '5.5-6.2'
    },
    {
      label: 'Week 11 - Flush (water only)',
      phase: 'flush',
      lightHours: 12,
      products: {},
      ec: { water: 0.4, nutrition: 0, total: 0.4 },
      ph: '5.5-6.2',
      note: 'Flush period: plain water only, no nutrients.'
    }
  ]
};

// ---------------------------------------------------------------------------
// Advanced Nutrients pH Perfect Sensi Coco (Top Shelf recipe) — 12 weeks, mL/L
// ---------------------------------------------------------------------------

const sensiBloomBase = {
  'pH Perfect Sensi Coco Bloom A': d(4),
  'pH Perfect Sensi Coco Bloom B': d(4)
};

const sensiCoco: FertilizerFamily = {
  id: 'sensi-coco',
  name: 'pH Perfect Sensi Coco (Top Shelf)',
  manufacturer: 'Advanced Nutrients',
  notes: [
    'Source: Advanced Nutrients pH Perfect Sensi Coco Top Shelf recipe (GLOBAL), dosages in mL/L.',
    'Grow cycle: 4 weeks @ 18 h light (pH Perfect base is pH buffering; no pH adjustment needed).',
    'Bloom cycle: 8 weeks @ 12 h light; week 8 of bloom is a nutrient-free flush period (Flawless Finish).',
    'Week 1 grow rate can be repeated for clones/seedlings in a "pre-veg" stage.',
    'For longer vegetative periods, repeat grow week 4 as needed; repeat bloom week 4 if the crop runs longer than 8 weeks.',
    'Mix water thoroughly after adding each product. If tip burn appears, reduce base nutrient strength by 25%.'
  ],
  weeks: [
    {
      label: 'Week 1 - Grow',
      phase: 'vegetative',
      lightHours: 18,
      products: {
        'pH Perfect Sensi Coco Grow A': d(1), 'pH Perfect Sensi Coco Grow B': d(1),
        'B-52': d(2), 'Voodoo Juice': d(2)
      }
    },
    {
      label: 'Week 2 - Grow',
      phase: 'vegetative',
      lightHours: 18,
      products: {
        'pH Perfect Sensi Coco Grow A': d(2), 'pH Perfect Sensi Coco Grow B': d(2),
        'B-52': d(2), 'Voodoo Juice': d(2)
      }
    },
    {
      label: 'Week 3 - Grow',
      phase: 'vegetative',
      lightHours: 18,
      products: {
        'pH Perfect Sensi Coco Grow A': d(3), 'pH Perfect Sensi Coco Grow B': d(3),
        'B-52': d(2)
      }
    },
    {
      label: 'Week 4 - Grow',
      phase: 'vegetative',
      lightHours: 18,
      products: {
        'pH Perfect Sensi Coco Grow A': d(4), 'pH Perfect Sensi Coco Grow B': d(4),
        'B-52': d(2)
      }
    },
    {
      label: 'Week 5 - Bloom 1',
      phase: 'generative',
      lightHours: 12,
      products: {
        ...sensiBloomBase,
        'Voodoo Juice': d(2), 'Bud Ignitor': d(2), 'Bud Candy': d(2)
      }
    },
    {
      label: 'Week 6 - Bloom 2',
      phase: 'generative',
      lightHours: 12,
      products: {
        ...sensiBloomBase,
        'Voodoo Juice': d(2), 'Bud Ignitor': d(2), 'Big Bud Coco': d(2), 'Bud Candy': d(2)
      }
    },
    {
      label: 'Week 7 - Bloom 3',
      phase: 'generative',
      lightHours: 12,
      products: {
        ...sensiBloomBase,
        'B-52': d(2), 'Big Bud Coco': d(2), 'Bud Candy': d(2)
      }
    },
    {
      label: 'Week 8 - Bloom 4',
      phase: 'generative',
      lightHours: 12,
      products: {
        ...sensiBloomBase,
        'B-52': d(2), 'Big Bud Coco': d(2), 'Bud Candy': d(2)
      }
    },
    {
      label: 'Week 9 - Bloom 5',
      phase: 'generative',
      lightHours: 12,
      products: {
        ...sensiBloomBase,
        'B-52': d(2), 'Big Bud Coco': d(2), 'Bud Candy': d(2)
      }
    },
    {
      label: 'Week 10 - Bloom 6',
      phase: 'generative',
      lightHours: 12,
      products: {
        ...sensiBloomBase,
        'B-52': d(2), 'Overdrive': d(2), 'Bud Candy': d(2)
      }
    },
    {
      label: 'Week 11 - Bloom 7',
      phase: 'generative',
      lightHours: 12,
      products: {
        ...sensiBloomBase,
        'B-52': d(2), 'Overdrive': d(2), 'Bud Candy': d(2)
      }
    },
    {
      label: 'Week 12 - Flush (Flawless Finish)',
      phase: 'flush',
      lightHours: 12,
      products: { 'Flawless Finish': d(2) },
      note: 'Nutrient-free flush period per the source chart.'
    }
  ]
};

export const FERTILIZER_FAMILIES: FertilizerFamily[] = [cannaCoco, sensiCoco];
