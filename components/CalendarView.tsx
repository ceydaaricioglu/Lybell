'use client';

import { useState, useEffect } from 'react';
import { TimelineTask } from '@/lib/types';
import { fetchTasksFromSupabase, filterRecurringTasks, isMockUser } from '@/lib/helpers';
import { MONTHS_TR } from '@/lib/constants';
import { supabase } from '@/lib/supabaseClient';
import { getGoogleCalendarAuthUrl, getMonthRange, type GoogleCalendarEvent } from '@/lib/googleCalendar';

interface CalendarViewProps {
  userId: string;
  darkMode?: boolean;
  onBack: () => void;
  onSessionLost?: () => void;
  onDateSelect: (date: string) => void;
  onEditTask: (task: TimelineTask, date?: string) => void;
  /** Merkezi cache: verilirse kullanılır */
  tasks?: TimelineTask[];
}

export default function CalendarView({ userId, darkMode = false, onBack, onSessionLost, onDateSelect, onEditTask, tasks: tasksFromParent }: CalendarViewProps) {
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

  const dayNames = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

  useEffect(() => {
    if (tasksFromParent !== undefined) {
      setLoading(false);
      return;
    }
    if (userId) loadTasks();
  }, [userId, tasksFromParent]);

  // URL'den Google callback sonucu → bağlantıyı yenile veya hata göster
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

  // Yükleme takılı kalırsa "Google Takvim'i Bağla" butonunun görünmesi için zaman aşımı
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
      // Giriş yapılmış (userId var) ama session henüz yoksa rehydrate için kısa bekle, tekrar dene
      if (!session?.access_token && !isMock) {
        await new Promise((r) => setTimeout(r, 300));
        const retry = await supabase.auth.getSession();
        session = retry.data.session;
      }
      let hadToken = !!session?.access_token;
      let res = await doRequest(session?.access_token ?? null);
      // 401 alındı ama token vardı: Supabase ağ geçidi süresi dolmuş token reddetmiş olabilir → bir kez yenile ve tekrar dene
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
        if (res.status === 401) {
          setGoogleDisconnectReason(hadToken ? 'session_rejected' : 'no_auth');
          // Otomatik çıkış yapma: getSession() bazen geç rehydrate oluyor, kullanıcı takvime giremez kalıyordu
        } else {
          setGoogleDisconnectReason(res.status === 0 ? 'network' : `http_${res.status}`);
        }
      }
    } catch (e) {
      setGoogleConnected(false);
      setGoogleEvents([]);
      setGoogleDisconnectReason('network');
    } finally {
      setGoogleLoading(false);
    }
  };

  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();
  const prevMonthDays = Array.from({ length: adjustedFirstDay }, (_, i) => daysInPrevMonth - adjustedFirstDay + i + 1);
  const currentMonthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const totalCells = 42;
  const remainingCells = totalCells - prevMonthDays.length - currentMonthDays.length;
  const nextMonthDays = Array.from({ length: remainingCells }, (_, i) => i + 1);

  const getTasksForDay = (day: number) => filterRecurringTasks(tasks, day.toString());
  const getGoogleEventsForDay = (day: number) => googleEvents.filter((e) => e.date === day.toString());
  const selectedDayTasks = selectedDate ? filterRecurringTasks(tasks, selectedDate).sort((a, b) => a.time.localeCompare(b.time)) : [];
  const selectedDayGoogleEvents = selectedDate ? getGoogleEventsForDay(parseInt(selectedDate, 10)).sort((a, b) => (a.time || '00:00').localeCompare(b.time || '00:00')) : [];

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

  return (
    <div className={`min-h-screen pb-24 ${dark ? 'bg-[#0f0f0f]' : 'bg-[#f5f0ea]'}`}>
      {/* Header */}
      <div className={`sticky top-0 z-10 px-6 py-5 border-b ${dark ? 'bg-[#0f0f0f] border-zinc-800' : 'bg-[#f5f0ea] border-stone-200'}`}>
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
            <div className={`text-sm ${dark ? 'text-zinc-500' : 'text-stone-500'}`}>{tasks.length} görev{googleConnected ? ` · ${googleEvents.length} Google` : ''}</div>
            <button
              onClick={goToNextMonth}
              className={`w-10 h-10 flex items-center justify-center rounded-xl transition-colors ${dark ? 'hover:bg-zinc-800' : 'hover:bg-white/80'}`}
            >
              <svg className={`w-5 h-5 ${dark ? 'text-zinc-400' : 'text-stone-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          {/* Google bağlantı hatası (callback success=0) */}
          {!isMock && googleConnectError && (
            <div className={`mt-3 px-3 py-2 rounded-xl text-xs ${dark ? 'bg-red-900/30 text-red-300' : 'bg-red-50 text-red-700'}`}>
              Bağlantı kurulamadı: {googleConnectError}
              {googleConnectError === 'no_refresh_token' && ' — Google hesap ayarlarından bu uygulamanın erişimini kaldırıp tekrar &quot;Bağla&quot; deneyin.'}
              <button type="button" onClick={() => setGoogleConnectError(null)} className="ml-2 underline">Kapat</button>
            </div>
          )}
          {/* Neden bağlı değil (no_token, refresh_failed vb.) */}
          {!isMock && !googleConnected && !googleLoading && googleDisconnectReason && (
            <div className={`mt-2 px-3 py-2 rounded-xl text-xs ${dark ? 'bg-amber-900/20 text-amber-300' : 'bg-amber-50 text-amber-800'}`}>
              {googleDisconnectReason === 'no_token' && 'Google token kayıtlı değil. &quot;Google Takvim\'i Bağla&quot; ile bağlanın; Google\'da erişimi kaldırıp tekrar denerseniz daha iyi çalışır.'}
              {googleDisconnectReason === 'refresh_failed' && 'Token süresi doldu. Google hesabından erişimi kaldırıp tekrar &quot;Bağla&quot; deyin.'}
              {googleDisconnectReason === 'no_auth' && 'Supabase oturumu yok. Ayarlar → Çıkış yap, sonra e-posta ve şifre ile giriş yapın (Atla kullanmayın).'}
              {googleDisconnectReason === 'session_rejected' && (
                <>
                  Giriş yaptınız ama Google Takvim sunucusu oturumu kabul etmedi. Önce <strong>Ayarlar → Çıkış yap</strong>, sonra e-posta ile tekrar giriş yapın. Hâlâ olmazsa: .env.local içinde <code>NEXT_PUBLIC_SUPABASE_URL</code> ve <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> değerlerinin Supabase projenize ait olduğundan emin olun.
                </>
              )}
              {googleDisconnectReason === 'network' && 'Ağ hatası. İnternet bağlantınızı ve Supabase proje ayarlarını kontrol edin.'}
              {googleDisconnectReason === 'calendar_api_error' && 'Google Takvim erişimi reddedildi veya hata oluştu. Aşağıdaki &quot;Google Takvim\'i Bağla&quot; ile tekrar bağlanın.'}
              {googleDisconnectReason?.includes('Edge Function') && 'Supabase Edge Function\'a ulaşılamıyor. .env.local içinde NEXT_PUBLIC_SUPABASE_URL ve ANON_KEY doğru projeye (gtwugoklzczszvueacxm) ait mi kontrol edin; Supabase Dashboard\'da proje duraklatılmamış olsun, Edge Function deploy edilmiş olsun.'}
              {!['no_token', 'refresh_failed', 'no_auth', 'session_rejected', 'network', 'calendar_api_error'].includes(googleDisconnectReason || '') && !googleDisconnectReason?.includes('Edge Function') && `Durum: ${googleDisconnectReason}`}
            </div>
          )}
          {/* Google Takvim bağla – gerçek kullanıcı ve bağlı değilse (yükleme olsa da buton görünsün) */}
          {!isMock && !googleConnected && (
            <div className="mt-3 space-y-2">
              <p className={`text-xs ${dark ? 'text-zinc-500' : 'text-stone-500'}`}>
                Ne yapmalı: (1) Ayarlar → Çıkış yap, e-posta ile tekrar giriş. (2) Olmazsa Google Hesap → Güvenlik → &quot;Üçüncü taraf erişimi&quot;ndan bu uygulamayı kaldırıp &quot;Google Takvim'i Bağla&quot; ile tekrar deneyin. Hesapları silip sıfırdan kaydolmak gerekmez.
              </p>
              <div className="flex gap-2">
                <a
                  href={getGoogleCalendarAuthUrl(userId) || '#'}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${dark ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 hover:bg-amber-500/30' : 'bg-amber-500 text-black border border-amber-500 hover:bg-amber-400 shadow-sm'}`}
                >
                  <span className="text-base font-bold">g</span>
                  Google Takvim&apos;i Bağla
                </a>
                <button
                  type="button"
                  onClick={() => { setGoogleConnectError(null); loadGoogleEvents(); }}
                  className={`shrink-0 px-3 py-2.5 rounded-xl text-sm font-medium ${dark ? 'bg-zinc-700 text-zinc-200' : 'bg-stone-200 text-stone-700'}`}
                >
                  Yenile
                </button>
              </div>
            </div>
          )}
          {!isMock && googleLoading && (
            <div className={`mt-3 text-center text-xs ${dark ? 'text-zinc-500' : 'text-stone-500'}`}>Google yükleniyor...</div>
          )}
          {isMock && (
            <p className={`mt-3 text-xs ${dark ? 'text-zinc-500' : 'text-stone-500'}`}>
              Google Takvim için Ayarlar → Çıkış yap, sonra e-posta ile giriş yapın (Atla ile değil).
            </p>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className={`w-12 h-12 border-4 rounded-full animate-spin mx-auto mb-4 ${dark ? 'border-zinc-700 border-t-amber-400/80' : 'border-stone-200 border-t-amber-500'}`} />
              <p className={dark ? 'text-zinc-500' : 'text-stone-500'}>Takvim yükleniyor...</p>
            </div>
          </div>
        ) : (
          <>
            <div className={`rounded-2xl overflow-hidden mb-6 ${dark ? 'bg-zinc-900/60 border border-zinc-800' : 'bg-white shadow-[0_4px_24px_-4px_rgba(0,0,0,0.06)] border border-stone-100'}`}>
              <div className={`grid grid-cols-7 border-b ${dark ? 'border-zinc-800 bg-zinc-900/40' : 'border-stone-200 bg-stone-50/80'}`}>
                {dayNames.map((day) => (
                  <div key={day} className={`text-center py-3 text-xs font-semibold ${dark ? 'text-zinc-500' : 'text-stone-600'}`}>
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7">
                {prevMonthDays.map((day) => (
                  <div
                    key={`prev-${day}`}
                    className={`aspect-square border p-2 opacity-40 ${dark ? 'border-zinc-800 bg-zinc-900/40' : 'border-stone-100 bg-stone-50/50'}`}
                  >
                    <div className={`text-sm ${dark ? 'text-zinc-600' : 'text-stone-400'}`}>{day}</div>
                  </div>
                ))}

                {currentMonthDays.map((day) => {
                  const dayTasks = getTasksForDay(day);
                  const dayGoogle = getGoogleEventsForDay(day);
                  const combined = [
                    ...dayTasks.map((t) => ({ type: 'task' as const, time: t.time, title: t.title, id: t.id, completed: t.completed })),
                    ...dayGoogle.map((e) => ({ type: 'google' as const, time: e.time || '00:00', title: e.title, id: e.id, completed: false })),
                  ].sort((a, b) => a.time.localeCompare(b.time));
                  const isToday = day === todayDate && currentMonth === todayMonth && currentYear === todayYear;
                  const isSelected = selectedDate === day.toString();
                  const completedCount = dayTasks.filter(t => t.completed).length;
                  const totalCount = dayTasks.length + dayGoogle.length;

                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDate(day.toString())}
                      className={`aspect-square border p-2 text-left transition-all relative ${
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
                      {totalCount > 0 && (
                        <div className="space-y-0.5">
                          {combined.slice(0, 2).map((item) =>
                            item.type === 'task' ? (
                              <div
                                key={item.id}
                                className={`text-[10px] px-1.5 py-0.5 rounded truncate flex items-center gap-0.5 ${
                                  item.completed
                                    ? dark ? 'bg-zinc-700 text-zinc-500' : 'bg-stone-100 text-stone-400'
                                    : dark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700'
                                }`}
                              >
                                <span className="truncate">{item.title}</span>
                              </div>
                            ) : (
                              <div
                                key={item.id}
                                className={`text-[10px] px-1.5 py-0.5 rounded truncate flex items-center gap-0.5 ${dark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700'}`}
                              >
                                <span className="font-bold text-blue-500 shrink-0">g</span>
                                <span className="truncate">{item.title}</span>
                              </div>
                            )
                          )}
                          {totalCount > 2 && (
                            <div className={`text-[10px] font-medium ${dark ? 'text-zinc-500' : 'text-stone-500'}`}>
                              +{totalCount - 2} daha
                            </div>
                          )}
                        </div>
                      )}
                      {totalCount > 0 && (
                        <div className={`absolute bottom-1 right-1 text-[10px] font-bold ${dark ? 'text-amber-400/90' : 'text-amber-600'}`}>
                          {completedCount}/{totalCount}
                        </div>
                      )}
                    </button>
                  );
                })}

                {nextMonthDays.map((day) => (
                  <div
                    key={`next-${day}`}
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
                            {task.subtasks && task.subtasks.length > 0 && (
                              <span className={`ml-2 text-xs font-semibold ${dark ? 'text-amber-400/90' : 'text-amber-600'}`}>
                                [{task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}]
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs ${dark ? 'text-zinc-500' : 'text-stone-400'}`}>{task.time}</span>
                            {task.priority && (
                              <>
                                <span className={dark ? 'text-zinc-600' : 'text-stone-300'}>•</span>
                                <span className={`text-xs px-1.5 py-0.5 rounded ${
                                  task.priority === 'high' ? (dark ? 'bg-red-900/40 text-red-400' : 'bg-red-100 text-red-600') :
                                  task.priority === 'medium' ? (dark ? 'bg-amber-900/40 text-amber-400' : 'bg-amber-100 text-amber-700') :
                                  dark ? 'bg-green-900/40 text-green-400' : 'bg-green-100 text-green-600'
                                }`}>
                                  {task.priority === 'high' ? 'Yüksek' : task.priority === 'medium' ? 'Orta' : 'Düşük'}
                                </span>
                              </>
                            )}
                          </div>
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
          </>
        )}
      </div>
    </div>
  );
}
