import { useState, useRef } from 'react';
import { Camera, Send, Loader2, Utensils, Dumbbell, X, MessageCircle, RotateCcw, PenLine } from 'lucide-react';
import { analyzeEntry, imageToBase64 } from '../lib/api';
import { useDefitStore } from '../store/useDefitStore';
import { MEAL_CATEGORY_ORDER, MEAL_CATEGORY_LABELS } from '../lib/mealCategory';
import type { EntryType, MealCategory } from '../types';

interface PendingContext {
  text: string;
  image?: string;
}

export default function InputArea() {
  const [type, setType] = useState<EntryType>('food');
  const [text, setText] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingContext, setPendingContext] = useState<PendingContext | null>(null);
  const [aiQuestion, setAiQuestion] = useState<string | null>(null);
  const [manualMode, setManualMode] = useState(false);
  const [manualForm, setManualForm] = useState({ name: '', kcal: '', carbs: '', protein: '', fat: '', meal_category: '' as MealCategory | '' });
  const fileRef = useRef<HTMLInputElement>(null);
  const addEntries = useDefitStore((s) => s.addEntries);
  const addManualEntry = useDefitStore((s) => s.addManualEntry);

  const isAwaitingReply = pendingContext !== null;

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const b64 = await imageToBase64(file);
    setImageData(b64);
    setImagePreview(URL.createObjectURL(file));
  }

  function clearImage() {
    setImageData(null);
    setImagePreview(null);
    if (fileRef.current) fileRef.current.value = '';
  }

  function cancelConversation() {
    setPendingContext(null);
    setAiQuestion(null);
    setErrorMessage(null);
    setText('');
    clearImage();
  }

  async function handleSubmit() {
    if (!text.trim() && !imageData) return;
    setSending(true);
    setErrorMessage(null);

    try {
      const res = await analyzeEntry(
        text.trim(),
        type,
        imageData ?? undefined,
        pendingContext?.text ?? undefined
      );

      console.log('Risposta API:', res);

      if (res.status === 'clarification_needed') {
        if (!isAwaitingReply) {
          setPendingContext({ text: text.trim(), image: imageData ?? undefined });
        }
        setAiQuestion(res.message);
        setText('');
      } else if (res.status === 'success') {
        const itemsToSave = res.items && res.items.length > 0
          ? res.items
          : [{ name: pendingContext?.text ?? text.trim(), kcal: res.total_kcal ?? 0, carbs: 0, protein: 0, fat: 0 }];

        await addEntries(type, itemsToSave);
        setText('');
        clearImage();
        setPendingContext(null);
        setAiQuestion(null);
        setErrorMessage(null);
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Errore imprevisto');
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div className="fixed inset-x-0 z-40" style={{ bottom: 'calc(4rem + env(safe-area-inset-bottom, 0px))' }}>
      <div className="bg-gradient-to-t from-zinc-950 via-zinc-950/98 via-60% to-transparent pt-10 pb-2">

        {isAwaitingReply && aiQuestion && (
          <div className="mx-4 mb-3">
            <div className="flex items-start gap-2.5">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-sky-500/20 border border-sky-500/30 flex items-center justify-center mt-0.5">
                <MessageCircle className="w-3.5 h-3.5 text-sky-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="bg-sky-500/10 border border-sky-500/20 rounded-2xl rounded-tl-sm px-3.5 py-2.5">
                  <p className="text-xs text-sky-200 leading-relaxed">{aiQuestion}</p>
                </div>
                <div className="flex items-center gap-2 mt-1.5 px-1">
                  <p className="text-[10px] text-zinc-600">Rispondi per completare l'inserimento</p>
                  <button
                    onClick={cancelConversation}
                    className="flex items-center gap-1 text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors ml-auto"
                  >
                    <RotateCcw className="w-2.5 h-2.5" />
                    Annulla
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-2 mx-9 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.05]">
              <p className="text-[10px] text-zinc-600 truncate">
                <span className="text-zinc-500">In sospeso: </span>
                {pendingContext.text}
              </p>
            </div>
          </div>
        )}

        {manualMode && (
          <div className="mx-4 mb-3 p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Inserimento manuale</span>
              <button onClick={() => setManualMode(false)} className="p-1 rounded-lg hover:bg-white/10 transition-colors">
                <X className="w-3.5 h-3.5 text-zinc-500" />
              </button>
            </div>
            <div className="space-y-2">
              <input
                type="text"
                value={manualForm.name}
                onChange={(e) => setManualForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Nome alimento"
                className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-white/20"
              />
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="text-[10px] text-zinc-600 mb-0.5 block">kcal</label>
                  <input type="text" inputMode="numeric" pattern="[0-9]*" value={manualForm.kcal} onChange={(e) => setManualForm((f) => ({ ...f, kcal: e.target.value }))} placeholder="0" className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-2 py-1.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-white/20" />
                </div>
                <div>
                  <label className="text-[10px] text-sky-400/70 mb-0.5 block">C</label>
                  <input type="text" inputMode="numeric" pattern="[0-9]*" value={manualForm.carbs} onChange={(e) => setManualForm((f) => ({ ...f, carbs: e.target.value }))} placeholder="0" className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-2 py-1.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-white/20" />
                </div>
                <div>
                  <label className="text-[10px] text-amber-400/70 mb-0.5 block">P</label>
                  <input type="text" inputMode="numeric" pattern="[0-9]*" value={manualForm.protein} onChange={(e) => setManualForm((f) => ({ ...f, protein: e.target.value }))} placeholder="0" className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-2 py-1.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-white/20" />
                </div>
                <div>
                  <label className="text-[10px] text-pink-400/70 mb-0.5 block">G</label>
                  <input type="text" inputMode="numeric" pattern="[0-9]*" value={manualForm.fat} onChange={(e) => setManualForm((f) => ({ ...f, fat: e.target.value }))} placeholder="0" className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-2 py-1.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-white/20" />
                </div>
              </div>
              <select
                value={manualForm.meal_category}
                onChange={(e) => setManualForm((f) => ({ ...f, meal_category: e.target.value as MealCategory }))}
                className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-white/20 appearance-none"
              >
                <option value="" className="bg-zinc-900">Pasto (automatico)</option>
                {MEAL_CATEGORY_ORDER.map((cat) => (
                  <option key={cat} value={cat} className="bg-zinc-900">{MEAL_CATEGORY_LABELS[cat]}</option>
                ))}
              </select>
              <button
                onClick={async () => {
                  const name = manualForm.name.trim();
                  const kcal = Math.max(0, parseInt(manualForm.kcal) || 0);
                  if (!name || kcal === 0) return;
                  const carbs = Math.max(0, parseInt(manualForm.carbs) || 0);
                  const protein = Math.max(0, parseInt(manualForm.protein) || 0);
                  const fat = Math.max(0, parseInt(manualForm.fat) || 0);
                  const category = manualForm.meal_category || undefined;
                  setSending(true);
                  try {
                    await addManualEntry(type, { name, kcal, carbs, protein, fat }, category);
                    setManualForm({ name: '', kcal: '', carbs: '', protein: '', fat: '', meal_category: '' });
                    setManualMode(false);
                  } finally {
                    setSending(false);
                  }
                }}
                disabled={sending || !manualForm.name.trim() || !(parseInt(manualForm.kcal) > 0)}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-30"
                style={{ background: type === 'food' ? '#f43f5e' : '#10b981' }}
              >
                {sending ? 'Salvataggio...' : 'Aggiungi'}
              </button>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="mx-4 mb-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
            <p className="text-xs text-red-300 leading-relaxed">{errorMessage}</p>
          </div>
        )}

        {imagePreview && (
          <div className="mx-4 mb-3 relative inline-block">
            <img
              src={imagePreview}
              alt="Preview"
              className="h-16 w-16 rounded-xl object-cover border border-white/10"
            />
            <button
              onClick={clearImage}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center"
            >
              <X className="w-3 h-3 text-zinc-400" />
            </button>
          </div>
        )}

        <div className="px-4 pb-4">
          {!isAwaitingReply && (
            <div className="flex items-center gap-2 mb-3 w-fit rounded-full bg-zinc-950/70 backdrop-blur-md px-1 py-1 border border-white/[0.06]">
              <TypeButton
                active={type === 'food'}
                onClick={() => setType('food')}
                icon={<Utensils className="w-3.5 h-3.5" />}
                label="Cibo"
                activeColor="bg-rose-500/20 text-rose-400 border-rose-500/30"
              />
              <TypeButton
                active={type === 'workout'}
                onClick={() => setType('workout')}
                icon={<Dumbbell className="w-3.5 h-3.5" />}
                label="Workout"
                activeColor="bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
              />
              <div className="w-px h-4 bg-white/[0.08]" />
              <button
                onClick={() => setManualMode((m) => !m)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 ${
                  manualMode
                    ? 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30'
                    : 'bg-transparent text-zinc-500 border-white/[0.06] hover:border-white/10'
                }`}
              >
                <PenLine className="w-3.5 h-3.5" />
                Manuale
              </button>
            </div>
          )}

          <div className="flex items-end gap-2">
            <div className={`flex-1 flex items-end gap-2 rounded-2xl px-3 py-2.5 transition-colors border ${
              isAwaitingReply
                ? 'bg-sky-500/[0.05] border-sky-500/20 focus-within:border-sky-500/40'
                : 'bg-white/[0.06] border-white/[0.08] focus-within:border-white/20'
            }`}>
              {!isAwaitingReply && (
                <>
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="flex-shrink-0 p-1 rounded-lg hover:bg-white/10 transition-colors text-zinc-400 hover:text-zinc-200"
                    aria-label="Carica foto"
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhoto}
                    className="hidden"
                  />
                </>
              )}
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  isAwaitingReply
                    ? 'Rispondi all\'AI...'
                    : type === 'food'
                      ? 'Descrivi il pasto...'
                      : 'Descrivi l\'allenamento...'
                }
                rows={1}
                autoFocus={isAwaitingReply}
                className={`flex-1 bg-transparent text-sm placeholder-zinc-500 resize-none outline-none max-h-24 leading-relaxed ${
                  isAwaitingReply ? 'text-sky-100' : 'text-white'
                }`}
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={sending || (!text.trim() && !imageData)}
              className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 ${
                sending || (!text.trim() && !imageData)
                  ? 'bg-white/5 text-zinc-600'
                  : isAwaitingReply
                    ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25 hover:bg-sky-400'
                    : type === 'food'
                      ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/25 hover:bg-rose-400'
                      : 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25 hover:bg-emerald-400'
              }`}
            >
              {sending ? (
                <Loader2 className="w-4.5 h-4.5 animate-spin" />
              ) : (
                <Send className="w-4.5 h-4.5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TypeButton({
  active,
  onClick,
  icon,
  label,
  activeColor,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  activeColor: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 ${
        active
          ? activeColor
          : 'bg-transparent text-zinc-500 border-white/[0.06] hover:border-white/10'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
