'use client';

import { useState, useEffect, useMemo } from 'react';
import { Category, TimelineTask } from '@/lib/types';
import { getMockCategories, fetchTasksFromSupabase, filterRecurringTasks, getDayAbbreviation, saveTaskToSupabase, DEFAULT_TAGS, getTagColorClasses, getCategoryPomodoroCount, getCountdownLabel, createListShare } from '@/lib/helpers';
import { getCategoryColor as getCategoryColorFromConstants } from '@/lib/constants';
import { useToast } from '@/components/Toast';

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
  const [sharing, setSharing] = useState(false);
  const [localTasks, setLocalTasks] = useState<TimelineTask[]>([]);
  const tasks = tasksFromParent ?? localTasks;
  const setTasks = setTasksFromParent ?? setLocalTasks;
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const [selectedDate, setSelectedDate] = useState<string | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  // Bugünden itibaren 14 gün
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today);
    d.setDate(currentDay + i);
    return { day: d.getDate(), isToday: i === 0 };
  });

  const categories = categoriesFromParent ?? getMockCategories(userId);
  const categoryData = categories.find(c => c.id === category);
  const colors = useMemo(() => getCategoryColorFromConstants(categoryData?.color), [categoryData?.color]);

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

  // Seçili tarihe göre filtreleme
  const getDisplayTasks = () => {
    let filtered: TimelineTask[];
    
    if (selectedDate === 'all') {
      filtered = visibleCategoryTasks;
    } else {
      filtered = filterRecurringTasks(visibleCategoryTasks, selectedDate);
    }

    // Durum filtreleme
    if (filter === 'active') {
      filtered = filtered.filter(t => !t.completed);
    } else if (filter === 'completed') {
      filtered = filtered.filter(t => t.completed);
    }

    return filtered.sort((a, b) => (a.orderIndex ?? 9999) - (b.orderIndex ?? 9999) || a.time.localeCompare(b.time));
  };

  const displayTasks = getDisplayTasks();

  const handleMoveTask = async (taskIndex: number, direction: 'up' | 'down') => {
    const otherIndex = direction === 'up' ? taskIndex - 1 : taskIndex + 1;
    if (otherIndex < 0 || otherIndex >= displayTasks.length) return;
    const taskA = displayTasks[taskIndex];
    const taskB = displayTasks[otherIndex];
    if (!taskA.id || !taskB.id) return;
    const orderA = taskA.orderIndex ?? taskIndex;
    const orderB = taskB.orderIndex ?? otherIndex;
    const updatedA = { ...taskA, orderIndex: orderB };
    const updatedB = { ...taskB, orderIndex: orderA };
    await saveTaskToSupabase(userId, updatedA);
    await saveTaskToSupabase(userId, updatedB);
    setTasks(prev => prev.map(t => t.id === updatedA.id ? updatedA : t.id === updatedB.id ? updatedB : t));
  };
  const displayedCount = displayTasks.length;
  const displayedCompleted = displayTasks.filter(t => t.completed).length;

  // Gün başına görev sayısı
  const getTaskCountForDay = (day: number) => {
    return filterRecurringTasks(visibleCategoryTasks, day.toString()).length;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className={`bg-gradient-to-r ${colors.gradient} px-6 pt-6 pb-8 text-white`}>
        <div className="max-w-md mx-auto">
          {/* Üst Bar */}
          <div className="flex items-center justify-between mb-5">
            <button
              onClick={onBack}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/15 hover:bg-white/25 transition-colors"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex items-center gap-2">
              {isPro && (
                <button
                  type="button"
                  onClick={async () => {
                    setSharing(true);
                    const token = await createListShare(userId, category);
                    setSharing(false);
                    if (token) {
                      const url = typeof window !== 'undefined' ? window.location.origin + '/share?t=' + token : '';
                      try {
                        await navigator.clipboard.writeText(url);
                        showToast('Paylaşım linki kopyalandı!', 'success');
                      } catch {
                        showToast('Link: ' + url, 'info');
                      }
                    } else {
                      showToast('Paylaşım için giriş yapılmış hesap gerekir.', 'error');
                    }
                  }}
                  disabled={sharing}
                  className="px-3 py-2 bg-white/20 rounded-xl text-sm font-semibold hover:bg-white/30 transition-colors flex items-center gap-1 disabled:opacity-60"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                  Paylaş
                </button>
              )}
              <button
                onClick={() => { onAddTask ? onAddTask(category) : onEditTask({} as TimelineTask); }}
                className="px-4 py-2 bg-white/20 rounded-xl text-sm font-semibold hover:bg-white/30 transition-colors flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                Görev Ekle
              </button>
            </div>
          </div>

          {/* Kategori Bilgisi */}
          <div className="flex items-center gap-4 mb-5">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-3xl">
              {categoryData?.icon || '📝'}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{categoryData?.name || category}</h1>
              <p className="text-white/70 text-sm">{displayedCount} görev · {displayedCompleted} tamamlanan</p>
            </div>
            {(() => {
              const categoryPomodoros = getCategoryPomodoroCount(userId, category);
              if (categoryPomodoros === 0) return null;
              return (
                <div className="bg-white/20 backdrop-blur-sm rounded-xl px-3 py-2 text-center">
                  <div className="text-2xl font-bold text-white mb-0.5">{categoryPomodoros}</div>
                  <div className="text-[10px] text-white/70">🍅 Pomodoro</div>
                </div>
              );
            })()}
          </div>

          {/* İlerleme Çubuğu */}
          {totalTasks > 0 && (
            <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-white/80">İlerleme</span>
                <span className="text-xs font-bold text-white">%{progressPercent}</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2">
                <div
                  className="bg-white rounded-full h-2 transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 -mt-3">
        {/* Tarih Seçici */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 mb-4">
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex gap-1.5" style={{ minWidth: 'max-content' }}>
              {/* Tümü Butonu */}
              <button
                onClick={() => setSelectedDate('all')}
                className={`flex-shrink-0 flex flex-col items-center justify-center px-3 py-2 rounded-xl transition-all min-w-[52px] ${
                  selectedDate === 'all'
                    ? `bg-gradient-to-r ${colors.gradient} text-white shadow-md`
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span className="text-[10px] font-medium opacity-70">—</span>
                <span className="text-xs font-bold mt-0.5">Tümü</span>
              </button>

              {days.map(({ day, isToday }) => {
                const dayStr = day.toString();
                const isSelected = selectedDate === dayStr;
                const taskCount = getTaskCountForDay(day);

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDate(dayStr)}
                    className={`flex-shrink-0 flex flex-col items-center justify-center px-2 py-2 rounded-xl transition-all min-w-[52px] relative ${
                      isSelected
                        ? `bg-gradient-to-r ${colors.gradient} text-white shadow-md`
                        : isToday
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span className={`text-[10px] font-medium ${isSelected ? 'text-white/70' : 'opacity-50'}`}>
                      {getDayAbbreviation(day)}
                    </span>
                    <span className="text-sm font-bold">{day}</span>
                    {taskCount > 0 && !isSelected && (
                      <div className={`w-1.5 h-1.5 rounded-full mt-0.5 ${colors.bg}`}></div>
                    )}
                    {taskCount > 0 && isSelected && (
                      <div className="w-1.5 h-1.5 rounded-full mt-0.5 bg-white"></div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Durum Filtreleri */}
        <div className="flex gap-2 mb-4">
          {[
            { key: 'all' as const, label: 'Tümü' },
            { key: 'active' as const, label: 'Aktif' },
            { key: 'completed' as const, label: 'Tamamlanan' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filter === f.key
                  ? `${colors.light} ${colors.text} font-semibold`
                  : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Görev Listesi */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500">Görevler yükleniyor...</p>
            </div>
          </div>
        ) : displayTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className={`w-20 h-20 ${colors.light} rounded-2xl flex items-center justify-center mx-auto mb-5 text-4xl`}>
              {filter === 'completed' ? '🎉' : categoryData?.icon || '📝'}
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {filter === 'completed' ? 'Tamamlanan görev yok' : filter === 'active' ? 'Aktif görev yok' : 'Bu kategoride henüz görev yok'}
            </h2>
            <p className="text-gray-500 text-sm mb-6 text-center">
              {filter === 'completed'
                ? 'Görevlerini tamamladıkça burada görünecek'
                : filter === 'active'
                ? 'Tüm görevler tamamlanmış, harika!'
                : 'Bu kategoriye ilk görevini ekleyerek başla'}
            </p>
            {filter === 'all' && (
              <button
                onClick={() => { onAddTask ? onAddTask(category) : onEditTask({} as TimelineTask); }}
                className={`px-6 py-3 bg-gradient-to-r ${colors.gradient} text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all`}
              >
                + Görev Ekle
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {displayTasks.map((task, taskIndex) => {
              const viewDate = selectedDate === 'all' ? task.date : selectedDate;
              const isOverdue = viewDate && parseInt(viewDate, 10) < currentDay && !task.completed;
              return (
              <div
                key={task.id}
                onClick={() => onEditTask(task, selectedDate === 'all' ? task.date : selectedDate as string)}
                className={`bg-white rounded-2xl p-4 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.08)] border border-stone-100 transition-all cursor-pointer hover:shadow-md active:scale-[0.99] active:opacity-95 ${
                  task.completed ? 'opacity-75' : 'hover:border-amber-200/40'
                } ${isOverdue ? 'border-l-4 border-l-red-400' : ''}`}
              >
                <div className="flex items-start gap-3">
                  {/* Yukarı / Aşağı sıralama */}
                  <div className="flex flex-col gap-0.5 flex-shrink-0">
                    <button type="button" onClick={(e) => { e.stopPropagation(); handleMoveTask(taskIndex, 'up'); }} disabled={taskIndex === 0} className="p-0.5 rounded text-gray-400 hover:text-gray-600 disabled:opacity-30" aria-label="Yukarı">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                    </button>
                    <button type="button" onClick={(e) => { e.stopPropagation(); handleMoveTask(taskIndex, 'down'); }} disabled={taskIndex === displayTasks.length - 1} className="p-0.5 rounded text-gray-400 hover:text-gray-600 disabled:opacity-30" aria-label="Aşağı">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </button>
                  </div>
                  {/* Tamamlama Toggle */}
                  <button
                    onClick={(e) => task.id && handleToggleTask(task.id, e)}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 mt-0.5 ${
                      task.completed
                        ? `${colors.bg} border-transparent`
                        : `border-gray-300 hover:border-emerald-400`
                    }`}
                  >
                    {task.completed && (
                      <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>

                  {/* İçerik */}
                  <div className="flex-1 min-w-0">
                    <div className={`font-medium ${task.completed ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                      {task.title}
                      {task.subtasks && task.subtasks.length > 0 && (
                        <span className="ml-2 text-xs text-emerald-600 font-semibold">
                          [{task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}]
                        </span>
                      )}
                    </div>
                    {task.description && (
                      <p className={`text-sm mt-1 line-clamp-2 ${task.completed ? 'text-gray-300' : 'text-gray-500'}`}>
                        {task.description}
                      </p>
                    )}

                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {/* Saat */}
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {task.time}
                      </span>

                      {/* Gecikmiş */}
                      {isOverdue && (
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
                          Gecikmiş
                        </span>
                      )}
                      {/* Tekrar */}
                      {task.recurrence && (
                        <span className="text-xs bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-medium">
                          {task.recurrence === 'weekly' ? '🔄 Haftalık' : task.recurrence === 'monthly' ? '📅 Aylık' : '📆 Hafta içi'}
                        </span>
                      )}

                      {/* Öncelik */}
                      {task.priority && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          task.priority === 'high' ? 'bg-red-50 text-red-600' :
                          task.priority === 'medium' ? 'bg-yellow-50 text-yellow-600' :
                          'bg-green-50 text-green-600'
                        }`}>
                          {task.priority === 'high' ? 'Yüksek' : task.priority === 'medium' ? 'Orta' : 'Düşük'}
                        </span>
                      )}
                      {getCountdownLabel(task.countdownTarget) && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-violet-100 text-violet-700">
                          ⏱ {getCountdownLabel(task.countdownTarget)}
                        </span>
                      )}
                      {task.voiceNote && (
                        <span className="text-xs opacity-80" title="Ses notu">🎤</span>
                      )}

                      {/* Tags */}
                      {task.tags && task.tags.map(tagId => {
                        const tag = DEFAULT_TAGS.find(t => t.id === tagId);
                        if (!tag) return null;
                        const colors = getTagColorClasses(tag.color);
                        return (
                          <span key={tagId} className={`text-xs px-2 py-0.5 rounded-full ${colors.bg} ${colors.text} font-medium`}>
                            #{tag.name}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Pomodoro Button */}
                  {onStartPomodoro && !task.completed && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onStartPomodoro(task);
                      }}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 transition-all mr-1"
                      title="Pomodoro Başlat"
                    >
                      <span className="text-lg">🍅</span>
                    </button>
                  )}

                  {/* Düzenle İkonu */}
                  <svg className="w-4 h-4 text-gray-300 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            );
            })}
          </div>
        )}
      </div>

      {/* FAB - Görev Ekle */}
      <button
        onClick={() => { onAddTask ? onAddTask(category) : onEditTask({} as TimelineTask); }}
        className={`fixed bottom-24 right-6 w-14 h-14 bg-gradient-to-br ${colors.gradient} text-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center hover:scale-110 active:scale-95 z-20`}
      >
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  );
}
