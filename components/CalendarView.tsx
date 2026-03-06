'use client';

import { useState, useEffect, useMemo } from 'react';
import { Category, TimelineTask } from '@/lib/types';
import { fetchTasksFromSupabase, filterRecurringTasks, isMockUser } from '@/lib/helpers';
import { getCategoryColor, MONTHS_TR } from '@/lib/constants';
import { supabase } from '@/lib/supabaseClient';
import { getGoogleCalendarAuthUrl, getMonthRange, type GoogleCalendarEvent } from '@/lib/googleCalendar';

const PRIMARY = '#ec5b13';
const DAY_NAMES = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

interface CalendarViewProps {
  userId: string;
  darkMode?: boolean;
  onBack: () => void;
  onSessionLost?: () => void;
  onDateSelect: (date: string) => void;
  onEditTask: (task: TimelineTask, date?: string) => void;
  onNewTask?: () => void;
  tasks?: TimelineTask[];
  categories?: Category[];
  isPro?: boolean;
  onOpenPro?: () => void;
}

function getChipClass(categoryColor?: string | null): string {
  const c = getCategoryColor(categoryColor);
  return `${c.light} ${c.text}`;
}

const CATEGORY_BORDER: Record<string, string> = {
  blue: 'border-l-blue-500',
  purple: 'border-l-purple-500',
  pink: 'border-l-pink-500',
  orange: 'border-l-orange-500',
  yellow: 'border-l-yellow-500',
  emerald: 'border-l-emerald-500',
};

