import { Crop, PlantKnowledgeBase } from '../schema/types';
import { validateAll } from './validate';
import cannabis from '../data/cannabis.json';
import vegetables from '../data/vegetables.json';
import leafyGreens from '../data/leafy-greens.json';
import herbs from '../data/herbs.json';
import microgreens from '../data/microgreens.json';
import fruits from '../data/fruits.json';
import flowers from '../data/flowers.json';

export * from './export';
export { validateAll } from './validate';

const DATA: Record<string, Crop[]> = {
  cannabis: cannabis as unknown as Crop[],
  vegetables: vegetables as unknown as Crop[],
  'leafy-greens': leafyGreens as unknown as Crop[],
  herbs: herbs as unknown as Crop[],
  microgreens: microgreens as unknown as Crop[],
  fruits: fruits as unknown as Crop[],
  flowers: flowers as unknown as Crop[],
};

export const crops: Crop[] = Object.values(DATA).flat();

const { ok, errors } = validateAll(crops);
if (!ok) throw new Error('Plant knowledge base failed validation:\n' + errors.join('\n'));

export const knowledgeBase: PlantKnowledgeBase = {
  version: '1.1.0',
  updatedAt: new Date().toISOString(),
  crops,
};
export default knowledgeBase;
