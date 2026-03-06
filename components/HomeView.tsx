'use client';

import { useState, useEffect, useMemo } from 'react';
import { Category, TimelineTask } from '@/lib/types';
import { getMockCategories, fetchTasksFromSupabase, filterRecurringTasks, DEFAULT_TAGS, getTagColorClasses, getTodayPomodoroCount, getWeekPomodoroCount, getPomodoroStreak, getWeekCompletedCount, getMyDayTaskIds, toggleMyDayTask, getCountdownLabel } from '@/lib/helpers';
import { getCategoryColor, MONTHS_TR } from '@/lib/constants';
import { TaskListSkeleton } from '@/components/Skeletons';

interface HomeViewProps {
  darkMode?: boolean;
  onCategorySelect: (category: string) => void;
  userId: string;
  onViewAll: () => void;
  onViewCalendar: () => void;
  onViewStats: () => void;
  onEditTask: (task: TimelineTask, viewingDate?: string) => void;
  onStartPomodoro: (task: TimelineTask) => void;
  /** Merkezi cache: verilirse kullanılır, fetch yapılmaz */
  tasks?: TimelineTask[];
  /** Merkezi kategori listesi: verilirse kullanılır */
  categories?: Category[];
}

export default function HomeView({ darkMode = false, onCategorySelect, userId, onViewAll, onViewCalendar, onViewStats, onEditTask, onStartPomodoro, tasks: tasksFromParent, categories: categoriesFromParent }: HomeViewProps) {
  const dark = darkMode;
  const [localCategories, setLocalCategories] = useState<Category[]>([]);
  const [localTasks, setLocalTasks] = useState<TimelineTask[]>([]);
  const [weekCompletedCount, setWeekCompletedCount] = useState<number>(0);
  const [myDayIds, setMyDayIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const allTasks = tasksFromParent ?? localTasks;
  const categories = categoriesFromParent ?? localCategories;

  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const todayStr = currentDay.toString();

  useEffect(() => {
    if (categoriesFromParent === undefined) setLocalCategories(getMockCategories(userId));
    setMyDayIds(getMyDayTaskIds(userId));
    if (tasksFromParent !== undefined) {
      setLoading(false);
      getWeekCompletedCount(userId).then(setWeekCompletedCount);
      return;
    }
    const loadData = async () => {
      setLoading(true);
      const loadedTasks = await fetchTasksFromSupabase(userId);
      setLocalTasks(loadedTasks);
      const count = await getWeekCompletedCount(userId);
      setWeekCompletedCount(count);
      setLoading(false);
    };
    loadData();
  }, [userId, tasksFromParent, categoriesFromParent]);

  // Bugünün görevleri (useMemo: allTasks/todayStr değişmedikçe yeniden hesaplanmaz)
  const todayTasks = useMemo(
    () => filterRecurringTasks(allTasks, todayStr)
      .filter(t => !t.completed)
      .sort((a, b) => a.time.localeCompare(b.time)),
    [allTasks, todayStr]
  );

  // Bugün Odakta (My Day) – bugünkü görevlerden odak listesinde olanlar
  const myDayTasks = useMemo(
    () => filterRecurringTasks(allTasks, todayStr)
      .filter(t => t.id && myDayIds.includes(t.id))
      .sort((a, b) => a.time.localeCompare(b.time)),
    [allTasks, todayStr, myDayIds]
  );

  const handleToggleMyDay = (taskId: string) => {
    toggleMyDayTask(userId, taskId);
    setMyDayIds(getMyDayTaskIds(userId));
  };

  // Yaklaşan görevler (bugünden sonraki 3 gün)
  const upcomingTasks = useMemo(() => {
    const upcomingDays = Array.from({ length: 3 }, (_, i) => {
      const d = new Date(today);
      d.setDate(currentDay + i + 1);
      return d.getDate().toString();
    });
    const list: TimelineTask[] = [];
    upcomingDays.forEach(day => {
      const dayTasks = filterRecurringTasks(allTasks, day)
        .filter(t => !t.completed)
        .map(t => ({ ...t, date: day }));
      list.push(...dayTasks);
    });
    list.sort((a, b) => {
      const dateCompare = parseInt(a.date) - parseInt(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.time.localeCompare(b.time);
    });
    return list;
  }, [allTasks, currentDay, today]);

  // Gecikmiş görevler (tarihi bugünden önce, tamamlanmamış)
  const overdueTasks = useMemo(
    () => allTasks
      .filter(t => !t.completed && t.date && parseInt(t.date, 10) < currentDay)
      .sort((a, b) => parseInt(a.date!) - parseInt(b.date!) || a.time.localeCompare(b.time)),
    [allTasks, currentDay]
  );

  // Pomodoro istatistikleri
  const todayPomodoros = getTodayPomodoroCount(userId);
  const weekPomodoros = getWeekPomodoroCount(userId);
  const pomodoroStreak = getPomodoroStreak(userId);

  // Kategoriler özeti (en çok görevli 3 kategori)
  const categoryStats = categories.map(cat => {
    const catTasks = allTasks.filter(t => t.category === cat.id);
    const completed = catTasks.filter(t => t.completed).length;
    const total = catTasks.length;
    return {
      ...cat,
      total,
      completed,
      progress: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }).sort((a, b) => b.total - a.total).slice(0, 3);

  if (loading) {
    return (
      <div className={`min-h-screen pb-24 ${dark ? 'bg-[#0f0f0f]' : 'bg-[#f5f0ea]'}`}>
        <div className="w-full max-w-md md:max-w-none mx-auto md:mx-0 px-4 md:px-0 pt-6 pb-4">
          <div className={dark ? 'h-px w-12 bg-amber-400/80 mb-5' : 'mb-6'}>
            <div className={`h-8 rounded w-48 mb-2 animate-pulse ${dark ? 'bg-zinc-700' : 'bg-stone-200'}`}></div>
            <div className={`h-4 rounded w-32 animate-pulse ${dark ? 'bg-zinc-800' : 'bg-stone-100'}`}></div>
          </div>
          <div className={`rounded-xl p-4 ${dark ? 'bg-zinc-900/60 border border-zinc-800' : 'bg-white border border-stone-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)]'}`}>
            <TaskListSkeleton count={3} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen pb-24 ${dark ? 'bg-[#0f0f0f] text-zinc-100' : 'bg-[#f5f0ea] text-stone-800'}`}>
      <div className="w-full max-w-md md:max-w-none mx-auto md:mx-0 px-4 md:px-0 pt-6 pb-4">
        {/* Header — Tasarım 3: Hoş geldin 👋 / Tasarım 2: Günaydın + amber çizgi */}
        <header className="mb-6">
          {dark && <div className="h-px w-12 bg-amber-400/80 mb-5" />}
          <h1 className={dark ? 'text-xl font-semibold text-white tracking-tight' : 'text-2xl font-semibold text-stone-800'}>
            {dark ? 'Günaydın' : 'Hoş geldin 👋'}
          </h1>
          <p className={dark ? 'text-sm text-zinc-500 mt-1' : 'text-stone-500 mt-1'}>
            {todayStr} {MONTHS_TR[currentMonth]} · {dark ? `${todayTasks.length} görev bugün` : 'Gününü planla'}
            {weekCompletedCount > 0 && (
              <span className={`inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${dark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-800'}`}>
                <span aria-hidden>✓</span> Bu hafta {weekCompletedCount} tamamlandı
              </span>
            )}
          </p>
        </header>

        {/* Gecikmiş görevler */}
        {overdueTasks.length > 0 && (
          <div className={`rounded-xl overflow-hidden mb-3 ${dark ? 'bg-red-950/30 border border-red-900/50' : 'bg-red-50/80 border border-red-200/80'}`}>
            <div className={`px-4 py-2.5 flex items-center justify-between ${dark ? 'border-b border-red-900/40' : 'border-b border-red-200/60'}`}>
              <h2 className={`text-sm font-semibold ${dark ? 'text-red-400' : 'text-red-700'}`}>⏰ Gecikmiş</h2>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${dark ? 'bg-red-900/50 text-red-300' : 'bg-red-200/80 text-red-700'}`}>{overdueTasks.length}</span>
            </div>
            <div className="divide-y divide-red-200/50">
              {overdueTasks.slice(0, 5).map((task) => (
                <button
                  key={task.id}
                  onClick={() => onEditTask(task, task.date)}
                  className={`w-full text-left flex items-center gap-3 px-4 py-2.5 ${dark ? 'hover:bg-red-900/20' : 'hover:bg-red-50/50'}`}
                >
                  <span className={`text-xs w-10 ${dark ? 'text-red-400/90' : 'text-red-600'}`}>{task.date} {MONTHS_TR[currentMonth]}</span>
                  <span className={`text-xs tabular-nums w-10 ${dark ? 'text-zinc-500' : 'text-stone-500'}`}>{task.time}</span>
                  <span className={`flex-1 font-medium truncate ${dark ? 'text-zinc-200' : 'text-stone-800'}`}>{task.title}</span>
                  <svg className={`w-4 h-4 flex-shrink-0 ${dark ? 'text-zinc-500' : 'text-stone-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
              ))}
            </div>
            {overdueTasks.length > 5 && (
              <p className={`text-center py-2 text-xs ${dark ? 'text-red-400/80' : 'text-red-600/80'}`}>+{overdueTasks.length - 5} gecikmiş görev daha</p>
            )}
          </div>
        )}

        {/* Bugün Odakta (My Day) */}
        {myDayTasks.length > 0 && (
          <div className={`rounded-xl overflow-hidden mb-3 ${dark ? 'bg-amber-500/10 border border-amber-500/30' : 'bg-amber-50/80 border border-amber-200/80'}`}>
            <div className={`px-4 py-2.5 flex items-center justify-between ${dark ? 'border-b border-amber-500/20' : 'border-b border-amber-200/60'}`}>
              <h2 className={`text-sm font-semibold ${dark ? 'text-amber-400' : 'text-amber-800'}`}>⭐ Bugün Odakta</h2>
              <span className={`text-xs font-medium ${dark ? 'text-amber-400/80' : 'text-amber-700'}`}>{myDayTasks.length}</span>
            </div>
            <div className="divide-y divide-amber-200/50">
              {myDayTasks.slice(0, 5).map((task) => (
                <div
                  key={task.id}
                  className={`flex items-center gap-3 px-4 py-2.5 ${dark ? 'hover:bg-amber-500/5' : 'hover:bg-amber-50/50'}`}
                >
                  <button
                    onClick={() => task.id && handleToggleMyDay(task.id)}
                    className="flex-shrink-0 text-amber-500"
                    title="Odak listesinden çıkar"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                  </button>
                  <button onClick={() => onEditTask(task, todayStr)} className="flex-1 min-w-0 text-left">
                    <span className={`font-medium truncate block ${dark ? 'text-zinc-200' : 'text-stone-800'}`}>{task.title}</span>
                    <span className={`text-xs ${dark ? 'text-zinc-500' : 'text-stone-500'}`}>{task.time}</span>
                  </button>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${task.completed ? (dark ? 'bg-amber-400/80' : 'bg-amber-500') : (dark ? 'border-zinc-600' : 'border-stone-300')}`}>
                    {task.completed && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                  </div>
                </div>
              ))}
            </div>
            {myDayTasks.length > 5 && <p className={`text-center py-2 text-xs ${dark ? 'text-zinc-500' : 'text-stone-500'}`}>+{myDayTasks.length - 5} daha</p>}
          </div>
        )}

        {/* Pomodoro Özet */}
        {(todayPomodoros > 0 || weekPomodoros > 0) && (
          <button
            onClick={onViewStats}
            className={`w-full rounded-xl p-4 mb-3 text-left transition-all ${
              dark
                ? 'bg-zinc-900/60 border border-zinc-800/80 hover:bg-zinc-800/60'
                : 'bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)] border border-stone-100 hover:shadow-md'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className={dark ? 'text-sm font-medium text-zinc-300' : 'text-sm font-semibold text-stone-700'}>🍅 Odaklanma İstatistikleri</h3>
              <svg className={`w-4 h-4 ${dark ? 'text-zinc-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className={`text-xl font-bold mb-0.5 ${dark ? 'text-amber-400/90' : 'text-red-600'}`}>{todayPomodoros}</div>
                <div className={dark ? 'text-xs text-zinc-500' : 'text-xs text-gray-500'}>Bugün</div>
              </div>
              <div className="text-center">
                <div className={`text-xl font-bold mb-0.5 ${dark ? 'text-amber-400/80' : 'text-orange-600'}`}>{weekPomodoros}</div>
                <div className={dark ? 'text-xs text-zinc-500' : 'text-xs text-gray-500'}>Bu Hafta</div>
              </div>
              <div className="text-center">
                <div className={`text-xl font-bold mb-0.5 ${dark ? 'text-amber-400/70' : 'text-amber-600'}`}>{pomodoroStreak}</div>
                <div className={dark ? 'text-xs text-zinc-500' : 'text-xs text-gray-500'}>Streak 🔥</div>
              </div>
            </div>
            <div className={`mt-3 text-xs text-center ${dark ? 'text-zinc-500' : 'text-gray-500'}`}>Detaylı istatistikler için tıkla</div>
          </button>
        )}

        {/* Bugünün Görevleri */}
        <div className={`rounded-xl overflow-hidden mb-3 ${dark ? 'bg-zinc-900/60 border border-zinc-800/80' : 'bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)] border border-stone-100'}`}>
          <div className={`px-4 py-3 flex items-center justify-between ${dark ? 'border-b border-zinc-800/80' : 'border-b border-stone-100'}`}>
            <h2 className={dark ? 'text-xs font-medium text-zinc-500' : 'text-sm font-semibold text-stone-600'}>Bugün</h2>
            {todayTasks.length > 0 && (
              <span className={dark ? 'px-2.5 py-1 bg-zinc-800 text-zinc-300 rounded-full text-xs font-medium' : 'px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-semibold'}>
                {todayTasks.length}
              </span>
            )}
          </div>

          {todayTasks.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <div className={`relative w-16 h-16 mx-auto mb-3 rounded-xl flex items-center justify-center ${dark ? 'bg-zinc-800/80' : 'bg-stone-100'}`}>
                <svg className={`w-8 h-8 ${dark ? 'text-zinc-500' : 'text-stone-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className={dark ? 'text-base font-semibold text-white mb-1' : 'text-base font-bold text-stone-800 mb-1'}>Harika bir gün!</h3>
              <p className={`text-sm mb-6 px-4 ${dark ? 'text-zinc-500' : 'text-stone-500'}`}>
                Bugün için planlanmış görev yok. Yeni bir görev ekleyerek güne başla!
              </p>
              <div className="flex flex-col gap-2 max-w-xs mx-auto">
                <button
                  onClick={() => onCategorySelect('add-task')}
                  className={`w-full px-4 py-3 rounded-xl text-sm font-semibold transition-all ${dark ? 'bg-amber-500/90 text-black hover:bg-amber-400' : 'bg-amber-600 text-white hover:shadow-lg hover:scale-[1.02]'}`}
                >
                  + İlk Görevini Ekle
                </button>
                <button
                  onClick={onViewCalendar}
                  className={`w-full px-4 py-2 rounded-xl text-sm font-medium transition-colors ${dark ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'}`}
                >
                  Takvime Git
                </button>
              </div>
            </div>
          ) : (
            <div className={dark ? '' : 'p-2'}>
              {todayTasks.slice(0, 5).map((task) => {
                const inMyDay = task.id && myDayIds.includes(task.id);
                return (
                <div
                  key={task.id}
                  className={`w-full flex items-center gap-3 group rounded-xl ${dark ? 'py-2.5 px-4 border-b border-zinc-800/80 last:border-0' : 'p-3 mx-2 mb-1.5 bg-stone-50/80 hover:bg-amber-50/60'}`}
                >
                  <button
                    onClick={(e) => { e.stopPropagation(); task.id && handleToggleMyDay(task.id); }}
                    className={`flex-shrink-0 p-0.5 ${inMyDay ? 'text-amber-500' : dark ? 'text-zinc-600 hover:text-amber-500/70' : 'text-stone-300 hover:text-amber-500'}`}
                    title={inMyDay ? 'Odak listesinden çıkar' : 'Bugün odakta'}
                  >
                    {inMyDay ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                    )}
                  </button>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    task.completed ? (dark ? 'bg-amber-400/80 border-amber-400/80' : 'bg-amber-500 border-amber-500') : (dark ? 'border-zinc-600' : 'border-stone-300')
                  }`}>
                    {task.completed && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`font-medium truncate ${dark ? 'text-zinc-200' : 'text-stone-800'}`}>
                      {task.title}
                      {task.subtasks && task.subtasks.length > 0 && (
                        <span className={`ml-2 text-xs font-semibold ${dark ? 'text-amber-400/80' : 'text-amber-700'}`}>
                          [{task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}]
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className={`text-xs tabular-nums w-11 ${dark ? 'text-amber-400/90' : 'text-amber-700/90'}`}>{task.time}</span>
                      {task.priority && (
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          task.priority === 'high' ? (dark ? 'bg-red-900/40 text-red-300' : 'bg-red-100 text-red-600') :
                          task.priority === 'medium' ? (dark ? 'bg-yellow-900/30 text-yellow-300' : 'bg-yellow-100 text-yellow-600') :
                          dark ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-600'
                        }`}>
                          {task.priority === 'high' ? 'Yüksek' : task.priority === 'medium' ? 'Orta' : 'Düşük'}
                        </span>
                      )}
                      {getCountdownLabel(task.countdownTarget) && (
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${dark ? 'bg-violet-900/40 text-violet-300' : 'bg-violet-100 text-violet-700'}`}>
                          ⏱ {getCountdownLabel(task.countdownTarget)}
                        </span>
                      )}
                      {task.voiceNote && (
                        <span className="text-xs opacity-80" title="Ses notu">🎤</span>
                      )}
                      {task.tags && task.tags.slice(0, 2).map(tagId => {
                        const tag = DEFAULT_TAGS.find(t => t.id === tagId);
                        if (!tag) return null;
                        const colors = getTagColorClasses(tag.color);
                        return (
                          <span key={tagId} className={`text-xs px-2 py-0.5 rounded-full ${colors.bg} ${colors.text} font-medium`}>
                            #{tag.name}
                          </span>
                        );
                      })}
                      {task.tags && task.tags.length > 2 && (
                        <span className={dark ? 'text-xs text-zinc-500' : 'text-xs text-gray-400'}>+{task.tags.length - 2}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); onStartPomodoro(task); }}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all opacity-0 group-hover:opacity-100 ${dark ? 'hover:bg-zinc-700' : 'hover:bg-red-50'}`}
                      title="Pomodoro Başlat"
                    >
                      <span className="text-lg">🍅</span>
                    </button>
                    <button onClick={() => onEditTask(task, todayStr)} className="flex-shrink-0">
                      <svg className={`w-4 h-4 ${dark ? 'text-zinc-500' : 'text-gray-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
                );
              })}
              {todayTasks.length > 5 && (
                <button
                  onClick={onViewAll}
                  className={`w-full py-3 text-sm font-medium transition-colors rounded-b-2xl ${dark ? 'text-amber-400/90 hover:bg-zinc-800/60' : 'text-amber-700 hover:bg-amber-50/60'}`}
                >
                  +{todayTasks.length - 5} görev daha görüntüle
                </button>
              )}
            </div>
          )}
        </div>

        {/* Yaklaşan Görevler */}
        {upcomingTasks.length > 0 && (
          <div className={`rounded-xl overflow-hidden mb-4 ${dark ? 'bg-zinc-900/40 border border-zinc-800' : 'bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)] border border-stone-100'}`}>
            <div className={`px-4 py-3 ${dark ? 'border-b border-zinc-800/50' : 'border-b border-stone-100'}`}>
              <h2 className={dark ? 'text-xs font-medium text-zinc-500' : 'text-sm font-semibold text-stone-600'}>Yaklaşan</h2>
            </div>
            <div className="divide-y divide-transparent">
              {upcomingTasks.slice(0, 3).map((task, idx) => {
                const taskDate = parseInt(task.date);
                const isTomorrow = taskDate === currentDay + 1;
                const dateLabel = isTomorrow ? 'Yarın' : `${taskDate} ${MONTHS_TR[currentMonth]}`;
                return (
                  <button
                    key={`${task.id}-${idx}`}
                    onClick={() => onEditTask(task, task.date)}
                    className={`w-full text-left flex items-center gap-3 rounded-xl transition-all active:scale-[0.99] active:opacity-95 ${dark ? 'py-2.5 px-4 border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/30' : 'py-2.5 px-4 mx-2 mb-1.5 bg-stone-50/60 hover:bg-stone-100/80'}`}
                  >
                    <span className={`text-xs w-14 ${dark ? 'text-zinc-500' : 'text-stone-500'}`}>{dateLabel}</span>
                    <span className={`text-xs tabular-nums w-10 ${dark ? 'text-zinc-500' : 'text-stone-400'}`}>{task.time}</span>
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium truncate ${dark ? 'text-zinc-300' : 'text-stone-700'}`}>
                        {task.title}
                        {task.subtasks && task.subtasks.length > 0 && (
                          <span className={`ml-2 text-xs font-semibold ${dark ? 'text-amber-400/80' : 'text-amber-700'}`}>
                            [{task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}]
                          </span>
                        )}
                      </div>
                    </div>
                    <svg className={`w-4 h-4 flex-shrink-0 ${dark ? 'text-zinc-500' : 'text-gray-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Kategoriler Özeti */}
        {categoryStats.length > 0 && (
          <section className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className={dark ? 'text-xs font-medium text-zinc-500' : 'text-sm font-semibold text-stone-600'}>Listeler</h2>
              <button
                onClick={() => onCategorySelect('categories')}
                className={`text-sm font-medium ${dark ? 'text-amber-400/90 hover:text-amber-400' : 'text-amber-700 hover:text-amber-800'}`}
              >
                Tümünü Gör
              </button>
            </div>
            <div className="flex flex-wrap gap-3">
              {categoryStats.map((cat) => {
                const colors = getCategoryColor(cat.color);
                return (
                  <button
                    key={cat.id}
                    onClick={() => onCategorySelect(cat.id)}
                    className={`flex items-center gap-3 rounded-xl transition-all active:scale-[0.99] active:opacity-95 ${
                      dark
                        ? 'px-4 py-2.5 bg-zinc-800/80 hover:bg-zinc-700/80 border border-zinc-700/80 text-zinc-300'
                        : 'px-5 py-3 bg-white shadow-[0_2px_12px_-2px_rgba(0,0,0,0.08)] border border-stone-100 hover:shadow-md hover:border-amber-200/60 text-stone-700 font-medium'
                    }`}
                  >
                    <span className="text-lg">{cat.icon}</span>
                    <span className="text-sm">{cat.name}</span>
                    <span className={dark ? 'text-zinc-500 text-sm' : 'text-stone-400 text-sm font-normal'}>{cat.total} görev</span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Hızlı İşlemler */}
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => onCategorySelect('add-task')}
            className={`rounded-xl p-3 transition-all text-center active:scale-[0.99] active:opacity-95 ${dark ? 'bg-zinc-900/60 border border-zinc-800 hover:bg-zinc-800/80' : 'bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)] border border-stone-100 hover:shadow-md'}`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2 ${dark ? 'bg-amber-500/20' : 'bg-amber-100'}`}>
              <svg className={`w-5 h-5 ${dark ? 'text-amber-400' : 'text-amber-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div className={`text-sm font-semibold ${dark ? 'text-zinc-200' : 'text-stone-900'}`}>Ekle</div>
          </button>
          <button
            onClick={onViewAll}
            className={`rounded-xl p-3 transition-all text-center active:scale-[0.99] active:opacity-95 ${dark ? 'bg-zinc-900/60 border border-zinc-800 hover:bg-zinc-800/80' : 'bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)] border border-stone-100 hover:shadow-md'}`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2 ${dark ? 'bg-zinc-700' : 'bg-stone-100'}`}>
              <svg className={`w-5 h-5 ${dark ? 'text-zinc-400' : 'text-stone-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <div className={`text-sm font-semibold ${dark ? 'text-zinc-200' : 'text-stone-900'}`}>Liste</div>
          </button>
          <button
            onClick={onViewCalendar}
            className={`rounded-xl p-3 transition-all text-center active:scale-[0.99] active:opacity-95 ${dark ? 'bg-zinc-900/60 border border-zinc-800 hover:bg-zinc-800/80' : 'bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)] border border-stone-100 hover:shadow-md'}`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2 ${dark ? 'bg-zinc-700' : 'bg-stone-100'}`}>
              <svg className={`w-5 h-5 ${dark ? 'text-zinc-400' : 'text-stone-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className={`text-sm font-semibold ${dark ? 'text-zinc-200' : 'text-stone-900'}`}>Takvim</div>
          </button>
        </div>
      </div>
    </div>
  );
}
