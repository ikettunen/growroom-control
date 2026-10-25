import { Crop } from '../schema/types';

export function validateCrop(crop: Crop): string[] {
  const errs: string[] = [];
  if (!crop.id || !crop.name) errs.push('missing id/name');
  if (!['cannabis','vegetable','herb','leafy-green','fruit','microgreen','flower'].includes(crop.category)) errs.push(`bad category: ${crop.category}`);
  if (!crop.phases?.length) { errs.push('no phases'); return errs; }
  if (crop.space) {
    const s = crop.space;
    const rangeOk = (r?: { min: number; max: number }) => !r || r.min <= r.max;
    if (!rangeOk(s.potSizeLiters)) errs.push(`${crop.id}: inverted space.potSizeLiters`);
    if (!rangeOk(s.potDepthCm)) errs.push(`${crop.id}: inverted space.potDepthCm`);
    if (!rangeOk(s.plantsPerM2)) errs.push(`${crop.id}: inverted space.plantsPerM2`);
    if (!rangeOk(s.spacingCm)) errs.push(`${crop.id}: inverted space.spacingCm`);
    if (!rangeOk(s.rootDepthCm)) errs.push(`${crop.id}: inverted space.rootDepthCm`);
    if (!rangeOk(s.verticalClearanceCm)) errs.push(`${crop.id}: inverted space.verticalClearanceCm`);
  }
  crop.phases.forEach((p, i) => {
    if (p.order !== i + 1) errs.push(`${crop.id}: phase order gap at ${p.id}`);
    const e = p.environment;
    if (e.tempDayMin > e.tempDayMax || e.tempNightMin > e.tempNightMax) errs.push(`${crop.id}/${p.id}: inverted temp range`);
    if (e.humidityMin > e.humidityMax) errs.push(`${crop.id}/${p.id}: inverted humidity range`);
    if (p.durationWeeksMin > p.durationWeeksMax) errs.push(`${crop.id}/${p.id}: inverted duration`);
    if (!/^\d{2}:\d{2}:\d{2}$/.test(e.lightOnAt)) errs.push(`${crop.id}/${p.id}: bad lightOnAt`);
  });
  return errs;
}

export function validateAll(crops: Crop[]): { ok: boolean; errors: string[] } {
  const errors = crops.flatMap(validateCrop);
  const ids = new Set<string>();
  crops.forEach(c => { if (ids.has(c.id)) errors.push(`duplicate crop id: ${c.id}`); ids.add(c.id); });
  return { ok: errors.length === 0, errors };
}
