'use client';

import { useState, useEffect } from 'react';
import { TimelineTask } from '@/lib/types';
import { fetchTasksFromSupabase, filterRecurringTasks, getDayAbbreviation, saveTaskToSupabase } from '@/lib/helpers';

interface TasksViewProps {
  userId: string;
  onBack: () => void;
  onEditTask: (task: TimelineTask, viewingDate?: string) => void;
  onAddTask: () => void;
}

export default function TasksView({ userId, onBack, onEditTask, onAddTask }: TasksViewProps) {
  const [tasks, setTasks] = useState<TimelineTask[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | 'all'>('all');
  const [loading, setLoading] = useState(true);

  // Bugünün tarih bilgileri
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const currentDay = today.getDate();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const allDaysInMonth = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

  useEffect(() => {
    loadTasks();
  }, [userId]);

  const loadTasks = async () => {
    setLoading(true);
    const loadedTasks = await fetchTasksFromSupabase(userId);
    setTasks(loadedTasks);
    setLoading(false);
  };

  const handleToggleTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const updatedTask = { ...task, completed: !task.completed };
    await saveTaskToSupabase(userId, updatedTask);
    setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
  };

  // Tarihlere göre görevleri grupla
  const getGroupedTasks = () => {
    const grouped: Record<string, TimelineTask[]> = {};

    allDaysInMonth.forEach(day => {
      const dayStr = day.toString();
      const filtered = filterRecurringTasks(tasks, dayStr);
      if (filtered.length > 0) {
        grouped[dayStr] = filtered.sort((a, b) => a.time.localeCompare(b.time));
      }
    });

    return grouped;
  };

  const groupedTasks = getGroupedTasks();
  const sortedDates = Object.keys(groupedTasks).sort((a, b) => parseInt(a) - parseInt(b));

  // Görevli günlerdeki görev sayısı
  const getTaskCountForDay = (day: number) => {
    const dayStr = day.toString();
    return filterRecurringTasks(tasks, dayStr).length;
  };

  // Seçili tarihe göre gösterilecek görevler
  const displayTasks = selectedDate === 'all'
    ? sortedDates.map(date => ({ date, tasks: groupedTasks[date] }))
    : [{ date: selectedDate, tasks: groupedTasks[selectedDate] || [] }];

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setTimeout(() => {
      const el = document.getElementById(`date-group-${date}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Görevler yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto pb-20">
      <div className="max-w-md mx-auto bg-white min-h-screen">
        {/* Header */}
        <div className="sticky top-0 bg-emerald-700 z-10 pb-4 pt-6 px-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-white">{months[currentMonth]} {currentYear}</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={onBack}
                className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-emerald-600 transition-colors"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Kompakt Horizontal Takvim */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2 mb-2">
            <div className="overflow-x-auto scrollbar-hide">
              <div className="flex gap-2 pb-1" style={{ minWidth: 'max-content' }}>
                <button
                  onClick={() => setSelectedDate('all')}
                  className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    selectedDate === 'all'
                      ? 'bg-white text-emerald-700 shadow-md'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  Tümü
                </button>

                {sortedDates.map(date => {
                  const dayNum = parseInt(date);
                  const taskCount = getTaskCountForDay(dayNum);
                  const isSelected = selectedDate === date;
                  const isToday = dayNum === currentDay;

                  return (
                    <button
                      key={date}
                      onClick={() => handleDateSelect(date)}
                      className={`flex-shrink-0 flex flex-col items-center gap-1 px-2 py-1 rounded-lg transition-all min-w-[50px] ${
                        isSelected
                          ? 'bg-white text-emerald-700 shadow-md'
                          : isToday
                          ? 'bg-white/30 text-white'
                          : 'bg-white/20 text-white hover:bg-white/30'
                      }`}
                    >
                      <span className="text-[10px] font-medium text-white/70">
                        {getDayAbbreviation(dayNum)}
                      </span>
                      <span className="text-sm font-bold">{dayNum}</span>
                      <div className="w-5 h-5 bg-emerald-400 rounded-full flex items-center justify-center">
                        <span className="text-[10px] font-bold text-white">{taskCount}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Filtre Butonları */}
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => setSelectedDate('all')}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                selectedDate === 'all'
                  ? 'bg-white text-emerald-700 shadow-md'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              Tüm Görevler
            </button>
            <button
              onClick={() => handleDateSelect(currentDay.toString())}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                selectedDate === currentDay.toString()
                  ? 'bg-white text-emerald-700 shadow-md'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              Bugün
            </button>
          </div>
        </div>

        {/* Görev Listesi */}
        {displayTasks.length === 0 || (displayTasks.length === 1 && displayTasks[0].tasks.length === 0) ? (
          <div className="flex flex-col items-center justify-center px-6 py-12">
            <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Henüz görev yok</h2>
            <p className="text-gray-600 mb-6 text-center">İlk görevini oluşturarak günü planlamaya başla</p>
            <button
              onClick={onAddTask}
              className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              + İlk Görevi Oluştur
            </button>
          </div>
        ) : (
          <div className="flex flex-col p-6 bg-white">
            {displayTasks.map((dateGroup) => {
              if (!dateGroup.tasks || dateGroup.tasks.length === 0) return null;

              return (
                <div
                  key={dateGroup.date}
                  id={`date-group-${dateGroup.date}`}
                  className="mb-8 scroll-mt-20"
                >
                  {/* Tarih Başlığı */}
                  <div className="flex items-center gap-3 mb-4 sticky top-52 bg-white py-2 z-10">
                    <div className="h-px flex-1 bg-gradient-to-r from-emerald-200 to-transparent"></div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-gray-900">
                        {dateGroup.date} {months[currentMonth]}
                      </span>
                      <span className="text-sm text-gray-500">
                        {getDayAbbreviation(parseInt(dateGroup.date))}
                      </span>
                      <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">
                        {dateGroup.tasks.length}
                      </span>
                    </div>
                    <div className="h-px flex-1 bg-gradient-to-l from-emerald-200 to-transparent"></div>
                  </div>

                  {/* Görevler */}
                  <div className="space-y-4">
                    {dateGroup.tasks.map((task, taskIndex) => (
                      <div key={task.id || taskIndex} className="flex items-center relative">
                        {/* Saat */}
                        <div className="w-16 text-sm text-gray-500 font-medium text-right pr-3 flex-shrink-0">
                          {task.time}
                        </div>

                        {/* Görev Kartı */}
                        <div
                          onClick={() => onEditTask(task, dateGroup.date)}
                          className="flex-1 bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between hover:border-emerald-300 transition-all cursor-pointer"
                        >
                          <div className="text-left flex-1">
                            <div className={task.completed ? 'line-through text-gray-400' : 'text-gray-900 font-medium'}>
                              {task.title}
                            </div>
                            {task.description && (
                              <div className={`text-xs mt-1 line-clamp-1 ${task.completed ? 'text-gray-300' : 'text-gray-400'}`}>
                                {task.description}
                              </div>
                            )}
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              {task.category && (
                                <span className="text-xs text-gray-500">
                                  {task.category === 'routines' ? '🏃 Rutinler' : task.category === 'reading' ? '📚 Okuma Listesi' : task.category}
                                </span>
                              )}
                              {task.recurrence && (
                                <span className="text-xs text-emerald-600">
                                  {task.recurrence === 'weekly' ? '🔄 Haftalık' : task.recurrence === 'monthly' ? '📅 Aylık' : '📆 Hafta içi'}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Öncelik */}
                          {task.priority && (
                            <div className={`px-2 py-1 rounded-full text-xs font-semibold mr-2 ${
                              task.priority === 'high' ? 'bg-red-100 text-red-700' :
                              task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                              {task.priority === 'high' ? '🔴' : task.priority === 'medium' ? '🟡' : '🟢'}
                            </div>
                          )}

                          {/* Tamamlama Toggle */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (task.id) handleToggleTask(task.id);
                            }}
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center border-emerald-500 transition-all flex-shrink-0 ${
                              task.completed ? 'bg-emerald-500' : 'bg-transparent hover:bg-emerald-100'
                            }`}
                          >
                            {task.completed && (
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Ekleme Butonu */}
        <button
          onClick={onAddTask}
          className="fixed bottom-24 right-6 w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center hover:scale-110 active:scale-95 z-20"
        >
          <span className="text-3xl font-light">+</span>
        </button>
      </div>
    </div>
  );
}
