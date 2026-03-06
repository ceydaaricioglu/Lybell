'use client';

import { useState, useMemo, useEffect } from 'react';
import { TimelineTask, Category } from '@cursor-deneme/shared';
import {
  filterRecurringTasks,
  saveTaskToSupabase,
  deleteTaskFromSupabase,
  fetchTasksFromSupabase,
  getMockCategories,
  getDayAbbreviation,
} from '@cursor-deneme/shared';
import { MONTHS_TR } from '@cursor-deneme/shared';
import { useLocale } from '@/components/LocaleContext';
import { t, type Locale } from '@cursor-deneme/shared';

const PRIMARY = '#f59e0b';
const BG_LIGHT = '#f5f0ea';
const BG_DARK = '#0f0f0f';

interface TasksViewProps {
  userId: string;
  darkMode?: boolean;
  isPro?: boolean;
  initialDateFromCalendar?: string;
  onBack: () => void;
  onEditTask: (task: TimelineTask, viewingDate?: string) => void;
  onAddTask: () => void;
  onStartPomodoro?: (task: TimelineTask) => void;
  onDeleteTask?: (taskId: string) => void | Promise<void>;
  tasks?: TimelineTask[];
  setTasks?: React.Dispatch<React.SetStateAction<TimelineTask[]>>;
  categories?: Category[];
}

function getCategoryName(categoryId: string | null | undefined, categories: Category[]): string {
  if (!categoryId) return '';
  const c = categories.find((x) => x.id === categoryId);
  return c?.name ?? (categoryId === 'routines' ? 'Rutinler' : categoryId === 'reading' ? 'Okuma' : categoryId);
}

function getCategoryColor(categoryId: string | null | undefined, categories: Category[]): string {
  if (!categoryId) return PRIMARY;
  const c = categories.find((x) => x.id === categoryId);
  if (c?.color === 'blue') return '#60a5fa';
  if (c?.color === 'green') return '#4ade80';
  if (c?.color === 'purple') return '#a78bfa';
  return PRIMARY;
}

function getPriorityBadgeStyle(priority: 'high' | 'medium' | 'low' | null | undefined, dark: boolean) {
  if (priority === 'high') return dark ? 'bg-red-500/20 text-red-400' : 'bg-red-50 text-red-600';
  if (priority === 'low') return dark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600';
  return dark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-50 text-amber-700';
}

function formatDueLabel(
  task: TimelineTask,
  currentDay: number,
  currentMonth: number,
  currentYear: number,
  locale?: Locale,
  tFn?: (key: string, l: Locale) => string
): string {
  const dayNum = parseInt(task.date);
  if (locale && tFn) {
    if (dayNum < currentDay) return tFn('tasks.yesterday', locale);
    if (dayNum === currentDay) return task.time ? `${tFn('tasks.today', locale)}, ${task.time}` : tFn('tasks.today', locale);
    if (dayNum === currentDay + 1) return tFn('tasks.tomorrow', locale);
  } else {
    if (dayNum < currentDay) return 'Yesterday';
    if (dayNum === currentDay) return task.time ? `Today, ${task.time}` : 'Today';
    if (dayNum === currentDay + 1) return 'Tomorrow';
  }
  return `${MONTHS_TR[currentMonth]?.slice(0, 3) ?? ''} ${dayNum}, ${currentYear}`;
}

function isOverdue(task: TimelineTask, currentDay: number): boolean {
  return !task.completed && parseInt(task.date) < currentDay && !task.recurrence;
}

