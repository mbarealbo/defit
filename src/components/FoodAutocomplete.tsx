import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { searchFoods, type OFFProduct } from '../lib/openFoodFacts';

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSelect: (product: OFFProduct) => void;
  placeholder?: string;
}

export default function FoodAutocomplete({ value, onChange, onSelect, placeholder }: Props) {
  const [results, setResults] = useState<OFFProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const abortRef = useRef<AbortController>();
  const containerRef = useRef<HTMLDivElement>(null);

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 3) {
      setResults([]);
      setOpen(false);
      return;
    }
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setLoading(true);
    try {
      const data = await searchFoods(q, ac.signal);
      setResults(data);
      setOpen(data.length > 0);
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        setResults([]);
        setOpen(false);
      }
    } finally {
      if (!ac.signal.aborted) setLoading(false);
    }
  }, []);

  function handleChange(val: string) {
    onChange(val);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => doSearch(val), 200);
  }

  function handleSelect(product: OFFProduct) {
    onSelect(product);
    setOpen(false);
    setResults([]);
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600 pointer-events-none" />
        <input
          type="text"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={placeholder ?? 'Cerca alimento...'}
          className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl pl-8 pr-8 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-white/20"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 animate-spin" />
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute z-50 left-0 right-0 mt-1 max-h-52 overflow-y-auto rounded-xl bg-zinc-900 border border-white/[0.1] shadow-xl">
          {results.map((p, i) => (
            <button
              key={i}
              onClick={() => handleSelect(p)}
              className="w-full text-left px-3 py-2.5 hover:bg-white/[0.06] transition-colors border-b border-white/[0.04] last:border-b-0"
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm text-white truncate">
                  {p.name}
                  {p.brand && <span className="text-zinc-500 text-xs ml-1.5">{p.brand}</span>}
                </span>
                <span className="text-xs text-zinc-400 flex-shrink-0">{p.kcal} kcal</span>
              </div>
              <div className="flex gap-3 mt-0.5">
                <span className="text-[10px] text-sky-400/70">C {p.carbs}g</span>
                <span className="text-[10px] text-amber-400/70">P {p.protein}g</span>
                <span className="text-[10px] text-pink-400/70">G {p.fat}g</span>
                <span className="text-[10px] text-zinc-600 ml-auto">per 100g</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
