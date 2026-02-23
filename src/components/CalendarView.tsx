import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useDefitStore } from '../store/useDefitStore';
import MultiRingDashboard from './MultiRingDashboard';
import Timeline from './Timeline';

const MONTH_NAMES = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
];

const DAY_NAMES = ['Lu', 'Ma', 'Me', 'Gi', 'Ve', 'Sa', 'Do'];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function CalendarView() {
  const today = todayStr();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [detailDate, setDetailDate] = useState<string | null>(null);

  const { records, fetchMonth, calendarLoading, setSelectedDate, tdee } = useDefitStore();

  useEffect(() => {
    fetchMonth(year, month);
  }, [year, month, fetchMonth]);

  function prevMonth() {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  }

  function nextMonth() {
    const todayDate = new Date();
    if (year > todayDate.getFullYear() || (year === todayDate.getFullYear() && month >= todayDate.getMonth() + 1)) return;
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  }

  const todayDate = new Date();
  const isCurrentMonth = year === todayDate.getFullYear() && month === todayDate.getMonth() + 1;
  const isFutureMonth = year > todayDate.getFullYear() || (year === todayDate.getFullYear() && month > todayDate.getMonth() + 1);

  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const daysInMonth = lastDay.getDate();
  let startDow = firstDay.getDay();
  if (startDow === 0) startDow = 7;
  const blanks = startDow - 1;

  function handleDayClick(d: number) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    if (dateStr > today) return;
    setDetailDate(dateStr);
    setSelectedDate(dateStr);
  }

  if (detailDate) {
    const record = records[detailDate] ?? { entries: [], foodKcal: 0, workoutKcal: 0, deficit: tdee };
    return (
      <div className="flex flex-col min-h-full">
        <div className="flex items-center gap-3 px-4 pt-4 pb-2">
          <button
            onClick={() => setDetailDate(null)}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Calendario
          </button>
        </div>
        <MultiRingDashboard record={record} date={detailDate} />
        <div className="h-px bg-white/[0.06] mx-4" />
        <Timeline date={detailDate} readOnly />
      </div>
    );
  }

  return (
    <div className="flex flex-col pb-24">
      <div className="flex items-center justify-between px-4 pt-5 pb-4">
        <button
          onClick={prevMonth}
          className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-white/[0.06] transition-colors text-zinc-400 hover:text-white"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white">{MONTH_NAMES[month - 1]} {year}</span>
          {calendarLoading && <Loader2 className="w-3.5 h-3.5 text-zinc-500 animate-spin" />}
        </div>
        <button
          onClick={nextMonth}
          disabled={isCurrentMonth || isFutureMonth}
          className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
            isCurrentMonth || isFutureMonth
              ? 'text-zinc-700 cursor-default'
              : 'text-zinc-400 hover:text-white hover:bg-white/[0.06]'
          }`}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="px-4">
        <div className="grid grid-cols-7 mb-2">
          {DAY_NAMES.map((d) => (
            <div key={d} className="text-center text-[10px] font-semibold uppercase tracking-wider text-zinc-600 py-1">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-y-1">
          {Array.from({ length: blanks }).map((_, i) => (
            <div key={`b-${i}`} />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const d = i + 1;
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const isFuture = dateStr > today;
            const isToday = dateStr === today;
            const rec = records[dateStr];
            const hasData = !!rec && rec.entries.length > 0;
            const deficit = rec?.deficit ?? tdee;
            const isSurplus = deficit < 0;
            const isLow = deficit >= 0 && deficit < 300;

            let dotColor = '#10b981';
            if (isSurplus) dotColor = '#ef4444';
            else if (isLow) dotColor = '#f59e0b';

            return (
              <button
                key={d}
                onClick={() => handleDayClick(d)}
                disabled={isFuture}
                className={`
                  relative flex flex-col items-center justify-center aspect-square rounded-xl transition-all duration-150
                  ${isFuture ? 'opacity-20 cursor-default' : 'hover:bg-white/[0.06] cursor-pointer active:scale-95'}
                  ${isToday ? 'bg-white/[0.08] ring-1 ring-white/20' : ''}
                `}
              >
                <span className={`text-sm font-medium tabular-nums leading-none ${
                  isToday ? 'text-white font-semibold' : isFuture ? 'text-zinc-600' : 'text-zinc-300'
                }`}>
                  {d}
                </span>
                {hasData && (
                  <div
                    className="w-1.5 h-1.5 rounded-full mt-1"
                    style={{ backgroundColor: dotColor }}
                  />
                )}
                {!hasData && !isFuture && (
                  <div className="w-1.5 h-1.5 mt-1" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6 px-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-600 mb-3">Legenda</p>
        <div className="flex items-center gap-5">
          <LegendItem color="#10b981" label="Deficit buono" />
          <LegendItem color="#f59e0b" label="Deficit basso" />
          <LegendItem color="#ef4444" label="Surplus" />
        </div>
      </div>

      <MonthSummary year={year} month={month} daysInMonth={daysInMonth} today={today} />
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-[11px] text-zinc-500">{label}</span>
    </div>
  );
}

function MonthSummary({ year, month, daysInMonth, today }: { year: number; month: number; daysInMonth: number; today: string }) {
  const { records, tdee } = useDefitStore();

  let totalFood = 0;
  let totalWorkout = 0;
  let daysTracked = 0;

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    if (dateStr > today) continue;
    const rec = records[dateStr];
    if (rec && rec.entries.length > 0) {
      totalFood += rec.foodKcal;
      totalWorkout += rec.workoutKcal;
      daysTracked++;
    }
  }

  if (daysTracked === 0) return null;

  const avgDeficit = daysTracked > 0
    ? Math.round((tdee * daysTracked + totalWorkout - totalFood) / daysTracked)
    : 0;

  return (
    <div className="mx-4 mt-4 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600 mb-3">Riepilogo mese</p>
      <div className="grid grid-cols-3 gap-4">
        <SummaryStat label="Giorni" value={String(daysTracked)} />
        <SummaryStat label="Deficit medio" value={String(avgDeficit)} unit="kcal" />
        <SummaryStat label="Workout tot." value={String(totalWorkout)} unit="kcal" />
      </div>
    </div>
  );
}

function SummaryStat({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-[10px] text-zinc-600 text-center leading-tight">{label}</span>
      <span className="text-base font-bold text-white tabular-nums">{value}</span>
      {unit && <span className="text-[10px] text-zinc-600">{unit}</span>}
    </div>
  );
}
