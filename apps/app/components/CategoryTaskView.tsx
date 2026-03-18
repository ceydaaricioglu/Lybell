'use client';

import { useState, useEffect, useMemo } from 'react';
import { Category, TimelineTask } from '@cursor-deneme/shared';
import { getMockCategories, fetchTasksFromSupabase, saveTaskToSupabase, createListShare } from '@cursor-deneme/shared';
import { getCategoryColor as getCategoryColorFromConstants, MONTHS_TR } from '@cursor-deneme/shared';
import { CategoryIcon } from '@/lib/categoryIcons';
import { useToast } from '@/components/Toast';
import { useLocale } from '@/components/LocaleContext';
import { t } from '@cursor-deneme/shared';

interface CategoryTaskViewProps {
  category: string;
  onBack: () => void;
  userId: string;
  isPro?: boolean;
  /** Optimistic silme: bu id'ler siliniyor gibi listeden gizlenir */
  deletingTaskIds?: Set<string>;
  onEditTask: (task: TimelineTask, viewingDate?: string) => void;
  /** Liste içinden yeni görev eklerken çağrılır; böylece açılan formda liste otomatik seçili olur */
  onAddTask?: (categoryId: string) => void;
  onStartPomodoro?: (task: TimelineTask) => void;
  /** Merkezi cache: verilirse kullanılır */
  tasks?: TimelineTask[];
  setTasks?: React.Dispatch<React.SetStateAction<TimelineTask[]>>;
  /** Merkezi kategori listesi */
  categories?: Category[];
}

