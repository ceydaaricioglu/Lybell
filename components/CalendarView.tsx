'use client';

import { useState, useEffect } from 'react';
import { TimelineTask } from '@/lib/types';
import { fetchTasksFromSupabase, filterRecurringTasks } from '@/lib/helpers';

interface CalendarViewProps {
  userId: string;
  darkMode?: boolean;
  onBack: () => void;
  onDateSelect: (date: string) => void;
  onEditTask: (task: TimelineTask, date?: string) => void;
}

export default function CalendarView({ userId, darkMode = false, onBack, onDateSelect, onEditTask }: CalendarViewProps) {
  const dark = darkMode;
  const [tasks, setTasks] = useState<TimelineTask[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const today = new Date();
  const todayDate = today.getDate();
  const todayMonth = today.getMonth();
  const todayYear = today.getFullYear();

  const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  const dayNames = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

  useEffect(() => {
    loadTasks();
  }, [userId]);

  const loadTasks = async () => {
    setLoading(true);
    const loadedTasks = await fetchTasksFromSupabase(userId);
    setTasks(loadedTasks);
    setLoading(false);
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
  const selectedDayTasks = selectedDate ? filterRecurringTasks(tasks, selectedDate).sort((a, b) => a.time.localeCompare(b.time)) : [];

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
            >
              <svg className={`w-6 h-6 ${dark ? 'text-zinc-300' : 'text-stone-700'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className={`text-2xl font-bold ${dark ? 'text-white' : 'text-stone-900'}`}>
              {months[currentMonth]} {currentYear}
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
            <div className={`text-sm ${dark ? 'text-zinc-500' : 'text-stone-500'}`}>{tasks.length} görev</div>
            <button
              onClick={goToNextMonth}
              className={`w-10 h-10 flex items-center justify-center rounded-xl transition-colors ${dark ? 'hover:bg-zinc-800' : 'hover:bg-white/80'}`}
            >
              <svg className={`w-5 h-5 ${dark ? 'text-zinc-400' : 'text-stone-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
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
                  const isToday = day === todayDate && currentMonth === todayMonth && currentYear === todayYear;
                  const isSelected = selectedDate === day.toString();
                  const completedCount = dayTasks.filter(t => t.completed).length;
                  const totalCount = dayTasks.length;

                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDate(day.toString())}
                      className={`aspect-square border p-2 text-left transition-all relative ${
                        dark
                          ? isSelected
                            ? 'bg-amber-500/20 border-amber-500/40'
                            : isToday
                              ? 'bg-amber-500/10 border-amber-500/30'
                              : 'border-zinc-800 hover:bg-zinc-800'
                          : isSelected
                            ? 'bg-amber-100 border-amber-300'
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
                          {dayTasks.slice(0, 2).map((task) => (
                            <div
                              key={task.id}
                              className={`text-[10px] px-1.5 py-0.5 rounded truncate ${
                                task.completed
                                  ? dark ? 'bg-zinc-700 text-zinc-500' : 'bg-stone-100 text-stone-400'
                                  : dark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700'
                              }`}
                            >
                              {task.title}
                            </div>
                          ))}
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
                    {selectedDate} {months[currentMonth]}
                  </h2>
                  <p className={`text-sm ${dark ? 'text-amber-400/90' : 'text-amber-700/90'}`}>
                    {selectedDayTasks.length} görev
                  </p>
                </div>

                {selectedDayTasks.length === 0 ? (
                  <div className="px-5 py-8 text-center">
                    <p className={`text-sm ${dark ? 'text-zinc-500' : 'text-stone-500'}`}>Bu tarihte görev yok</p>
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
