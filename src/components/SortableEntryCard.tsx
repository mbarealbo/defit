import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Utensils, Dumbbell, Trash2, Clock, GripVertical, Pencil } from 'lucide-react';
import { useDefitStore } from '../store/useDefitStore';
import type { Entry } from '../types';

interface Props {
  entry: Entry;
  readOnly?: boolean;
  isFuoriPasto?: boolean;
  onEdit?: (entry: Entry) => void;
}

export default function SortableEntryCard({ entry, readOnly = false, isFuoriPasto = false, onEdit }: Props) {
  const deleteEntry = useDefitStore((s) => s.deleteEntry);
  const isFood = entry.type === 'food';

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: entry.id, disabled: readOnly || !isFood });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group rounded-2xl border backdrop-blur-sm transition-colors duration-200 ${
        isFuoriPasto
          ? 'bg-red-950/20 border-red-500/20'
          : isFood
          ? 'bg-white/[0.04] border-white/[0.06]'
          : 'bg-emerald-500/[0.06] border-emerald-500/[0.1]'
      }`}
    >
      <div className="flex items-start gap-2 p-3.5">
        {isFood && !readOnly && (
          <button
            {...attributes}
            {...listeners}
            className="flex-shrink-0 mt-1 cursor-grab active:cursor-grabbing touch-none p-0.5 text-zinc-600 hover:text-zinc-400 transition-colors"
            aria-label="Trascina"
          >
            <GripVertical className="w-3.5 h-3.5" />
          </button>
        )}

        <div
          className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center ${
            isFuoriPasto
              ? 'bg-red-500/15'
              : isFood
              ? 'bg-rose-500/15'
              : 'bg-emerald-500/15'
          }`}
        >
          {isFood ? (
            <Utensils className={`w-3.5 h-3.5 ${isFuoriPasto ? 'text-red-400' : 'text-rose-400'}`} />
          ) : (
            <Dumbbell className="w-3.5 h-3.5 text-emerald-400" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className={`text-sm font-semibold leading-snug ${isFuoriPasto ? 'text-red-200' : 'text-white'}`}>
              {entry.name}
            </h3>
            <span
              className={`text-sm font-bold tabular-nums flex-shrink-0 ${
                isFuoriPasto ? 'text-red-400' : isFood ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {isFood ? '-' : '+'}
              {entry.kcal}
            </span>
          </div>

          <div className="flex items-center gap-3 mt-1 flex-wrap">
            {entry.time_label && (
              <span className="flex items-center gap-1 text-[10px] text-zinc-600">
                <Clock className="w-2.5 h-2.5" />
                {entry.time_label}
              </span>
            )}
            {isFood && (entry.carbs > 0 || entry.protein > 0 || entry.fat > 0) && (
              <>
                <MacroPill label="C" value={entry.carbs} color="text-sky-400" />
                <MacroPill label="P" value={entry.protein} color="text-amber-400" />
                <MacroPill label="G" value={entry.fat} color="text-pink-400" />
              </>
            )}
          </div>
        </div>

        {!readOnly && (
          <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity flex-shrink-0">
            {isFood && onEdit && (
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(entry); }}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                aria-label="Modifica"
              >
                <Pencil className="w-3 h-3 text-zinc-500" />
              </button>
            )}
            <button
              onClick={() => deleteEntry(entry.id)}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Elimina"
            >
              <Trash2 className="w-3 h-3 text-zinc-500" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function MacroPill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <span className="text-[10px] text-zinc-600">
      <span className={`font-semibold ${color}`}>{label}</span> {value}g
    </span>
  );
}
