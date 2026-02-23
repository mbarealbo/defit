import { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Zap, User, Activity, Target, Check } from 'lucide-react';
import { useProfile } from '../context/ProfileContext';
import { ACTIVITY_OPTIONS, calcBMR, calcTDEE } from '../types/profile';
import type { Sex, ProfileFormData } from '../types/profile';

const STEPS = ['Sesso & Eta', 'Corpo', 'Stile di Vita', 'Obiettivo'];

const defaultForm: ProfileFormData = {
  sex: 'uomo',
  age: 25,
  weight_kg: 75,
  height_cm: 175,
  activity_multiplier: 1.375,
  target_deficit: 500,
  min_deficit_target: 500,
  max_deficit_target: 1000,
};

interface Props {
  onComplete?: () => void;
  initialData?: Partial<ProfileFormData>;
}

export default function OnboardingWizard({ onComplete, initialData }: Props) {
  const { saveProfile } = useProfile();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<ProfileFormData>({ ...defaultForm, ...initialData });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isFirst = step === 0;
  const isLast = step === STEPS.length - 1;

  function update<K extends keyof ProfileFormData>(key: K, value: ProfileFormData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleNext() {
    if (!isLast) {
      setStep((s) => s + 1);
      return;
    }
    setSaving(true);
    setError(null);
    const { error } = await saveProfile(form);
    setSaving(false);
    if (error) {
      setError(error);
      return;
    }
    onComplete?.();
  }

  const previewBMR = calcBMR(form.sex, form.weight_kg, form.height_cm, form.age);
  const previewTDEE = calcTDEE(previewBMR, form.activity_multiplier);

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      <div className="flex-1 flex flex-col max-w-lg mx-auto w-full px-5 pt-10 pb-6">
        <div className="flex flex-col items-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Zap className="w-5 h-5 text-emerald-400" />
          </div>
          <h1 className="text-xl font-bold">Configura il tuo profilo</h1>
          <p className="text-sm text-zinc-500 text-center">
            Calcoliamo il tuo fabbisogno calorico preciso con la formula Mifflin-St Jeor
          </p>
        </div>

        <StepIndicator current={step} total={STEPS.length} labels={STEPS} />

        <div className="flex-1 mt-8">
          {step === 0 && (
            <StepSexAge form={form} update={update} />
          )}
          {step === 1 && (
            <StepBody form={form} update={update} />
          )}
          {step === 2 && (
            <StepActivity form={form} update={update} />
          )}
          {step === 3 && (
            <StepGoal
              form={form}
              update={update}
              previewTDEE={previewTDEE}
              previewBMR={previewBMR}
            />
          )}
        </div>

        {error && (
          <p className="text-sm text-red-400 text-center mt-4">{error}</p>
        )}

        <div className="flex items-center gap-3 mt-8">
          {!isFirst && (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="flex items-center gap-1.5 px-4 py-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.09] text-zinc-300 text-sm font-medium transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Indietro
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black text-sm font-semibold transition-colors"
          >
            {saving ? 'Salvataggio...' : isLast ? (
              <>
                <Check className="w-4 h-4" />
                Salva e inizia
              </>
            ) : (
              <>
                Continua
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function StepIndicator({ current, total, labels }: { current: number; total: number; labels: string[] }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
          <div
            className={`h-1 w-full rounded-full transition-all duration-300 ${
              i <= current ? 'bg-emerald-500' : 'bg-white/[0.1]'
            }`}
          />
        </div>
      ))}
    </div>
  );
}

function StepSexAge({ form, update }: { form: ProfileFormData; update: <K extends keyof ProfileFormData>(k: K, v: ProfileFormData[K]) => void }) {
  return (
    <div className="space-y-6">
      <SectionHeader icon={<User className="w-4 h-4" />} title="Sesso & Eta" />

      <div className="space-y-2">
        <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Sesso</label>
        <div className="grid grid-cols-2 gap-3">
          {(['uomo', 'donna'] as Sex[]).map((s) => (
            <button
              key={s}
              onClick={() => update('sex', s)}
              className={`py-3.5 rounded-xl text-sm font-semibold capitalize transition-all border ${
                form.sex === s
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                  : 'bg-white/[0.04] border-white/[0.08] text-zinc-400 hover:border-white/[0.15]'
              }`}
            >
              {s === 'uomo' ? 'Uomo' : 'Donna'}
            </button>
          ))}
        </div>
      </div>

      <NumberField
        label="Eta"
        value={form.age}
        unit="anni"
        min={10}
        max={100}
        onChange={(v) => update('age', v)}
      />
    </div>
  );
}

function StepBody({ form, update }: { form: ProfileFormData; update: <K extends keyof ProfileFormData>(k: K, v: ProfileFormData[K]) => void }) {
  return (
    <div className="space-y-6">
      <SectionHeader icon={<Activity className="w-4 h-4" />} title="Misure corporee" />
      <NumberField
        label="Peso"
        value={form.weight_kg}
        unit="kg"
        min={30}
        max={300}
        step={0.5}
        onChange={(v) => update('weight_kg', v)}
      />
      <NumberField
        label="Altezza"
        value={form.height_cm}
        unit="cm"
        min={100}
        max={250}
        onChange={(v) => update('height_cm', v)}
      />
    </div>
  );
}

function StepActivity({ form, update }: { form: ProfileFormData; update: <K extends keyof ProfileFormData>(k: K, v: ProfileFormData[K]) => void }) {
  return (
    <div className="space-y-4">
      <SectionHeader icon={<Activity className="w-4 h-4" />} title="Stile di Vita" />
      <p className="text-xs text-zinc-500">Seleziona il livello che meglio descrive la tua settimana tipo.</p>
      <div className="space-y-2.5">
        {ACTIVITY_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => update('activity_multiplier', opt.value)}
            className={`w-full text-left px-4 py-3.5 rounded-xl text-sm transition-all border ${
              form.activity_multiplier === opt.value
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-200'
                : 'bg-white/[0.03] border-white/[0.07] text-zinc-400 hover:border-white/[0.14]'
            }`}
          >
            <span className="leading-snug">{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function StepGoal({
  form, update, previewTDEE, previewBMR,
}: {
  form: ProfileFormData;
  update: <K extends keyof ProfileFormData>(k: K, v: ProfileFormData[K]) => void;
  previewTDEE: number;
  previewBMR: number;
}) {
  return (
    <div className="space-y-5">
      <SectionHeader icon={<Target className="w-4 h-4" />} title="Obiettivo Deficit" />

      <div className="grid grid-cols-2 gap-2.5 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
        <CalcStat label="BMR" value={previewBMR} unit="kcal" color="#10b981" />
        <CalcStat label="TDEE" value={previewTDEE} unit="kcal" color="#0ea5e9" />
        <CalcStat label="Deficit Minimo" value={form.min_deficit_target} unit="kcal" color="#f59e0b" />
        <CalcStat label="Deficit Massimo" value={form.max_deficit_target} unit="kcal" color="#f472b6" />
      </div>

      <div className="space-y-4">
        <NumberField
          label="Deficit Minimo"
          value={form.min_deficit_target}
          unit="kcal"
          min={0}
          max={form.max_deficit_target}
          step={50}
          onChange={(v) => update('min_deficit_target', v)}
        />
        <NumberField
          label="Deficit Massimo"
          value={form.max_deficit_target}
          unit="kcal"
          min={form.min_deficit_target}
          max={3000}
          step={50}
          onChange={(v) => update('max_deficit_target', v)}
        />
      </div>
    </div>
  );
}

function CalcStat({ label, value, unit, color }: { label: string; value: number; unit: string; color: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">{label}</span>
      <span className="text-lg font-bold tabular-nums" style={{ color }}>{value}</span>
      <span className="text-[10px] text-zinc-600">{unit}</span>
    </div>
  );
}

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 text-zinc-300">
      <span className="text-emerald-400">{icon}</span>
      <h2 className="text-base font-semibold">{title}</h2>
    </div>
  );
}

function NumberField({
  label, value, unit, min, max, step = 1, onChange,
}: {
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
}) {
  const [raw, setRaw] = useState(String(value));

  useEffect(() => {
    setRaw(String(value));
  }, [value]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setRaw(e.target.value);
    const n = parseFloat(e.target.value);
    if (!isNaN(n)) onChange(Math.min(max, Math.max(min, n)));
  }

  function handleBlur() {
    const n = parseFloat(raw);
    const clamped = isNaN(n) ? min : Math.min(max, Math.max(min, n));
    onChange(clamped);
    setRaw(String(clamped));
  }

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">{label}</label>
      <div className="flex items-center gap-3">
        <button
          onClick={() => onChange(Math.max(min, value - step))}
          className="w-10 h-10 rounded-xl bg-white/[0.06] hover:bg-white/[0.10] text-zinc-300 text-lg font-medium transition-colors flex-shrink-0 flex items-center justify-center"
        >
          −
        </button>
        <div className="flex-1 relative">
          <input
            type="number"
            value={raw}
            min={min}
            max={max}
            step={step}
            onChange={handleChange}
            onBlur={handleBlur}
            className="w-full bg-zinc-900 border border-white/[0.08] rounded-xl px-4 py-3 text-center text-base font-bold focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500">{unit}</span>
        </div>
        <button
          onClick={() => onChange(Math.min(max, value + step))}
          className="w-10 h-10 rounded-xl bg-white/[0.06] hover:bg-white/[0.10] text-zinc-300 text-lg font-medium transition-colors flex-shrink-0 flex items-center justify-center"
        >
          +
        </button>
      </div>
    </div>
  );
}
