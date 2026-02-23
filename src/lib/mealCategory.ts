import type { MealCategory } from '../types';

export const MEAL_CATEGORY_ORDER: MealCategory[] = [
  'colazione',
  'spuntino mattutino',
  'pranzo',
  'spuntino pomeridiano',
  'cena',
  'fuori pasto',
];

export const MEAL_CATEGORY_LABELS: Record<MealCategory, string> = {
  'colazione': 'Colazione',
  'spuntino mattutino': 'Spuntino mattutino',
  'pranzo': 'Pranzo',
  'spuntino pomeridiano': 'Spuntino pomeridiano',
  'cena': 'Cena',
  'fuori pasto': 'Fuori pasto',
};

export function getMealCategory(timeStr?: string): MealCategory {
  const now = timeStr ?? new Date().toTimeString().slice(0, 5);
  const [hStr, mStr] = now.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  const total = h * 60 + m;

  if (total <= 5 * 60) return 'fuori pasto';
  if (total <= 10 * 60) return 'colazione';
  if (total <= 12 * 60 + 30) return 'spuntino mattutino';
  if (total <= 15 * 60 + 29) return 'pranzo';
  if (total <= 16 * 60 + 29) return 'fuori pasto';
  if (total <= 18 * 60 + 29) return 'spuntino pomeridiano';
  if (total <= 19 * 60 + 29) return 'fuori pasto';
  if (total <= 22 * 60 + 29) return 'cena';
  return 'fuori pasto';
}

export function getCurrentTimeLabel(): string {
  return new Date().toTimeString().slice(0, 5);
}
