import { useState, useRef } from 'react';
import { Camera, Send, Loader2, Utensils, Dumbbell, X, MessageCircle, RotateCcw } from 'lucide-react';
import { analyzeEntry, imageToBase64 } from '../lib/api';
import { useDefitStore } from '../store/useDefitStore';
import type { EntryType } from '../types';

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
  const fileRef = useRef<HTMLInputElement>(null);
  const addEntries = useDefitStore((s) => s.addEntries);

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
    <div className="fixed inset-x-0 z-40" style={{ bottom: '4rem' }}>
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
