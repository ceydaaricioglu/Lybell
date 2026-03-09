'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { TimelineTask, Category } from '@cursor-deneme/shared';
import {
  filterRecurringTasks,
  saveTaskToSupabase,
  deleteTaskFromSupabase,
  fetchTasksFromSupabase,
  getMockCategories,
  getDayAbbreviation,
  DEFAULT_TAGS,
} from '@cursor-deneme/shared';
import { MONTHS_TR } from '@cursor-deneme/shared';
import { useLocale } from '@/components/LocaleContext';
import { t, type Locale } from '@cursor-deneme/shared';
import EisenhowerView from '@/components/EisenhowerView';

const PRIMARY = '#f97316';
const BG_LIGHT = '#f8fafc';
const BG_DARK = '#221610';

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
  onViewCalendar?: () => void;
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
  onViewCalendar,
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
  const [activeTab, setActiveTab] = useState<'today' | 'upcoming' | 'completed' | 'eisenhower'>('today');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [recurrenceFilter, setRecurrenceFilter] = useState<'all' | 'recurring' | 'one-time'>('all');
  const [tagFilter, setTagFilter] = useState<string>('all');
  const [openFilterMenu, setOpenFilterMenu] = useState<'priority' | 'recurrence' | 'tag' | null>(null);
  const filterMenuRef = useRef<HTMLDivElement>(null);

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
    if (tagFilter !== 'all') {
      out = out.filter((t) => Array.isArray(t.tags) && t.tags.includes(tagFilter));
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

  useEffect(() => {
    if (!openFilterMenu) return;
    const onPointerDown = (e: PointerEvent) => {
      if (filterMenuRef.current?.contains(e.target as Node)) return;
      setOpenFilterMenu(null);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [openFilterMenu]);

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
  }, [tasks, currentDay, searchQuery, isPro, priorityFilter, recurrenceFilter, tagFilter]);

  const todayTasks = useMemo(() => {
    const list = filterRecurringTasks(tasks, todayStr).filter((t) => !t.completed && matchesSearch(t, searchQuery));
    const filtered = applyProFilters(list);
    return filtered.sort((a, b) => (a.orderIndex ?? 9999) - (b.orderIndex ?? 9999) || (a.time || '').localeCompare(b.time || ''));
  }, [tasks, todayStr, searchQuery, isPro, priorityFilter, recurrenceFilter, tagFilter]);

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
  }, [tasks, currentDay, searchQuery, isPro, priorityFilter, recurrenceFilter, tagFilter]);

  const completedTasks = useMemo(() => {
    const base = tasks.filter((t) => t.completed && matchesSearch(t, searchQuery));
    return applyProFilters(base);
  }, [tasks, searchQuery, isPro, priorityFilter, recurrenceFilter, tagFilter]);

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
    <div className="flex flex-col flex-1 min-h-0 relative bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100" style={{ backgroundColor: dark ? BG_DARK : BG_LIGHT }}>
      <div className="flex flex-col flex-1 min-h-0 max-w-md mx-auto w-full overflow-hidden">
        {/* Header - Görevler tasarımı */}
        <header className="flex items-center justify-between px-6 pt-6 pb-2 bg-white flex-shrink-0" style={dark ? { backgroundColor: '#221610' } : undefined}>
          <div className="flex items-center gap-3">
            <button type="button" onClick={onBack} className="p-2 -ml-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" aria-label={t('common.back', locale)}>
              <span className="material-symbols-outlined text-slate-600 dark:text-slate-400 text-2xl">menu</span>
            </button>
            <h1 className="text-xl font-bold tracking-tight" style={{ color: dark ? '#f5f0ea' : '#1a1a1a' }}>{t('tasks.title', locale)}</h1>
          </div>
          <div className="flex items-center">
            <button type="button" onClick={onViewCalendar} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" aria-label={t('calendar.title', locale)}>
              <span className="material-symbols-outlined text-slate-600 dark:text-slate-400">calendar_month</span>
            </button>
          </div>
        </header>

        {/* Tabs - segment (pill) kontrolü */}
        <div className="px-4 sm:px-6 pt-3 pb-2 flex-shrink-0">
          <div
            className={`inline-flex rounded-xl p-1 w-full max-w-md ${dark ? '' : 'bg-slate-100'}`}
            style={dark ? { backgroundColor: '#2a1f1a' } : undefined}
          >
            {(['today', 'upcoming', 'completed'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`flex-1 min-w-0 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === tab ? 'shadow-sm' : 'opacity-80 hover:opacity-100'
                }`}
                style={
                  activeTab === tab
                    ? dark
                      ? { backgroundColor: '#3d2a1f', color: '#f5f0ea' }
                      : { backgroundColor: 'white', color: '#1a1a1a', boxShadow: '0 1px 2px rgba(0,0,0,0.06)' }
                    : dark
                      ? { color: '#b8a99e' }
                      : { color: '#64748b' }
                }
              >
                {tab === 'today' ? t('tasks.today', locale) : tab === 'upcoming' ? t('tasks.upcoming', locale) : t('tasks.completed', locale)}
              </button>
            ))}
            {isPro && (
              <button
                type="button"
                onClick={() => setActiveTab('eisenhower')}
                className={`flex-1 min-w-0 py-2.5 px-2 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === 'eisenhower' ? 'shadow-sm' : 'opacity-80 hover:opacity-100'
                }`}
                style={
                  activeTab === 'eisenhower'
                    ? dark
                      ? { backgroundColor: '#3d2a1f', color: '#f5f0ea' }
                      : { backgroundColor: 'white', color: '#1a1a1a', boxShadow: '0 1px 2px rgba(0,0,0,0.06)' }
                    : dark
                      ? { color: '#b8a99e' }
                      : { color: '#64748b' }
                }
              >
                Eisenhower
              </button>
            )}
          </div>
        </div>

        {/* Pro filtreler - 3 açılır menü */}
        {isPro && (
          <div className="px-4 sm:px-6 py-2 flex-shrink-0 flex flex-wrap items-center gap-2" ref={filterMenuRef}>
            <span className={`text-xs font-medium w-full sm:w-auto ${dark ? 'text-zinc-400' : 'text-slate-500'}`}>
              {locale === 'tr' ? 'Filtreler' : 'Filters'}:
            </span>
            {/* Öncelik */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenFilterMenu((v) => (v === 'priority' ? null : 'priority'))}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  dark ? 'border-zinc-600 bg-[#2a1f1a]' : 'border-slate-200 bg-white'
                } ${openFilterMenu === 'priority' ? 'ring-2 ring-offset-1' : ''}`}
                style={
                  openFilterMenu === 'priority'
                    ? { borderColor: PRIMARY, color: dark ? '#f5f0ea' : '#1a1a1a', boxShadow: `0 0 0 2px ${PRIMARY}40` }
                    : dark
                      ? { color: '#b8a99e' }
                      : { color: '#475569' }
                }
              >
                {priorityFilter === 'all' ? (locale === 'tr' ? 'Öncelik' : 'Priority') : t(`tasks.${priorityFilter}` as 'tasks.high', locale)}
                <span className="material-symbols-outlined text-base opacity-70">expand_more</span>
              </button>
              {openFilterMenu === 'priority' && (
                <div
                  className={`absolute top-full left-0 mt-1 py-1 rounded-lg shadow-lg border min-w-[140px] z-50 ${
                    dark ? 'bg-[#2a1f1a] border-zinc-600' : 'bg-white border-slate-200'
                  }`}
                >
                  {(['all', 'high', 'medium', 'low'] as const).map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setPriorityFilter(key);
                        setOpenFilterMenu(null);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm ${dark ? 'hover:bg-[#3d2a1f]' : 'hover:bg-slate-50'} ${priorityFilter === key ? 'font-semibold' : ''}`}
                      style={priorityFilter === key ? { color: PRIMARY } : dark ? { color: '#e8e0d8' } : { color: '#334155' }}
                    >
                      {key === 'all' ? (locale === 'tr' ? 'Tümü' : 'All') : t(`tasks.${key}` as 'tasks.high', locale)}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {/* Tekrar */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenFilterMenu((v) => (v === 'recurrence' ? null : 'recurrence'))}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  dark ? 'border-zinc-600 bg-[#2a1f1a]' : 'border-slate-200 bg-white'
                } ${openFilterMenu === 'recurrence' ? 'ring-2 ring-offset-1' : ''}`}
                style={{
                  ...(openFilterMenu === 'recurrence' ? { borderColor: PRIMARY, color: dark ? '#f5f0ea' : '#1a1a1a', boxShadow: `0 0 0 2px ${PRIMARY}40` } : {}),
                  ...(openFilterMenu !== 'recurrence' && dark ? { color: '#b8a99e' } : openFilterMenu !== 'recurrence' ? { color: '#475569' } : {}),
                }}
              >
                {recurrenceFilter === 'all'
                  ? (locale === 'tr' ? 'Tekrar' : 'Recurrence')
                  : recurrenceFilter === 'recurring'
                    ? locale === 'tr'
                      ? 'Tekrarlayan'
                      : 'Recurring'
                    : locale === 'tr'
                      ? 'Tekrarsız'
                      : 'One-time'}
                <span className="material-symbols-outlined text-base opacity-70">expand_more</span>
              </button>
              {openFilterMenu === 'recurrence' && (
                <div
                  className={`absolute top-full left-0 mt-1 py-1 rounded-lg shadow-lg border min-w-[160px] z-50 ${
                    dark ? 'bg-[#2a1f1a] border-zinc-600' : 'bg-white border-slate-200'
                  }`}
                >
                  {(['all', 'recurring', 'one-time'] as const).map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setRecurrenceFilter(key);
                        setOpenFilterMenu(null);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm ${dark ? 'hover:bg-[#3d2a1f]' : 'hover:bg-slate-50'} ${recurrenceFilter === key ? 'font-semibold' : ''}`}
                      style={recurrenceFilter === key ? { color: PRIMARY } : dark ? { color: '#e8e0d8' } : { color: '#334155' }}
                    >
                      {key === 'all' ? (locale === 'tr' ? 'Tümü' : 'All') : key === 'recurring' ? (locale === 'tr' ? 'Tekrarlayan' : 'Recurring') : locale === 'tr' ? 'Tekrarsız' : 'One-time'}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {/* Etiket */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenFilterMenu((v) => (v === 'tag' ? null : 'tag'))}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  dark ? 'border-zinc-600 bg-[#2a1f1a]' : 'border-slate-200 bg-white'
                } ${openFilterMenu === 'tag' ? 'ring-2 ring-offset-1' : ''}`}
                style={
                  openFilterMenu === 'tag'
                    ? { borderColor: PRIMARY, color: dark ? '#f5f0ea' : '#1a1a1a', boxShadow: `0 0 0 2px ${PRIMARY}40` }
                    : dark
                      ? { color: '#b8a99e' }
                      : { color: '#475569' }
                }
              >
                {tagFilter === 'all' ? (locale === 'tr' ? 'Etiket' : 'Tag') : DEFAULT_TAGS.find((x) => x.id === tagFilter)?.name ?? tagFilter}
                <span className="material-symbols-outlined text-base opacity-70">expand_more</span>
              </button>
              {openFilterMenu === 'tag' && (
                <div
                  className={`absolute top-full left-0 mt-1 py-1 rounded-lg shadow-lg border min-w-[160px] max-h-56 overflow-y-auto z-50 ${
                    dark ? 'bg-[#2a1f1a] border-zinc-600' : 'bg-white border-slate-200'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setTagFilter('all');
                      setOpenFilterMenu(null);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm ${dark ? 'hover:bg-[#3d2a1f]' : 'hover:bg-slate-50'} ${tagFilter === 'all' ? 'font-semibold' : ''}`}
                    style={tagFilter === 'all' ? { color: PRIMARY } : dark ? { color: '#e8e0d8' } : { color: '#334155' }}
                  >
                    {locale === 'tr' ? 'Tümü' : 'All'}
                  </button>
                  {DEFAULT_TAGS.map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => {
                        setTagFilter(tagFilter === tag.id ? 'all' : tag.id);
                        setOpenFilterMenu(null);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm ${dark ? 'hover:bg-[#3d2a1f]' : 'hover:bg-slate-50'} ${tagFilter === tag.id ? 'font-semibold' : ''}`}
                      style={tagFilter === tag.id ? { color: PRIMARY } : dark ? { color: '#e8e0d8' } : { color: '#334155' }}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Task list */}
        <div className="flex-1 overflow-auto px-6 py-4 pb-28 space-y-6">
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
                  <section className={todayTasks.length === 0 && overdueTasks.length === 0 ? 'flex-1 flex flex-col min-h-0' : ''}>
                    {todayTasks.length === 0 && overdueTasks.length === 0 ? (
                      <EmptyState dark={dark} onAddTask={onAddTask} searchQuery={searchQuery} locale={locale} tFn={t} />
                    ) : (
                      <>
                    <h3 className={`text-xs font-bold uppercase tracking-widest mb-4 ${dark ? 'text-zinc-400' : 'text-stone-500'}`}>
                      {activeTab === 'today' ? t('tasks.todayTasks', locale) : t('nav.tasks', locale)}
                    </h3>
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
                    </>
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

          {isPro && activeTab === 'eisenhower' && (
                <section>
                  <EisenhowerView
                    tasks={tasks}
                    categories={categories}
                    darkMode={dark}
                    onEditTask={onEditTask}
                    onAddTask={onAddTask}
                    onToggleTask={handleToggleTask}
                  />
                </section>
              )}
        </div>

        {/* Floating Action Button - nav'ın üstünde görünsün (z-nav < z-fab) */}
        <div className="absolute bottom-20 right-6 z-40">
          <button
            type="button"
            onClick={onAddTask}
            className="flex items-center justify-center rounded-xl h-14 px-6 text-white font-bold shadow-lg hover:brightness-110 transition-all gap-3"
            style={{ backgroundColor: PRIMARY, boxShadow: `0 10px 40px -10px ${PRIMARY}4D` }}
          >
            <span className="material-symbols-outlined">add</span>
            <span>{t('tasks.newTask', locale)}</span>
          </button>
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
  const isSearch = searchQuery.trim().length > 0;
  return (
    <div className="flex flex-1 flex-col px-6 py-12 items-center justify-center">
      <div className="flex flex-col items-center gap-8 w-full">
        <div className={'w-48 h-48 rounded-full flex items-center justify-center relative overflow-hidden ' + (dark ? 'bg-slate-800' : 'bg-slate-50')}>
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent" />
          <span className="material-symbols-outlined text-6xl text-slate-200 dark:text-slate-700">task_alt</span>
        </div>
        <div className="flex flex-col items-center gap-2 text-center">
          <p className={'text-lg font-bold ' + (dark ? 'text-slate-100' : 'text-slate-900')}>
            {isSearch ? tFn('tasks.noMatch', locale) : completed ? tFn('tasks.noCompleted', locale) : (locale === 'tr' ? 'Henüz görev yok' : 'No tasks yet')}
          </p>
          <p className={'text-sm font-normal max-w-[280px] ' + (dark ? 'text-slate-400' : 'text-slate-500')}>
            {isSearch
              ? (locale === 'tr' ? 'Arama kriterlerine uygun görev bulunamadı.' : 'No tasks match your search.')
              : completed
                ? (locale === 'tr' ? 'Tamamlanan görevler burada listelenir.' : 'Completed tasks will appear here.')
                : (locale === 'tr' ? 'Bugün için planlanmış bir göreviniz bulunmuyor. Yeni bir başlangıç yapın.' : "You don't have any tasks planned for today. Start fresh.")}
          </p>
        </div>
        {!completed && (
          <button
            type="button"
            onClick={onAddTask}
            className={'flex min-w-[120px] items-center justify-center rounded-lg h-11 px-6 text-sm font-bold transition-colors ' + (dark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200')}
          >
            {tFn('tasks.newTask', locale)}
          </button>
        )}
      </div>
    </div>
  );
}
