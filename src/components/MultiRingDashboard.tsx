import { useState } from 'react';
import { useDefitStore, WORKOUT_GOAL } from '../store/useDefitStore';
import { useProfile } from '../context/ProfileContext';
import type { DayRecord } from '../types';

const CENTER = 110;
const SIZE = CENTER * 2;

const RINGS = [
  { radius: 88, stroke: 14 },
  { radius: 68, stroke: 12 },
  { radius: 50, stroke: 10 },
];

function arc(radius: number, stroke: number, ratio: number) {
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.max(0, Math.min(1, ratio)));
  return { circumference, offset };
}

interface Props {
  record: DayRecord;
  date: string;
}

export default function MultiRingDashboard({ record, date }: Props) {
  const { tdee } = useDefitStore();
  const { profile } = useProfile();
  const { foodKcal, workoutKcal, deficit, entries } = record;

  const [selectedMacroGoal, setSelectedMacroGoal] = useState<'min' | 'max'>('min');

  const d = new Date();
  const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const isToday = date === today;

  const effectiveTDEE = (!isToday && record.tdeeSnapshot != null) ? record.tdeeSnapshot : tdee;
  const targetDeficit = profile?.target_deficit ?? 0;
  const minDeficitTarget = (!isToday && record.minDeficitSnapshot != null)
    ? record.minDeficitSnapshot
    : (profile?.min_deficit_target ?? targetDeficit);
  const maxDeficitTarget = (!isToday && record.maxDeficitSnapshot != null)
    ? record.maxDeficitSnapshot
    : (profile?.max_deficit_target ?? targetDeficit);
  const dailyAllowance = effectiveTDEE - targetDeficit;

  const liveDeficit = isToday
    ? effectiveTDEE + workoutKcal - foodKcal
    : deficit;

  const totalCarbs = entries.filter((e) => e.type === 'food').reduce((s, e) => s + e.carbs, 0);
  const totalProtein = entries.filter((e) => e.type === 'food').reduce((s, e) => s + e.protein, 0);
  const totalFat = entries.filter((e) => e.type === 'food').reduce((s, e) => s + e.fat, 0);

  const targetBudget = selectedMacroGoal === 'min'
    ? (effectiveTDEE + workoutKcal) - minDeficitTarget
    : (effectiveTDEE + workoutKcal) - maxDeficitTarget;

  const targetCarbsG = Math.round((targetBudget * 0.40) / 4);
  const targetProteinG = Math.round((targetBudget * 0.30) / 4);
  const targetFatG = Math.round((targetBudget * 0.30) / 9);

  const budget = effectiveTDEE + workoutKcal;
  const deficitRatio = budget > 0 ? Math.max(0, liveDeficit / budget) : 1;
  const foodRatio = dailyAllowance > 0 ? foodKcal / dailyAllowance : 0;
  const workoutRatio = workoutKcal / WORKOUT_GOAL;

  const isSurplus = liveDeficit < 0;
  const isOnTarget = !isSurplus && liveDeficit >= targetDeficit * 0.8;
  const isLowDeficit = !isSurplus && !isOnTarget;

  const deficitColor = isSurplus ? '#ef4444' : isOnTarget ? '#10b981' : '#f59e0b';
  const deficitTrack = isSurplus ? '#7f1d1d' : isOnTarget ? '#064e3b' : '#78350f';

  const foodOverMax = foodKcal > dailyAllowance;
  const foodColor = foodOverMax ? '#ef4444' : '#f97316';
  const foodTrack = '#431407';

  const workoutColor = '#0ea5e9';
  const workoutTrack = '#0c4a6e';

  const deficitArc = arc(RINGS[0].radius, RINGS[0].stroke, deficitRatio);
  const foodArc = arc(RINGS[1].radius, RINGS[1].stroke, Math.min(foodRatio, 1));
  const workoutArcData = arc(RINGS[2].radius, RINGS[2].stroke, Math.min(workoutRatio, 1));

  const formattedDate = new Intl.DateTimeFormat('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(date + 'T12:00:00'));

  const label = isToday ? 'Oggi' : formattedDate;

  void isLowDeficit;

  const isSurplusEmoji = liveDeficit < 0;
  const isOnRangeTarget = !isSurplusEmoji && liveDeficit >= minDeficitTarget && liveDeficit <= maxDeficitTarget;
  const emojiChar = isSurplusEmoji ? '❌' : isOnRangeTarget ? '🏆' : null;
  const emojiTitle = isSurplusEmoji ? 'Surplus calorico!' : isOnRangeTarget ? 'Obiettivo raggiunto!' : undefined;

  const hasMacroTargets = minDeficitTarget > 0 || maxDeficitTarget > 0;

  return (
    <section className="relative flex flex-col items-center pt-6 pb-4 px-4">
      <p className="text-[11px] font-medium uppercase tracking-widest text-zinc-500 mb-5 capitalize">
        {label}
      </p>

      <div className="relative">
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="-rotate-90"
        >
          <circle cx={CENTER} cy={CENTER} r={RINGS[0].radius} fill="none" strokeWidth={RINGS[0].stroke} stroke={deficitTrack} />
          <circle
            cx={CENTER} cy={CENTER} r={RINGS[0].radius}
            fill="none" strokeWidth={RINGS[0].stroke}
            strokeLinecap="round"
            strokeDasharray={deficitArc.circumference}
            strokeDashoffset={deficitArc.offset}
            stroke={deficitColor}
            style={{ transition: 'stroke-dashoffset 0.7s cubic-bezier(0.4,0,0.2,1), stroke 0.3s' }}
          />

          <circle cx={CENTER} cy={CENTER} r={RINGS[1].radius} fill="none" strokeWidth={RINGS[1].stroke} stroke={foodTrack} />
          <circle
            cx={CENTER} cy={CENTER} r={RINGS[1].radius}
            fill="none" strokeWidth={RINGS[1].stroke}
            strokeLinecap="round"
            strokeDasharray={foodArc.circumference}
            strokeDashoffset={foodArc.offset}
            stroke={foodColor}
            style={{ transition: 'stroke-dashoffset 0.7s cubic-bezier(0.4,0,0.2,1)' }}
          />

          <circle cx={CENTER} cy={CENTER} r={RINGS[2].radius} fill="none" strokeWidth={RINGS[2].stroke} stroke={workoutTrack} />
          <circle
            cx={CENTER} cy={CENTER} r={RINGS[2].radius}
            fill="none" strokeWidth={RINGS[2].stroke}
            strokeLinecap="round"
            strokeDasharray={workoutArcData.circumference}
            strokeDashoffset={workoutArcData.offset}
            stroke={workoutColor}
            style={{ transition: 'stroke-dashoffset 0.7s cubic-bezier(0.4,0,0.2,1)' }}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
            Deficit
          </span>
          <span
            className="text-3xl font-bold tabular-nums leading-none"
            style={{ color: deficitColor, transition: 'color 0.3s' }}
          >
            {liveDeficit < 0 ? '-' : ''}{Math.abs(liveDeficit)}
          </span>
          <span className="text-[10px] text-zinc-600">kcal</span>
        </div>
      </div>

      <div className="flex items-center gap-6 mt-5">
        <RingStat color="#10b981" label="TDEE" value={effectiveTDEE} unit="kcal" />
        <div className="w-px h-8 bg-white/[0.08]" />
        <RingStat color={foodColor} label="Cibo" value={foodKcal} unit="kcal" />
        <div className="w-px h-8 bg-white/[0.08]" />
        <RingStat color={workoutColor} label="Workout" value={workoutKcal} unit="kcal" />
        {emojiChar && (
          <>
            <div className="w-px h-8 bg-white/[0.08]" />
            <span
              className="text-xl leading-none"
              title={emojiTitle}
            >
              {emojiChar}
            </span>
          </>
        )}
      </div>

      <div className="mt-3 rounded-2xl bg-white/[0.03] border border-white/[0.05] w-full max-w-xs overflow-hidden">
        {hasMacroTargets && (() => {
          const kcalOverBudget = foodKcal > targetBudget;
          const kcalFillPct = targetBudget > 0 ? Math.min(100, (foodKcal / targetBudget) * 100) : 0;
          const kcalBarColor = kcalOverBudget ? '#ef4444' : '#f97316';
          const kcalTextColor = kcalOverBudget ? '#ef4444' : '#f97316';
          return (
            <div className="px-3 pt-3 pb-1">
              <div className="flex items-baseline justify-between mb-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Kcal</span>
                <span
                  className="text-[11px] font-bold tabular-nums"
                  style={{ color: kcalTextColor, transition: 'color 0.2s' }}
                >
                  {foodKcal} / {targetBudget}
                  <span className="text-[9px] font-normal ml-0.5 text-zinc-500">kcal</span>
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/[0.07] overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${kcalFillPct}%`,
                    backgroundColor: kcalBarColor,
                    transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1), background-color 0.2s',
                  }}
                />
              </div>
            </div>
          );
        })()}
        {hasMacroTargets && (
          <div className="flex items-center m-2 mb-0 rounded-xl bg-white/[0.05] p-0.5">
            <button
              onClick={() => setSelectedMacroGoal('min')}
              className="flex-1 py-1 text-[11px] font-semibold rounded-lg transition-all duration-200"
              style={
                selectedMacroGoal === 'min'
                  ? { background: 'rgba(255,255,255,0.10)', color: '#f8fafc' }
                  : { color: '#71717a' }
              }
            >
              Target Minimo
            </button>
            <button
              onClick={() => setSelectedMacroGoal('max')}
              className="flex-1 py-1 text-[11px] font-semibold rounded-lg transition-all duration-200"
              style={
                selectedMacroGoal === 'max'
                  ? { background: 'rgba(255,255,255,0.10)', color: '#f8fafc' }
                  : { color: '#71717a' }
              }
            >
              Target Massimo
            </button>
          </div>
        )}

        <div className="flex items-stretch gap-0 px-2 py-2.5">
          <MacroStat
            label="Carb"
            consumed={totalCarbs}
            target={hasMacroTargets ? targetCarbsG : null}
            color="#38bdf8"
          />
          <div className="w-px bg-white/[0.07] mx-1 self-stretch" />
          <MacroStat
            label="Prot"
            consumed={totalProtein}
            target={hasMacroTargets ? targetProteinG : null}
            color="#fbbf24"
          />
          <div className="w-px bg-white/[0.07] mx-1 self-stretch" />
          <MacroStat
            label="Grassi"
            consumed={totalFat}
            target={hasMacroTargets ? targetFatG : null}
            color="#f472b6"
          />
        </div>
      </div>

      <div className="flex items-center gap-4 mt-3">
        <Legend color={deficitColor} label="Deficit" />
        <Legend color={foodColor} label="Cibo" />
        <Legend color={workoutColor} label="Allenamento" />
      </div>
    </section>
  );
}

function RingStat({ color, label, value, unit }: { color: string; label: string; value: number; unit: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{label}</span>
      <span className="text-base font-bold tabular-nums" style={{ color }}>{value}</span>
      <span className="text-[10px] text-zinc-600">{unit}</span>
    </div>
  );
}

interface MacroStatProps {
  label: string;
  consumed: number;
  target: number | null;
  color: string;
}

function MacroStat({ label, consumed, target, color }: MacroStatProps) {
  const exceeded = target !== null && consumed > target;
  const displayColor = exceeded ? '#ef4444' : color;
  const fillPct = target !== null && target > 0
    ? Math.min(100, (consumed / target) * 100)
    : null;

  return (
    <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{label}</span>
      {target !== null ? (
        <span
          className="text-[11px] font-bold tabular-nums leading-none"
          style={{ color: displayColor, transition: 'color 0.2s' }}
        >
          {consumed} / {target}
          <span className="text-[9px] font-normal ml-0.5">g</span>
        </span>
      ) : (
        <span className="text-sm font-bold tabular-nums" style={{ color }}>{consumed}g</span>
      )}
      {fillPct !== null && (
        <div className="w-full h-1.5 rounded-full bg-white/[0.07] overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: `${fillPct}%`,
              backgroundColor: displayColor,
              transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1), background-color 0.2s',
            }}
          />
        </div>
      )}
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-[10px] text-zinc-500">{label}</span>
    </div>
  );
}
