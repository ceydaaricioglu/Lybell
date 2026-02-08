'use client';

import { useState, useEffect } from 'react';
import { Category, TimelineTask } from '@/lib/types';
import { getMockCategories, fetchTasksFromSupabase, filterRecurringTasks } from '@/lib/helpers';
import { StatsCardSkeleton, TaskListSkeleton, CategoryListSkeleton } from '@/components/Skeletons';

interface HomeViewProps {
  onCategorySelect: (category: string) => void;
  userId: string;
  onViewAll: () => void;
  onEditTask: (task: TimelineTask, viewingDate?: string) => void;
}

export default function HomeView({ onCategorySelect, userId, onViewAll, onEditTask }: HomeViewProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [allTasks, setAllTasks] = useState<TimelineTask[]>([]);
  const [loading, setLoading] = useState(true);

  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const todayStr = currentDay.toString();

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const loadedCategories = getMockCategories(userId);
      setCategories(loadedCategories);
      
      const loadedTasks = await fetchTasksFromSupabase(userId);
      setAllTasks(loadedTasks);
      setLoading(false);
    };
    loadData();
  }, [userId]);

  // Bugünün görevleri
  const todayTasks = filterRecurringTasks(allTasks, todayStr)
    .filter(t => !t.completed)
    .sort((a, b) => a.time.localeCompare(b.time));

  // Yaklaşan görevler (bugünden sonraki 3 gün)
  const upcomingDays = Array.from({ length: 3 }, (_, i) => {
    const d = new Date(today);
    d.setDate(currentDay + i + 1);
    return d.getDate().toString();
  });

  const upcomingTasks: TimelineTask[] = [];
  upcomingDays.forEach(day => {
    const dayTasks = filterRecurringTasks(allTasks, day)
      .filter(t => !t.completed)
      .map(t => ({ ...t, date: day }));
    upcomingTasks.push(...dayTasks);
  });
  upcomingTasks.sort((a, b) => {
    const dateCompare = parseInt(a.date) - parseInt(b.date);
    if (dateCompare !== 0) return dateCompare;
    return a.time.localeCompare(b.time);
  });

  // İstatistikler
  const totalTasks = allTasks.length;
  const completedTasks = allTasks.filter(t => t.completed).length;
  const activeTasks = totalTasks - completedTasks;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Kategoriler özeti (en çok görevli 3 kategori)
  const categoryStats = categories.map(cat => {
    const catTasks = allTasks.filter(t => t.category === cat.id);
    const completed = catTasks.filter(t => t.completed).length;
    const total = catTasks.length;
    return {
      ...cat,
      total,
      completed,
      progress: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }).sort((a, b) => b.total - a.total).slice(0, 3);

  const getCategoryColor = (color?: string) => {
    const colorMap: Record<string, { bg: string; light: string; text: string }> = {
      blue: { bg: 'bg-blue-600', light: 'bg-blue-100', text: 'text-blue-600' },
      purple: { bg: 'bg-purple-600', light: 'bg-purple-100', text: 'text-purple-600' },
      pink: { bg: 'bg-pink-600', light: 'bg-pink-100', text: 'text-pink-600' },
      orange: { bg: 'bg-orange-600', light: 'bg-orange-100', text: 'text-orange-600' },
      yellow: { bg: 'bg-yellow-600', light: 'bg-yellow-100', text: 'text-yellow-600' },
      emerald: { bg: 'bg-emerald-600', light: 'bg-emerald-100', text: 'text-emerald-600' },
    };
    return colorMap[color || 'emerald'] || colorMap.emerald;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 pt-6 pb-8 text-white">
          <div className="max-w-md mx-auto">
            <div className="h-8 bg-white/20 rounded w-48 mb-2 animate-pulse"></div>
            <div className="h-4 bg-white/10 rounded w-32 animate-pulse"></div>
          </div>
        </div>

        <div className="max-w-md mx-auto px-4 -mt-4 space-y-4 pb-8">
          <StatsCardSkeleton />
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-24 mb-1"></div>
              <div className="h-3 bg-gray-100 rounded w-20"></div>
            </div>
            <TaskListSkeleton count={3} />
          </div>
          
          <CategoryListSkeleton count={2} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 pt-6 pb-8 text-white">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold mb-1">Hoş Geldin! 🎉</h1>
          <p className="text-emerald-50 text-sm">Gününü planlamaya hazırsın</p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 -mt-4 space-y-4 pb-8">
        {/* İstatistikler */}
        {totalTasks > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-600 mb-1">{totalTasks}</div>
                <div className="text-xs text-gray-500">Toplam</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-teal-600 mb-1">{completedTasks}</div>
                <div className="text-xs text-gray-500">Tamamlanan</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-500 mb-1">{activeTasks}</div>
                <div className="text-xs text-gray-500">Aktif</div>
              </div>
            </div>
            {completionRate > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500">Tamamlanma Oranı</span>
                  <span className="text-xs font-semibold text-emerald-600">%{completionRate}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full transition-all"
                    style={{ width: `${completionRate}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Bugünün Görevleri */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Bugün</h2>
              <p className="text-xs text-gray-500">{todayStr} {['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'][currentMonth]}</p>
            </div>
            {todayTasks.length > 0 && (
              <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">
                {todayTasks.length}
              </span>
            )}
          </div>

          {todayTasks.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <div className="relative w-20 h-20 mx-auto mb-4">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-2xl rotate-6 opacity-20 animate-pulse"></div>
                <div className="relative w-20 h-20 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl flex items-center justify-center">
                  <svg className="w-10 h-10 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Harika bir gün!</h3>
              <p className="text-sm text-gray-500 mb-6 px-4">
                Bugün için planlanmış görev yok. Yeni bir görev ekleyerek güne başla!
              </p>
              <div className="flex flex-col gap-2 max-w-xs mx-auto">
                <button
                  onClick={() => onCategorySelect('add-task')}
                  className="w-full px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl text-sm font-semibold hover:shadow-lg transition-all transform hover:scale-105"
                >
                  + İlk Görevini Ekle
                </button>
                <button
                  onClick={onViewAll}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  Tüm Görevleri Gör
                </button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {todayTasks.slice(0, 5).map((task) => (
                <button
                  key={task.id}
                  onClick={() => onEditTask(task, todayStr)}
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
                    <div className="font-medium text-gray-900 truncate">{task.title}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-400">{task.time}</span>
                      {task.category && (
                        <span className="text-xs text-gray-400">•</span>
                      )}
                      {task.priority && (
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          task.priority === 'high' ? 'bg-red-100 text-red-600' :
                          task.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                          'bg-green-100 text-green-600'
                        }`}>
                          {task.priority === 'high' ? 'Yüksek' : task.priority === 'medium' ? 'Orta' : 'Düşük'}
                        </span>
                      )}
                    </div>
                  </div>
                  <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
              {todayTasks.length > 5 && (
                <button
                  onClick={onViewAll}
                  className="w-full px-5 py-3 text-emerald-600 text-sm font-medium hover:bg-emerald-50 transition-colors"
                >
                  +{todayTasks.length - 5} görev daha görüntüle
                </button>
              )}
            </div>
          )}
        </div>

        {/* Yaklaşan Görevler */}
        {upcomingTasks.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Yaklaşan</h2>
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                {upcomingTasks.length}
              </span>
            </div>
            <div className="divide-y divide-gray-100">
              {upcomingTasks.slice(0, 3).map((task, idx) => {
                const taskDate = parseInt(task.date);
                const isTomorrow = taskDate === currentDay + 1;
                const dateLabel = isTomorrow ? 'Yarın' : `${taskDate} ${['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'][currentMonth]}`;
                
                return (
                  <button
                    key={`${task.id}-${idx}`}
                    onClick={() => onEditTask(task, task.date)}
                    className="w-full px-5 py-4 hover:bg-gray-50 transition-colors text-left flex items-center gap-3"
                  >
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">{task.title}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-400">{dateLabel}</span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-400">{task.time}</span>
                      </div>
                    </div>
                    <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Kategoriler Özeti */}
        {categoryStats.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Kategoriler</h2>
              <button
                onClick={() => onCategorySelect('categories')}
                className="text-sm text-emerald-600 font-medium hover:text-emerald-700"
              >
                Tümünü Gör
              </button>
            </div>
            <div className="divide-y divide-gray-100">
              {categoryStats.map((cat) => {
                const colors = getCategoryColor(cat.color);
                return (
                  <button
                    key={cat.id}
                    onClick={() => onCategorySelect(cat.id)}
                    className="w-full px-5 py-4 hover:bg-gray-50 transition-colors text-left flex items-center gap-3"
                  >
                    <div className={`w-10 h-10 ${colors.light} rounded-xl flex items-center justify-center text-xl flex-shrink-0`}>
                      {cat.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900">{cat.name}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">{cat.total} görev</span>
                        {cat.total > 0 && (
                          <>
                            <span className="text-xs text-gray-300">•</span>
                            <div className="flex-1 max-w-24 bg-gray-200 rounded-full h-1.5">
                              <div
                                className={`${colors.bg} h-1.5 rounded-full transition-all`}
                                style={{ width: `${cat.progress}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500">%{cat.progress}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Hızlı İşlemler */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onCategorySelect('add-task')}
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all text-center"
          >
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-2">
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div className="text-sm font-semibold text-gray-900">Görev Ekle</div>
          </button>
          <button
            onClick={onViewAll}
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all text-center"
          >
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <div className="text-sm font-semibold text-gray-900">Tüm Görevler</div>
          </button>
        </div>
      </div>
    </div>
  );
}
