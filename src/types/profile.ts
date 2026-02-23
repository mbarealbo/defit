export type Sex = 'uomo' | 'donna';

export interface UserProfile {
  id: string;
  sex: Sex;
  age: number;
  weight_kg: number;
  height_cm: number;
  activity_multiplier: number;
  target_deficit: number;
  min_deficit_target: number;
  max_deficit_target: number;
  bmr: number;
  tdee: number;
  created_at: string;
  updated_at: string;
}

export interface ProfileFormData {
  sex: Sex;
  age: number;
  weight_kg: number;
  height_cm: number;
  activity_multiplier: number;
  target_deficit: number;
  min_deficit_target: number;
  max_deficit_target: number;
}

export function calcBMR(sex: Sex, weight: number, height: number, age: number): number {
  const base = 10 * weight + 6.25 * height - 5 * age;
  return Math.round(sex === 'uomo' ? base + 5 : base - 161);
}

export function calcTDEE(bmr: number, multiplier: number): number {
  return Math.round(bmr * multiplier);
}

export const ACTIVITY_OPTIONS = [
  { value: 1.2, label: 'Base / Non dichiaro (Inserirò a mano le calorie bruciate)' },
  { value: 1.375, label: 'Automatico: Leggermente Attivo (1-3 allenamenti a settimana)' },
  { value: 1.55, label: 'Automatico: Moderatamente Attivo (3-5 allenamenti a settimana)' },
  { value: 1.725, label: 'Automatico: Molto Attivo (6-7 allenamenti a settimana)' },
  { value: 1.9, label: 'Automatico: Estremamente Attivo (Lavoro fisico pesante o doppio allenamento)' },
];

export const DEFICIT_OPTIONS = [
  { value: 0, label: 'Mantenimento (0 kcal)' },
  { value: 250, label: 'Lieve (-250 kcal/giorno)' },
  { value: 500, label: 'Normale (-500 kcal/giorno, circa 0.5kg a settimana)' },
  { value: 1000, label: 'Aggressivo (-1000 kcal/giorno, circa 1kg a settimana)' },
];
