export type EntryType = 'food' | 'workout';

export type MealCategory =
  | 'colazione'
  | 'spuntino mattutino'
  | 'pranzo'
  | 'spuntino pomeridiano'
  | 'cena'
  | 'fuori pasto';

export interface Entry {
  id: string;
  user_id: string;
  type: EntryType;
  name: string;
  kcal: number;
  carbs: number;
  protein: number;
  fat: number;
  entry_date: string;
  created_at: string;
  meal_category: MealCategory | null;
  time_label: string | null;
}

export interface DayRecord {
  entries: Entry[];
  foodKcal: number;
  workoutKcal: number;
  deficit: number;
  tdeeSnapshot?: number;
  minDeficitSnapshot?: number;
  maxDeficitSnapshot?: number;
}

export interface AnalysisItem {
  name: string;
  kcal: number;
  carbs: number;
  protein: number;
  fat: number;
}

export interface AnalysisResponse {
  status: 'success' | 'clarification_needed';
  message: string;
  items: AnalysisItem[];
  total_kcal: number;
}
