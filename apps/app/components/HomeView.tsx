'use client';

import { useState, useEffect, useMemo } from 'react';
import { Category, TimelineTask } from '@cursor-deneme/shared';
import { getMockCategories, fetchTasksFromSupabase, filterRecurringTasks, DEFAULT_TAGS, getTagColorClasses, getTodayPomodoroCount, getWeekPomodoroCount, getPomodoroStreak, getWeekCompletedCount, getMyDayTaskIds, toggleMyDayTask, getCountdownLabel, getProfile, supabase } from '@cursor-deneme/shared';
import { MONTHS_TR } from '@cursor-deneme/shared';
import { TaskListSkeleton } from '@/components/Skeletons';
import { CategoryIcon } from '@/lib/categoryIcons';

const WEEKDAY_TR = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

interface HomeViewProps {
  darkMode?: boolean;
  isPro?: boolean;
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

export default function HomeView({
  darkMode = false,
  isPro = false,
  onCategorySelect,
  userId,
  onViewAll,
  onViewCalendar,
  onViewStats,
  onEditTask,
  onStartPomodoro,
  tasks: tasksFromParent,
  categories: categoriesFromParent,
}: HomeViewProps) {
  const dark = darkMode;
  const [localCategories, setLocalCategories] = useState<Category[]>([]);
  const [localTasks, setLocalTasks] = useState<TimelineTask[]>([]);
  const [weekCompletedCount, setWeekCompletedCount] = useState<number>(0);
  const [myDayIds, setMyDayIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(`displayName_${userId}`) ?? null;
    } catch {
      return null;
    }
  });
  const allTasks = tasksFromParent ?? localTasks;
  const categories = categoriesFromParent ?? localCategories;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const cacheKey = `displayName_${userId}`;
      // 1) Oturumdaki kullanıcı metadata'sından ismi hemen çek (çok hızlı, genelde local)
      try {
        const { data } = await supabase.auth.getUser();
        if (!cancelled) {
          const meta = (data?.user?.user_metadata ?? {}) as Record<string, any>;
          const metaName =
            (meta.full_name as string | undefined) ||
            (meta.name as string | undefined) ||
            (meta.first_name && meta.last_name ? `${meta.first_name} ${meta.last_name}` : '');
          if (metaName) {
            setDisplayName(metaName);
            try {
              localStorage.setItem(cacheKey, metaName);
            } catch {
              // noop
            }
          }
        }
      } catch {
        // sessiz geç
      }

      // 2) Ardından profiles tablosundan nihai ismi al (varsa override et)
      try {
        const p = await getProfile(userId);
        if (!cancelled && p.displayName) {
          setDisplayName(p.displayName);
          try {
            localStorage.setItem(cacheKey, p.displayName);
          } catch {
            // noop
          }
        }
      } catch {
        // profil hatasını sessizce yut
      }
    })();
    return () => {
      cancelled = true;
    };
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

  const firstName = displayName?.trim() ? displayName.trim().split(/\s+/)[0] : '';
  const dateLabel = `${currentDay} ${MONTHS_TR[currentMonth]}, ${WEEKDAY_TR[today.getDay()]}`;

  if (loading) {
    return (
      <div className={`flex flex-col flex-1 min-h-0 overflow-auto pb-16 ${dark ? 'bg-[#221610]' : 'bg-[#f5f0ea]'}`}>
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

  const CARD_DARK = '#1f2937';
  const BORDER_DARK = '#111827';
  const bgLight = dark ? 'bg-[#1A2332]' : 'bg-[#F8FAFC]';
  const primary = '#1A2332';

  // Hoş geldin kartında tarih formatı
  const headerDateLabel = `${currentDay} ${MONTHS_TR[currentMonth].toUpperCase()}, ${WEEKDAY_TR[today.getDay()].toUpperCase()}`;

  // Özet kartı için yüzde
  const progressPercent = todayProgressPct;

  // Hızlı kategori butonları için "Rutinler" ve "Okuma Listesi"ni bul
  const routinesCategory =
    categories.find((c) => c.name.toLowerCase().includes('rutin')) ??
    categories.find((c) => c.id === 'routines') ??
    categories[0];
  // Okuma Listesi yeni kullanıcıda yoksa kesinlikle fallback yapmayalım.
  const readingCategory =
    categories.find((c) => c.name.toLowerCase().includes('okuma')) ??
    categories.find((c) => c.id === 'reading') ??
    null;

  return (
    <div className={`flex flex-col flex-1 min-h-0 overflow-auto pb-16 ${bgLight} ${dark ? 'text-slate-100' : 'text-slate-900'}`}>
      <div className="w-full max-w-md mx-auto min-w-0 overflow-x-hidden">
        {/* Header */}
        <header className="px-6 pt-10 pb-6 bg-white/95 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                {firstName ? `Hoş geldin, ${firstName}` : 'Hoş geldin'}
              </h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em]">
                {headerDateLabel}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onViewStats}
            className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-400 border border-slate-200 shadow-sm hover:text-slate-900 transition-colors"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
            </svg>
          </button>
        </header>

        {/* Main content */}
        <main className="flex-1 px-6 space-y-10 pb-8 pt-2">
          {/* Quick add */}
          <section className="mt-8">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  className="w-full h-14 pl-5 pr-4 rounded-2xl border border-slate-200 bg-white focus:ring-2 focus:ring-slate-900 focus:border-slate-900 text-sm shadow-sm transition-all placeholder:text-slate-400"
                  placeholder="Yarın 14:00 toplantı #acil..."
                  onFocus={() => onCategorySelect('add-task')}
                  readOnly
                />
              </div>
              <button
                type="button"
                onClick={() => onCategorySelect('add-task')}
                className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-bold text-sm shadow-lg shadow-slate-200 active:scale-[0.98] transition-all"
              >
                Ekle
              </button>
            </div>
            <button
              type="button"
              onClick={() => onCategorySelect('voice-add')}
              disabled={!isPro}
              className="mt-4 flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full text-[13px] font-semibold transition-colors"
              style={!isPro ? { opacity: 0.55, cursor: 'not-allowed', color: '#9CA3AF' } : undefined}
            >
              <svg
                className="h-4 w-4"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
                />
              </svg>
              Sesle ekle
              {!isPro && (
                <span
                  className="ml-1 inline-flex items-center justify-center opacity-70"
                  style={{ color: primary }}
                  aria-label="Pro"
                >
                  <span
                    className="material-symbols-outlined text-[14px] leading-none"
                    style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}
                  >
                    crown
                  </span>
                </span>
              )}
            </button>
          </section>

          {/* Quick categories: Rutinler & Okuma Listesi */}
          <section className="flex gap-6 overflow-x-auto no-scrollbar py-2">
            {routinesCategory && (
              <button
                type="button"
                onClick={() => onCategorySelect(routinesCategory.id)}
                className="flex flex-col items-center gap-3 shrink-0"
              >
                <div className="w-16 h-16 bg-blue-50 rounded-[1.25rem] flex items-center justify-center text-blue-600 border border-blue-100 hover:bg-blue-100 transition-colors">
                  <CategoryIcon icon={routinesCategory.icon} size={28} />
                </div>
                <span className="text-[11px] font-bold text-slate-500 tracking-wide uppercase">
                  Rutinler
                </span>
              </button>
            )}
            {readingCategory && (
              <button
                type="button"
                onClick={() => onCategorySelect(readingCategory.id)}
                className="flex flex-col items-center gap-3 shrink-0"
              >
                <div className="w-16 h-16 bg-purple-50 rounded-[1.25rem] flex items-center justify-center text-purple-600 border border-purple-100 hover:bg-purple-100 transition-colors">
                  <CategoryIcon icon={readingCategory.icon} size={28} />
                </div>
                <span className="text-[11px] font-bold text-slate-500 tracking-wide uppercase">
                  Okuma Listesi
                </span>
              </button>
            )}
          </section>

          {/* Daily summary */}
          <section className="bg-slate-900 p-7 rounded-[2.5rem] shadow-xl shadow-slate-200">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-lg font-bold text-white">Günün Özeti</h2>
                <p className="text-sm text-slate-400 font-medium">Harika gidiyorsun!</p>
              </div>
              <div className="text-3xl font-bold text-white">
                {progressPercent}%
              </div>
            </div>
            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden mb-5">
              <div
                className="bg-slate-400 h-full transition-all duration-700"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
              {todayCompletedCount}/{todayTotalCount || 0} GÖREV TAMAMLANDI
            </p>
          </section>

          {/* Empty state when hiç görev yok */}
          {todayTasks.length === 0 && todayTotalCount === 0 && (
            <section className="flex flex-col items-center justify-center py-6">
              <div className="w-40 h-40 bg-white rounded-full flex items-center justify-center mb-8 border border-slate-100 shadow-sm">
                <div className="w-14 h-18 border-2 border-slate-200 rounded-lg relative flex items-center justify-center">
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-7 h-3 bg-slate-200 rounded-t-md" />
                  <svg
                    className="h-8 w-8 text-slate-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M5 13l4 4L19 7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
              </div>
              <p className="text-slate-400 font-semibold text-sm">
                Henüz bir görev bulunmuyor
              </p>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