export default function CategoryTaskView({ category, onBack, userId, isPro = false, deletingTaskIds, onEditTask, onAddTask, onStartPomodoro, tasks: tasksFromParent, setTasks: setTasksFromParent, categories: categoriesFromParent }: CategoryTaskViewProps) {
  const { showToast } = useToast();
  const { locale } = useLocale();
  const [sharing, setSharing] = useState(false);
  const [localTasks, setLocalTasks] = useState<TimelineTask[]>([]);
  const tasks = tasksFromParent ?? localTasks;
  const setTasks = setTasksFromParent ?? setLocalTasks;
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const categories = categoriesFromParent ?? getMockCategories(userId);
  const categoryData = categories.find(c => c.id === category);
  const colors = useMemo(() => getCategoryColorFromConstants(categoryData?.color), [categoryData?.color]);

  const handleShare = async () => {
    setSharing(true);
    try {
      const token = await createListShare(userId, category);
      if (token) {
        const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/share?t=${token}`;
        await navigator.clipboard.writeText(url);
        showToast(locale === 'tr' ? 'Paylaşım linki kopyalandı' : 'Share link copied', 'success');
      } else {
        showToast(locale === 'tr' ? 'Paylaşım oluşturulamadı' : 'Could not create share', 'error');
      }
    } catch {
      showToast(locale === 'tr' ? 'Paylaşım oluşturulamadı' : 'Could not create share', 'error');
    } finally {
      setSharing(false);
    }
  };

  const loadTasks = async () => {
    setLoading(true);
    const loadedTasks = await fetchTasksFromSupabase(userId);
    setTasks(loadedTasks);
    setLoading(false);
  };

  useEffect(() => {
    if (tasksFromParent !== undefined) {
      setLoading(false);
      return;
    }
    loadTasks();
  }, [userId, category, tasksFromParent]);

  const handleToggleTask = async (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const updatedTask = { ...task, completed: !task.completed };
    await saveTaskToSupabase(userId, updatedTask);
    setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
  };

  // Kategoriye ait tüm görevler (siliniyor olanları gizle)
  const allCategoryTasks = tasks.filter((task) => task.category === category);
  const visibleCategoryTasks = deletingTaskIds?.size
    ? allCategoryTasks.filter((t) => !t.id || !deletingTaskIds.has(t.id))
    : allCategoryTasks;
  const totalTasks = visibleCategoryTasks.length;
  const completedCount = visibleCategoryTasks.filter(t => t.completed).length;
  const progressPercent = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  const matchesSearch = (t: TimelineTask) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    return t.title.toLowerCase().includes(q) || (t.description?.toLowerCase().includes(q) ?? false);
  };

  const searchFiltered = useMemo(
    () => visibleCategoryTasks.filter(matchesSearch),
    [visibleCategoryTasks, searchQuery]
  );

  const toDoTasks = useMemo(
    () =>
      searchFiltered
        .filter((t) => !t.completed && !(t.subtasks && t.subtasks.length > 0 && t.subtasks.some((s) => s.completed)))
        .sort((a, b) => (a.orderIndex ?? 9999) - (b.orderIndex ?? 9999) || (a.time || '').localeCompare(b.time || '')),
    [searchFiltered]
  );
  const inProgressTasks = useMemo(
    () =>
      searchFiltered
        .filter((t) => !t.completed && t.subtasks && t.subtasks.length > 0 && t.subtasks.some((s) => s.completed))
        .sort((a, b) => (a.orderIndex ?? 9999) - (b.orderIndex ?? 9999) || (a.time || '').localeCompare(b.time || '')),
    [searchFiltered]
  );
  const completedTasks = useMemo(
    () =>
      searchFiltered
        .filter((t) => t.completed)
        .sort((a, b) => (a.orderIndex ?? 9999) - (b.orderIndex ?? 9999) || (a.time || '').localeCompare(b.time || '')),
    [searchFiltered]
  );

  const displayTasks = searchFiltered;

  const formatTaskDate = (task: TimelineTask) => {
    const day = task.date ? parseInt(task.date, 10) : currentDay;
    const month = MONTHS_TR[currentMonth] ?? '';
    const short = month.slice(0, 3);
    return `${short} ${day}`;
  };

  const BRAND = '#1A2332';

  const TaskRow = ({ task }: { task: TimelineTask }) => {
    const overdue = parseInt(task.date, 10) < currentDay && !task.completed;
    const priority = (task.priority ?? 'medium') as 'high' | 'medium' | 'low';
    const priorityPill =
      priority === 'high'
        ? 'bg-red-50 text-red-600'
        : priority === 'low'
          ? 'bg-blue-50 text-blue-600'
          : 'bg-slate-100 text-slate-600';
    return (
      <button
        type="button"
        onClick={() => onEditTask(task, task.date)}
        className="w-full text-left flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
      >
        <button
          type="button"
          onClick={(e) => handleToggleTask(task.id!, e)}
          className="w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0"
          style={{
            borderColor: task.completed ? BRAND : '#cbd5e1',
            backgroundColor: task.completed ? BRAND : 'transparent',
          }}
          aria-label={task.completed ? 'Tamamlandı' : 'Tamamla'}
        >
          {task.completed && (
            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`font-semibold text-sm truncate ${task.completed ? 'line-through text-slate-400' : 'text-slate-900'}`}>
              {task.title}
            </span>
            {!task.completed && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${priorityPill}`}>
                {priority === 'high' ? t('tasks.high', locale) : priority === 'low' ? t('tasks.low', locale) : t('tasks.medium', locale)}
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
            <span className={overdue ? 'text-red-600 font-semibold' : ''}>{formatTaskDate(task)} · {task.time}</span>
          </div>
        </div>

        <span className="material-symbols-outlined text-slate-400">chevron_right</span>
      </button>
    );
  };

  const circleRadius = 40;
  const circumference = 2 * Math.PI * circleRadius;
  const progressOffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className="flex flex-col flex-1 min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <header className="px-6 pt-10 pb-6 bg-white/95 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="p-2 -ml-2 rounded-xl hover:bg-slate-100 text-slate-600"
            aria-label="Geri"
          >
            <span className="material-symbols-outlined text-[22px]">arrow_back</span>
          </button>
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 truncate">
              {categoryData?.name || category}
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em]">
              {totalTasks} {locale === 'tr' ? 'görev' : 'tasks'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {isPro && (
            <button
              type="button"
              onClick={handleShare}
              disabled={sharing}
              className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-400 border border-slate-200 shadow-sm hover:text-slate-900 transition-colors disabled:opacity-60"
              aria-label={locale === 'tr' ? 'Listeyi paylaş' : 'Share list'}
            >
              {sharing ? (
                <span className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <span className="material-symbols-outlined text-[20px]">ios_share</span>
              )}
            </button>
          )}
          <button
            type="button"
            onClick={() => (onAddTask ? onAddTask(category) : undefined)}
            className="bg-slate-900 text-white px-4 py-2.5 rounded-2xl font-bold text-sm shadow-lg shadow-slate-200 active:scale-[0.98] transition-all"
          >
            {locale === 'tr' ? 'Ekle' : 'Add'}
          </button>
        </div>
      </header>

      <main className="flex-1 px-6 space-y-6 pb-32 pt-6">
        {/* Search */}
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            <span className="material-symbols-outlined text-[20px]">search</span>
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={locale === 'tr' ? 'Görevlerde ara...' : 'Search tasks...'}
            className="w-full h-12 pl-12 pr-4 rounded-2xl border border-slate-200 bg-white focus:ring-2 focus:ring-slate-900 focus:border-slate-900 text-sm shadow-sm transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Progress summary */}
        <section className="bg-slate-900 p-6 rounded-[2rem] shadow-xl shadow-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">{locale === 'tr' ? 'Proje Özeti' : 'Overview'}</h2>
              <p className="text-sm text-slate-400 font-medium">
                {completedCount}/{totalTasks} {locale === 'tr' ? 'tamamlandı' : 'completed'}
              </p>
            </div>
            <div className="relative w-16 h-16">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle className="text-slate-700 stroke-current" cx="50" cy="50" fill="transparent" r={circleRadius} strokeWidth="10" />
                <circle
                  className="text-white stroke-current"
                  cx="50"
                  cy="50"
                  fill="transparent"
                  r={circleRadius}
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={progressOffset}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold text-white">{progressPercent}%</span>
              </div>
            </div>
          </div>
        </section>

        {/* Sections */}
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-8">
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  {locale === 'tr' ? 'Yapılacaklar' : 'To do'}
                </h3>
                <span className="text-xs font-bold text-slate-400">{toDoTasks.length}</span>
              </div>
              {toDoTasks.length === 0 ? (
                <p className="text-sm text-slate-400">{locale === 'tr' ? 'Görev yok' : 'No tasks'}</p>
              ) : (
                <div className="space-y-3">
                  {toDoTasks.map((task) => task.id ? <TaskRow key={task.id} task={task} /> : null)}
                </div>
              )}
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  {locale === 'tr' ? 'Devam Eden' : 'In progress'}
                </h3>
                <span className="text-xs font-bold text-slate-400">{inProgressTasks.length}</span>
              </div>
              {inProgressTasks.length === 0 ? (
                <p className="text-sm text-slate-400">{locale === 'tr' ? 'Görev yok' : 'No tasks'}</p>
              ) : (
                <div className="space-y-3">
                  {inProgressTasks.map((task) => task.id ? <TaskRow key={task.id} task={task} /> : null)}
                </div>
              )}
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  {locale === 'tr' ? 'Tamamlanan' : 'Completed'}
                </h3>
                <span className="text-xs font-bold text-slate-400">{completedTasks.length}</span>
              </div>
              {completedTasks.length === 0 ? (
                <p className="text-sm text-slate-400">{locale === 'tr' ? 'Henüz yok' : 'None yet'}</p>
              ) : (
                <div className="space-y-3">
                  {completedTasks.map((task) => task.id ? <TaskRow key={task.id} task={task} /> : null)}
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
