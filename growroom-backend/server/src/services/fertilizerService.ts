import {
  FERTILIZER_FAMILIES,
  FertilizerFamily,
  FertilizerWeek,
  Dosage
} from '../data/fertilizerSchedules';

export interface FamilySummary {
  id: string;
  name: string;
  manufacturer: string;
  weekCount: number;
  phases: string[];
  products: string[];
  notes: string[];
}

export interface ScaledProduct {
  name: string;
  mlPerLiter: Dosage;
  /** Dosage for the requested bucket, in ml */
  dosageMl: Dosage;
}

export interface ScaledWeek {
  week: number;
  label: string;
  phase: string;
  lightHours: number;
  ec?: { water: number; nutrition: number; total: number };
  ph?: string;
  note?: string;
  products: ScaledProduct[];
}

export interface ScheduleCalculation {
  family: string;
  familyName: string;
  manufacturer: string;
  bucketSize: number;
  weeks: ScaledWeek[];
  notes: string[];
}

const round1 = (value: number): number => Math.round(value * 10) / 10;

function scaleDosage(dosage: Dosage, bucketLiters: number): Dosage {
  return {
    min: round1(dosage.min * bucketLiters),
    max: round1(dosage.max * bucketLiters)
  };
}

function scaleWeek(week: FertilizerWeek, weekNumber: number, bucketLiters: number): ScaledWeek {
  return {
    week: weekNumber,
    label: week.label,
    phase: week.phase,
    lightHours: week.lightHours,
    ec: week.ec,
    ph: week.ph,
    note: week.note,
    products: Object.entries(week.products).map(([name, mlPerLiter]) => ({
      name,
      mlPerLiter,
      dosageMl: scaleDosage(mlPerLiter, bucketLiters)
    }))
  };
}

export class FertilizerService {
  getFamily(familyId: string): FertilizerFamily | undefined {
    return FERTILIZER_FAMILIES.find((family) => family.id === familyId);
  }

  getFamilies(): FamilySummary[] {
    return FERTILIZER_FAMILIES.map((family) => ({
      id: family.id,
      name: family.name,
      manufacturer: family.manufacturer,
      weekCount: family.weeks.length,
      phases: Array.from(new Set(family.weeks.map((week) => week.phase))),
      products: Array.from(new Set(family.weeks.flatMap((week) => Object.keys(week.products)))),
      notes: family.notes
    }));
  }

  /**
   * Calculate dosages for a family, scaled to the requested bucket size.
   * If weekNumber is given, only that week is returned; otherwise the full
   * week-by-week schedule comes back.
   */
  calculate(familyId: string, bucketLiters: number, weekNumber?: number): ScheduleCalculation {
    const family = this.getFamily(familyId);
    if (!family) {
      throw new Error('Family not found');
    }

    const weeks = family.weeks.map((week, index) => scaleWeek(week, index + 1, bucketLiters));
    const selected = weekNumber !== undefined ? weeks.filter((w) => w.week === weekNumber) : weeks;

    return {
      family: family.id,
      familyName: family.name,
      manufacturer: family.manufacturer,
      bucketSize: bucketLiters,
      weeks: selected,
      notes: family.notes
    };
  }
}
