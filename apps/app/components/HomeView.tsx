'use client';

import { useState, useEffect, useMemo } from 'react';
import { Category, TimelineTask } from '@cursor-deneme/shared';
import { getMockCategories, fetchTasksFromSupabase, filterRecurringTasks, DEFAULT_TAGS, getTagColorClasses, getTodayPomodoroCount, getWeekPomodoroCount, getPomodoroStreak, getWeekCompletedCount, getMyDayTaskIds, toggleMyDayTask, getCountdownLabel, getProfile } from '@cursor-deneme/shared';
import { MONTHS_TR } from '@cursor-deneme/shared';
import { TaskListSkeleton } from '@/components/Skeletons';
import { CategoryIcon } from '@/lib/categoryIcons';

const WEEKDAY_TR = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

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
  const [displayName, setDisplayName] = useState<string | null>(null);
  const allTasks = tasksFromParent ?? localTasks;
  const categories = categoriesFromParent ?? localCategories;

  useEffect(() => {
    getProfile(userId).then((p) => setDisplayName(p.displayName || null));
  }, [userId]);

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

  // Bugünkü tüm görevler (tekrarlı dahil) – özet kartı için
  const todayAllTasks = useMemo(
    () => filterRecurringTasks(allTasks, todayStr),
    [allTasks, todayStr]
  );
  const todayCompletedCount = todayAllTasks.filter((t) => t.completed).length;
  const todayTotalCount = todayAllTasks.length;
  const todayProgressPct = todayTotalCount > 0 ? Math.round((todayCompletedCount / todayTotalCount) * 100) : 0;

  const userInitial = (displayName && displayName.trim()[0]) ? displayName.trim()[0].toUpperCase() : 'K';
  const dateLabel = `${currentDay} ${MONTHS_TR[currentMonth]}, ${WEEKDAY_TR[today.getDay()]}`;

  if (loading) {
    return (
      <div className={`flex flex-col flex-1 min-h-0 overflow-auto pb-24 ${dark ? 'bg-[#221610]' : 'bg-[#f5f0ea]'}`}>
        <div className="w-full max-w-md md:max-w-none mx-auto md:mx-0 px-4 md:px-0 pt-8 pb-4 min-w-0 overflow-x-hidden">
          <div className={dark ? 'h-px w-12 bg-amber-400/80 mb-5' : 'mb-6'}>
            <div className={`h-8 rounded w-48 mb-2 animate-pulse ${dark ? '' : 'bg-stone-200'}`} style={dark ? { backgroundColor: '#3d2a1f' } : undefined}></div>
            <div className={`h-4 rounded w-32 animate-pulse ${dark ? '' : 'bg-stone-100'}`} style={dark ? { backgroundColor: '#2a1f1a' } : undefined}></div>
          </div>
          <div className={`rounded-xl p-4 ${dark ? '' : 'bg-white border border-stone-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)]'}`} style={dark ? { backgroundColor: '#2a1f1a', borderWidth: 1, borderStyle: 'solid', borderColor: '#3d2a1f' } : undefined}>
            <TaskListSkeleton count={3} />
          </div>
        </div>
      </div>
    );
  }

  const CARD_DARK = '#2a1f1a';
  const BORDER_DARK = '#3d2a1f';
  const bgLight = dark ? 'bg-[#221610]' : 'bg-[#fdfcfb]';
  const cardBg = 'bg-white border-stone-100';
  const cardDarkStyle = dark ? { backgroundColor: CARD_DARK, borderColor: BORDER_DARK } : undefined;
  const primary = '#f59e0b';

  return (
    <div className={`flex flex-col flex-1 min-h-0 overflow-auto pb-24 ${bgLight} ${dark ? 'text-slate-100' : 'text-slate-900'}`}>
      <div className="w-full max-w-md mx-auto px-6 pt-8 pb-4 min-w-0 overflow-x-hidden">
        {/* Header: avatar + Hoş geldin + tarih, bildirim */}
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div
              className="size-10 rounded-full flex items-center justify-center overflow-hidden border shrink-0 text-lg font-semibold"
              style={{ backgroundColor: `${primary}20`, borderColor: `${primary}33`, color: primary }}
            >
              {userInitial}
            </div>
            <div>
              <h1 className="text-2xl font-extralight tracking-tight" style={{ color: dark ? '#f5f0ea' : '#1a1a1a' }}>
                Hoş geldin
              </h1>
              <p className="text-[10px] uppercase tracking-[0.2em] font-medium opacity-70" style={{ color: primary }}>
                {dateLabel}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onViewStats}
            className={`size-10 rounded-full flex items-center justify-center shadow-sm border ${dark ? '' : 'bg-white border-stone-100'}`}
            style={dark ? { backgroundColor: '#2a1f1a', borderColor: '#3d2a1f' } : undefined}
            aria-label="Bildirimler"
          >
            <svg className="w-5 h-5 text-slate-600 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>
        </header>

        {/* Yatay kategoriler */}
        <div className="w-full overflow-x-auto scrollbar-hide flex gap-6 pb-6 -mx-6 px-6">
          {categories.map((cat) => {
            const colors: Record<string, { bg: string; text: string }> = {
              blue: { bg: 'bg-blue-50 dark:bg-blue-900/30', text: 'text-blue-400' },
              green: { bg: 'bg-green-50 dark:bg-green-900/30', text: 'text-green-500' },
              purple: { bg: 'bg-purple-50 dark:bg-purple-900/30', text: 'text-purple-400' },
              orange: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-500' },
            };
            const c = colors[cat.color] || colors.orange;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onCategorySelect(cat.id)}
                className="flex flex-col items-center gap-2 shrink-0"
              >
                <div className={`size-14 rounded-2xl flex items-center justify-center ${c.bg} ${c.text}`}>
                  <CategoryIcon icon={cat.icon} size={28} className="w-7 h-7 shrink-0" />
                </div>
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 max-w-[72px] truncate">
                  {cat.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Günün özeti kartı */}
        <div className="px-0 py-4">
          <div className={`${cardBg} p-6 rounded-xl border shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]`} style={cardDarkStyle}>
            <div className="flex justify-between items-end mb-4">
              <div>
                <h3 className={`text-sm font-semibold ${dark ? 'text-slate-100' : 'text-slate-800'}`}>Günün Özeti</h3>
                <p className="text-xs text-slate-400 mt-1">Harika gidiyorsun!</p>
              </div>
              <span className="text-xl font-light" style={{ color: primary }}>{todayProgressPct}%</span>
            </div>
            <div className={`h-2 w-full rounded-full overflow-hidden ${dark ? '' : 'bg-slate-100'}`} style={dark ? { backgroundColor: '#3d2a1f' } : undefined}>
              <div className="h-full rounded-full transition-all" style={{ width: `${todayProgressPct}%`, backgroundColor: primary }} />
            </div>
            <p className="text-[11px] text-slate-400 mt-3">
              {todayCompletedCount}/{todayTotalCount > 0 ? todayTotalCount : '0'} görev tamamlandı
            </p>
          </div>
        </div>

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
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${task.completed ? (dark ? 'bg-amber-400/80' : 'bg-amber-500') : (dark ? '' : 'border-stone-300')}`} style={dark && !task.completed ? { borderColor: '#6b5a4a' } : undefined}>
                    {task.completed && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                  </div>
                </div>
              ))}
            </div>
            {myDayTasks.length > 5 && <p className={`text-center py-2 text-xs ${dark ? '' : 'text-stone-500'}`} style={dark ? { color: '#b8a99e' } : undefined}>+{myDayTasks.length - 5} daha</p>}
          </div>
        )}

        {/* Pomodoro Özet */}
        {(todayPomodoros > 0 || weekPomodoros > 0) && (
          <button
            onClick={onViewStats}
            className={`w-full rounded-xl p-4 mb-3 text-left transition-all ${
              dark ? 'border hover:opacity-90' : 'bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)] border border-stone-100 hover:shadow-md'
            }`}
            style={dark ? { backgroundColor: '#2a1f1a', borderColor: '#3d2a1f' } : undefined}
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

        {/* Ana içerik: Boş durum veya bugünün görevleri */}
        {todayTasks.length === 0 && todayTotalCount === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center px-8 pb-20">
            <div className="size-32 rounded-full flex items-center justify-center mb-6" style={{ backgroundColor: `${primary}15` }}>
              <svg className="w-14 h-14 opacity-40" style={{ color: primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <h2 className="text-lg font-medium text-slate-700 dark:text-slate-200 text-center mb-2">Henüz görev yok</h2>
            <p className="text-sm text-slate-400 text-center mb-8 max-w-[240px]">Bugün başarmak istediğin ilk şeyi ekleyerek başla.</p>
            <button
              type="button"
              onClick={() => onCategorySelect('add-task')}
              className="w-full max-w-[280px] py-4 px-6 rounded-xl font-medium transition-colors flex items-center justify-center gap-3"
              style={{ backgroundColor: `${primary}20`, color: primary }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              İlk Görevini Ekle
            </button>
          </div>
        ) : todayTasks.length > 0 ? (
          <div className={`rounded-xl overflow-hidden mb-4 ${cardBg} border shadow-sm`} style={cardDarkStyle}>
            <div className={`px-4 py-3 flex items-center justify-between border-b ${dark ? '' : 'border-stone-100'}`} style={dark ? { borderColor: '#3d2a1f' } : undefined}>
              <h2 className={`text-sm font-semibold ${dark ? 'text-slate-100' : 'text-slate-800'}`}>Bugün</h2>
              <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: `${primary}20`, color: primary }}>
                {todayTasks.length}
              </span>
            </div>
            <div className={dark ? '' : 'p-2'}>
              {todayTasks.slice(0, 5).map((task) => {
                const inMyDay = task.id && myDayIds.includes(task.id);
                return (
                <div
                  key={task.id}
                  className={`w-full flex items-center gap-3 group rounded-xl ${dark ? 'py-2.5 px-4 border-b last:border-0' : 'p-3 mx-2 mb-1.5 bg-stone-50/80 hover:bg-amber-50/60'}`}
                  style={dark ? { borderColor: '#3d2a1f' } : undefined}
                >
                  <button
                    onClick={(e) => { e.stopPropagation(); task.id && handleToggleMyDay(task.id); }}
                    className={`flex-shrink-0 p-0.5 ${inMyDay ? 'text-amber-500' : dark ? 'hover:text-amber-500/70' : 'text-stone-300 hover:text-amber-500'}`}
                    style={dark && !inMyDay ? { color: '#8b7355' } : undefined}
                    title={inMyDay ? 'Odak listesinden çıkar' : 'Bugün odakta'}
                  >
                    {inMyDay ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                    )}
                  </button>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    task.completed ? (dark ? 'bg-amber-400/80 border-amber-400/80' : 'bg-amber-500 border-amber-500') : (dark ? '' : 'border-stone-300')
                  }`} style={dark && !task.completed ? { borderColor: '#6b5a4a' } : undefined}>
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
                      className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all opacity-0 group-hover:opacity-100 ${dark ? 'hover:opacity-80' : 'hover:bg-red-50'}`}
                      style={dark ? { backgroundColor: 'transparent' } : undefined}
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
                  className={`w-full py-3 text-sm font-medium transition-colors rounded-b-xl ${dark ? 'text-amber-400/90 hover:opacity-90' : 'text-amber-700 hover:bg-amber-50/60'}`}
                >
                  +{todayTasks.length - 5} görev daha görüntüle
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center px-8 py-12">
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">Bugünkü görevlerin hepsini tamamladın 🎉</p>
            <button
              type="button"
              onClick={() => onCategorySelect('add-task')}
              className="py-3 px-5 rounded-xl font-medium text-sm"
              style={{ backgroundColor: `${primary}20`, color: primary }}
            >
              + Yeni görev ekle
            </button>
          </div>
        )}

        {/* Yaklaşan Görevler */}
        {upcomingTasks.length > 0 && (
          <div className={`rounded-xl overflow-hidden mb-4 ${dark ? 'border' : 'bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)] border border-stone-100'}`} style={dark ? { backgroundColor: '#2a1f1a', borderColor: '#3d2a1f' } : undefined}>
            <div className={`px-4 py-3 ${dark ? 'border-b' : 'border-b border-stone-100'}`} style={dark ? { borderColor: '#3d2a1f' } : undefined}>
              <h2 className={dark ? 'text-xs font-medium' : 'text-sm font-semibold text-stone-600'} style={dark ? { color: '#b8a99e' } : undefined}>Yaklaşan</h2>
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
                    className={`w-full text-left flex items-center gap-3 rounded-xl transition-all active:scale-[0.99] active:opacity-95 ${dark ? 'py-2.5 px-4 border-b last:border-0 hover:opacity-90' : 'py-2.5 px-4 mx-2 mb-1.5 bg-stone-50/60 hover:bg-stone-100/80'}`}
                    style={dark ? { borderColor: '#3d2a1f' } : undefined}
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

      </div>
    </div>
  );
}
