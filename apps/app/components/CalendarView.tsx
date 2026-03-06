'use client';

import { useState, useEffect, useMemo } from 'react';
import { Category, TimelineTask } from '@cursor-deneme/shared';
import { fetchTasksFromSupabase, filterRecurringTasks, isMockUser } from '@cursor-deneme/shared';
import { getCategoryColor, MONTHS_TR } from '@cursor-deneme/shared';
import { supabase } from '@cursor-deneme/shared';
import { getGoogleCalendarAuthUrl, getMonthRange, type GoogleCalendarEvent } from '@cursor-deneme/shared';

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

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${dark ? 'bg-[#0f0f0f]' : 'bg-[#f5f0ea]'}`}>
        <div className="text-center">
          <div className={`w-12 h-12 border-4 rounded-full animate-spin mx-auto mb-4 ${dark ? 'border-zinc-700 border-t-amber-400/80' : 'border-stone-200 border-t-amber-500'}`} />
          <p className={dark ? 'text-zinc-500' : 'text-stone-500'}>Takvim yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen pb-24 ${dark ? 'bg-[#0f0f0f]' : 'bg-[#f5f0ea]'}`}>
      {/* Header - eski sade tasarım */}
      <div className={`sticky top-0 z-10 px-4 sm:px-6 py-5 border-b ${dark ? 'bg-[#0f0f0f] border-zinc-800' : 'bg-[#f5f0ea] border-stone-200'}`}>
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onBack}
              className={`w-10 h-10 flex items-center justify-center rounded-xl transition-colors ${dark ? 'hover:bg-zinc-800' : 'hover:bg-white/80'}`}
              aria-label="Geri"
            >
              <svg className={`w-6 h-6 ${dark ? 'text-zinc-300' : 'text-stone-700'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className={`text-xl font-semibold ${dark ? 'text-white' : 'text-stone-900'}`}>
              {MONTHS_TR[currentMonth]} {currentYear}
            </h1>
            <button
              onClick={goToToday}
              className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                dark ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
              }`}
            >
              Bugün
            </button>
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={goToPreviousMonth}
              className={`w-10 h-10 flex items-center justify-center rounded-xl transition-colors ${dark ? 'hover:bg-zinc-800' : 'hover:bg-white/80'}`}
            >
              <svg className={`w-5 h-5 ${dark ? 'text-zinc-400' : 'text-stone-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className={`text-sm ${dark ? 'text-zinc-500' : 'text-stone-500'}`}>
              {tasks.length} görev{googleConnected ? ` · ${googleEvents.length} Google` : ''}
            </div>
            <button
              onClick={goToNextMonth}
              className={`w-10 h-10 flex items-center justify-center rounded-xl transition-colors ${dark ? 'hover:bg-zinc-800' : 'hover:bg-white/80'}`}
            >
              <svg className={`w-5 h-5 ${dark ? 'text-zinc-400' : 'text-stone-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          {!isMock && googleConnectError && (
            <div className={`mt-3 px-3 py-2 rounded-xl text-xs ${dark ? 'bg-red-900/30 text-red-300' : 'bg-red-50 text-red-700'}`}>
              Bağlantı kurulamadı: {googleConnectError}
              <button type="button" onClick={() => setGoogleConnectError(null)} className="ml-2 underline">Kapat</button>
            </div>
          )}
          {!isMock && !googleConnected && !googleLoading && (
            <div className="mt-2">
              {isPro ? (
                <a href={getGoogleCalendarAuthUrl(userId) || '#'} className={`text-xs font-semibold ${dark ? 'text-amber-400 hover:underline' : 'text-amber-700 hover:underline'}`}>
                  Google Takvim&apos;i Bağla
                </a>
              ) : onOpenPro ? (
                <button type="button" onClick={onOpenPro} className={`text-xs font-semibold ${dark ? 'text-amber-400 hover:underline' : 'text-amber-700 hover:underline'}`}>
                  Pro ile Google Takvim
                </button>
              ) : null}
            </div>
          )}
        </div>
      </div>

      <div className="px-4 sm:px-6 py-4">
        <div className={`rounded-2xl overflow-hidden mb-6 ${dark ? 'bg-zinc-900/60 border border-zinc-800' : 'bg-white shadow-[0_4px_24px_-4px_rgba(0,0,0,0.06)] border border-stone-100'}`}>
          <div className={`grid grid-cols-7 border-b ${dark ? 'border-zinc-800 bg-zinc-900/40' : 'border-stone-200 bg-stone-50/80'}`}>
            {DAY_NAMES.map((day) => (
              <div key={day} className={`text-center py-3 text-xs font-semibold ${dark ? 'text-zinc-500' : 'text-stone-600'}`}>
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {prevMonthDays.map((day) => (
              <div
                key={`p-${day}`}
                className={`aspect-square border p-2 opacity-40 ${dark ? 'border-zinc-800 bg-zinc-900/40' : 'border-stone-100 bg-stone-50/50'}`}
              >
                <div className={`text-sm ${dark ? 'text-zinc-600' : 'text-stone-400'}`}>{day}</div>
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
                  className={`aspect-square border p-2 text-left transition-all relative min-w-0 ${
                    dark
                      ? isSelected
                        ? 'bg-amber-500/25 border-amber-500/60 ring-2 ring-amber-400/30'
                        : isToday
                          ? 'bg-amber-500/10 border-amber-500/30'
                          : 'border-zinc-800 hover:bg-zinc-800'
                      : isSelected
                        ? 'bg-amber-100 border-amber-400 ring-2 ring-amber-400/20'
                        : isToday
                          ? 'bg-amber-50 border-amber-200'
                          : 'border-stone-100 hover:bg-white/80'
                  }`}
                >
                  <div className={`text-sm font-semibold mb-1 ${
                    isToday ? (dark ? 'text-amber-400' : 'text-amber-700') : isSelected ? (dark ? 'text-amber-400' : 'text-amber-700') : dark ? 'text-zinc-200' : 'text-stone-900'
                  }`}>
                    {day}
                  </div>
                  {combined.length > 0 && (
                    <div className="space-y-0.5">
                      {combined.map((item) =>
                        item.type === 'task' ? (
                          <div
                            key={item.task.id}
                            role="button"
                            tabIndex={0}
                            onClick={(e) => { e.stopPropagation(); onEditTask(item.task, day.toString()); }}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), onEditTask(item.task, day.toString()))}
                            className={`text-[10px] px-1.5 py-0.5 rounded truncate flex items-center gap-0.5 cursor-pointer hover:opacity-90 ${
                              item.task.completed
                                ? dark ? 'bg-zinc-700 text-zinc-500' : 'bg-stone-100 text-stone-400'
                                : dark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            <span className="truncate">{item.title}</span>
                          </div>
                        ) : (
                          <div key={item.id} className={`text-[10px] px-1.5 py-0.5 rounded truncate flex items-center gap-0.5 ${dark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700'}`}>
                            <span className="font-bold text-blue-500 shrink-0">g</span>
                            <span className="truncate">{item.title}</span>
                          </div>
                        )
                      )}
                      {(dayTasks.length + dayGoogle.length) > 3 && (
                        <div className={`text-[10px] font-medium ${dark ? 'text-zinc-500' : 'text-stone-500'}`}>
                          +{dayTasks.length + dayGoogle.length - 3} daha
                        </div>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
            {nextMonthDays.map((day) => (
              <div
                key={`n-${day}`}
                className={`aspect-square border p-2 opacity-40 ${dark ? 'border-zinc-800 bg-zinc-900/40' : 'border-stone-100 bg-stone-50/50'}`}
              >
                <div className={`text-sm ${dark ? 'text-zinc-600' : 'text-stone-400'}`}>{day}</div>
              </div>
            ))}
          </div>
        </div>

        {selectedDate && (
          <div className={`rounded-2xl overflow-hidden ${dark ? 'bg-zinc-900/60 border border-zinc-800' : 'bg-white shadow-[0_4px_24px_-4px_rgba(0,0,0,0.06)] border border-stone-100'}`}>
            <div className={`px-5 py-4 border-b ${dark ? 'bg-amber-500/20 border-zinc-800' : 'bg-amber-50 border-stone-100'}`}>
              <h2 className={`text-lg font-bold ${dark ? 'text-white' : 'text-stone-900'}`}>
                {selectedDate} {MONTHS_TR[currentMonth]}
              </h2>
              <p className={`text-sm ${dark ? 'text-amber-400/90' : 'text-amber-700/90'}`}>
                {selectedDayTasks.length} görev{selectedDayGoogleEvents.length > 0 ? ` · ${selectedDayGoogleEvents.length} Google` : ''}
              </p>
            </div>
            {selectedDayTasks.length === 0 && selectedDayGoogleEvents.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <p className={`text-sm ${dark ? 'text-zinc-500' : 'text-stone-500'}`}>Bu tarihte görev veya etkinlik yok</p>
              </div>
            ) : (
              <div className={dark ? 'divide-y divide-zinc-800' : 'divide-y divide-stone-100'}>
                {selectedDayTasks.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => onEditTask(task, selectedDate)}
                    className={`w-full px-5 py-4 text-left flex items-center gap-3 transition-colors ${dark ? 'hover:bg-zinc-800/80' : 'hover:bg-stone-50'}`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      task.completed ? (dark ? 'bg-amber-500/80 border-amber-500/80' : 'bg-amber-500 border-amber-500') : (dark ? 'border-zinc-600' : 'border-stone-300')
                    }`}>
                      {task.completed && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium truncate ${task.completed ? (dark ? 'line-through text-zinc-500' : 'line-through text-stone-400') : (dark ? 'text-zinc-100' : 'text-stone-900')}`}>
                        {task.title}
                      </div>
                      <div className={`text-xs mt-1 ${dark ? 'text-zinc-500' : 'text-stone-400'}`}>{task.time}</div>
                    </div>
                    <svg className={`w-4 h-4 flex-shrink-0 ${dark ? 'text-zinc-500' : 'text-stone-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
                {selectedDayGoogleEvents.map((event) => (
                  <div
                    key={event.id}
                    className={`w-full px-5 py-4 flex items-center gap-3 ${dark ? 'bg-blue-500/5' : 'bg-blue-50/50'}`}
                  >
                    <span className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 font-bold text-[10px] ${dark ? 'bg-blue-500/30 text-blue-400' : 'bg-blue-200 text-blue-700'}`}>g</span>
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium truncate ${dark ? 'text-zinc-100' : 'text-stone-900'}`}>{event.title}</div>
                      <div className={`text-xs mt-1 ${dark ? 'text-zinc-500' : 'text-stone-500'}`}>
                        {event.allDay ? 'Tüm gün' : event.time}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
