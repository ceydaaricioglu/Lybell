'use client';

import { useState, useEffect } from 'react';
import { TimelineTask } from '@/lib/types';
import { fetchTasksFromSupabase, filterRecurringTasks } from '@/lib/helpers';

interface CalendarViewProps {
  userId: string;
  onBack: () => void;
  onDateSelect: (date: string) => void;
  onEditTask: (task: TimelineTask, date?: string) => void;
}

export default function CalendarView({ userId, onBack, onDateSelect, onEditTask }: CalendarViewProps) {
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

  // Ayın ilk gününün haftanın hangi günü olduğunu bul (0 = Pazar, 1 = Pazartesi, ...)
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; // Pazartesi başlasın

  // Ayın kaç günü olduğunu bul
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // Önceki ayın son günleri
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();
  const prevMonthDays = Array.from({ length: adjustedFirstDay }, (_, i) => daysInPrevMonth - adjustedFirstDay + i + 1);

  // Bu ayın günleri
  const currentMonthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Sonraki ayın ilk günleri (toplam 42 hücre için)
  const totalCells = 42;
  const remainingCells = totalCells - prevMonthDays.length - currentMonthDays.length;
  const nextMonthDays = Array.from({ length: remainingCells }, (_, i) => i + 1);

  // Gün başına görev sayısı
  const getTasksForDay = (day: number) => {
    return filterRecurringTasks(tasks, day.toString());
  };

  // Seçili günün görevleri
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
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-5 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onBack}
              className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <h1 className="text-2xl font-bold text-gray-900">
              {months[currentMonth]} {currentYear}
            </h1>

            <button
              onClick={goToToday}
              className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-medium hover:bg-emerald-200 transition-colors"
            >
              Bugün
            </button>
          </div>

          {/* Ay Navigasyonu */}
          <div className="flex items-center justify-between">
            <button
              onClick={goToPreviousMonth}
              className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="text-sm text-gray-500">
              {tasks.length} görev
            </div>

            <button
              onClick={goToNextMonth}
              className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500">Takvim yükleniyor...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Calendar Grid */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
              {/* Gün İsimleri */}
              <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
                {dayNames.map((day) => (
                  <div key={day} className="text-center py-3 text-xs font-semibold text-gray-600">
                    {day}
                  </div>
                ))}
              </div>

              {/* Takvim Günleri */}
              <div className="grid grid-cols-7">
                {/* Önceki ayın günleri */}
                {prevMonthDays.map((day) => (
                  <div
                    key={`prev-${day}`}
                    className="aspect-square border border-gray-100 p-2 bg-gray-50 opacity-40"
                  >
                    <div className="text-sm text-gray-400">{day}</div>
                  </div>
                ))}

                {/* Bu ayın günleri */}
                {currentMonthDays.map((day) => {
                  const dayTasks = getTasksForDay(day);
                  const isToday = day === todayDate && currentMonth === todayMonth && currentYear === todayYear;
                  const isSelected = selectedDate === day.toString();
                  const completedCount = dayTasks.filter(t => t.completed).length;
                  const totalCount = dayTasks.length;

                  return (
                    <button
                      key={day}
                      onClick={() => {
                        setSelectedDate(day.toString());
                      }}
                      className={`aspect-square border border-gray-100 p-2 text-left hover:bg-emerald-50 transition-all relative ${
                        isSelected ? 'bg-emerald-50 border-emerald-300' : ''
                      } ${isToday ? 'bg-blue-50 border-blue-300' : ''}`}
                    >
                      <div className={`text-sm font-semibold mb-1 ${
                        isToday ? 'text-blue-600' : isSelected ? 'text-emerald-600' : 'text-gray-900'
                      }`}>
                        {day}
                      </div>
                      
                      {totalCount > 0 && (
                        <div className="space-y-0.5">
                          {dayTasks.slice(0, 2).map((task) => (
                            <div
                              key={task.id}
                              className={`text-[10px] px-1.5 py-0.5 rounded truncate ${
                                task.completed ? 'bg-gray-100 text-gray-400' : 'bg-emerald-100 text-emerald-700'
                              }`}
                            >
                              {task.title}
                            </div>
                          ))}
                          {totalCount > 2 && (
                            <div className="text-[10px] text-gray-500 font-medium">
                              +{totalCount - 2} daha
                            </div>
                          )}
                        </div>
                      )}

                      {totalCount > 0 && (
                        <div className="absolute bottom-1 right-1 text-[10px] font-bold text-emerald-600">
                          {completedCount}/{totalCount}
                        </div>
                      )}
                    </button>
                  );
                })}

                {/* Sonraki ayın günleri */}
                {nextMonthDays.map((day) => (
                  <div
                    key={`next-${day}`}
                    className="aspect-square border border-gray-100 p-2 bg-gray-50 opacity-40"
                  >
                    <div className="text-sm text-gray-400">{day}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Seçili Günün Detayları */}
            {selectedDate && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
                  <h2 className="text-lg font-bold">
                    {selectedDate} {months[currentMonth]}
                  </h2>
                  <p className="text-sm text-emerald-50">
                    {selectedDayTasks.length} görev
                  </p>
                </div>

                {selectedDayTasks.length === 0 ? (
                  <div className="px-5 py-8 text-center">
                    <p className="text-sm text-gray-500">Bu gün için görev yok</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {selectedDayTasks.map((task) => (
                      <button
                        key={task.id}
                        onClick={() => onEditTask(task, selectedDate)}
                        className="w-full px-5 py-4 hover:bg-gray-50 transition-colors text-left flex items-center gap-3"
                      >
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          task.completed ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'
                        }`}>
                          {task.completed && (
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`font-medium truncate ${task.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                            {task.title}
                            {task.subtasks && task.subtasks.length > 0 && (
                              <span className="ml-2 text-xs text-emerald-600 font-semibold">
                                [{task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}]
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-400">{task.time}</span>
                            {task.priority && (
                              <>
                                <span className="text-xs text-gray-400">•</span>
                                <span className={`text-xs px-1.5 py-0.5 rounded ${
                                  task.priority === 'high' ? 'bg-red-100 text-red-600' :
                                  task.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                                  'bg-green-100 text-green-600'
                                }`}>
                                  {task.priority === 'high' ? 'Yüksek' : task.priority === 'medium' ? 'Orta' : 'Düşük'}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
