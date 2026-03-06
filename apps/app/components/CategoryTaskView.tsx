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

  const PRIMARY = '#2463eb';
  const BG_LIGHT = '#f6f6f8';
  const ACCENT_ORANGE = '#f97316';
  const ACCENT_YELLOW = '#eab308';

  const renderTaskCard = (task: TimelineTask, isInProgressColumn: boolean) => {
    const isOverdue = parseInt(task.date, 10) < currentDay && !task.completed;
    const priority = task.priority ?? 'medium';
    const priorityClass =
      priority === 'high'
        ? 'bg-red-100 text-red-600'
        : priority === 'low'
          ? 'bg-blue-100 text-blue-600'
          : 'bg-amber-100 text-amber-600';
    return (
      <div
        key={task.id}
        role="button"
        tabIndex={0}
        onClick={() => onEditTask(task, task.date)}
        onKeyDown={(e) => e.key === 'Enter' && onEditTask(task, task.date)}
        className={
          'bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow cursor-grab ' +
          (task.completed
            ? 'bg-white/80 opacity-80 line-through'
            : isInProgressColumn
              ? 'border-l-4 border-l-[#2463eb]'
              : '')
        }
      >
        <div className="flex justify-between mb-2">
          <span className={'px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ' + (task.completed ? 'bg-slate-100 text-slate-500' : priorityClass)}>
            {task.completed ? t('tasks.low', locale) : priority === 'high' ? t('tasks.high', locale) : priority === 'low' ? t('tasks.low', locale) : t('tasks.medium', locale)}
          </span>
          {!task.completed && (
            <span className="text-slate-300" aria-hidden>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 6h2v12H8V6zm6 0h2v12h-2V6z" /></svg>
            </span>
          )}
        </div>
        <h4 className={'font-semibold text-sm mb-4 ' + (task.completed ? 'text-slate-500' : 'text-slate-900')}>{task.title}</h4>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-slate-400 text-xs">
            {task.completed ? (
              <>
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span>{t('tasks.done', locale)}</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                <span>{formatTaskDate(task)}</span>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  const circleRadius = 40;
  const circumference = 2 * Math.PI * circleRadius;
  const progressOffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className="flex h-screen overflow-hidden bg-[#f6f6f8] min-w-0">
      <main className="flex-1 flex flex-col overflow-hidden min-w-0 bg-[#f6f6f8]">
        {/* Top Header - beyaz, sol sidebar çizgisiyle birleşik */}
        <header className="bg-white px-3 sm:px-4 md:px-6 py-3 border-b border-slate-200 flex items-center justify-between gap-2 sm:gap-3 flex-shrink-0 min-w-0">
          <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
            <button
              type="button"
              onClick={onBack}
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 flex-shrink-0"
              aria-label="Geri"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <h2 className="text-lg md:text-xl font-bold text-slate-900 line-clamp-2 min-w-0 break-words">{categoryData?.name || category}</h2>
            <span className="hidden sm:inline-flex px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider flex-shrink-0">
              {t('project.private', locale)}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="relative hidden sm:block">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('project.searchTasks', locale)}
                className="pl-8 pr-3 py-1.5 bg-slate-100 border-none rounded-lg focus:ring-2 focus:ring-[#2463eb] w-28 md:w-44 text-sm text-slate-900 placeholder:text-slate-400"
              />
            </div>
            {isPro && (
              <button
                type="button"
                onClick={handleShare}
                disabled={sharing}
                className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-2.5 py-1.5 rounded-lg font-medium text-xs flex items-center gap-1.5 transition-all flex-shrink-0 disabled:opacity-50"
                aria-label={locale === 'tr' ? 'Listeyi paylaş' : 'Share list'}
              >
                {sharing ? (
                  <span className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                )}
                {locale === 'tr' ? 'Paylaş' : 'Share'}
              </button>
            )}
            <button
              type="button"
              onClick={() => { onAddTask ? onAddTask(category) : onEditTask({} as TimelineTask); }}
              className="bg-[#2463eb] text-white px-3 md:px-4 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 hover:opacity-90 transition-all flex-shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              {t('project.newTask', locale)}
            </button>
          </div>
        </header>

        {/* Board View - açık gri alan */}
        <div className="flex-1 overflow-x-auto p-4 md:p-6 flex gap-6 min-h-0 bg-[#f6f6f8]">
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
                  <div className="w-12 h-12 border-4 border-slate-200 border-t-[#2463eb] rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* To Do */}
              <div className="w-80 flex-shrink-0 flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-4 px-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-700">{t('project.toDo', locale)}</h3>
                    <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-xs font-bold">{toDoTasks.length}</span>
                  </div>
                </div>
                <div className="space-y-4 overflow-y-auto pr-2 flex-1 min-h-0">
                  {toDoTasks.map((t) => renderTaskCard(t, false))}
                </div>
              </div>
              {/* In Progress */}
              <div className="w-80 flex-shrink-0 flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-4 px-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-700">{t('project.inProgress', locale)}</h3>
                    <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-xs font-bold">{inProgressTasks.length}</span>
                  </div>
                </div>
                <div className="space-y-4 overflow-y-auto pr-2 flex-1 min-h-0">
                  {inProgressTasks.map((t) => renderTaskCard(t, true))}
                </div>
              </div>
              {/* Completed */}
              <div className="w-80 flex-shrink-0 flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-4 px-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-700">{t('project.completed', locale)}</h3>
                    <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-xs font-bold">{completedTasks.length}</span>
                  </div>
                </div>
                <div className="space-y-4 overflow-y-auto pr-2 flex-1 min-h-0">
                  {completedTasks.map((t) => renderTaskCard(t, false))}
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Right Sidebar - Project Overview (xl) */}
      <aside className="w-64 bg-white border-l border-slate-200 overflow-y-auto hidden xl:flex flex-col flex-shrink-0">
        <div className="p-5">
          <h3 className="text-base font-bold mb-4 text-slate-900">{t('project.overview', locale)}</h3>
          <div className="relative flex flex-col items-center mb-6">
            <div className="relative w-32 h-32">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle className="text-slate-100 stroke-current" cx="50" cy="50" fill="transparent" r={circleRadius} strokeWidth="8" />
                <circle
                  className="text-[#2463eb] stroke-current"
                  cx="50"
                  cy="50"
                  fill="transparent"
                  r={circleRadius}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={progressOffset}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-slate-900">{progressPercent}%</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase">{t('project.complete', locale)}</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-5">
            <div className="p-3 bg-slate-50 rounded-xl">
              <p className="text-[10px] text-slate-400 font-medium mb-0.5">{t('project.activeTasks', locale)}</p>
              <p className="text-lg font-bold text-slate-900">{toDoTasks.length + inProgressTasks.length}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <p className="text-[10px] text-slate-400 font-medium mb-0.5">{t('project.completed', locale)}</p>
              <p className="text-lg font-bold text-slate-900">{completedTasks.length}</p>
            </div>
          </div>
          <div className="mb-5">
            <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">{t('project.description', locale)}</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              {categoryData?.name ? `${categoryData.name} listesindeki görevler.` : 'Bu projedeki görevler.'}
            </p>
          </div>
        </div>
        <div className="mt-auto p-5 border-t border-slate-200">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase mb-3">
            <span>{t('project.summary', locale)}</span>
          </div>
          <div className="space-y-2">
            <div className="flex gap-3">
              <div className="mt-1 w-1.5 h-1.5 rounded-full bg-[#f97316]" />
              <p className="text-xs text-slate-600">
                <span className="font-bold text-slate-900">{toDoTasks.length}</span> {t('project.tasksRemaining', locale)}
              </p>
            </div>
            <div className="flex gap-3">
              <div className="mt-1 w-1.5 h-1.5 rounded-full bg-[#2463eb]" />
              <p className="text-xs text-slate-600">
                <span className="font-bold text-slate-900">{completedTasks.length}</span> {t('project.tasksCompleted', locale)}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
