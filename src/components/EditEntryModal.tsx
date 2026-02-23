import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { X, Save, Sparkles, Send, RotateCcw } from 'lucide-react';
import { useDefitStore } from '../store/useDefitStore';
import { refineEntry } from '../lib/api';
import type { Entry } from '../types';

interface Props {
  entry: Entry;
  onClose: () => void;
}

interface FormState {
  name: string;
  kcal: string;
  carbs: string;
  protein: string;
  fat: string;
}

interface AiMessage {
  role: 'user' | 'ai';
  text: string;
}

function toForm(e: { name: string; kcal: number; carbs: number; protein: number; fat: number }): FormState {
  return {
    name: e.name,
    kcal: String(e.kcal),
    carbs: String(e.carbs),
    protein: String(e.protein),
    fat: String(e.fat),
  };
}

export default function EditEntryModal({ entry, onClose }: Props) {
  const updateEntry = useDefitStore((s) => s.updateEntry);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(toForm(entry));
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setForm(toForm(entry));
    setMessages([]);
    setAiInput('');
    setAiError(null);
  }, [entry.id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, aiLoading]);

  function handleChange(field: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleAiRefine() {
    const prompt = aiInput.trim();
    if (!prompt || aiLoading) return;

    setAiInput('');
    setAiError(null);
    setMessages((m) => [...m, { role: 'user', text: prompt }]);
    setAiLoading(true);

    try {
      const current = {
        name: form.name,
        kcal: parseInt(form.kcal) || 0,
        carbs: parseInt(form.carbs) || 0,
        protein: parseInt(form.protein) || 0,
        fat: parseInt(form.fat) || 0,
      };

      const refined = await refineEntry(current, prompt);

      setForm(toForm(refined));
      setMessages((m) => [
        ...m,
        { role: 'ai', text: `Aggiornato: ${refined.name} — ${refined.kcal} kcal (C: ${refined.carbs}g · P: ${refined.protein}g · G: ${refined.fat}g)` },
      ]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Errore sconosciuto';
      setAiError(msg);
      setMessages((m) => [...m, { role: 'ai', text: `Errore: ${msg}` }]);
    } finally {
      setAiLoading(false);
    }
  }

  function handleAiKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAiRefine();
    }
  }

  async function handleSave() {
    const kcal = Math.max(0, Math.round(Number(form.kcal) || 0));
    const carbs = Math.max(0, Math.round(Number(form.carbs) || 0));
    const protein = Math.max(0, Math.round(Number(form.protein) || 0));
    const fat = Math.max(0, Math.round(Number(form.fat) || 0));
    const name = form.name.trim() || entry.name;

    setSaving(true);
    try {
      await updateEntry(entry.id, { name, kcal, carbs, protein, fat });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    setForm(toForm(entry));
    setMessages([]);
    setAiError(null);
  }

  const hasChanges =
    form.name !== entry.name ||
    parseInt(form.kcal) !== entry.kcal ||
    parseInt(form.carbs) !== entry.carbs ||
    parseInt(form.protein) !== entry.protein ||
    parseInt(form.fat) !== entry.fat;

  return (
    <div
      className="fixed inset-0 flex items-end sm:items-center justify-center p-4 pb-safe"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 9999 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-sm rounded-3xl border border-white/[0.08] bg-zinc-900 shadow-2xl flex flex-col"
        style={{ animation: 'slideUp 0.2s cubic-bezier(0.4,0,0.2,1)', maxHeight: 'calc(100dvh - 2rem)', zIndex: 9999 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/[0.06] flex-shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-white">Modifica Pasto</h2>
            {hasChanges && (
              <button
                onClick={handleReset}
                className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors"
                title="Ripristina originale"
              >
                <RotateCcw className="w-3 h-3" />
                ripristina
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4 text-zinc-400" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1">
          {/* Manual fields */}
          <div className="px-5 pt-4 pb-3 space-y-3">
            <Field
              label="Descrizione Pasto"
              value={form.name}
              onChange={(v) => handleChange('name', v)}
              type="text"
              placeholder="es. Pasta al pomodoro"
            />
            <Field
              label="Calorie"
              value={form.kcal}
              onChange={(v) => handleChange('kcal', v)}
              type="number"
              placeholder="0"
              unit="kcal"
            />
            <div className="grid grid-cols-3 gap-2">
              <Field
                label="Carboidrati"
                value={form.carbs}
                onChange={(v) => handleChange('carbs', v)}
                type="number"
                placeholder="0"
                unit="g"
                accent="#38bdf8"
              />
              <Field
                label="Proteine"
                value={form.protein}
                onChange={(v) => handleChange('protein', v)}
                type="number"
                placeholder="0"
                unit="g"
                accent="#fbbf24"
              />
              <Field
                label="Grassi"
                value={form.fat}
                onChange={(v) => handleChange('fat', v)}
                type="number"
                placeholder="0"
                unit="g"
                accent="#f472b6"
              />
            </div>
          </div>

          {/* Divider */}
          <div className="mx-5 border-t border-white/[0.06]" />

          {/* AI section */}
          <div className="px-5 pt-3 pb-4">
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-400/80">
                Affina con AI
              </span>
            </div>

            {/* Chat log */}
            {messages.length > 0 && (
              <div className="mb-2 space-y-2 max-h-32 overflow-y-auto">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`text-xs leading-relaxed rounded-xl px-3 py-2 ${
                      msg.role === 'user'
                        ? 'bg-white/[0.06] text-zinc-300 ml-4'
                        : msg.text.startsWith('Errore')
                        ? 'bg-red-500/10 text-red-400 mr-4'
                        : 'bg-amber-500/10 text-amber-300 mr-4'
                    }`}
                  >
                    {msg.text}
                  </div>
                ))}
                {aiLoading && (
                  <div className="bg-amber-500/10 rounded-xl px-3 py-2 mr-4 flex items-center gap-2">
                    <span className="w-3 h-3 border border-amber-400/40 border-t-amber-400 rounded-full animate-spin flex-shrink-0" />
                    <span className="text-xs text-amber-400/60">Calcolo in corso...</span>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            )}

            {/* AI input */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                onKeyDown={handleAiKeyDown}
                placeholder="Es: Aggiungi un cucchiaio d'olio..."
                disabled={aiLoading}
                className="flex-1 bg-white/[0.04] border border-white/[0.07] rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500/30 transition-colors disabled:opacity-40"
              />
              <button
                onClick={handleAiRefine}
                disabled={aiLoading || !aiInput.trim()}
                className="w-8 h-8 rounded-xl flex items-center justify-center transition-all flex-shrink-0 disabled:opacity-30"
                style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.15)' }}
                title="Invia"
              >
                {aiLoading ? (
                  <span className="w-3.5 h-3.5 border border-amber-400/40 border-t-amber-400 rounded-full animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5 text-amber-400" />
                )}
              </button>
            </div>
            {aiError && (
              <p className="mt-1.5 text-[10px] text-red-400">{aiError}</p>
            )}
          </div>
        </div>

        {/* Footer buttons */}
        <div className="flex gap-2 px-5 pt-3 border-t border-white/[0.06] flex-shrink-0" style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom, 1.25rem))' }}>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-2xl text-sm font-semibold text-zinc-400 bg-white/[0.05] hover:bg-white/[0.08] transition-colors"
          >
            Annulla
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 rounded-2xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-colors"
            style={{ background: saving ? '#78350f' : '#f97316' }}
          >
            {saving ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                Salva Modifiche
              </>
            )}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type: 'text' | 'number';
  placeholder?: string;
  unit?: string;
  accent?: string;
}

function Field({ label, value, onChange, type, placeholder, unit, accent }: FieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: accent ?? '#71717a' }}>
        {label}
      </label>
      <div className="relative flex items-center">
        <input
          type="text"
          inputMode={type === 'number' ? 'numeric' : 'text'}
          pattern={type === 'number' ? '[0-9]*' : undefined}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-white/20 transition-colors"
          style={unit ? { paddingRight: unit.length > 2 ? '3rem' : '2.2rem' } : undefined}
        />
        {unit && (
          <span className="absolute right-3 text-[10px] text-zinc-600 pointer-events-none">{unit}</span>
        )}
      </div>
    </div>
  );
}
