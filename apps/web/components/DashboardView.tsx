'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Category, TimelineTask } from '@cursor-deneme/shared';
import { filterRecurringTasks, getWeekCompletedCount, getWeekDailyCompletedCounts, saveTaskToSupabase } from '@cursor-deneme/shared';
import { MONTHS_TR } from '@cursor-deneme/shared';
import { useLocale } from '@/components/LocaleContext';
import { t } from '@cursor-deneme/shared';

const PRIMARY = '#ec5b13';
const DAY_LABELS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

interface DashboardViewProps {
  userId: string;
  darkMode?: boolean;
  tasks?: TimelineTask[];
  categories?: Category[];
  userDisplayName?: string | null;
  onViewAll: () => void;
  onNewTask: () => void;
  onEditTask: (task: TimelineTask, date?: string) => void;
  onViewCalendar: () => void;
  onStartPomodoro?: (task: TimelineTask) => void;
  setTasks?: React.Dispatch<React.SetStateAction<TimelineTask[]>>;
  onOpenProfile?: () => void;
  onOpenSettings?: () => void;
  onLogout?: () => void;
}

function formatTime(time: string) {
  const [h, m] = time.split(':').map(Number);
  if (h === 0 && m === 0) return '00:00';
  if (h >= 12) return `${h === 12 ? 12 : h - 12}:${String(m).padStart(2, '0')} PM`;
  return `${h}:${String(m).padStart(2, '0')} AM`;
}