export default function CalendarView({
  userId,
  darkMode = false,
  onBack,
  onSessionLost,
  onDateSelect,
  onEditTask,
  onNewTask,
  tasks: tasksFromParent,
  categories = [],
  isPro = false,
  onOpenPro,
}: CalendarViewProps) {
  const dark = darkMode;
  const [localTasks, setLocalTasks] = useState<TimelineTask[]>([]);
  const tasks = tasksFromParent ?? localTasks;
  const [googleEvents, setGoogleEvents] = useState<GoogleCalendarEvent[]>([]);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleConnectError, setGoogleConnectError] = useState<string | null>(null);
  const [googleDisconnectReason, setGoogleDisconnectReason] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('month');
  const isMock = isMockUser(userId);

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const today = new Date();
  const todayDate = today.getDate();
  const todayMonth = today.getMonth();
  const todayYear = today.getFullYear();

  useEffect(() => {
    if (tasksFromParent !== undefined) {
      setLoading(false);
      return;
    }
    if (userId) loadTasks();
  }, [userId, tasksFromParent]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('google_calendar') !== 'callback') return;
    const success = params.get('success');
    const reason = params.get('reason') || '';
    window.history.replaceState({}, '', window.location.pathname);
    if (success === '1') {
      setGoogleConnectError(null);
      loadGoogleEvents();
    } else {
      setGoogleConnectError(reason || 'bilinmeyen');
    }
  }, []);

  useEffect(() => {
    if (!isMock) loadGoogleEvents();
  }, [userId, currentMonth, currentYear, isMock]);

  useEffect(() => {
    if (isMock || !googleLoading) return;
    const t = setTimeout(() => setGoogleLoading(false), 8000);
    return () => clearTimeout(t);
  }, [isMock, googleLoading]);

  const loadTasks = async () => {
    if (!userId) return;
    setLoading(true);
    const loadedTasks = await fetchTasksFromSupabase(userId);
    setLocalTasks(loadedTasks);
    setLoading(false);
  };

  const loadGoogleEvents = async () => {
    if (isMock) return;
    setGoogleLoading(true);
    setGoogleDisconnectReason(null);
    const { timeMin, timeMax } = getMonthRange(currentDate.getFullYear(), currentDate.getMonth());
    const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gtwugoklzczszvueacxm.supabase.co') + '/functions/v1/google-calendar-events';
    const doRequest = async (accessToken: string | null): Promise<Response> => {
      return fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ timeMin, timeMax }),
      });
    };
    try {
      let { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token && !isMock) {
        await new Promise((r) => setTimeout(r, 300));
        const retry = await supabase.auth.getSession();
        session = retry.data.session;
      }
      let hadToken = !!session?.access_token;
      let res = await doRequest(session?.access_token ?? null);
      if (res.status === 401 && hadToken) {
        const { data: refreshData } = await supabase.auth.refreshSession();
        const newSession = refreshData?.session;
        if (newSession?.access_token) {
          res = await doRequest(newSession.access_token);
          hadToken = true;
        }
      }
      const data = await res.json().catch(() => ({})) as { connected?: boolean; events?: GoogleCalendarEvent[]; reason?: string };
      if (res.ok && typeof data.connected === 'boolean') {
        setGoogleConnected(data.connected);
        setGoogleEvents(data.events || []);
        if (!data.connected && data.reason) setGoogleDisconnectReason(data.reason);
        else setGoogleDisconnectReason(null);
      } else {
        setGoogleConnected(false);
        setGoogleEvents([]);
        if (res.status === 401) setGoogleDisconnectReason(hadToken ? 'session_rejected' : 'no_auth');
        else setGoogleDisconnectReason(res.status === 0 ? 'network' : `http_${res.status}`);
      }
    } catch {
      setGoogleConnected(false);
      setGoogleEvents([]);
      setGoogleDisconnectReason('network');
    } finally {
      setGoogleLoading(false);
    }
  };

  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();
  const prevMonthDays = Array.from({ length: firstDayOfMonth }, (_, i) => daysInPrevMonth - firstDayOfMonth + i + 1);
  const currentMonthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const totalCells = 42;
  const remainingCells = totalCells - prevMonthDays.length - currentMonthDays.length;
  const nextMonthDays = Array.from({ length: Math.max(0, remainingCells) }, (_, i) => i + 1);

  const getTasksForDay = (day: number) => filterRecurringTasks(tasks, day.toString());
  const getGoogleEventsForDay = (day: number) => googleEvents.filter((e) => e.date === day.toString());
  const getCategoryById = (id: string | undefined) => categories.find((c) => c.id === id);

  const selectedDayTasks = selectedDate ? filterRecurringTasks(tasks, selectedDate).sort((a, b) => a.time.localeCompare(b.time)) : [];
  const selectedDayGoogleEvents = selectedDate ? getGoogleEventsForDay(parseInt(selectedDate, 10)).sort((a, b) => (a.time || '00:00').localeCompare(b.time || '00:00')) : [];

  const upcomingTasks = useMemo(() => {
    const list: { task: TimelineTask; date: string; label: string }[] = [];
    const startDay = currentMonth === todayMonth && currentYear === todayYear ? todayDate : 1;
    for (let d = startDay; d <= daysInMonth; d++) {
      const dayStr = d.toString();
      const dayTasks = filterRecurringTasks(tasks, dayStr).filter((t) => !t.completed);
      const cat = getCategoryById(dayTasks[0]?.category);
      dayTasks.forEach((task) => {
        let label = `${d} ${MONTHS_TR[currentMonth]}`;
        if (d === todayDate && currentMonth === todayMonth && currentYear === todayYear) label = 'Bugün';
        else if (d === todayDate + 1 && currentMonth === todayMonth && currentYear === todayYear) label = 'Yarın';
        list.push({ task, date: dayStr, label });
      });
    }
    return list.sort((a, b) => parseInt(a.date, 10) - parseInt(b.date, 10) || a.task.time.localeCompare(b.task.time)).slice(0, 8);
  }, [tasks, currentMonth, currentYear, todayDate, todayMonth, todayYear, daysInMonth, categories]);

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1));
    setSelectedDate(null);
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1));
    setSelectedDate(null);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(todayDate.toString());
  };

  const cellBorder = dark ? 'border-slate-800/50' : 'border-slate-100';
  const cellMuted = dark ? 'bg-slate-900/10 text-slate-600' : 'bg-slate-50/30 text-slate-300';

  if (loading) {
    return (
      <div className={`flex h-screen items-center justify-center ${dark ? 'bg-[#221610]' : 'bg-[#f8f6f6]'}`}>
        <div className={`w-12 h-12 border-4 rounded-full animate-spin ${dark ? 'border-slate-700 border-t-[#ec5b13]' : 'border-slate-200 border-t-[#ec5b13]'}`} />
      </div>
    );
  }

  return (
    <div className={`flex flex-col min-h-screen pb-24 md:pb-0 ${dark ? 'bg-[#221610] text-slate-100' : 'bg-[#f8f6f6] text-slate-900'}`}>
      {/* Top bar - Stitch style */}
      <header className="h-16 border-b border-slate-200 flex items-center justify-between px-4 md:px-8 bg-white shrink-0 text-slate-900">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-700"
            aria-label="Geri"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h1 className="text-xl md:text-2xl font-bold font-display">{MONTHS_TR[currentMonth]} {currentYear}</h1>
          <div className="hidden md:flex items-center bg-slate-100 p-1 rounded-xl ml-4">
            <button type="button" onClick={() => setViewMode('day')} className={'px-4 py-1.5 text-xs font-medium rounded-lg transition-colors ' + (viewMode === 'day' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500')}>Gün</button>
            <button type="button" onClick={() => setViewMode('week')} className={'px-4 py-1.5 text-xs font-medium rounded-lg transition-colors ' + (viewMode === 'week' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500')}>Hafta</button>
            <button type="button" onClick={() => setViewMode('month')} className={'px-4 py-1.5 text-xs font-medium rounded-lg transition-colors ' + (viewMode === 'month' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500')}>Ay</button>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button type="button" onClick={() => goToPreviousMonth()} className="p-1.5 hover:bg-white rounded-lg transition-colors text-slate-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button type="button" onClick={goToToday} className="px-3 text-xs font-bold uppercase tracking-wider text-slate-900">Bugün</button>
            <button type="button" onClick={goToNextMonth} className="p-1.5 hover:bg-white rounded-lg transition-colors text-slate-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
          <div className="h-8 w-px bg-slate-200 mx-1 md:mx-2 hidden md:block" />
          <button type="button" className="p-2 text-slate-500 hover:bg-slate-100 rounded-full hidden md:flex" aria-label="Ara">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </button>
          <button type="button" className="p-2 text-slate-500 hover:bg-slate-100 rounded-full hidden md:flex" aria-label="Bildirimler">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
          </button>
          <div className="size-8 rounded-full bg-slate-300 flex items-center justify-center text-sm font-semibold text-slate-600 border-2 border-[#ec5b13]/20">?</div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Calendar grid */}
        <div className="flex-1 overflow-auto p-4">
          <div className={`h-full min-h-[480px] border rounded-xl overflow-hidden flex flex-col ${dark ? 'bg-[#221610]/40 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className={`grid grid-cols-7 border-b ${dark ? 'border-slate-800 bg-slate-800/50' : 'border-slate-200 bg-slate-50'}`}>
              {DAY_NAMES.map((day) => (
                <div key={day} className="py-3 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">{day}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 grid-rows-6 flex-1 auto-rows-fr">
              {prevMonthDays.map((day) => (
                <div key={`p-${day}`} className={`border-b border-r ${cellBorder} ${cellMuted} p-2`}>
                  <span className="text-sm font-medium">{day}</span>
                </div>
              ))}
              {currentMonthDays.map((day) => {
                const dayTasks = getTasksForDay(day);
                const dayGoogle = getGoogleEventsForDay(day);
                const combined = [
                  ...dayTasks.slice(0, 3).map((t) => ({ type: 'task' as const, title: t.title, id: t.id, task: t })),
                  ...dayGoogle.slice(0, 2).map((e) => ({ type: 'google' as const, title: e.title, id: e.id, task: null })),
                ];
                const isToday = day === todayDate && currentMonth === todayMonth && currentYear === todayYear;
                const isSelected = selectedDate === day.toString();

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setSelectedDate(day.toString())}
                    className={`border-b border-r ${cellBorder} p-2 text-left group cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors min-h-[80px] ${
                      isToday ? 'bg-[#ec5b13]/5' : ''
                    } ${isSelected ? 'ring-2 ring-[#ec5b13]/40 ring-inset' : ''}`}
                  >
                    <span className={`text-sm font-medium block mb-1 ${isToday ? 'font-bold text-[#ec5b13]' : ''}`}>
                      {day}
                      {isToday && ' Bugün'}
                    </span>
                    <div className="space-y-1">
                      {combined.map((item) => {
                        if (item.type === 'google') {
                          return (
                            <div key={item.id} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-800 truncate">
                              {item.title}
                            </div>
                          );
                        }
                        const cat = getCategoryById(item.task.category);
                        const chipClass = getChipClass(cat?.color, dark);
                        return (
                          <div
                            key={item.task.id}
                            role="button"
                            tabIndex={0}
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditTask(item.task, day.toString());
                            }}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), onEditTask(item.task, day.toString()))}
                            className={`text-[10px] px-1.5 py-0.5 rounded truncate cursor-pointer hover:opacity-90 ${getChipClass(cat?.color)}`}
                          >
                            {item.title}
                          </div>
                        );
                      })}
                      {(dayTasks.length + dayGoogle.length) > 3 && (
                        <div className="text-[10px] text-slate-400">+{dayTasks.length + dayGoogle.length - 3}</div>
                      )}
                    </div>
                  </button>
                );
              })}
              {nextMonthDays.map((day) => (
                <div key={`n-${day}`} className={`border-b border-r ${cellBorder} ${cellMuted} p-2`}>
                  <span className="text-sm font-medium">{day}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Selected day detail - below calendar on mobile, or we keep it as before */}
          {selectedDate && (
            <div className={`mt-4 rounded-xl overflow-hidden ${dark ? 'bg-slate-900/60 border border-slate-800' : 'bg-white border border-slate-100 shadow-sm'} md:hidden`}>
              <div className={`px-4 py-3 border-b ${dark ? 'border-slate-800' : 'border-stone-100'}`}>
                <h2 className="font-bold">{selectedDate} {MONTHS_TR[currentMonth]}</h2>
                <p className="text-sm text-slate-500">{selectedDayTasks.length} görev{selectedDayGoogleEvents.length > 0 ? ` · ${selectedDayGoogleEvents.length} Google` : ''}</p>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {selectedDayTasks.map((task) => (
                  <button key={task.id} type="button" onClick={() => onEditTask(task, selectedDate)} className="w-full px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 flex items-center justify-between">
                    <span className="font-medium truncate">{task.title}</span>
                    <span className="text-xs text-slate-500">{task.time}</span>
                  </button>
                ))}
                {selectedDayGoogleEvents.map((e) => (
                  <div key={e.id} className="px-4 py-3 flex items-center gap-2 bg-slate-100">
                    <span className="text-slate-600 font-bold text-xs">g</span>
                    <span className="font-medium truncate">{e.title}</span>
                  </div>
                ))}
                {selectedDayTasks.length === 0 && selectedDayGoogleEvents.length === 0 && (
                  <p className="px-4 py-6 text-center text-sm text-slate-500">Bu tarihte görev yok</p>
                )}
              </div>
            </div>
          )}

          {/* Google connect - compact */}
          {!isMock && !googleConnected && !googleLoading && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {isPro ? (
                <a href={getGoogleCalendarAuthUrl(userId) || '#'} className="text-xs font-semibold text-[#ec5b13] hover:underline">
                  Google Takvim&apos;i Bağla
                </a>
              ) : onOpenPro ? (
                <button type="button" onClick={onOpenPro} className="text-xs font-semibold text-[#ec5b13] hover:underline">
                  Pro ile Google Takvim
                </button>
              ) : null}
            </div>
          )}
        </div>

        {/* Right sidebar - Upcoming Tasks */}
        <aside className={`hidden lg:flex flex-col w-80 shrink-0 border-l ${dark ? 'border-slate-800 bg-[#221610]/30' : 'border-slate-200 bg-white/50'} p-6 gap-6 overflow-auto`}>
          <div>
            <h3 className="text-lg font-bold mb-4">Yaklaşan Görevler</h3>
            <div className="space-y-4">
              {upcomingTasks.length === 0 ? (
                <p className="text-sm text-slate-500">Yaklaşan görev yok</p>
              ) : (
                upcomingTasks.map(({ task, date, label }) => {
                  const cat = getCategoryById(task.category);
                  const borderClass = cat && cat.color ? (CATEGORY_BORDER[cat.color] ?? 'border-l-[#ec5b13]') : 'border-l-[#ec5b13]';
                  return (
                    <button
                      key={task.id ?? task.title + date}
                      type="button"
                      onClick={() => onEditTask(task, date)}
                      className={`w-full p-4 rounded-xl shadow-sm border-l-4 text-left transition-colors hover:opacity-90 ${dark ? 'bg-slate-800' : 'bg-white'} ${borderClass}`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${cat ? getCategoryColor(cat.color).text : 'text-[#ec5b13]'}`}>
                          {cat?.name ?? 'Görev'}
                        </span>
                        <span className="text-[10px] text-slate-400">{label}</span>
                      </div>
                      <h4 className="text-sm font-semibold mb-1">{task.title}</h4>
                      <span className="text-xs text-slate-500">{task.time}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
          <div className="mt-auto p-4 rounded-2xl bg-[#ec5b13]/10 border border-[#ec5b13]/20">
            <div className="flex items-center gap-3 mb-2">
              <svg className="w-5 h-5 text-[#ec5b13]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              <h4 className="text-sm font-bold text-[#ec5b13]">Verimlilik İpucu</h4>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Toplantıları salı günleri gruplayarak derin iş için daha fazla zaman açın.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
