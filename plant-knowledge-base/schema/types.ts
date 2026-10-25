// Plant Knowledge Base — TypeScript interfaces (source of truth)
// Mirrors plant-knowledge-base/DATA_MODEL.md v1.0

export interface EnvironmentTarget {
  tempDayMin: number; tempDayMax: number;
  tempNightMin: number; tempNightMax: number;
  humidityMin: number; humidityMax: number;
  vpdMin?: number; vpdMax?: number;
  lightCycleHours: number;   // 0 | 12 | 16 | 18 | 20 | 24
  lightOnAt: string;         // 'HH:MM:SS'
  dliTarget?: number;        // mol/m2/d
  co2Target?: number;        // ppm
}

export interface FertilizerHint {
  familyId?: string;
  phaseLabel: string;
  ecTarget?: { min: number; max: number };
  phTarget?: { min: number; max: number };
  notes: string[];
}

export type CareNoteCategory = 'watering' | 'pruning' | 'training' | 'pest' | 'harvest' | 'general';
export interface CareNote { category: CareNoteCategory; note: string; }

export interface GrowPhase {
  id: string; label: string; order: number;
  durationWeeksMin: number; durationWeeksMax: number;
  environment: EnvironmentTarget;
  fertilizerHint?: FertilizerHint;
  careNotes: CareNote[];
}

export interface Variety {
  id: string; name: string; description: string;
  origin?: string; tags: string[];
  phaseOverrides?: Partial<Record<string, Partial<GrowPhase>>>;
}

export type CropCategory = 'cannabis' | 'vegetable' | 'herb' | 'leafy-green' | 'fruit' | 'microgreen' | 'flower';

export interface Range { min: number; max: number }

// Space / container requirements (guideline ranges, indoor typicals)
export interface SpaceRequirement {
  potSizeLiters?: Range;        // container volume for a full-cycle plant
  potDepthCm?: Range;           // container depth needed for the root system
  plantsPerM2?: Range;          // final planting density
  spacingCm?: Range;            // plant-to-plant spacing (in-row / pot-to-pot)
  canopyFootprintM2?: number;   // canopy area per plant at maturity
  rootDepthCm?: Range;          // expected root system depth
  verticalClearanceCm?: Range;  // canopy height incl. container + light clearance
  recommendedMedium?: string[]; // e.g. ['coco', 'soil', 'hydro-dwc', 'nft', 'aero']
  notes?: string[];
}

export interface Crop {
  id: string; name: string; scientificName?: string;
  category: CropCategory; description: string; tags: string[];
  phases: GrowPhase[]; varieties: Variety[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  indoorSuitable: boolean;
  typicalTotalWeeks: { min: number; max: number };
  space?: SpaceRequirement;
  compatibleFertilizerFamilies: string[];
  sources: string[]; updatedAt: string;
}

export interface PlantKnowledgeBase { version: string; updatedAt: string; crops: Crop[]; }

export interface RoomExport {
  temperatureSetting: number; humiditySetting: number;
  lightCycleHours: number; lightOnAt: string;
  fertilizerFamily: string | null; cycleStartDate: string | null;
  _meta: {
    cropId: string; varietyId: string | null; phaseName: string;
    ecTarget: { min: number; max: number } | null;
    phTarget: { min: number; max: number } | null;
    careNotes: CareNote[];
    totalWeeksEstimate: { min: number; max: number };
  };
}
