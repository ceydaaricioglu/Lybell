'use client';

import { useState, useEffect } from 'react';
import { Category, TimelineTask } from '@cursor-deneme/shared';
import { fetchTasksFromSupabase, filterRecurringTasks, isMockUser } from '@cursor-deneme/shared';
import { MONTHS_TR } from '@cursor-deneme/shared';
import { supabase } from '@cursor-deneme/shared';
import { getGoogleCalendarAuthUrl, getMonthRange, type GoogleCalendarEvent } from '@cursor-deneme/shared';
import { useLocale } from '@/components/LocaleContext';

// Lybell takvim paleti
const PRIMARY = '#1e293b'; // deep navy
const ACCENT_ORANGE = '#ec5b13';
const BG_LIGHT = '#f8fafc';
const BG_DARK = '#0f172a';
const DAY_NAMES = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const WEEKDAY_TR = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

interface CalendarViewProps {
  userId: string;
  darkMode?: boolean;
  onBack: () => void;
  onSessionLost?: () => void;
  onDateSelect: (date: string) => void;
  onEditTask: (task: TimelineTask, date?: string) => void;
  onNewTask?: (date?: string) => void;
  tasks?: TimelineTask[];
  categories?: Category[];
  isPro?: boolean;
  onOpenPro?: () => void;
}

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
  const { locale } = useLocale();
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
    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!baseUrl) {
      setGoogleLoading(false);
      return;
    }
    const url = `${baseUrl}/functions/v1/google-calendar-events`;
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
  const firstDayMonday = (firstDayOfMonth + 6) % 7;
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const currentMonthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const totalCells = 42;
  const nextMonthCount = Math.max(0, totalCells - firstDayMonday - currentMonthDays.length);
  const nextMonthDays = Array.from({ length: nextMonthCount }, (_, i) => i + 1);

  const getGoogleEventsForDay = (day: number) => googleEvents.filter((e) => e.date === day.toString());

  const agendaDate = selectedDate || todayDate.toString();
  const selectedDayTasks = filterRecurringTasks(tasks, agendaDate).sort((a, b) => a.time.localeCompare(b.time));
  const selectedDayGoogleEvents = getGoogleEventsForDay(parseInt(agendaDate, 10)).sort((a, b) => (a.time || '00:00').localeCompare(b.time || '00:00'));

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1));
    setSelectedDate(null);
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1));
    setSelectedDate(null);
  };

  const displayDate = selectedDate || todayDate.toString();
  const isAgendaToday = agendaDate === todayDate.toString() && currentMonth === todayMonth && currentYear === todayYear;
  const agendaLabel = isAgendaToday ? 'Bugün' : `${agendaDate} ${MONTHS_TR[currentMonth]}`;
  const todayStr = `${todayDate} ${MONTHS_TR[todayMonth]}, ${WEEKDAY_TR[today.getDay()]}`;

  const handleAddTask = () => {
    if (onNewTask) onNewTask(agendaDate);
    else onDateSelect(agendaDate);
  };

  if (loading) {
    return (
      <div className={`flex flex-col flex-1 min-h-0 overflow-auto ${dark ? 'bg-[#0f0f0f]' : 'bg-[#f5f0ea]'}`}>
        <div className="flex items-center justify-center flex-1">
          <div className="text-center">
            <div className={`w-12 h-12 border-4 rounded-full animate-spin mx-auto mb-4 ${dark ? 'border-zinc-700 border-t-blue-400/80' : 'border-stone-200 border-t-blue-500'}`} />
            <p className={dark ? 'text-zinc-500' : 'text-stone-500'}>Takvim yükleniyor...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative flex flex-col flex-1 min-h-0 overflow-auto pb-16 max-w-md mx-auto ${
        dark ? 'bg-background-dark text-slate-100' : 'bg-background-light text-slate-900'
      }`}
      style={{ backgroundColor: dark ? BG_DARK : BG_LIGHT }}
    >
      <header
        className={`flex items-center justify-between px-6 pt-8 pb-2 flex-shrink-0 ${
          dark ? 'bg-background-dark' : 'bg-background-light'
        }`}
        style={{ backgroundColor: dark ? BG_DARK : BG_LIGHT }}
      >
        <div className="flex flex-col">
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ color: dark ? '#e5e7eb' : PRIMARY }}
          >
            {MONTHS_TR[currentMonth]} {currentYear}
          </h1>
          <p className={`text-sm font-medium ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
            Bugün {todayStr}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className={`flex items-center justify-center size-10 rounded-full ${
              dark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
            }`}
            aria-label="Geri"
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <button
            type="button"
            className={`flex items-center justify-center size-10 rounded-full ${
              dark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
            }`}
            aria-label="Ara"
          >
            <span className="material-symbols-outlined">search</span>
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 space-y-6 min-h-0">
        {/* Takvim kartı */}
        <div
          className={`rounded-3xl p-4 border ${
            dark ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-100'
          }`}
        >
          <div className="flex items-center justify-between mb-4 px-2">
            <button
              type="button"
              onClick={goToPreviousMonth}
              className={`p-2 rounded-full transition-colors ${
                dark ? 'hover:bg-slate-800' : 'hover:bg-slate-200'
              }`}
            >
              <span className={`material-symbols-outlined ${dark ? 'text-slate-400' : 'text-slate-600'}`}>
                chevron_left
              </span>
            </button>
            <span className={`font-semibold ${dark ? 'text-slate-200' : 'text-primary'}`}>
              {MONTHS_TR[currentMonth]}
            </span>
            <button
              type="button"
              onClick={goToNextMonth}
              className={`p-2 rounded-full transition-colors ${
                dark ? 'hover:bg-slate-800' : 'hover:bg-slate-200'
              }`}
            >
              <span className={`material-symbols-outlined ${dark ? 'text-slate-400' : 'text-slate-600'}`}>
                chevron_right
              </span>
            </button>
          </div>
          <div className="grid grid-cols-7 gap-y-1 text-center mb-1">
            {DAY_NAMES.map((d) => (
              <div
                key={d}
                className="text-xs font-bold text-slate-400 uppercase tracking-wider py-2"
              >
                {d}
              </div>
            ))}
            {Array.from({ length: firstDayMonday }, (_, i) => (
              <div key={`e-${i}`} className="h-10" />
            ))}
            {currentMonthDays.map((day) => {
              const isToday = day === todayDate && currentMonth === todayMonth && currentYear === todayYear;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedDate(day.toString())}
                  className="h-10 w-full flex items-center justify-center"
                >
                  {isToday ? (
                    <div
                      className="size-9 flex items-center justify-center rounded-full font-bold text-sm shadow-lg"
                      style={{
                        backgroundColor: PRIMARY,
                        color: '#ffffff',
                        boxShadow: `0 10px 20px ${PRIMARY}40`,
                      }}
                    >
                      {day}
                    </div>
                  ) : (
                    <span
                      className={`text-sm font-medium ${
                        dark ? 'text-slate-300' : 'text-slate-700'
                      }`}
                    >
                      {day}
                    </span>
                  )}
                </button>
              );
            })}
            {nextMonthDays.map((_, i) => (
              <div key={`n-${i}`} className="h-10" />
            ))}
          </div>
        </div>

        {/* Google Takvim bağlantısı - takvim kartının hemen altında, her zaman hızlı görünür */}
        {!isMock && !googleConnected && (
          <div
            className={`rounded-xl px-4 py-3 flex items-center justify-between gap-3 border ${dark ? 'border-[#3d2a1f]' : 'border-slate-200'}`}
            style={dark ? { backgroundColor: '#2a1f1a' } : { backgroundColor: '#f8fafc' }}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="material-symbols-outlined text-lg flex-shrink-0" style={{ color: PRIMARY }}>event</span>
              <span className={`text-sm font-medium truncate ${dark ? 'text-slate-200' : 'text-slate-700'}`}>
                {locale === 'tr' ? 'Google Takvim ile senkronize et' : 'Sync with Google Calendar'}
              </span>
            </div>
            {/* Free kullanıcı da Google Calendar'dan okumaları alabilsin (görev push'ı Pro'da). */}
            <a
              href={getGoogleCalendarAuthUrl(userId) || '#'}
              className="flex-shrink-0 py-2 px-4 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-70"
              style={{ backgroundColor: PRIMARY, pointerEvents: googleLoading ? 'none' : undefined, opacity: googleLoading ? 0.7 : 1 }}
            >
              {googleLoading
                ? locale === 'tr'
                  ? 'Kontrol ediliyor...'
                  : 'Checking...'
                : locale === 'tr'
                  ? 'Bağla'
                  : 'Connect'}
            </a>
          </div>
        )}

        <div className="space-y-4">
          <h3 className={`text-lg font-bold ${dark ? 'text-slate-100' : 'text-slate-800'} px-1`}>
            {agendaLabel}
          </h3>
          {selectedDayTasks.length === 0 && selectedDayGoogleEvents.length === 0 ? (
            <div className={`rounded-xl p-6 border flex flex-col items-center text-center ${dark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
              <div className={`size-16 rounded-full flex items-center justify-center mb-4 ${dark ? 'bg-slate-800' : 'bg-slate-50'}`}>
                <span className="material-symbols-outlined text-slate-300 text-3xl">task_alt</span>
              </div>
              <h4 className={`text-base font-semibold ${dark ? 'text-slate-100' : 'text-slate-900'}`}>
                Henüz görev yok
              </h4>
              <p className="text-sm text-slate-500 mt-1 mb-6">Bugün için planlanmış bir etkinliğiniz bulunmuyor.</p>
              <button
                type="button"
                onClick={handleAddTask}
                className="w-full py-3 rounded-lg text-white font-semibold text-sm shadow-lg hover:opacity-90 transition-colors"
                style={{ backgroundColor: PRIMARY, boxShadow: `0 10px 20px -5px ${PRIMARY}40` }}
              >
                Görev Ekle
              </button>
            </div>
          ) : (
            <div className={`rounded-xl overflow-hidden border ${dark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
              <div className={dark ? 'divide-y divide-slate-800' : 'divide-y divide-slate-100'}>
                {selectedDayTasks.map((task) => (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => onEditTask(task, agendaDate)}
                    className={`w-full px-5 py-4 text-left flex items-center gap-3 transition-colors ${dark ? 'hover:bg-slate-800/80' : 'hover:bg-slate-50'}`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      task.completed ? 'opacity-60' : ''
                    }`} style={task.completed ? { backgroundColor: PRIMARY, borderColor: PRIMARY } : { borderColor: dark ? '#475569' : '#cbd5e1' }}>
                      {task.completed && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium truncate ${task.completed ? 'line-through opacity-60' : ''} ${dark ? 'text-slate-100' : 'text-slate-900'}`}>
                        {task.title}
                      </div>
                      <div className={`text-xs mt-1 ${dark ? 'text-slate-500' : 'text-slate-500'}`}>{task.time}</div>
                    </div>
                    <span className="material-symbols-outlined text-slate-400">chevron_right</span>
                  </button>
                ))}
                {selectedDayGoogleEvents.map((event) => (
                  <div
                    key={event.id}
                    className={`w-full px-5 py-4 flex items-center gap-3 ${dark ? 'bg-blue-500/5' : 'bg-blue-50/50'}`}
                  >
                    <span
                      className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 font-bold text-[10px] ${
                        dark ? 'bg-blue-500/30 text-blue-400' : 'bg-blue-200 text-blue-700'
                      }`}
                    >
                      g
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium truncate ${dark ? 'text-slate-100' : 'text-slate-900'}`}>{event.title}</div>
                      <div className={`text-xs mt-1 ${dark ? 'text-slate-500' : 'text-slate-500'}`}>
                        {event.allDay ? 'Tüm gün' : event.time}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className={`px-4 py-3 border-t ${dark ? 'border-slate-800' : 'border-slate-100'}`}>
                <button
                  type="button"
                  onClick={handleAddTask}
                  className="w-full py-2.5 rounded-lg text-sm font-semibold transition-colors"
                  style={{ backgroundColor: `${PRIMARY}15`, color: PRIMARY }}
                >
                  Görev Ekle
                </button>
              </div>
            </div>
          )}
        </div>

        {!isMock && googleConnectError && (
          <div className={`px-3 py-2 rounded-xl text-xs ${dark ? 'bg-red-900/30 text-red-300' : 'bg-red-50 text-red-700'}`}>
            Bağlantı kurulamadı: {googleConnectError}
            <button type="button" onClick={() => setGoogleConnectError(null)} className="ml-2 underline">Kapat</button>
          </div>
        )}
      </main>
    </div>
  );
}
