'use client';

import { useState, useEffect } from 'react';
import { Category, TimelineTask } from '@/lib/types';
import { getMockCategories, fetchTasksFromSupabase, filterRecurringTasks, DEFAULT_TAGS, getTagColorClasses, getTodayPomodoroCount, getWeekPomodoroCount, getPomodoroStreak } from '@/lib/helpers';
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
}

const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

export default function HomeView({ darkMode = false, onCategorySelect, userId, onViewAll, onViewCalendar, onViewStats, onEditTask, onStartPomodoro }: HomeViewProps) {
  const dark = darkMode;
  const [categories, setCategories] = useState<Category[]>([]);
  const [allTasks, setAllTasks] = useState<TimelineTask[]>([]);
  const [loading, setLoading] = useState(true);

  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const todayStr = currentDay.toString();

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const loadedCategories = getMockCategories(userId);
      setCategories(loadedCategories);
      
      const loadedTasks = await fetchTasksFromSupabase(userId);
      setAllTasks(loadedTasks);
      setLoading(false);
    };
    loadData();
  }, [userId]);

  // Bugünün görevleri
  const todayTasks = filterRecurringTasks(allTasks, todayStr)
    .filter(t => !t.completed)
    .sort((a, b) => a.time.localeCompare(b.time));

  // Yaklaşan görevler (bugünden sonraki 3 gün)
  const upcomingDays = Array.from({ length: 3 }, (_, i) => {
    const d = new Date(today);
    d.setDate(currentDay + i + 1);
    return d.getDate().toString();
  });

  const upcomingTasks: TimelineTask[] = [];
  upcomingDays.forEach(day => {
    const dayTasks = filterRecurringTasks(allTasks, day)
      .filter(t => !t.completed)
      .map(t => ({ ...t, date: day }));
    upcomingTasks.push(...dayTasks);
  });
  upcomingTasks.sort((a, b) => {
    const dateCompare = parseInt(a.date) - parseInt(b.date);
    if (dateCompare !== 0) return dateCompare;
    return a.time.localeCompare(b.time);
  });

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

  const getCategoryColor = (color?: string) => {
    const colorMap: Record<string, { bg: string; light: string; text: string }> = {
      blue: { bg: 'bg-blue-600', light: 'bg-blue-100', text: 'text-blue-600' },
      purple: { bg: 'bg-purple-600', light: 'bg-purple-100', text: 'text-purple-600' },
      pink: { bg: 'bg-pink-600', light: 'bg-pink-100', text: 'text-pink-600' },
      orange: { bg: 'bg-orange-600', light: 'bg-orange-100', text: 'text-orange-600' },
      yellow: { bg: 'bg-yellow-600', light: 'bg-yellow-100', text: 'text-yellow-600' },
      emerald: { bg: 'bg-emerald-600', light: 'bg-emerald-100', text: 'text-emerald-600' },
    };
    return colorMap[color || 'emerald'] || colorMap.emerald;
  };

  if (loading) {
    return (
      <div className={`min-h-screen pb-24 ${dark ? 'bg-[#0f0f0f]' : 'bg-[#f5f0ea]'}`}>
        <div className="max-w-md mx-auto px-5 pt-10 pb-8">
          <div className={dark ? 'h-px w-12 bg-amber-400/80 mb-5' : 'mb-8'}>
            <div className={`h-8 rounded w-48 mb-2 animate-pulse ${dark ? 'bg-zinc-700' : 'bg-stone-200'}`}></div>
            <div className={`h-4 rounded w-32 animate-pulse ${dark ? 'bg-zinc-800' : 'bg-stone-100'}`}></div>
          </div>
          <div className={`rounded-2xl p-5 ${dark ? 'bg-zinc-900/60 border border-zinc-800' : 'bg-white border border-stone-100 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.06)]'}`}>
            <TaskListSkeleton count={3} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen pb-24 ${dark ? 'bg-[#0f0f0f] text-zinc-100' : 'bg-[#f5f0ea] text-stone-800'}`}>
      <div className="max-w-md mx-auto px-5 pt-10 pb-8">
        {/* Header — Tasarım 3: Hoş geldin 👋 / Tasarım 2: Günaydın + amber çizgi */}
        <header className="mb-8">
          {dark && <div className="h-px w-12 bg-amber-400/80 mb-5" />}
          <h1 className={dark ? 'text-2xl font-semibold text-white tracking-tight' : 'text-3xl font-semibold text-stone-800'}>
            {dark ? 'Günaydın' : 'Hoş geldin 👋'}
          </h1>
          <p className={dark ? 'text-sm text-zinc-500 mt-1' : 'text-stone-500 mt-1'}>
            {todayStr} {MONTHS[currentMonth]} · {dark ? `${todayTasks.length} görev bugün` : 'Gününü planla'}
          </p>
        </header>

        {/* Pomodoro Özet */}
        {(todayPomodoros > 0 || weekPomodoros > 0) && (
          <button
            onClick={onViewStats}
            className={`w-full rounded-2xl p-5 mb-4 text-left transition-all ${
              dark
                ? 'bg-zinc-900/60 border border-zinc-800/80 hover:bg-zinc-800/60'
                : 'bg-white shadow-[0_4px_24px_-4px_rgba(0,0,0,0.06)] border border-stone-100 hover:shadow-md'
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
                <div className={`text-2xl font-bold mb-1 ${dark ? 'text-amber-400/90' : 'text-red-600'}`}>{todayPomodoros}</div>
                <div className={dark ? 'text-xs text-zinc-500' : 'text-xs text-gray-500'}>Bugün</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold mb-1 ${dark ? 'text-amber-400/80' : 'text-orange-600'}`}>{weekPomodoros}</div>
                <div className={dark ? 'text-xs text-zinc-500' : 'text-xs text-gray-500'}>Bu Hafta</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold mb-1 ${dark ? 'text-amber-400/70' : 'text-amber-600'}`}>{pomodoroStreak}</div>
                <div className={dark ? 'text-xs text-zinc-500' : 'text-xs text-gray-500'}>Streak 🔥</div>
              </div>
            </div>
            <div className={`mt-3 text-xs text-center ${dark ? 'text-zinc-500' : 'text-gray-500'}`}>Detaylı istatistikler için tıkla</div>
          </button>
        )}

        {/* Bugünün Görevleri */}
        <div className={`rounded-[24px] overflow-hidden mb-4 ${dark ? 'bg-zinc-900/60 border border-zinc-800/80' : 'bg-white shadow-[0_4px_24px_-4px_rgba(0,0,0,0.06)] border border-stone-100'}`}>
          <div className={`px-5 py-4 flex items-center justify-between ${dark ? 'border-b border-zinc-800/80' : 'border-b border-stone-100'}`}>
            <h2 className={dark ? 'text-xs font-medium text-zinc-500' : 'text-sm font-semibold text-stone-600'}>Bugün</h2>
            {todayTasks.length > 0 && (
              <span className={dark ? 'px-2.5 py-1 bg-zinc-800 text-zinc-300 rounded-full text-xs font-medium' : 'px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-semibold'}>
                {todayTasks.length}
              </span>
            )}
          </div>

          {todayTasks.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <div className={`relative w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center ${dark ? 'bg-zinc-800/80' : 'bg-stone-100'}`}>
                <svg className={`w-10 h-10 ${dark ? 'text-zinc-500' : 'text-stone-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className={dark ? 'text-lg font-semibold text-white mb-1' : 'text-lg font-bold text-stone-800 mb-1'}>Harika bir gün!</h3>
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
                  onClick={onViewAll}
                  className={`w-full px-4 py-2 rounded-xl text-sm font-medium transition-colors ${dark ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'}`}
                >
                  Tüm Görevleri Gör
                </button>
              </div>
            </div>
          ) : (
            <div className={dark ? '' : 'p-2'}>
              {todayTasks.slice(0, 5).map((task) => (
                <div
                  key={task.id}
                  className={`w-full flex items-center gap-3 group rounded-2xl ${dark ? 'py-3 px-4 border-b border-zinc-800/80 last:border-0' : 'p-4 mx-2 mb-2 bg-stone-50/80 hover:bg-amber-50/60'}`}
                >
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
              ))}
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
          <div className={`rounded-[24px] overflow-hidden mb-4 ${dark ? 'bg-zinc-900/40 border border-zinc-800/50' : 'bg-white shadow-[0_4px_24px_-4px_rgba(0,0,0,0.06)] border border-stone-100'}`}>
            <div className={`px-5 py-4 ${dark ? 'border-b border-zinc-800/50' : 'border-b border-stone-100'}`}>
              <h2 className={dark ? 'text-xs font-medium text-zinc-500' : 'text-sm font-semibold text-stone-600'}>Yaklaşan</h2>
            </div>
            <div className="divide-y divide-transparent">
              {upcomingTasks.slice(0, 3).map((task, idx) => {
                const taskDate = parseInt(task.date);
                const isTomorrow = taskDate === currentDay + 1;
                const dateLabel = isTomorrow ? 'Yarın' : `${taskDate} ${MONTHS[currentMonth]}`;
                return (
                  <button
                    key={`${task.id}-${idx}`}
                    onClick={() => onEditTask(task, task.date)}
                    className={`w-full text-left flex items-center gap-3 rounded-2xl ${dark ? 'py-2.5 px-5 border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/30' : 'py-3 px-4 mx-2 mb-2 bg-stone-50/60 hover:bg-stone-100/80'}`}
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
              <h2 className={dark ? 'text-xs font-medium text-zinc-500' : 'text-sm font-semibold text-stone-600'}>Kategoriler</h2>
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
                    className={`flex items-center gap-3 rounded-2xl transition-all ${
                      dark
                        ? 'px-4 py-2.5 bg-zinc-800/80 hover:bg-zinc-700/80 border border-zinc-700/80 text-zinc-300'
                        : 'px-5 py-3 bg-white shadow-[0_2px_12px_-2px_rgba(0,0,0,0.08)] border border-stone-100 hover:shadow-md hover:border-amber-200/60 text-stone-700 font-medium'
                    }`}
                  >
                    <span className="text-xl">{cat.icon}</span>
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
            className={`rounded-2xl p-4 transition-all text-center ${dark ? 'bg-zinc-900/60 border border-zinc-800 hover:bg-zinc-800/80' : 'bg-white shadow-[0_2px_12px_-2px_rgba(0,0,0,0.08)] border border-stone-100 hover:shadow-md'}`}
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
            className={`rounded-2xl p-4 transition-all text-center ${dark ? 'bg-zinc-900/60 border border-zinc-800 hover:bg-zinc-800/80' : 'bg-white shadow-[0_2px_12px_-2px_rgba(0,0,0,0.08)] border border-stone-100 hover:shadow-md'}`}
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
            className={`rounded-2xl p-4 transition-all text-center ${dark ? 'bg-zinc-900/60 border border-zinc-800 hover:bg-zinc-800/80' : 'bg-white shadow-[0_2px_12px_-2px_rgba(0,0,0,0.08)] border border-stone-100 hover:shadow-md'}`}
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
