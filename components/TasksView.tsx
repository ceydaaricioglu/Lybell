'use client';

import { useState, useEffect } from 'react';
import { TimelineTask } from '@/lib/types';
import { fetchTasksFromSupabase, filterRecurringTasks, getDayAbbreviation, saveTaskToSupabase, DEFAULT_TAGS, getTagColorClasses } from '@/lib/helpers';

interface TasksViewProps {
  userId: string;
  darkMode?: boolean;
  initialDateFromCalendar?: string;
  onBack: () => void;
  onEditTask: (task: TimelineTask, viewingDate?: string) => void;
  onAddTask: () => void;
  onStartPomodoro?: (task: TimelineTask) => void;
}

const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

export default function TasksView({ userId, darkMode = false, initialDateFromCalendar, onBack, onEditTask, onAddTask, onStartPomodoro }: TasksViewProps) {
  const dark = darkMode;
  const [tasks, setTasks] = useState<TimelineTask[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | 'all'>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const currentDay = today.getDate();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const allDaysInMonth = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  useEffect(() => {
    loadTasks();
  }, [userId]);

  useEffect(() => {
    if (initialDateFromCalendar && !loading) {
      setSelectedDate(initialDateFromCalendar);
      setTimeout(() => {
        const el = document.getElementById(`date-group-${initialDateFromCalendar}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    }
  }, [initialDateFromCalendar, loading]);

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

  const getGroupedTasks = () => {
    const grouped: Record<string, TimelineTask[]> = {};
    allDaysInMonth.forEach(day => {
      const dayStr = day.toString();
      let filtered = filterRecurringTasks(tasks, dayStr);
      if (selectedTag) filtered = filtered.filter(t => t.tags && t.tags.includes(selectedTag));
      if (filtered.length > 0) grouped[dayStr] = filtered.sort((a, b) => a.time.localeCompare(b.time));
    });
    return grouped;
  };

  const groupedTasks = getGroupedTasks();
  const sortedDates = Object.keys(groupedTasks).sort((a, b) => parseInt(a) - parseInt(b));
  const stripDates =
    initialDateFromCalendar && !sortedDates.includes(initialDateFromCalendar)
      ? [initialDateFromCalendar, ...sortedDates].sort((a, b) => parseInt(a) - parseInt(b))
      : sortedDates;

  const getTaskCountForDay = (day: number) => filterRecurringTasks(tasks, day.toString()).length;
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
      <div className={`min-h-screen flex items-center justify-center ${dark ? 'bg-[#0f0f0f]' : 'bg-[#f5f0ea]'}`}>
        <div className="text-center">
          <div className={`w-12 h-12 border-4 rounded-full animate-spin mx-auto mb-4 ${dark ? 'border-zinc-700 border-t-amber-400/80' : 'border-stone-200 border-t-amber-500'}`}></div>
          <p className={dark ? 'text-zinc-500' : 'text-stone-500'}>Görevler yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen pb-24 ${dark ? 'bg-[#0f0f0f] text-zinc-100' : 'bg-[#f5f0ea] text-stone-800'}`}>
      <div className="max-w-md mx-auto px-5 pt-10 pb-8">
        {/* Header */}
        <header className="mb-6">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className={`w-10 h-10 flex items-center justify-center rounded-xl transition-colors ${dark ? 'hover:bg-zinc-800' : 'hover:bg-white/80'}`}
            >
              <svg className={`w-6 h-6 ${dark ? 'text-zinc-300' : 'text-stone-700'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className={`text-xl font-semibold ${dark ? 'text-white' : 'text-stone-800'}`}>
              {MONTHS[currentMonth]} {currentYear}
            </h1>
            <div className="w-10" />
          </div>
        </header>

        {/* Tarih strip + filtreler */}
        <div className={`rounded-2xl p-4 mb-4 ${dark ? 'bg-zinc-900/60 border border-zinc-800/80' : 'bg-white shadow-[0_4px_24px_-4px_rgba(0,0,0,0.06)] border border-stone-100'}`}>
          <div className="overflow-x-auto scrollbar-hide -mx-1">
            <div className="flex gap-2 pb-1" style={{ minWidth: 'max-content' }}>
              <button
                onClick={() => setSelectedDate('all')}
                className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  selectedDate === 'all'
                    ? dark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-800'
                    : dark ? 'bg-zinc-800/80 text-zinc-400 hover:bg-zinc-700' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                Tümü
              </button>
              <button
                onClick={() => handleDateSelect(currentDay.toString())}
                className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  selectedDate === currentDay.toString()
                    ? dark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-800'
                    : dark ? 'bg-zinc-800/80 text-zinc-400 hover:bg-zinc-700' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                Bugün
              </button>
              {stripDates.map(date => {
                const dayNum = parseInt(date);
                const taskCount = getTaskCountForDay(dayNum);
                const isSelected = selectedDate === date;
                const isToday = dayNum === currentDay;
                return (
                  <button
                    key={date}
                    onClick={() => handleDateSelect(date)}
                    className={`flex-shrink-0 flex flex-col items-center gap-1 px-2.5 py-1.5 rounded-xl transition-all min-w-[48px] ${
                      isSelected
                        ? dark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-800'
                        : isToday
                        ? dark ? 'bg-zinc-700/80 text-zinc-300' : 'bg-stone-100 text-stone-700'
                        : dark ? 'bg-zinc-800/60 text-zinc-500 hover:bg-zinc-700' : 'bg-stone-50 text-stone-500 hover:bg-stone-100'
                    }`}
                  >
                    <span className="text-[10px] font-medium">{getDayAbbreviation(dayNum)}</span>
                    <span className="text-sm font-bold">{dayNum}</span>
                    <span className={`text-[10px] font-semibold ${isSelected || isToday ? (dark ? 'text-amber-400/80' : 'text-amber-700') : dark ? 'text-zinc-500' : 'text-stone-400'}`}>{taskCount}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tag filtreleri */}
          <div className="overflow-x-auto scrollbar-hide mt-3 pt-3 border-t border-transparent" style={{ borderColor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}>
            <div className="flex gap-2" style={{ minWidth: 'max-content' }}>
              <button
                onClick={() => setSelectedTag(null)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  !selectedTag ? (dark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-800') : (dark ? 'bg-zinc-800 text-zinc-400' : 'bg-stone-100 text-stone-500')
                }`}
              >
                Tüm Etiketler
              </button>
              {DEFAULT_TAGS.map(tag => {
                const tagTaskCount = tasks.filter(t => t.tags && t.tags.includes(tag.id)).length;
                if (tagTaskCount === 0) return null;
                const isSelected = selectedTag === tag.id;
                const colors = getTagColorClasses(tag.color);
                return (
                  <button
                    key={tag.id}
                    onClick={() => setSelectedTag(isSelected ? null : tag.id)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1 ${
                      isSelected ? (dark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-800') : (dark ? 'bg-zinc-800 text-zinc-400' : 'bg-stone-100 text-stone-600')
                    }`}
                  >
                    #{tag.name}
                    <span className="opacity-80">{tagTaskCount}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Görev listesi veya boş */}
        {displayTasks.length === 0 || (displayTasks.length === 1 && displayTasks[0].tasks.length === 0) ? (
          <div className="flex flex-col items-center justify-center px-6 py-16">
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 ${dark ? 'bg-zinc-800/80' : 'bg-white shadow-[0_4px_24px_-4px_rgba(0,0,0,0.06)] border border-stone-100'}`}>
              <svg className={`w-10 h-10 ${dark ? 'text-zinc-500' : 'text-stone-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <h2 className={`text-xl font-bold mb-2 ${dark ? 'text-white' : 'text-stone-800'}`}>Bu ayda henüz görev yok</h2>
            <p className={`mb-6 text-center text-sm ${dark ? 'text-zinc-500' : 'text-stone-500'}`}>İlk görevini oluşturarak günü planlamaya başla</p>
            <button
              onClick={onAddTask}
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${dark ? 'bg-amber-500/90 text-black hover:bg-amber-400' : 'bg-amber-600 text-white hover:shadow-lg hover:scale-[1.02]'}`}
            >
              + İlk Görevi Oluştur
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {displayTasks.map((dateGroup) => {
              const isEmpty = !dateGroup.tasks || dateGroup.tasks.length === 0;
              return (
                <div key={dateGroup.date} id={`date-group-${dateGroup.date}`} className="scroll-mt-24">
                  <div className={`flex items-center gap-3 mb-4 ${dark ? 'text-zinc-500' : 'text-stone-500'}`}>
                    <span className="text-sm font-semibold">{dateGroup.date} {MONTHS[currentMonth]}</span>
                    <span className="text-xs">{getDayAbbreviation(parseInt(dateGroup.date))}</span>
                    {!isEmpty && (
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${dark ? 'bg-zinc-800 text-zinc-300' : 'bg-amber-100 text-amber-800'}`}>
                        {dateGroup.tasks.length}
                      </span>
                    )}
                  </div>

                  {isEmpty ? (
                    <div className={`py-8 text-center rounded-2xl ${dark ? 'bg-zinc-900/40' : 'bg-white border border-stone-100'}`}>
                      <p className={`text-sm ${dark ? 'text-zinc-500' : 'text-stone-500'}`}>Bu tarihte görev yok</p>
                      <button onClick={onAddTask} className={`mt-3 text-sm font-medium ${dark ? 'text-amber-400 hover:text-amber-300' : 'text-amber-700 hover:text-amber-800'}`}>
                        + Görev ekle
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {dateGroup.tasks.map((task, taskIndex) => (
                        <div
                          key={task.id || taskIndex}
                          onClick={() => onEditTask(task, dateGroup.date)}
                          className={`flex items-center gap-3 rounded-2xl p-4 cursor-pointer transition-all ${
                            dark
                              ? 'bg-zinc-900/60 border border-zinc-800/80 hover:bg-zinc-800/60'
                              : 'bg-white shadow-[0_2px_12px_-2px_rgba(0,0,0,0.08)] border border-stone-100 hover:shadow-md hover:border-amber-200/40'
                          }`}
                        >
                          <span className={`text-sm font-medium tabular-nums w-11 flex-shrink-0 ${dark ? 'text-amber-400/90' : 'text-amber-700/90'}`}>
                            {task.time}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className={`font-medium ${task.completed ? 'line-through opacity-70' : ''} ${dark ? 'text-zinc-200' : 'text-stone-800'}`}>
                              {task.title}
                              {task.subtasks && task.subtasks.length > 0 && (
                                <span className={`ml-2 text-xs font-semibold ${dark ? 'text-amber-400/80' : 'text-amber-700'}`}>
                                  [{task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}]
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              {task.category && (
                                <span className={`text-xs ${dark ? 'text-zinc-500' : 'text-stone-500'}`}>
                                  {task.category === 'routines' ? '🏃 Rutinler' : task.category === 'reading' ? '📚 Okuma' : task.category}
                                </span>
                              )}
                              {task.tags && task.tags.slice(0, 2).map(tagId => {
                                const tag = DEFAULT_TAGS.find(t => t.id === tagId);
                                if (!tag) return null;
                                const colors = getTagColorClasses(tag.color);
                                return (
                                  <span key={tagId} className={`text-xs px-2 py-0.5 rounded-full ${colors.bg} ${colors.text} font-medium`}>#{tag.name}</span>
                                );
                              })}
                            </div>
                          </div>
                          {task.priority && (
                            <span className={`text-lg flex-shrink-0 ${task.priority === 'high' ? '🔴' : task.priority === 'medium' ? '🟡' : '🟢'}`} />
                          )}
                          {onStartPomodoro && !task.completed && (
                            <button
                              onClick={(e) => { e.stopPropagation(); onStartPomodoro(task); }}
                              className="w-8 h-8 flex items-center justify-center rounded-lg flex-shrink-0 hover:opacity-80"
                              title="Pomodoro"
                            >
                              <span className="text-lg">🍅</span>
                            </button>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); if (task.id) handleToggleTask(task.id); }}
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                              task.completed
                                ? dark ? 'bg-amber-400/80 border-amber-400/80' : 'bg-amber-500 border-amber-500'
                                : dark ? 'border-zinc-600 hover:border-zinc-500' : 'border-stone-300 hover:border-amber-400'
                            }`}
                          >
                            {task.completed && (
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* FAB */}
        <button
          onClick={onAddTask}
          className={`fixed bottom-24 right-6 w-14 h-14 rounded-2xl shadow-xl flex items-center justify-center text-2xl font-light transition-all hover:scale-105 active:scale-95 z-20 ${
            dark ? 'bg-amber-500/90 text-black hover:bg-amber-400' : 'bg-amber-600 text-white hover:shadow-2xl'
          }`}
        >
          +
        </button>
      </div>
    </div>
  );
}