export default function TasksView({
  userId,
  darkMode = false,
  isPro = false,
  initialDateFromCalendar,
  onBack,
  onEditTask,
  onAddTask,
  onStartPomodoro,
  onDeleteTask,
  tasks: tasksFromParent,
  setTasks: setTasksFromParent,
  categories: categoriesFromParent,
}: TasksViewProps) {
  const { locale } = useLocale();
  const dark = darkMode;
  const [localTasks, setLocalTasks] = useState<TimelineTask[]>([]);
  const [loading, setLoading] = useState(!tasksFromParent);
  const tasks = tasksFromParent ?? localTasks;
  const setTasks = setTasksFromParent ?? setLocalTasks;
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'today' | 'upcoming' | 'completed'>('today');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [recurrenceFilter, setRecurrenceFilter] = useState<'all' | 'recurring' | 'one-time'>('all');

  const categories = categoriesFromParent ?? (userId ? getMockCategories(userId) : []);

  const applyProFilters = (list: TimelineTask[]) => {
    if (!isPro) return list;
    let out = list;
    if (priorityFilter !== 'all') {
      out = out.filter((t) => (t.priority ?? 'medium') === priorityFilter);
    }
    if (recurrenceFilter === 'recurring') {
      out = out.filter((t) => !!t.recurrence);
    } else if (recurrenceFilter === 'one-time') {
      out = out.filter((t) => !t.recurrence);
    }
    return out;
  };

  useEffect(() => {
    if (tasksFromParent !== undefined) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    const load = async () => {
      const list = await fetchTasksFromSupabase(userId);
      if (!cancelled) {
        setLocalTasks(list);
        setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [userId, tasksFromParent]);

  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const todayStr = currentDay.toString();

  const matchesSearch = (t: TimelineTask, q: string) => {
    if (!q.trim()) return true;
    const lower = q.trim().toLowerCase();
    return t.title.toLowerCase().includes(lower) || (t.description?.toLowerCase().includes(lower) ?? false);
  };

  const overdueTasks = useMemo(() => {
    const base = tasks.filter((t) => !t.completed && parseInt(t.date) < currentDay && !t.recurrence && matchesSearch(t, searchQuery));
    return applyProFilters(base);
  }, [tasks, currentDay, searchQuery, isPro, priorityFilter, recurrenceFilter]);

  const todayTasks = useMemo(() => {
    const list = filterRecurringTasks(tasks, todayStr).filter((t) => !t.completed && matchesSearch(t, searchQuery));
    const filtered = applyProFilters(list);
    return filtered.sort((a, b) => (a.orderIndex ?? 9999) - (b.orderIndex ?? 9999) || (a.time || '').localeCompare(b.time || ''));
  }, [tasks, todayStr, searchQuery, isPro, priorityFilter, recurrenceFilter]);

  const upcomingTasks = useMemo(() => {
    const result: TimelineTask[] = [];
    const seen = new Set<string>();
    for (let d = currentDay + 1; d <= 31; d++) {
      const dayStr = d.toString();
      filterRecurringTasks(tasks, dayStr).forEach((t) => {
        if (!t.completed && matchesSearch(t, searchQuery) && (!t.id || !seen.has(t.id))) {
          if (t.id) seen.add(t.id);
          result.push({ ...t, date: dayStr });
        }
      });
    }
    return applyProFilters(result).sort((a, b) => parseInt(a.date) - parseInt(b.date) || (a.time || '').localeCompare(b.time || ''));
  }, [tasks, currentDay, searchQuery, isPro, priorityFilter, recurrenceFilter]);

  const completedTasks = useMemo(() => {
    const base = tasks.filter((t) => t.completed && matchesSearch(t, searchQuery));
    return applyProFilters(base);
  }, [tasks, searchQuery, isPro, priorityFilter, recurrenceFilter]);

  const handleToggleTask = async (task: TimelineTask) => {
    if (!task.id) return;
    const updated = { ...task, completed: !task.completed, completedAt: !task.completed ? new Date().toISOString() : undefined };
    await saveTaskToSupabase(userId, updated);
    setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
  };

  const handleMoveTask = async (task: TimelineTask, direction: 'up' | 'down') => {
    const list = todayTasks;
    const idx = list.findIndex((t) => t.id === task.id);
    if (idx < 0) return;
    const nextIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (nextIdx < 0 || nextIdx >= list.length) return;
    const other = list[nextIdx];
    const taskOrder = task.orderIndex ?? idx;
    const otherOrder = other.orderIndex ?? nextIdx;
    const updatedTask = { ...task, orderIndex: otherOrder };
    const updatedOther = { ...other, orderIndex: taskOrder };
    await Promise.all([saveTaskToSupabase(userId, updatedTask), saveTaskToSupabase(userId, updatedOther)]);
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? updatedTask : t.id === other.id ? updatedOther : t))
    );
  };

  const dateLabel = `${getDayAbbreviation(currentDay)}, ${todayStr} ${MONTHS_TR[currentMonth]} ${currentYear}`;

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${dark ? 'bg-[#0f0f0f]' : 'bg-[#f5f0ea]'}`}>
        <div className="text-center">
          <div className={`w-12 h-12 border-4 rounded-full animate-spin mx-auto mb-4 ${dark ? 'border-zinc-700 border-t-amber-400/80' : 'border-stone-200 border-t-amber-500'}`} />
          <p className={dark ? 'text-zinc-500' : 'text-stone-500'}>{t('tasks.loading', locale)}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen pb-24 ${dark ? 'bg-[#0f0f0f] text-zinc-100' : 'bg-[#f5f0ea] text-stone-800'}`}>
      <div className="max-w-md mx-auto px-4 sm:px-5 pt-6 pb-4">
        {/* Header - eski sade tasarım */}
        <header className="mb-6">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className={`w-10 h-10 flex items-center justify-center rounded-xl transition-colors ${dark ? 'hover:bg-zinc-800' : 'hover:bg-white/80'}`}
              aria-label={t('common.back', locale)}
            >
              <svg className={`w-6 h-6 ${dark ? 'text-zinc-300' : 'text-stone-700'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className={`text-xl font-semibold ${dark ? 'text-white' : 'text-stone-800'}`}>
              {MONTHS_TR[currentMonth]} {currentYear}
            </h1>
            <div className="w-10" />
          </div>
          <div className="mt-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('tasks.searchTasks', locale)}
              className={`w-full px-4 py-2.5 rounded-xl text-sm border transition-all placeholder:opacity-70 ${
                dark ? 'bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-500' : 'bg-white border-stone-200 text-stone-800 placeholder:text-stone-400'
              }`}
            />
          </div>
        </header>

        {/* Tabs + Yeni görev - kart içinde */}
        <div className={`rounded-2xl p-4 mb-4 ${dark ? 'bg-zinc-900/60 border border-zinc-800' : 'bg-white shadow-[0_4px_24px_-4px_rgba(0,0,0,0.06)] border border-stone-100'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2">
              {(['today', 'upcoming', 'completed'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    activeTab === tab
                      ? dark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-800'
                      : dark ? 'bg-zinc-800/80 text-zinc-400 hover:bg-zinc-700' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {tab === 'today' ? t('tasks.today', locale) : tab === 'upcoming' ? t('tasks.upcoming', locale) : t('tasks.completed', locale)}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={onAddTask}
              className="flex items-center gap-1.5 text-white px-3 py-2 rounded-xl text-sm font-bold shadow-sm hover:opacity-95"
              style={{ backgroundColor: PRIMARY }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t('tasks.newTask', locale)}
            </button>
          </div>
          <p className={`text-sm ${dark ? 'text-zinc-500' : 'text-stone-500'}`}>{dateLabel}</p>
          {isPro && (
            <>
              <div className="flex flex-wrap gap-2 mt-3">
                <span className={`text-xs font-medium ${dark ? 'text-zinc-500' : 'text-stone-500'}`}>{t('tasks.priority', locale)}:</span>
                {(['all', 'high', 'medium', 'low'] as const).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setPriorityFilter(key)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                      priorityFilter === key
                        ? dark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-800'
                        : dark ? 'bg-zinc-800/80 text-zinc-400 hover:bg-zinc-700' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    {key === 'all' ? (locale === 'tr' ? 'Tümü' : 'All') : t(`tasks.${key}` as 'tasks.high', locale)}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className={`text-xs font-medium ${dark ? 'text-zinc-500' : 'text-stone-500'}`}>{locale === 'tr' ? 'Tekrar' : 'Repeat'}:</span>
                {(['all', 'recurring', 'one-time'] as const).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setRecurrenceFilter(key)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                      recurrenceFilter === key
                        ? dark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-800'
                        : dark ? 'bg-zinc-800/80 text-zinc-400 hover:bg-zinc-700' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    {key === 'all' ? (locale === 'tr' ? 'Tümü' : 'All') : key === 'recurring' ? (locale === 'tr' ? 'Tekrarlayan' : 'Recurring') : (locale === 'tr' ? 'Tekrarsız' : 'One-time')}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Task list */}
        <div className="space-y-6">
          {activeTab === 'today' && (
                <>
                  {overdueTasks.length > 0 && (
                    <section>
                      <h3 className={`text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2 ${dark ? 'text-red-400' : 'text-red-600'}`}>
                        {t('tasks.overdue', locale)} <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      </h3>
                      <div className="space-y-3">
                        {overdueTasks.map((task, idx) => (
                          <TaskCard
                            key={task.id ?? `overdue-${idx}`}
                            task={task}
                            categories={categories}
                            dark={dark}
                            isOverdue
                            currentDay={currentDay}
                            currentMonth={currentMonth}
                            currentYear={currentYear}
                            locale={locale}
                            tFn={t}
                            onToggle={() => handleToggleTask(task)}
                            onEdit={() => onEditTask(task, task.date)}
                            onSelect={() => onEditTask(task, task.date)}
                            onDelete={() => task.id && onDeleteTask?.(task.id)}
                          />
                        ))}
                      </div>
                    </section>
                  )}
                  <section>
                    <h3 className={`text-xs font-bold uppercase tracking-widest mb-4 ${dark ? 'text-zinc-400' : 'text-stone-500'}`}>
                      {activeTab === 'today' ? t('tasks.todayTasks', locale) : t('nav.tasks', locale)}
                    </h3>
                    {todayTasks.length === 0 && overdueTasks.length === 0 ? (
                      <EmptyState dark={dark} onAddTask={onAddTask} searchQuery={searchQuery} locale={locale} tFn={t} />
                    ) : (
                      <div className="space-y-3">
                        {todayTasks.map((task, idx) => (
                          <TaskCard
                            key={task.id ?? `today-${idx}`}
                            task={task}
                            categories={categories}
                            dark={dark}
                            currentDay={currentDay}
                            currentMonth={currentMonth}
                            currentYear={currentYear}
                            locale={locale}
                            tFn={t}
                            onToggle={() => handleToggleTask(task)}
                            onEdit={() => onEditTask(task, task.date)}
                            onSelect={() => onEditTask(task, task.date)}
                            onDelete={() => task.id && onDeleteTask?.(task.id)}
                            onMoveUp={todayTasks.length >= 2 && idx > 0 ? () => handleMoveTask(task, 'up') : undefined}
                            onMoveDown={todayTasks.length >= 2 && idx < todayTasks.length - 1 ? () => handleMoveTask(task, 'down') : undefined}
                          />
                        ))}
                      </div>
                    )}
                  </section>
                </>
              )}

          {activeTab === 'upcoming' && (
                <section>
                  <h3 className={`text-xs font-bold uppercase tracking-widest mb-4 ${dark ? 'text-zinc-400' : 'text-stone-500'}`}>{t('tasks.upcoming', locale)}</h3>
                  {upcomingTasks.length === 0 ? (
                    <EmptyState dark={dark} onAddTask={onAddTask} searchQuery={searchQuery} locale={locale} tFn={t} />
                  ) : (
                    <div className="space-y-3">
                      {upcomingTasks.map((task, idx) => (
                        <TaskCard
                          key={task.id ?? `upcoming-${idx}`}
                          task={task}
                          categories={categories}
                          dark={dark}
                          currentDay={currentDay}
                          currentMonth={currentMonth}
                          currentYear={currentYear}
                          locale={locale}
                          tFn={t}
                          onToggle={() => handleToggleTask(task)}
                          onEdit={() => onEditTask(task, task.date)}
                          onSelect={() => onEditTask(task, task.date)}
                          onDelete={() => task.id && onDeleteTask?.(task.id)}
                        />
                      ))}
                    </div>
                  )}
                </section>
              )}

          {activeTab === 'completed' && (
                <section>
                  <h3 className={`text-xs font-bold uppercase tracking-widest mb-4 ${dark ? 'text-zinc-400' : 'text-stone-500'}`}>{t('tasks.completed', locale)}</h3>
                  {completedTasks.length === 0 ? (
                    <EmptyState dark={dark} onAddTask={onAddTask} searchQuery={searchQuery} completed locale={locale} tFn={t} />
                  ) : (
                    <div className="space-y-3">
                      {completedTasks.map((task, idx) => (
                        <TaskCard
                          key={task.id ?? `done-${idx}`}
                          task={task}
                          categories={categories}
                          dark={dark}
                          completed
                          currentDay={currentDay}
                          currentMonth={currentMonth}
                          currentYear={currentYear}
                          locale={locale}
                          tFn={t}
                          onToggle={() => handleToggleTask(task)}
                          onEdit={() => onEditTask(task, task.date)}
                          onSelect={() => onEditTask(task, task.date)}
                          onDelete={() => task.id && onDeleteTask?.(task.id)}
                        />
                      ))}
                    </div>
                  )}
                </section>
              )}
        </div>
      </div>
    </div>
  );
}

function TaskCard({
  task,
  categories,
  dark,
  isOverdue,
  completed,
  currentDay,
  currentMonth,
  currentYear,
  locale,
  tFn,
  onToggle,
  onEdit,
  onSelect,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  task: TimelineTask;
  categories: Category[];
  dark: boolean;
  isOverdue?: boolean;
  completed?: boolean;
  currentDay?: number;
  currentMonth?: number;
  currentYear?: number;
  locale: Locale;
  tFn: (key: string, l: Locale) => string;
  onToggle: () => void;
  onEdit: () => void;
  onSelect: () => void;
  onDelete: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}) {
  const dueLabel =
    currentDay !== undefined && currentMonth !== undefined && currentYear !== undefined && locale && tFn
      ? formatDueLabel(task, currentDay, currentMonth, currentYear, locale, tFn)
      : (task.time || tFn('tasks.today', locale));
  const priority = task.priority ?? 'medium';

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onKeyDown={(e) => e.key === 'Enter' && onSelect()}
      className={'group flex items-center gap-4 p-4 rounded-xl border shadow-sm cursor-pointer transition-all ' + (dark ? 'bg-slate-800/60 border-slate-700 hover:border-amber-500/30' : 'bg-white border-slate-200 hover:border-amber-500/30')}
    >
      <input
        type="checkbox"
        checked={!!task.completed}
        onChange={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className="w-5 h-5 rounded-full border-2 border-slate-300 text-amber-500 focus:ring-amber-500 flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={'text-sm font-semibold truncate ' + (task.completed ? 'line-through opacity-60 ' : '') + (dark ? 'text-slate-200' : 'text-slate-800')}
          >
            {task.title}
          </span>
          {!completed && priority !== 'medium' && (
            <span className={'px-2 py-0.5 rounded text-[10px] font-bold flex-shrink-0 ' + getPriorityBadgeStyle(priority, dark)}>
              {priority === 'high' ? tFn('tasks.high', locale) : priority === 'low' ? tFn('tasks.low', locale) : tFn('tasks.medium', locale)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          <div
            className={'flex items-center gap-1 text-[11px] font-medium ' + (isOverdue ? 'text-red-500' : dark ? 'text-slate-400' : 'text-slate-500')}
          >
            {isOverdue ? tFn('tasks.yesterday', locale) : dueLabel}
          </div>
          {getCategoryName(task.category, categories) && (
            <div className={'flex items-center gap-1 text-[11px] ' + (dark ? 'text-slate-400' : 'text-slate-500')}>
              <span
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: getCategoryColor(task.category, categories) }}
              />
              {getCategoryName(task.category, categories)}
            </div>
          )}
        </div>
      </div>
      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 flex-shrink-0">
        {(onMoveUp ?? onMoveDown) && (
          <>
            {onMoveUp && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
                className={'p-1 rounded ' + (dark ? 'text-slate-400 hover:bg-slate-700 hover:text-slate-200' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600')}
                aria-label="Yukarı"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
              </button>
            )}
            {onMoveDown && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
                className={'p-1 rounded ' + (dark ? 'text-slate-400 hover:bg-slate-700 hover:text-slate-200' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600')}
                aria-label="Aşağı"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l7 7 7-7" /></svg>
              </button>
            )}
          </>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className={'p-1.5 rounded-md ' + (dark ? 'text-slate-400 hover:bg-slate-700 hover:text-slate-200' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600')}
          aria-label={tFn('common.edit', locale)}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className={'p-1.5 rounded-md ' + (dark ? 'text-slate-400 hover:bg-red-500/20 hover:text-red-400' : 'text-slate-400 hover:bg-red-50 hover:text-red-600')}
          aria-label={tFn('common.delete', locale)}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function EmptyState({
  dark,
  onAddTask,
  searchQuery,
  completed,
  locale,
  tFn,
}: {
  dark: boolean;
  onAddTask: () => void;
  searchQuery: string;
  completed?: boolean;
  locale: Locale;
  tFn: (key: string, l: Locale) => string;
}) {
  return (
    <div className={'rounded-xl border p-8 text-center ' + (dark ? 'border-slate-700 bg-slate-800/40' : 'border-slate-200 bg-slate-50')}>
      <p className={'text-sm mb-4 ' + (dark ? 'text-slate-400' : 'text-slate-500')}>
        {searchQuery.trim()
          ? tFn('tasks.noMatch', locale)
          : completed
            ? tFn('tasks.noCompleted', locale)
            : tFn('tasks.noTasks', locale)}
      </p>
      {!completed && (
        <button
          type="button"
          onClick={onAddTask}
          className="text-white px-4 py-2 rounded-lg text-sm font-bold"
          style={{ backgroundColor: PRIMARY }}
        >
          {tFn('tasks.newTask', locale)}
        </button>
      )}
    </div>
  );
}