function priorityBadge(priority: string | null | undefined) {
  if (priority === 'high') return { label: 'Yüksek', class: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' };
  if (priority === 'medium') return { label: 'Orta', class: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' };
  if (priority === 'low') return { label: 'Düşük', class: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400' };
  return { label: 'Yaklaşan', class: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' };
}

export default function DashboardView({
  userId,
  darkMode = false,
  tasks = [],
  categories = [],
  userDisplayName,
  onViewAll,
  onNewTask,
  onEditTask,
  onViewCalendar,
  onStartPomodoro,
  setTasks,
  onOpenProfile,
  onOpenSettings,
  onLogout,
}: DashboardViewProps) {
  const dark = darkMode;
  const { locale } = useLocale();
  const [searchQuery, setSearchQuery] = useState('');
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    if (profileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [profileMenuOpen]);
  const [weekCompletedCount, setWeekCompletedCount] = useState(0);

  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const todayStr = currentDay.toString();

  useEffect(() => {
    getWeekCompletedCount(userId).then(setWeekCompletedCount);
  }, [userId, tasks]);

  const todayTasks = useMemo(
    () =>
      filterRecurringTasks(tasks, todayStr)
        .filter((t) => !t.completed)
        .sort((a, b) => a.time.localeCompare(b.time)),
    [tasks, todayStr]
  );

  const todayTasksWithCompleted = useMemo(
    () =>
      filterRecurringTasks(tasks, todayStr).sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        return a.time.localeCompare(b.time);
      }),
    [tasks, todayStr]
  );

  const weekDailyCounts = useMemo(() => getWeekDailyCompletedCounts(tasks), [tasks]);
  const maxCount = Math.max(1, ...weekDailyCounts);

  const topCategory = useMemo(() => {
    const withProgress = categories.map((cat) => {
      const catTasks = tasks.filter((t) => t.category === cat.id);
      const completed = catTasks.filter((t) => t.completed).length;
      const total = catTasks.length;
      return { ...cat, total, completed, progress: total > 0 ? Math.round((completed / total) * 100) : 0 };
    });
    return withProgress.sort((a, b) => b.total - a.total)[0];
  }, [categories, tasks]);

  const handleToggleTask = async (task: TimelineTask) => {
    if (!task.id) return;
    const updated = { ...task, completed: !task.completed, completedAt: !task.completed ? new Date().toISOString() : undefined };
    await saveTaskToSupabase(userId, updated);
    setTasks?.((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
    getWeekCompletedCount(userId).then(setWeekCompletedCount);
  };

  const filteredTodayTasks = searchQuery.trim()
    ? todayTasksWithCompleted.filter(
        (t) =>
          t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
      )
    : todayTasksWithCompleted.slice(0, 5);

  const userInitial = userDisplayName?.trim()?.[0]?.toUpperCase() ?? '?';

  return (
    <div className={`min-h-screen pb-24 md:pb-8 ${dark ? 'bg-[#221610] text-slate-100' : 'bg-[#f8f6f6] text-slate-900'}`}>
      <header className="h-16 md:h-14 bg-white backdrop-blur-md border-b border-slate-200 px-4 md:px-8 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-4 md:gap-6 flex-1 max-w-2xl">
          <div className="relative w-full max-w-md">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Görev, proje veya dosya ara..."
              className="w-full pl-11 pr-4 py-2.5 border-none rounded-xl focus:ring-2 focus:ring-[#ec5b13]/50 text-sm bg-slate-100 text-slate-900"
            />
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-4 ml-2">
          <button
            type="button"
            onClick={onNewTask}
            className="flex items-center gap-2 text-white px-4 md:px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm hover:opacity-95 transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ec5b13]/80"
            style={{ backgroundColor: PRIMARY }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
            <span className="hidden sm:inline">Yeni Görev</span>
          </button>
          <div className="h-8 w-px bg-slate-200 hidden md:block" />
          <button type="button" className="p-2 text-slate-500 hover:bg-slate-100 rounded-full relative hidden md:flex" aria-label="Bildirimler">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full border-2 border-white" style={{ backgroundColor: PRIMARY }} />
          </button>
          <div className="relative hidden md:block" ref={profileMenuRef}>
            <button
              type="button"
              onClick={() => setProfileMenuOpen((v) => !v)}
              className="flex items-center gap-2 pl-2 py-1.5 pr-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              aria-expanded={profileMenuOpen}
              aria-haspopup="true"
            >
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-semibold text-sm border-2 border-transparent hover:border-[#ec5b13] transition-all">
                {userInitial}
              </div>
              <svg className={'w-5 h-5 text-slate-400 transition-transform ' + (profileMenuOpen ? 'rotate-180' : '')} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            {profileMenuOpen && (onOpenProfile || onOpenSettings || onLogout) && (
              <div className="absolute right-0 top-full mt-1 py-1 min-w-[160px] bg-white rounded-xl border border-slate-200 shadow-lg z-50">
                {onOpenProfile && (
                  <button
                    type="button"
                    onClick={() => { onOpenProfile(); setProfileMenuOpen(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <span>{t('header.profile', locale)}</span>
                  </button>
                )}
                {onOpenSettings && (
                  <button
                    type="button"
                    onClick={() => { onOpenSettings(); setProfileMenuOpen(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <span>{t('header.preferences', locale)}</span>
                  </button>
                )}
                {onLogout && (
                  <button
                    type="button"
                    onClick={() => { onLogout(); setProfileMenuOpen(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-slate-100"
                  >
                    <span>{t('settings.logout', locale)}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="p-4 md:pt-1 md:px-8 md:pb-8 grid grid-cols-12 gap-6">
        {/* Sol: Bugünkü Görevler */}
        <section className="col-span-12 lg:col-span-4 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold font-display text-black">Bugünkü Görevler</h2>
            <button type="button" onClick={onViewAll} className="text-sm font-semibold hover:underline" style={{ color: PRIMARY }}>
              Tümünü Gör
            </button>
          </div>
          <div className="space-y-4">
            {filteredTodayTasks.length === 0 ? (
              <div className={`text-sm py-6 px-4 text-center rounded-2xl ${dark ? 'text-slate-400 bg-slate-900/50' : 'text-slate-500 bg-white border border-slate-100'}`}>
                <p className="mb-4">
                  {searchQuery.trim() ? t('dashboard.noSearchResults', locale) : t('dashboard.noTasksToday', locale)}
                </p>
                {!searchQuery.trim() && (
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={onNewTask}
                      className="px-4 py-2 rounded-lg text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ec5b13]/80"
                      style={{ backgroundColor: PRIMARY }}
                    >
                      {t('dashboard.addFirst', locale)}
                    </button>
                    <button
                      type="button"
                      onClick={onViewCalendar}
                      className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-300"
                    >
                      {t('dashboard.goToCalendar', locale)}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              filteredTodayTasks.map((task) => {
                const badge = priorityBadge(task.priority ?? null);
                return (
                  <button
                    key={task.id ?? task.title + task.time}
                    type="button"
                    onClick={() => !task.completed && onEditTask(task, task.date)}
                    className={'w-full text-left bg-white p-4 rounded-2xl border border-slate-100 flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow ' + (task.completed ? 'opacity-75' : '')}
                  >
                    <input
                      type="checkbox"
                      checked={!!task.completed}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleToggleTask(task);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="task-checkbox mt-1 w-5 h-5 rounded border-slate-300 dark:border-slate-700 focus:ring-[#ec5b13] accent-[#ec5b13]"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-semibold text-sm ${task.completed ? 'line-through text-slate-400' : ''}`}>{task.title}</h3>
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${badge.class}`}>{badge.label}</span>
                        <span className="flex items-center gap-1 text-[11px] text-slate-400">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          {formatTime(task.time)}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
          {topCategory && topCategory.total > 0 ? (
            <div className="p-5 rounded-2xl text-white bg-gradient-to-br from-[#ec5b13] to-orange-600 border border-[#ec5b13]/20">
              <p className="text-white/80 text-[10px] font-bold uppercase tracking-widest mb-1.5">{t('dashboard.nextGoal', locale)}</p>
              <h3 className="text-lg font-bold mb-3">{topCategory.name}</h3>
              <div className="w-full bg-white/20 rounded-full h-1.5 mb-2">
                <div className="bg-white h-1.5 rounded-full transition-all" style={{ width: `${topCategory.progress}%` }} />
              </div>
              <div className="flex justify-between text-[10px] font-medium text-white/90">
                <span>%{topCategory.progress} tamamlandı</span>
                <span>{topCategory.total - topCategory.completed} kaldı</span>
              </div>
            </div>
          ) : categories.length > 0 ? (
            <p className="text-xs text-slate-500 py-3 px-4 rounded-xl bg-slate-50 border border-slate-100">
              {t('dashboard.selectProject', locale)}
            </p>
          ) : null}
        </section>

        {/* Orta: Üretkenlik */}
        <section className="col-span-12 lg:col-span-5 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold font-display text-slate-900">Üretkenlik Skoru</h2>
              <span className="text-slate-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
              </span>
            </div>
            <div className="flex items-end justify-between gap-2 h-48 mb-6 px-2">
              {weekDailyCounts.map((count, i) => (
                <div key={i} className="flex flex-col items-center gap-2 flex-1">
                  <div
                    className={`w-full rounded-t-lg transition-all ${
                      i === new Date().getDay() - 1 || (new Date().getDay() === 0 && i === 6) ? 'shadow-lg' : ''
                    }`}
                    style={{
                      height: `${Math.max(10, (count / maxCount) * 100)}%`,
                      backgroundColor: i === new Date().getDay() - 1 || (new Date().getDay() === 0 && i === 6) ? PRIMARY : dark ? '#334155' : '#e2e8f0',
                    }}
                  />
                  <span className={`text-[10px] font-bold ${i === new Date().getDay() - 1 || (new Date().getDay() === 0 && i === 6) ? '' : 'text-slate-400'}`} style={i === new Date().getDay() - 1 || (new Date().getDay() === 0 && i === 6) ? { color: PRIMARY } : undefined}>
                    {DAY_LABELS[i]}
                  </span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl text-center bg-[#f8f6f6]">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Haftalık Ort.</p>
                <p className="text-2xl font-black" style={{ color: PRIMARY }}>
                  {weekDailyCounts.reduce((a, b) => a + b, 0) > 0 ? Math.round((weekDailyCounts.reduce((a, b) => a + b, 0) / 7) * 10) || 0 : 0}%
                </p>
              </div>
              <div className="p-4 rounded-2xl text-center bg-[#f8f6f6]">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tamamlanan</p>
                <p className="text-2xl font-black text-slate-800">{weekCompletedCount}</p>
              </div>
            </div>
          </div>
          <div className={`p-6 rounded-3xl border relative overflow-hidden ${dark ? 'bg-[#ec5b13]/5 border-[#ec5b13]/20' : 'bg-orange-50 border-[#ec5b13]/10'}`}>
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-[#ec5b13]/10 rounded-full blur-2xl" />
            <div className="flex items-center gap-3 mb-4 relative">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#ec5b13]/20">
                <svg className="w-5 h-5" style={{ color: PRIMARY }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
              </div>
              <h3 className="font-bold" style={{ color: PRIMARY }}>Günlük İpucu</h3>
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed italic relative">
              &quot;2 dakika kuralı: İki dakikadan kısa sürecek bir işi hemen yapın. Listeye eklemeyin.&quot;
            </p>
          </div>
        </section>

        {/* Sağ: Takvim + Pomodoro */}
        <section className="col-span-12 lg:col-span-3 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">{MONTHS_TR[currentMonth]} {currentYear}</h2>
              <div className="flex gap-1">
<button type="button" className="p-1 hover:bg-slate-100 rounded" aria-label="Önceki ay">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <button type="button" className="p-1 hover:bg-slate-100 rounded" aria-label="Sonraki ay">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 mb-2">
              {DAY_LABELS.map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium">
              {(() => {
                const firstDay = new Date(currentYear, currentMonth, 1).getDay();
                const startOffset = firstDay === 0 ? 6 : firstDay - 1;
                const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
                const cells = Array.from({ length: 42 }, (_, i) => {
                  const dayNum = i - startOffset + 1;
                  const isCurrentMonth = dayNum >= 1 && dayNum <= daysInMonth;
                  const isToday = isCurrentMonth && dayNum === currentDay;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={isCurrentMonth ? onViewCalendar : undefined}
                      className={'py-2 rounded-lg ' + (!isCurrentMonth ? 'text-slate-300' : isToday ? 'text-white font-bold' : 'hover:bg-slate-100')}
                      style={isToday ? { backgroundColor: PRIMARY } : undefined}
                    >
                      {isCurrentMonth ? dayNum : ''}
                    </button>
                  );
                });
                return cells;
              })()}
            </div>
          </div>
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm text-center">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">Odak Modu</h2>
            <div className="relative inline-flex items-center justify-center mb-6">
              <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 160 160">
                <circle className="text-slate-100" cx="80" cy="80" fill="transparent" r="70" stroke="currentColor" strokeWidth="8" />
                <circle className="transition-all" cx="80" cy="80" fill="transparent" r="70" stroke="currentColor" strokeDasharray="440" strokeDashoffset="110" strokeWidth="8" style={{ color: PRIMARY }} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-slate-800">25:00</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pomodoro</span>
              </div>
            </div>
            <div className="flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => todayTasks[0] && onStartPomodoro?.(todayTasks[0])}
                className="w-12 h-12 rounded-full flex items-center justify-center hover:opacity-90 transition-all"
                style={{ backgroundColor: `${PRIMARY}20`, color: PRIMARY }}
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
              </button>
              <button type="button" className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200 transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
