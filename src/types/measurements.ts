export interface Measurement {
  id: string;
  user_id: string;
  date: string;
  peso: number | null;
  petto: number | null;
  vita: number | null;
  fianchi: number | null;
  cosce: number | null;
  braccia: number | null;
  created_at: string;
}

export interface MeasurementFormData {
  peso: number | null;
  petto: number | null;
  vita: number | null;
  fianchi: number | null;
  cosce: number | null;
  braccia: number | null;
}

export type MeasurementKey = keyof MeasurementFormData;

export const MEASUREMENT_LABELS: Record<MeasurementKey, string> = {
  peso: 'Peso',
  petto: 'Petto',
  vita: 'Girovita',
  fianchi: 'Fianchi',
  cosce: 'Cosce',
  braccia: 'Braccia',
};

export const MEASUREMENT_UNITS: Record<MeasurementKey, string> = {
  peso: 'kg',
  petto: 'cm',
  vita: 'cm',
  fianchi: 'cm',
  cosce: 'cm',
  braccia: 'cm',
};
