'use client';

import { useMemo } from 'react';
import { TimelineTask, Category } from '@cursor-deneme/shared';
import { filterRecurringTasks } from '@cursor-deneme/shared';
import { useLocale } from '@/components/LocaleContext';
import { t } from '@cursor-deneme/shared';

function isUrgent(task: TimelineTask, currentDay: number, todayStr: string): boolean {
  if (task.recurrence) {
    return filterRecurringTasks([task], todayStr).length > 0;
  }
  return parseInt(task.date ?? '0') <= currentDay;
}

interface EisenhowerViewProps {
  tasks: TimelineTask[];
  categories: Category[];
  darkMode?: boolean;
  onEditTask: (task: TimelineTask, date?: string) => void;
  onAddTask: () => void;
  onToggleTask: (task: TimelineTask) => void;
}

/** Urgent = due today or overdue; Important = high priority. Each task appears once. */
function useEisenhowerQuads(tasks: TimelineTask[], currentDay: number, todayStr: string) {
  const allIncomplete = useMemo(() => {
    return tasks.filter((t) => !t.completed);
  }, [tasks]);

  const q1 = useMemo(() => {
    return allIncomplete.filter((t) => isUrgent(t, currentDay, todayStr) && t.priority === 'high');
  }, [allIncomplete, currentDay, todayStr]);

  const q2 = useMemo(() => {
    return allIncomplete.filter((t) => !isUrgent(t, currentDay, todayStr) && t.priority === 'high');
  }, [allIncomplete, currentDay, todayStr]);

  const q3 = useMemo(() => {
    return allIncomplete.filter((t) => isUrgent(t, currentDay, todayStr) && t.priority !== 'high');
  }, [allIncomplete, currentDay, todayStr]);

  const q4 = useMemo(() => {
    return allIncomplete.filter((t) => !isUrgent(t, currentDay, todayStr) && t.priority !== 'high');
  }, [allIncomplete, currentDay, todayStr]);

  return { q1, q2, q3, q4 };
}

function QuadrantCard({
  task,
  dark,
  onToggle,
  onEdit,
}: {
  task: TimelineTask;
  dark: boolean;
  onToggle: () => void;
  onEdit: () => void;
}) {
  return (
    <div
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border cursor-pointer transition-colors ${
        dark ? 'border-zinc-700 hover:bg-zinc-800/80' : 'border-stone-200 hover:bg-stone-50'
      }`}
      onClick={onEdit}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className={`shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center ${dark ? 'border-zinc-500' : 'border-stone-400'}`}
        aria-label="Tamamla"
      >
        {task.completed ? <span className="text-amber-500 text-xs">✓</span> : null}
      </button>
      <span className={`flex-1 text-sm truncate ${dark ? 'text-zinc-200' : 'text-stone-800'}`}>{task.title}</span>
    </div>
  );
}

export default function EisenhowerView({
  tasks,
  categories,
  darkMode = false,
  onEditTask,
  onAddTask,
  onToggleTask,
}: EisenhowerViewProps) {
  const dark = darkMode;
  const { locale } = useLocale();
  const today = new Date();
  const currentDay = today.getDate();
  const todayStr = currentDay.toString();

  const { q1, q2, q3, q4 } = useEisenhowerQuads(tasks, currentDay, todayStr);

  const quadrantLabel = (q: string) => {
    if (locale === 'tr') {
      if (q === 'q1') return 'Acil + Önemli';
      if (q === 'q2') return 'Önemli (planla)';
      if (q === 'q3') return 'Acil (delege et / hızlı bitir)';
      if (q === 'q4') return 'Önemsiz (ertele / sil)';
    } else {
      if (q === 'q1') return 'Urgent + Important';
      if (q === 'q2') return 'Important (schedule)';
      if (q === 'q3') return 'Urgent (delegate / quick)';
      if (q === 'q4') return 'Neither (postpone / drop)';
    }
    return q;
  };

  const renderQuad = (list: TimelineTask[], bg: string, border: string) => (
    <div className={`rounded-xl border-2 p-3 min-h-[120px] ${bg} ${border}`}>
      {list.length === 0 ? (
        <p className={`text-xs ${dark ? 'text-zinc-500' : 'text-stone-500'}`}>—</p>
      ) : (
        <div className="space-y-2">
          {list.slice(0, 8).map((task, idx) => (
            <QuadrantCard
              key={task.id ?? `eq-${idx}`}
              task={task}
              dark={dark}
              onToggle={() => onToggleTask(task)}
              onEdit={() => onEditTask(task, task.date)}
            />
          ))}
          {list.length > 8 && (
            <p className={`text-xs ${dark ? 'text-zinc-500' : 'text-stone-500'}`}>+{list.length - 8}</p>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <p className={`text-xs ${dark ? 'text-zinc-500' : 'text-stone-500'}`}>
        {locale === 'tr'
          ? 'Eisenhower matrisi: Acil × Önemli. Öncelik = önemli, bugün/gecikmiş = acil.'
          : 'Eisenhower matrix: Urgent × Important. High priority = important, today/overdue = urgent.'}
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <h3 className={`text-xs font-bold uppercase mb-2 ${dark ? 'text-red-400' : 'text-red-600'}`}>
            {quadrantLabel('q1')}
          </h3>
          {renderQuad(q1, dark ? 'bg-red-950/30' : 'bg-red-50', dark ? 'border-red-800' : 'border-red-200')}
        </div>
        <div>
          <h3 className={`text-xs font-bold uppercase mb-2 ${dark ? 'text-amber-400' : 'text-amber-700'}`}>
            {quadrantLabel('q2')}
          </h3>
          {renderQuad(q2, dark ? 'bg-amber-950/20' : 'bg-amber-50/60', dark ? 'border-amber-800' : 'border-amber-200')}
        </div>
        <div>
          <h3 className={`text-xs font-bold uppercase mb-2 ${dark ? 'text-orange-400' : 'text-orange-600'}`}>
            {quadrantLabel('q3')}
          </h3>
          {renderQuad(q3, dark ? 'bg-orange-950/20' : 'bg-orange-50/60', dark ? 'border-orange-800' : 'border-orange-200')}
        </div>
        <div>
          <h3 className={`text-xs font-bold uppercase mb-2 ${dark ? 'text-zinc-400' : 'text-stone-500'}`}>
            {quadrantLabel('q4')}
          </h3>
          {renderQuad(q4, dark ? 'bg-zinc-800/50' : 'bg-stone-50', dark ? 'border-zinc-700' : 'border-stone-200')}
        </div>
      </div>
      <button
        type="button"
        onClick={onAddTask}
        className={`w-full py-3 rounded-xl font-medium text-sm ${dark ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30' : 'bg-amber-100 text-amber-800 hover:bg-amber-200'}`}
      >
        + {locale === 'tr' ? 'Yeni görev' : 'New task'}
      </button>
    </div>
  );
}
