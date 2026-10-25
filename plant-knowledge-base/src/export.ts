import { Crop, RoomExport, Variety } from '../schema/types';

function mergePhase(crop: Crop, variety: Variety | null | undefined, phaseId?: string) {
  const base = phaseId ? crop.phases.find(p => p.id === phaseId) : crop.phases[0];
  if (!base) throw new Error(`phase not found: ${phaseId}`);
  const override = variety?.phaseOverrides?.[base.id];
  return { ...base, ...(override || {}) };
}

export function buildRoomExport(
  crops: Crop[],
  cropId: string,
  varietyId?: string | null,
  phaseId?: string
): RoomExport {
  const crop = crops.find(c => c.id === cropId);
  if (!crop) throw new Error(`unknown crop: ${cropId}`);
  const variety = varietyId ? crop.varieties.find(v => v.id === varietyId) : null;
  if (varietyId && !variety) throw new Error(`unknown variety: ${varietyId}`);
  const phase = mergePhase(crop, variety, phaseId ?? crop.phases[0].id);
  const e = phase.environment;
  return {
    temperatureSetting: +(((e.tempDayMin + e.tempDayMax) / 2).toFixed(1)),
    humiditySetting: +(((e.humidityMin + e.humidityMax) / 2).toFixed(1)),
    lightCycleHours: e.lightCycleHours,
    lightOnAt: e.lightOnAt,
    fertilizerFamily: phase.fertilizerHint?.familyId ?? null,
    cycleStartDate: new Date().toISOString().slice(0, 10),
    _meta: {
      cropId: crop.id,
      varietyId: variety?.id ?? null,
      phaseName: phase.label,
      ecTarget: phase.fertilizerHint?.ecTarget ?? null,
      phTarget: phase.fertilizerHint?.phTarget ?? null,
      careNotes: phase.careNotes,
      totalWeeksEstimate: crop.typicalTotalWeeks,
    },
  };
}
