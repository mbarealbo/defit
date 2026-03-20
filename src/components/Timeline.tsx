import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Loader2, Dumbbell, Utensils, AlertTriangle } from 'lucide-react';
import { useDefitStore } from '../store/useDefitStore';
import { MEAL_CATEGORY_ORDER, MEAL_CATEGORY_LABELS } from '../lib/mealCategory';
import SortableEntryCard from './SortableEntryCard';
import EditEntryModal from './EditEntryModal';
import type { Entry, MealCategory } from '../types';

interface Props {
  date?: string;
  readOnly?: boolean;
}

function DroppableCategory({ id }: { id: string }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`rounded-2xl border border-dashed py-4 text-center text-[11px] transition-colors ${
        isOver
          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
          : 'border-white/10 bg-white/[0.02] text-zinc-600'
      }`}
    >
      {isOver ? 'Rilascia qui' : 'Trascina qui'}
    </div>
  );
}

export default function Timeline({ date, readOnly = false }: Props) {
  const { loading, records, updateEntryCategory } = useDefitStore();
  const today = new Date().toISOString().slice(0, 10);
  const targetDate = date ?? today;
  const record = records[targetDate];
  const entries = record?.entries ?? [];
  const isToday = targetDate === today;
  const [activeEntry, setActiveEntry] = useState<Entry | null>(null);
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  );

  if (!date && loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-zinc-500 animate-spin" />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <div className="w-12 h-12 rounded-full bg-white/[0.04] flex items-center justify-center mb-3">
          <Utensils className="w-5 h-5 text-zinc-600" />
        </div>
        <p className="text-zinc-500 text-sm leading-relaxed max-w-[240px]">
          {isToday
            ? 'Nessun inserimento oggi. Aggiungi un pasto o un allenamento per iniziare.'
            : 'Nessun dato registrato per questo giorno.'}
        </p>
      </div>
    );
  }

  const foodEntries = entries.filter((e) => e.type === 'food');
  const workoutEntries = entries.filter((e) => e.type === 'workout');

  const byCategory: Record<string, Entry[]> = {};
  for (const e of foodEntries) {
    const cat = e.meal_category ?? 'fuori pasto';
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(e);
  }

  const populatedCategories = MEAL_CATEGORY_ORDER.filter((cat) => byCategory[cat]?.length > 0);
  const orderedCategories = activeEntry
    ? MEAL_CATEGORY_ORDER.filter((cat) => cat !== 'fuori pasto')
    : populatedCategories;

  function handleDragStart(event: DragStartEvent) {
    const id = String(event.active.id);
    setActiveEntry(entries.find((e) => e.id === id) ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveEntry(null);
    const { active, over } = event;
    if (!over) return;

    const draggedId = String(active.id);
    const overId = String(over.id);
    if (draggedId === overId) return;

    const draggedEntry = entries.find((e) => e.id === draggedId);
    if (!draggedEntry) return;

    let targetCategory: MealCategory | null = null;

    if (overId.startsWith('category:')) {
      targetCategory = overId.replace('category:', '') as MealCategory;
    } else {
      const overEntry = entries.find((e) => e.id === overId);
      if (overEntry?.meal_category) {
        targetCategory = overEntry.meal_category;
      }
    }

    if (targetCategory && targetCategory !== draggedEntry.meal_category) {
      updateEntryCategory(draggedId, targetCategory);
    }
  }

  return (
    <section className="px-4 pb-6 mt-4">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="space-y-5">
          {orderedCategories.map((cat) => {
            const catEntries = byCategory[cat] ?? [];
            const isEmpty = catEntries.length === 0;
            const isFuoriPasto = cat === 'fuori pasto';
            const ids = catEntries.map((e) => e.id);
            const totalKcal = catEntries.reduce((s, e) => s + e.kcal, 0);

            return (
              <div key={cat} id={`category:${cat}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {isFuoriPasto && (
                      <AlertTriangle className="w-3 h-3 text-red-400" />
                    )}
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-widest ${
                        isFuoriPasto ? 'text-red-400' : 'text-zinc-500'
                      }`}
                    >
                      {MEAL_CATEGORY_LABELS[cat]}
                    </span>
                  </div>
                  {!isEmpty && (
                    <span className={`text-[10px] tabular-nums font-medium ${isFuoriPasto ? 'text-red-500' : 'text-zinc-600'}`}>
                      {totalKcal} kcal
                    </span>
                  )}
                </div>

                {isFuoriPasto && !isEmpty && (
                  <div className="mb-2 px-3 py-1.5 rounded-xl bg-red-950/30 border border-red-500/15">
                    <p className="text-[10px] text-red-400/70 leading-relaxed">
                      Stai mangiando fuori dai pasti principali. Trascina le voci nella categoria corretta se necessario.
                    </p>
                  </div>
                )}

                {isEmpty ? (
                  <DroppableCategory id={`category:${cat}`} />
                ) : (
                  <SortableContext items={ids} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2">
                      {catEntries.map((entry) => (
                        <SortableEntryCard
                          key={entry.id}
                          entry={entry}
                          readOnly={readOnly}
                          isFuoriPasto={isFuoriPasto}
                          onEdit={setEditingEntry}
                        />
                      ))}
                    </div>
                  </SortableContext>
                )}
              </div>
            );
          })}

          {workoutEntries.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Dumbbell className="w-3 h-3 text-emerald-400" />
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-emerald-600">
                    Allenamento
                  </span>
                </div>
                <span className="text-[10px] tabular-nums font-medium text-emerald-600">
                  +{workoutEntries.reduce((s, e) => s + e.kcal, 0)} kcal
                </span>
              </div>
              <div className="space-y-2">
                {workoutEntries.map((entry) => (
                  <SortableEntryCard
                    key={entry.id}
                    entry={entry}
                    readOnly={readOnly}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <DragOverlay>
          {activeEntry && (
            <div className="rotate-1 scale-105 shadow-2xl shadow-black/40">
              <SortableEntryCard
                entry={activeEntry}
                readOnly={false}
                isFuoriPasto={activeEntry.meal_category === 'fuori pasto'}
              />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {editingEntry && (
        <EditEntryModal
          entry={editingEntry}
          onClose={() => setEditingEntry(null)}
        />
      )}
    </section>
  );
}
