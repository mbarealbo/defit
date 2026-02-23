import type { AnalysisResponse, EntryType } from '../types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export async function analyzeEntry(
  text: string,
  type: EntryType,
  image?: string,
  previousContext?: string
): Promise<AnalysisResponse> {
  const url = `${SUPABASE_URL}/functions/v1/analyze-entry`;

  const body: Record<string, unknown> = { text, type };
  if (image) body.image = image;
  if (previousContext) body.previousContext = previousContext;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Network error' }));
    throw new Error(err.error || `Request failed (${res.status})`);
  }

  return res.json();
}

export interface RefinedEntry {
  name: string;
  kcal: number;
  carbs: number;
  protein: number;
  fat: number;
}

export async function refineEntry(
  currentEntry: RefinedEntry,
  userPrompt: string,
): Promise<RefinedEntry> {
  const url = `${SUPABASE_URL}/functions/v1/refine-entry`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ currentEntry, userPrompt }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Network error' }));
    throw new Error(err.error || `Request failed (${res.status})`);
  }

  return res.json();
}

export function imageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
