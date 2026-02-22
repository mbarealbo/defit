import { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Check, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useProfile } from '../context/ProfileContext';
import { useDefitStore } from '../store/useDefitStore';
import type { MeasurementFormData, MeasurementKey, Measurement } from '../types/measurements';
import { MEASUREMENT_LABELS, MEASUREMENT_UNITS } from '../types/measurements';

interface Step {
  key: MeasurementKey;
  question: string;
  hint?: string;
  min: number;
  max: number;
  step: number;
}

const STEPS: Step[] = [
  { key: 'peso', question: 'Qual è il tuo Peso attuale?', hint: 'Peso corporeo', min: 20, max: 300, step: 0.1 },
  { key: 'petto', question: 'Circonferenza Petto', hint: 'Misura sotto le ascelle', min: 40, max: 200, step: 0.5 },
  { key: 'vita', question: 'Circonferenza Girovita / Addome', hint: "Misura all'altezza dell'ombelico", min: 40, max: 200, step: 0.5 },
  { key: 'fianchi', question: 'Circonferenza Fianchi', hint: 'Misura il punto più largo', min: 40, max: 200, step: 0.5 },
  { key: 'cosce', question: 'Circonferenza Cosce', hint: 'Misura la coscia più grande', min: 20, max: 120, step: 0.5 },
  { key: 'braccia', question: 'Circonferenza Braccia', hint: 'Misura il bicipite contratto', min: 10, max: 80, step: 0.5 },
];

interface Props {
  onClose: () => void;
  onSaved: (toast?: string) => void;
  latestMeasurement?: Measurement | null;
}

export default function MeasurementWizard({ onClose, onSaved, latestMeasurement }: Props) {
  const { profile } = useProfile();
  const { updateWeight } = useProfile();
  const { setTDEE } = useDefitStore();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<MeasurementFormData>(() => ({
    peso: latestMeasurement?.peso ?? profile?.weight_kg ?? null,
    petto: latestMeasurement?.petto ?? null,
    vita: latestMeasurement?.vita ?? null,
    fianchi: latestMeasurement?.fianchi ?? null,
    cosce: latestMeasurement?.cosce ?? null,
    braccia: latestMeasurement?.braccia ?? null,
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  function handleNext() {
    if (!isLast) { setStep((s) => s + 1); return; }
    handleSave();
  }

  function handleSkip() {
    if (!isLast) { setStep((s) => s + 1); return; }
    handleSave();
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError('Non autenticato'); setSaving(false); return; }

    const today = new Date().toISOString().slice(0, 10);
    const { error: err } = await supabase.from('measurements').insert({
      user_id: user.id,
      date: today,
      peso: form.peso,
      petto: form.petto,
      vita: form.vita,
      fianchi: form.fianchi,
      cosce: form.cosce,
      braccia: form.braccia,
    });

    if (err) { setError(err.message); setSaving(false); return; }

    let toastMessage: string | undefined;

    if (form.peso !== null) {
      const { error: weightErr, newTDEE } = await updateWeight(form.peso);
      if (!weightErr && newTDEE !== null) {
        setTDEE(newTDEE);
        toastMessage = `Peso aggiornato. Nuovo TDEE calcolato: ${newTDEE} kcal`;
      }
    }

    setSaving(false);
    onSaved(toastMessage);
  }

  const currentValue = form[current.key];

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/90 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <div className="w-full max-w-sm bg-zinc-900 border border-white/[0.08] rounded-3xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-2">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all duration-300 ${
                  i < step ? 'w-5 bg-emerald-500' : i === step ? 'w-5 bg-emerald-400' : 'w-2 bg-white/[0.1]'
                }`}
              />
            ))}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/[0.06] hover:bg-white/[0.10] flex items-center justify-center text-zinc-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 pb-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
            Passo {step + 1} di {STEPS.length}
          </p>
          <h2 className="text-xl font-bold text-white mt-1">{current.question}</h2>
          {current.hint && (
            <p className="text-xs text-zinc-500 mt-1">{current.hint}</p>
          )}
        </div>

        <div className="px-5 py-4">
          <NumberInput
            value={currentValue}
            unit={MEASUREMENT_UNITS[current.key]}
            stepSize={current.step}
            min={current.min}
            max={current.max}
            placeholder={`es. ${current.key === 'peso' ? '75.0' : '90.0'}`}
            onChange={(v) => setForm((f) => ({ ...f, [current.key]: v }))}
          />
        </div>

        {error && (
          <p className="text-xs text-red-400 text-center px-5 pb-2">{error}</p>
        )}

        <div className="flex items-center gap-2.5 px-5 pb-5">
          {step > 0 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="flex items-center gap-1.5 px-4 py-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.09] text-zinc-300 text-sm font-medium transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Indietro
            </button>
          )}

          {currentValue === null && !isLast && (
            <button
              onClick={handleSkip}
              className="px-4 py-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.07] text-zinc-500 text-sm font-medium transition-colors"
            >
              Salta
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
                Salva Misurazione
              </>
            ) : (
              <>
                Avanti
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function NumberInput({
  value, unit, min, max, stepSize, placeholder, onChange,
}: {
  value: number | null;
  unit: string;
  min: number;
  max: number;
  stepSize: number;
  placeholder: string;
  onChange: (v: number | null) => void;
}) {
  const [raw, setRaw] = useState(value !== null ? String(value) : '');

  useEffect(() => {
    if (value === null) { setRaw(''); return; }
    setRaw(String(value));
  }, [value]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const str = e.target.value;
    setRaw(str);
    if (str === '' || str === '-') { onChange(null); return; }
    const normalized = str.replace(',', '.');
    if (normalized.endsWith('.')) return;
    const n = parseFloat(normalized);
    if (!isNaN(n)) onChange(n);
  }

  function handleBlur() {
    const normalized = raw.replace(',', '.');
    if (normalized === '' || normalized === '-') { onChange(null); setRaw(''); return; }
    const n = parseFloat(normalized);
    if (isNaN(n)) { onChange(null); setRaw(''); return; }
    const clamped = Math.min(max, Math.max(min, n));
    onChange(clamped);
    setRaw(String(clamped));
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => {
          const cur = value ?? min;
          const next = Math.max(min, parseFloat((cur - stepSize).toFixed(2)));
          onChange(next);
        }}
        className="w-12 h-12 rounded-xl bg-white/[0.06] hover:bg-white/[0.10] text-zinc-300 text-xl font-medium transition-colors flex-shrink-0 flex items-center justify-center select-none"
      >
        −
      </button>
      <div className="flex-1 relative">
        <input
          type="number"
          inputMode="decimal"
          value={raw}
          placeholder={placeholder}
          onChange={handleChange}
          onBlur={handleBlur}
          className="w-full bg-zinc-800 border border-white/[0.08] rounded-xl px-4 py-3.5 text-center text-xl font-bold text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500 pointer-events-none">{unit}</span>
      </div>
      <button
        type="button"
        onClick={() => {
          const cur = value ?? min;
          const next = Math.min(max, parseFloat((cur + stepSize).toFixed(2)));
          onChange(next);
        }}
        className="w-12 h-12 rounded-xl bg-white/[0.06] hover:bg-white/[0.10] text-zinc-300 text-xl font-medium transition-colors flex-shrink-0 flex items-center justify-center select-none"
      >
        +
      </button>
    </div>
  );
}

export { MEASUREMENT_LABELS };
