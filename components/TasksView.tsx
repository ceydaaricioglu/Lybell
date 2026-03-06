'use client';

import { useState, useMemo, useEffect } from 'react';
import { TimelineTask, Category } from '@/lib/types';
import {
  filterRecurringTasks,
  saveTaskToSupabase,
  deleteTaskFromSupabase,
  fetchTasksFromSupabase,
  getMockCategories,
  getDayAbbreviation,
} from '@/lib/helpers';
import { MONTHS_TR } from '@/lib/constants';
import { useLocale } from '@/components/LocaleContext';
import { t, type Locale } from '@/lib/i18n';

const PRIMARY = '#f59e0b';
const BG_LIGHT = '#fbfbfd';
const BG_DARK = '#111621';

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
  const [selectedTask, setSelectedTask] = useState<TimelineTask | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);

  const categories = categoriesFromParent ?? (userId ? getMockCategories(userId) : []);

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
    const mq = typeof window !== 'undefined' ? window.matchMedia('(min-width: 1280px)') : null;
    if (!mq) return;
    const fn = () => setIsDesktop(mq.matches);
    fn();
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, []);

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
    return tasks.filter((t) => !t.completed && parseInt(t.date) < currentDay && !t.recurrence && matchesSearch(t, searchQuery));
  }, [tasks, currentDay, searchQuery]);

  const todayTasks = useMemo(() => {
    const list = filterRecurringTasks(tasks, todayStr).filter((t) => !t.completed && matchesSearch(t, searchQuery));
    return list.sort((a, b) => (a.orderIndex ?? 9999) - (b.orderIndex ?? 9999) || (a.time || '').localeCompare(b.time || ''));
  }, [tasks, todayStr, searchQuery]);

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
    return result.sort((a, b) => parseInt(a.date) - parseInt(b.date) || (a.time || '').localeCompare(b.time || ''));
  }, [tasks, currentDay, searchQuery]);

  const completedTasks = useMemo(() => {
    return tasks.filter((t) => t.completed && matchesSearch(t, searchQuery));
  }, [tasks, searchQuery]);

  const handleToggleTask = async (task: TimelineTask) => {
    if (!task.id) return;
    const updated = { ...task, completed: !task.completed, completedAt: !task.completed ? new Date().toISOString() : undefined };
    await saveTaskToSupabase(userId, updated);
    setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
    if (selectedTask?.id === task.id) setSelectedTask(updated);
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
    if (selectedTask?.id === task.id) setSelectedTask(updatedTask);
    if (selectedTask?.id === other.id) setSelectedTask(updatedOther);
  };

  const handleDeleteInPanel = async () => {
    if (!selectedTask?.id) return;
    await onDeleteTask?.(selectedTask.id);
    setSelectedTask(null);
  };

  const dateLabel = `${getDayAbbreviation(currentDay)}, ${todayStr} ${MONTHS_TR[currentMonth]} ${currentYear}`;

  const handleTaskCardClick = (task: TimelineTask) => {
    if (isDesktop) setSelectedTask(task);
    else onEditTask(task, task.date);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen" style={{ backgroundColor: dark ? BG_DARK : BG_LIGHT }}>
        <div className="text-center">
          <div className={'w-12 h-12 border-4 rounded-full animate-spin mx-auto mb-4 ' + (dark ? 'border-slate-700 border-t-amber-500' : 'border-slate-200 border-t-amber-500')} />
          <p className={dark ? 'text-slate-500' : 'text-slate-500'}>{t('tasks.loading', locale)}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex h-screen overflow-hidden min-h-0"
      style={{ backgroundColor: dark ? BG_DARK : BG_LIGHT }}
    >
      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top header */}
        <header
          className={'h-16 border-b px-4 md:px-8 flex items-center justify-between flex-shrink-0 ' + (dark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-white')}
        >
          <div className="flex items-center flex-1 max-w-md">
            <div className="relative w-full">
              <span
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl pointer-events-none"
                aria-hidden
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('tasks.searchTasks', locale)}
                className={'w-full pl-10 pr-4 py-2 rounded-lg text-sm border-none focus:ring-2 focus:ring-primary/20 ' + (dark ? 'bg-slate-800 text-slate-100 placeholder:text-slate-500' : 'bg-slate-100 text-slate-800 placeholder:text-slate-400')}
                style={{ ['--tw-ring-color' as string]: `${PRIMARY}33` }}
              />
            </div>
          </div>
          <div className="flex items-center gap-4 ml-4">
            <button
              type="button"
              onClick={onBack}
              className={'p-1.5 rounded-lg ' + (dark ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800')}
              aria-label={t('common.back', locale)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              type="button"
              className={'p-1.5 rounded-lg ' + (dark ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800')}
              aria-label={t('common.notifications', locale)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
          </div>
        </header>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className={'text-3xl font-black tracking-tight ' + (dark ? 'text-white' : 'text-slate-900')}>
                  {activeTab === 'today' ? t('tasks.today', locale) : activeTab === 'upcoming' ? t('tasks.upcoming', locale) : t('tasks.completed', locale)}
                </h2>
                <p className={dark ? 'text-slate-500 mt-1' : 'text-slate-500 mt-1'}>{dateLabel}</p>
              </div>
              <button
                type="button"
                onClick={onAddTask}
                className="flex items-center gap-2 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-sm hover:opacity-95 transition-opacity"
                style={{ backgroundColor: PRIMARY }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {t('tasks.newTask', locale)}
              </button>
            </div>

            {/* Tabs */}
            <div className={'flex border-b mb-6 ' + (dark ? 'border-slate-700' : 'border-slate-200')}>
              {(['today', 'upcoming', 'completed'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={'px-4 py-2 text-sm font-medium capitalize ' + (activeTab === tab ? 'border-b-2 font-bold' : dark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-500 hover:text-slate-700')}
                  style={activeTab === tab ? { borderBottomColor: PRIMARY, color: PRIMARY } : undefined}
                >
                  {tab === 'today' ? t('tasks.today', locale) : tab === 'upcoming' ? t('tasks.upcoming', locale) : t('tasks.completed', locale)}
                </button>
              ))}
            </div>

            {/* Task list */}
            <div className="space-y-8">
              {activeTab === 'today' && (
                <>
                  {overdueTasks.length > 0 && (
                    <section>
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
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
                            onSelect={() => handleTaskCardClick(task)}
                            onDelete={() => task.id && onDeleteTask?.(task.id)}
                          />
                        ))}
                      </div>
                    </section>
                  )}
                  <section>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
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
                            onSelect={() => handleTaskCardClick(task)}
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
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">{t('tasks.upcoming', locale)}</h3>
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
                          onSelect={() => handleTaskCardClick(task)}
                          onDelete={() => task.id && onDeleteTask?.(task.id)}
                        />
                      ))}
                    </div>
                  )}
                </section>
              )}

              {activeTab === 'completed' && (
                <section>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">{t('tasks.completed', locale)}</h3>
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
                          onSelect={() => handleTaskCardClick(task)}
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
      </main>

      {/* Right panel - Task Details (xl) */}
      {selectedTask && (
        <aside
          className={'w-80 border-l flex-shrink-0 hidden xl:flex flex-col overflow-hidden ' + (dark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white')}
        >
          <div className={'p-6 border-b flex items-center justify-between ' + (dark ? 'border-slate-800' : 'border-slate-100')}>
            <h3 className={'font-bold ' + (dark ? 'text-slate-200' : 'text-slate-800')}>{t('tasks.taskDetails', locale)}</h3>
            <button
              type="button"
              onClick={() => setSelectedTask(null)}
              className={'p-1 rounded-lg ' + (dark ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600')}
              aria-label={t('common.close', locale)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-2">{t('tasks.title', locale)}</label>
                <p className={'text-lg font-bold ' + (dark ? 'text-slate-100' : 'text-slate-800')}>{selectedTask.title}</p>
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-2">{t('tasks.description', locale)}</label>
                <p className={'text-sm ' + (dark ? 'text-slate-400' : 'text-slate-600')}>
                  {selectedTask.description || t('tasks.noDescription', locale)}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-2">{t('tasks.dueDate', locale)}</label>
                <div
                  className={'flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium ' + (dark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700')}
                >
                  {formatDueLabel(selectedTask, currentDay, currentMonth, currentYear, locale, t)}
                </div>
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-2">{t('tasks.priority', locale)}</label>
                <div
                  className={'px-3 py-2 rounded-lg text-xs font-bold capitalize ' + (selectedTask.priority === 'high' ? (dark ? 'bg-red-500/20 text-red-400' : 'bg-red-50 text-red-600') : (dark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'))}
                >
                  {selectedTask.priority === 'high' ? t('tasks.high', locale) : selectedTask.priority === 'low' ? t('tasks.low', locale) : t('tasks.medium', locale)}
                </div>
              </div>
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-2">{t('tasks.category', locale)}</label>
              <div
                className={'flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ' + (dark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700')}
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: getCategoryColor(selectedTask.category, categories) }}
                />
                {getCategoryName(selectedTask.category, categories) || '—'}
              </div>
            </div>
            {selectedTask.subtasks && selectedTask.subtasks.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{t('tasks.subtasks', locale)}</label>
                </div>
                <div className="space-y-2">
                  {selectedTask.subtasks.map((st) => (
                    <div
                      key={st.id}
                      className={'flex items-center gap-3 p-2 rounded-lg ' + (dark ? 'hover:bg-slate-800' : 'hover:bg-slate-100') + ' ' + (st.completed ? (dark ? 'text-slate-500' : 'text-slate-400') : '')}
                      style={st.completed ? { textDecoration: 'line-through' } : undefined}
                    >
                      <span className={'text-xs flex-1 ' + (st.completed ? 'line-through' : '')}>{st.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className={'pt-6 border-t flex items-center justify-between ' + (dark ? 'border-slate-800' : 'border-slate-100')}>
              <button
                type="button"
                onClick={handleDeleteInPanel}
                className="flex items-center gap-2 text-red-500 hover:text-red-600 text-sm font-bold"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                {t('tasks.deleteTask', locale)}
              </button>
              <button
                type="button"
                onClick={() => onEditTask(selectedTask, selectedTask.date)}
                className="text-white px-4 py-2 rounded-lg text-sm font-bold"
                style={{ backgroundColor: PRIMARY }}
              >
                {t('tasks.editTask', locale)}
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* Mobile: show task details in a slide-over or keep panel hidden; xl shows sidebar. On small screens we don't show the right panel, user can tap task to open edit. */}
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
