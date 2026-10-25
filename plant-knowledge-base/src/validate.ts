import { Crop } from '../schema/types';

export function validateCrop(crop: Crop): string[] {
  const errs: string[] = [];
  if (!crop.id || !crop.name) errs.push('missing id/name');
  if (!['cannabis','vegetable','herb','leafy-green','fruit','microgreen','flower'].includes(crop.category)) errs.push(`bad category: ${crop.category}`);
  if (!crop.phases?.length) { errs.push('no phases'); return errs; }
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
