'use client';

import { useState, useEffect } from 'react';
import { TimelineTask } from '@/lib/types';
import { getMockCategories, fetchTasksFromSupabase, filterRecurringTasks, getDayAbbreviation, saveTaskToSupabase } from '@/lib/helpers';

interface CategoryTaskViewProps {
  category: string;
  onBack: () => void;
  userId: string;
  onEditTask: (task: TimelineTask) => void;
}

export default function CategoryTaskView({ category, onBack, userId, onEditTask }: CategoryTaskViewProps) {
  const [tasks, setTasks] = useState<TimelineTask[]>([]);
  const today = new Date();
  const currentDay = today.getDate();
  const [selectedDate, setSelectedDate] = useState(currentDay.toString());
  
  // Bugünden itibaren 14 gün göster
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today);
    d.setDate(currentDay + i);
    return d.getDate();
  });
  const categories = getMockCategories(userId);
  const categoryData = categories.find(c => c.id === category);

  const [loading, setLoading] = useState(true);

  const loadTasks = async () => {
    setLoading(true);
    const loadedTasks = await fetchTasksFromSupabase(userId);
    setTasks(loadedTasks);
    setLoading(false);
  };

  useEffect(() => {
    loadTasks();
  }, [userId]);

  const handleToggleTask = async (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const updatedTask = { ...task, completed: !task.completed };
    await saveTaskToSupabase(userId, updatedTask);
    setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
  };

  const categoryTasks = filterRecurringTasks(
    tasks.filter((task) => task.category === category),
    selectedDate
  ).sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div className="min-h-screen bg-white">
      <div className="sticky top-0 bg-emerald-700 z-10 pb-4 pt-6 px-4 relative">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-emerald-600 transition-colors"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-2xl font-bold text-white">{categoryData?.name || category}</h1>
          </div>
        </div>

        <div className="overflow-x-auto scrollbar-hide py-4 px-2">
          <div className="flex gap-3 pb-2" style={{ minWidth: 'max-content' }}>
            {days.map((day) => {
              const dayStr = day.toString();
              const isSelected = selectedDate === dayStr;
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(dayStr)}
                  className={`flex-shrink-0 flex flex-col items-center gap-1 transition-all ${
                    isSelected ? 'scale-110' : ''
                  }`}
                >
                  <span className={`text-xs font-medium ${isSelected ? 'text-white font-semibold' : 'text-white/70'}`}>
                    {getDayAbbreviation(day)}
                  </span>
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${
                      isSelected
                        ? 'bg-white text-emerald-700 shadow-lg'
                        : 'bg-transparent text-white hover:bg-white/20'
                    }`}
                  >
                    {day}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500">Görevler yükleniyor...</p>
          </div>
        </div>
      ) : categoryTasks.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
          <div className="text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
              {categoryData?.icon || '📝'}
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Henüz görev yok</h2>
            <p className="text-gray-600 mb-6">İlk görevini ekleyerek başla</p>
          </div>
        </div>
      ) : (
        <div className="max-w-md mx-auto px-6 py-6">
          <div className="space-y-3">
            {categoryTasks.map((task) => (
              <div
                key={task.id}
                onClick={() => onEditTask(task)}
                className="flex items-center gap-4 p-4 bg-white rounded-xl border-2 border-emerald-100 hover:border-emerald-300 transition-all cursor-pointer"
              >
                <button
                  onClick={(e) => task.id && handleToggleTask(task.id, e)}
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                    task.completed ? 'bg-emerald-500 border-emerald-500' : 'border-emerald-500 hover:bg-emerald-100'
                  }`}
                >
                  {task.completed && (
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
                <div className="flex-1">
                  <div className={`font-medium ${task.completed ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                    {task.title}
                  </div>
                  <div className="text-sm text-gray-500">{task.time}</div>
                </div>
                {task.priority && (
                  <div className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    task.priority === 'high' ? 'bg-red-100 text-red-700' :
                    task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {task.priority === 'high' ? '🔴' : task.priority === 'medium' ? '🟡' : '🟢'}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={() => onEditTask({} as TimelineTask)}
        className="fixed bottom-24 right-6 w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center hover:scale-110 active:scale-95 z-20"
      >
        <span className="text-3xl font-light">+</span>
      </button>
    </div>
  );
}
