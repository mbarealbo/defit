import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { getMealCategory, getCurrentTimeLabel } from '../lib/mealCategory';
import type { Entry, EntryType, AnalysisItem, DayRecord, MealCategory } from '../types';

export const FALLBACK_TDEE = 2000;
export const WORKOUT_GOAL = 500;

export function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

interface DailySnapshot {
  tdee_snapshot: number;
  min_deficit_snapshot: number;
  max_deficit_snapshot: number;
}

function calcRecord(entries: Entry[], tdee: number, snapshot?: DailySnapshot | null): DayRecord {
  let foodKcal = 0;
  let workoutKcal = 0;
  for (const e of entries) {
    if (e.type === 'food') foodKcal += e.kcal;
    else workoutKcal += e.kcal;
  }
  const effectiveTdee = snapshot?.tdee_snapshot ?? tdee;
  return {
    entries,
    foodKcal,
    workoutKcal,
    deficit: effectiveTdee + workoutKcal - foodKcal,
    tdeeSnapshot: snapshot?.tdee_snapshot,
    minDeficitSnapshot: snapshot?.min_deficit_snapshot,
    maxDeficitSnapshot: snapshot?.max_deficit_snapshot,
  };
}

async function upsertSnapshot(
  userId: string,
  date: string,
  tdee: number,
  minDeficit: number,
  maxDeficit: number,
) {
  await supabase.from('daily_snapshots').upsert(
    {
      user_id: userId,
      date,
      tdee_snapshot: tdee,
      min_deficit_snapshot: minDeficit,
      max_deficit_snapshot: maxDeficit,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,date' },
  );
}

interface DefitState {
  records: Record<string, DayRecord>;
  snapshots: Record<string, DailySnapshot>;
  selectedDate: string;
  loading: boolean;
  calendarLoading: boolean;
  tdee: number;
  minDeficit: number;
  maxDeficit: number;
  setTDEE: (tdee: number) => void;
  setDeficitTargets: (min: number, max: number) => void;
  syncTodaySnapshot: (tdee: number, minDeficit: number, maxDeficit: number) => Promise<void>;
  fetchToday: () => Promise<void>;
  fetchMonth: (year: number, month: number) => Promise<void>;
  addEntries: (type: EntryType, items: AnalysisItem[]) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  updateEntryCategory: (id: string, category: MealCategory) => Promise<void>;
  updateEntry: (id: string, fields: { name: string; kcal: number; carbs: number; protein: number; fat: number }) => Promise<void>;
  setSelectedDate: (date: string) => void;
  getRecord: (date: string) => DayRecord;
}

const EMPTY_RECORD: DayRecord = { entries: [], foodKcal: 0, workoutKcal: 0, deficit: FALLBACK_TDEE };

export const useDefitStore = create<DefitState>((set, get) => ({
  records: {},
  snapshots: {},
  selectedDate: todayStr(),
  loading: true,
  calendarLoading: false,
  tdee: FALLBACK_TDEE,
  minDeficit: 0,
  maxDeficit: 0,

  setTDEE: (tdee: number) => {
    set({ tdee });
  },

  setDeficitTargets: (min: number, max: number) => {
    set({ minDeficit: min, maxDeficit: max });
  },

  syncTodaySnapshot: async (tdee: number, minDeficit: number, maxDeficit: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const today = todayStr();
    await upsertSnapshot(user.id, today, tdee, minDeficit, maxDeficit);

    const newSnapshot: DailySnapshot = {
      tdee_snapshot: tdee,
      min_deficit_snapshot: minDeficit,
      max_deficit_snapshot: maxDeficit,
    };

    const existingEntries = get().records[today]?.entries ?? [];
    const record = calcRecord(existingEntries, tdee, newSnapshot);

    set((s) => ({
      tdee,
      minDeficit,
      maxDeficit,
      records: { ...s.records, [today]: record },
      snapshots: { ...s.snapshots, [today]: newSnapshot },
    }));
  },

  getRecord: (date: string) => {
    return get().records[date] ?? { ...EMPTY_RECORD };
  },

  setSelectedDate: (date: string) => {
    set({ selectedDate: date });
  },

  fetchToday: async () => {
    set({ loading: true });
    const today = todayStr();

    const { data: { user } } = await supabase.auth.getUser();

    const [entriesRes, snapshotRes] = await Promise.all([
      supabase
        .from('entries')
        .select('*')
        .eq('entry_date', today)
        .order('created_at', { ascending: true }),
      user
        ? supabase
            .from('daily_snapshots')
            .select('*')
            .eq('user_id', user.id)
            .eq('date', today)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    const entries = (entriesRes.data ?? []) as Entry[];
    const snapshot = snapshotRes.data as DailySnapshot | null;

    const { tdee, minDeficit, maxDeficit } = get();

    if (user && !snapshot) {
      await upsertSnapshot(user.id, today, tdee, minDeficit, maxDeficit);
    }

    const activeSnapshot: DailySnapshot = snapshot ?? {
      tdee_snapshot: tdee,
      min_deficit_snapshot: minDeficit,
      max_deficit_snapshot: maxDeficit,
    };

    const record = calcRecord(entries, tdee, activeSnapshot);

    set((s) => ({
      records: { ...s.records, [today]: record },
      snapshots: { ...s.snapshots, [today]: activeSnapshot },
      loading: false,
    }));
  },

  fetchMonth: async (year: number, month: number) => {
    set({ calendarLoading: true });
    const from = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const to = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const { data: { user } } = await supabase.auth.getUser();

    const [entriesRes, snapshotsRes] = await Promise.all([
      supabase
        .from('entries')
        .select('*')
        .gte('entry_date', from)
        .lte('entry_date', to)
        .order('created_at', { ascending: true }),
      user
        ? supabase
            .from('daily_snapshots')
            .select('*')
            .eq('user_id', user.id)
            .gte('date', from)
            .lte('date', to)
        : Promise.resolve({ data: [] }),
    ]);

    const entries = (entriesRes.data ?? []) as Entry[];
    const snapshots = (snapshotsRes.data ?? []) as (DailySnapshot & { date: string })[];

    const snapshotByDate: Record<string, DailySnapshot> = {};
    for (const s of snapshots) {
      snapshotByDate[s.date] = s;
    }

    const byDate: Record<string, Entry[]> = {};
    for (const e of entries) {
      if (!byDate[e.entry_date]) byDate[e.entry_date] = [];
      byDate[e.entry_date].push(e);
    }

    const newRecords: Record<string, DayRecord> = {};
    const tdee = get().tdee;

    for (const [date, dayEntries] of Object.entries(byDate)) {
      newRecords[date] = calcRecord(dayEntries, tdee, snapshotByDate[date] ?? null);
    }

    set((s) => ({
      records: { ...s.records, ...newRecords },
      snapshots: { ...s.snapshots, ...snapshotByDate },
      calendarLoading: false,
    }));
  },

  addEntries: async (type, items) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const date = todayStr();
    const timeLabel = getCurrentTimeLabel();
    const mealCategory = type === 'food' ? getMealCategory(timeLabel) : null;
    const { tdee, minDeficit, maxDeficit } = get();

    await upsertSnapshot(user.id, date, tdee, minDeficit, maxDeficit);

    const rows = items.map((item) => ({
      user_id: user.id,
      type,
      name: item.name,
      kcal: item.kcal,
      carbs: item.carbs,
      protein: item.protein,
      fat: item.fat,
      entry_date: date,
      time_label: timeLabel,
      meal_category: mealCategory,
    }));

    const { data, error } = await supabase.from('entries').insert(rows).select();
    if (error) throw new Error(error.message);

    const newEntries = (data ?? []) as Entry[];
    const existing = get().records[date]?.entries ?? [];
    const allEntries = [...existing, ...newEntries];

    const activeSnapshot: DailySnapshot = {
      tdee_snapshot: tdee,
      min_deficit_snapshot: minDeficit,
      max_deficit_snapshot: maxDeficit,
    };

    const record = calcRecord(allEntries, tdee, activeSnapshot);

    set((s) => ({
      records: { ...s.records, [date]: record },
      snapshots: { ...s.snapshots, [date]: activeSnapshot },
    }));
  },

  deleteEntry: async (id: string) => {
    await supabase.from('entries').delete().eq('id', id);

    const records = { ...get().records };
    const { tdee, snapshots } = get();
    for (const [date, record] of Object.entries(records)) {
      if (record.entries.some((e) => e.id === id)) {
        const entries = record.entries.filter((e) => e.id !== id);
        records[date] = calcRecord(entries, tdee, snapshots[date] ?? null);
        break;
      }
    }
    set({ records });
  },

  updateEntry: async (id, fields) => {
    await supabase.from('entries').update(fields).eq('id', id);

    const records = { ...get().records };
    const { tdee, snapshots } = get();
    for (const [date, record] of Object.entries(records)) {
      const idx = record.entries.findIndex((e) => e.id === id);
      if (idx !== -1) {
        const entries = record.entries.map((e) =>
          e.id === id ? { ...e, ...fields } : e
        );
        records[date] = calcRecord(entries, tdee, snapshots[date] ?? null);
        break;
      }
    }
    set({ records });
  },

  updateEntryCategory: async (id: string, category: MealCategory) => {
    await supabase.from('entries').update({ meal_category: category }).eq('id', id);

    const records = { ...get().records };
    const { tdee, snapshots } = get();
    for (const [date, record] of Object.entries(records)) {
      const idx = record.entries.findIndex((e) => e.id === id);
      if (idx !== -1) {
        const entries = record.entries.map((e) =>
          e.id === id ? { ...e, meal_category: category } : e
        );
        records[date] = calcRecord(entries, tdee, snapshots[date] ?? null);
        break;
      }
    }
    set({ records });
  },
}));
