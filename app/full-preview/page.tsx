'use client';

import { useState, useEffect } from 'react';

// Mock data
const mockUserId = 'mock-user-preview';

// LocalStorage'dan taskları yükle
const loadTasks = (): any[] => {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('preview_tasks');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Bozuk verileri filtrele (title'ı olmayan veya string olmayan)
        return parsed.filter((t: any) => t && typeof t.title === 'string' && t.title.trim());
      }
    } catch {
      localStorage.removeItem('preview_tasks');
    }
  }
  return [];
};

// Taskları kaydet
const saveTasks = (tasks: any[]): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('preview_tasks', JSON.stringify(tasks));
  }
};

// Bugünün bilgileri
const TODAY = new Date();
const CURRENT_MONTH = TODAY.getMonth();
const CURRENT_YEAR = TODAY.getFullYear();
const CURRENT_DAY = TODAY.getDate();
const DAYS_IN_MONTH = new Date(CURRENT_YEAR, CURRENT_MONTH + 1, 0).getDate();
const MONTH_NAMES = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const DAY_NAMES = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

// Gün kısaltmaları - gerçek takvime göre
const getDayAbbreviation = (dayNumber: number): string => {
  const date = new Date(CURRENT_YEAR, CURRENT_MONTH, dayNumber);
  return DAY_NAMES[date.getDay()];
};

// Tarihin haftalık gününü döndür (0=Pazar, 1=Pazartesi, ...)
const getDayOfWeek = (dayNumber: number): number => {
  const date = new Date(CURRENT_YEAR, CURRENT_MONTH, dayNumber);
  return date.getDay();
};

// Onboarding Step 1
function OnboardingStep1({ onNext, selectedFocus, setSelectedFocus }: any) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex flex-col">
      <div className="bg-white border-b border-emerald-100 px-6 py-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Step 1 of 2</span>
            <span className="text-sm font-medium text-emerald-600">50%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full transition-all duration-300" style={{ width: '50%' }}></div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">Choose Your Focus</h2>
          <p className="text-gray-600 text-center mb-8">What would you like to organize first?</p>

          <div className="space-y-3 mb-8">
            {[
              { icon: "📚", label: "Reading List", value: "reading", color: "from-purple-400 to-pink-400" },
              { icon: "🏃", label: "Daily Routines", value: "routines", color: "from-blue-400 to-cyan-400" },
              { icon: "💼", label: "Work Tasks", value: "work", color: "from-orange-400 to-red-400" },
              { icon: "🎯", label: "Personal Goals", value: "goals", color: "from-emerald-400 to-teal-400" }
            ].map((option, index) => (
              <button
                key={index}
                onClick={() => setSelectedFocus(option.value)}
                className={`w-full p-4 bg-white rounded-xl border-2 transition-all text-left flex items-center gap-4 hover:shadow-md ${
                  selectedFocus === option.value
                    ? 'border-emerald-500 bg-emerald-50 shadow-md'
                    : 'border-emerald-100 hover:border-emerald-300'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${option.color} flex items-center justify-center text-2xl`}>
                  {option.icon}
                </div>
                <span className="font-semibold text-gray-900">{option.label}</span>
                {selectedFocus === option.value && (
                  <svg className="w-6 h-6 text-emerald-500 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>

          <button
            onClick={onNext}
            disabled={!selectedFocus}
            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

// Onboarding Step 2
function OnboardingStep2({ onComplete, selectedSchedule, setSelectedSchedule }: any) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex flex-col">
      <div className="bg-white border-b border-emerald-100 px-6 py-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Step 2 of 2</span>
            <span className="text-sm font-medium text-emerald-600">100%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full transition-all duration-300" style={{ width: '100%' }}></div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">Set Your Schedule</h2>
          <p className="text-gray-600 text-center mb-8">When do you prefer to plan your day?</p>

          <div className="space-y-3 mb-8">
            {[
              { icon: "🌅", label: "Morning Person", value: "morning", color: "from-yellow-400 to-orange-400" },
              { icon: "🌆", label: "Evening Planner", value: "evening", color: "from-indigo-400 to-purple-400" },
              { icon: "🌙", label: "Flexible", value: "flexible", color: "from-gray-400 to-gray-600" }
            ].map((option, index) => (
              <button
                key={index}
                onClick={() => setSelectedSchedule(option.value)}
                className={`w-full p-4 bg-white rounded-xl border-2 transition-all text-left flex items-center gap-4 hover:shadow-md ${
                  selectedSchedule === option.value
                    ? 'border-emerald-500 bg-emerald-50 shadow-md'
                    : 'border-emerald-100 hover:border-emerald-300'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${option.color} flex items-center justify-center text-2xl`}>
                  {option.icon}
                </div>
                <span className="font-semibold text-gray-900">{option.label}</span>
                {selectedSchedule === option.value && (
                  <svg className="w-6 h-6 text-emerald-500 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => window.location.reload()}
              className="flex-1 py-3 bg-white border-2 border-emerald-200 text-emerald-600 rounded-xl font-semibold hover:bg-emerald-50 transition-all"
            >
              Back
            </button>
            <button
              onClick={onComplete}
              disabled={!selectedSchedule}
              className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Finish Setup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Home Screen (Welcome Dashboard)
function HomeScreen({ onCategorySelect, onViewAll, tasks }: any) {
  const routinesCount = tasks.filter((t: any) => t.category === 'routines').length;
  const readingCount = tasks.filter((t: any) => t.category === 'reading').length;
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t: any) => t.completed).length;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-8 text-white">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold mb-2">Welcome! 🎉</h1>
          <p className="text-emerald-50">You're ready to organize your day</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto px-6 py-8">
        {/* Welcome Card */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 mb-6 border border-emerald-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Setup Complete!</h2>
              <p className="text-sm text-gray-600">Let's start organizing</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        {totalTasks > 0 && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-emerald-100">
              <div className="text-2xl font-bold text-emerald-600 mb-1">{totalTasks}</div>
              <div className="text-xs text-gray-600">Total Tasks</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-emerald-100">
              <div className="text-2xl font-bold text-teal-600 mb-1">{completedTasks}</div>
              <div className="text-xs text-gray-600">Completed</div>
            </div>
          </div>
        )}

        {/* Categories */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Categories</h2>
          <div className="space-y-3">
            <button
              onClick={() => onCategorySelect('routines')}
              className="w-full bg-white rounded-xl p-5 shadow-sm border-2 border-emerald-100 hover:border-emerald-300 hover:shadow-md transition-all text-left flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl">
                  🏃
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Rutinler</div>
                  <div className="text-xs text-gray-500">{routinesCount} tasks</div>
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button
              onClick={() => onCategorySelect('reading')}
              className="w-full bg-white rounded-xl p-5 shadow-sm border-2 border-emerald-100 hover:border-emerald-300 hover:shadow-md transition-all text-left flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-2xl">
                  📚
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Okuma Listesi</div>
                  <div className="text-xs text-gray-500">{readingCount} tasks</div>
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
          <h3 className="font-semibold text-gray-900 mb-3">Quick Actions</h3>
          <div className="flex gap-2">
            <button
              onClick={() => onCategorySelect('add-task')}
              className="flex-1 py-2 px-4 bg-white border border-emerald-200 text-emerald-600 rounded-lg font-medium hover:bg-emerald-100 transition-colors text-sm"
            >
              + Add Task
            </button>
            <button
              onClick={onViewAll}
              className="flex-1 py-2 px-4 bg-white border border-emerald-200 text-emerald-600 rounded-lg font-medium hover:bg-emerald-100 transition-colors text-sm"
            >
              View All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Category Detail Screen
function CategoryDetailScreen({ category, onBack, tasks, onAddTask }: any) {
  const categoryName = category === 'routines' ? 'Rutinler' : 'Okuma Listesi';
  const categoryIcon = category === 'routines' ? '🏃' : '📚';
  const [selectedDate, setSelectedDate] = useState(CURRENT_DAY.toString());
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(TODAY);
    d.setDate(CURRENT_DAY + i);
    return d.getDate();
  });

  // Tekrarlı görevleri filtrele
  const filterRecurringTasks = (allTasks: any[], selectedDate: string): any[] => {
    const selectedDayNum = parseInt(selectedDate);
    const selectedDayOfWeek = getDayOfWeek(selectedDayNum);
    
    return allTasks.filter((task) => {
      if (!task.recurrence) {
        return task.date === selectedDate;
      }
      
      const originalDate = task.originalDate || task.date;
      const originalDayNum = parseInt(originalDate);
      const originalDayOfWeek = getDayOfWeek(originalDayNum);
      
      switch (task.recurrence) {
        case 'weekly':
          return selectedDayOfWeek === originalDayOfWeek;
        case 'monthly':
          return selectedDayNum === originalDayNum;
        case 'weekdays':
          return selectedDayOfWeek >= 1 && selectedDayOfWeek <= 5;
        default:
          return task.date === selectedDate;
      }
    });
  };
  
  // Kategoriye göre filtrele ve tekrarlı görevleri uygula
  const categoryTasks = filterRecurringTasks(
    tasks.filter((task: any) => task.category === category),
    selectedDate
  ).sort((a: any, b: any) => a.time.localeCompare(b.time));

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
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
            <h1 className="text-2xl font-bold text-white">{categoryName}</h1>
          </div>
        </div>

        {/* Date Selector */}
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
                    {['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'][(day - 1) % 7]}
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

      {/* Tasks List or Empty State */}
      {categoryTasks.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
          <div className="text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
              {categoryIcon}
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No tasks yet</h2>
            <p className="text-gray-600 mb-6">Start by adding your first {categoryName.toLowerCase()} task</p>
            <button
              onClick={onAddTask}
              className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              + Add Task
            </button>
          </div>
        </div>
      ) : (
        <div className="max-w-md mx-auto px-6 py-6">
          <div className="space-y-3">
            {categoryTasks.map((task: any) => (
              <div
                key={task.id}
                className="flex items-center gap-4 p-4 bg-white rounded-xl border-2 border-emerald-100 hover:border-emerald-300 transition-all"
              >
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  task.completed ? 'bg-emerald-500 border-emerald-500' : 'border-emerald-500'
                }`}>
                  {task.completed && (
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <div className={`font-medium ${task.completed ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                    {task.title}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-gray-500">{task.time}</span>
                    {task.recurrence && (
                      <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                        {task.recurrence === 'weekly' ? '🔄 Her hafta' : task.recurrence === 'monthly' ? '📅 Her ay' : '📆 Hafta içi'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Button */}
      <button
        onClick={onAddTask}
        className="fixed bottom-24 right-6 w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center hover:scale-110 active:scale-95 z-20"
      >
        <span className="text-3xl font-light">+</span>
      </button>
    </div>
  );
}

// Add Task Screen
function AddTaskScreen({ onBack, onSave }: any) {
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('08:00');
  const [date, setDate] = useState(CURRENT_DAY.toString());
  const [category, setCategory] = useState<'routines' | 'reading' | null>(null);
  const [recurrence, setRecurrence] = useState<'weekly' | 'monthly' | 'weekdays' | null>(null);
  const [showRecurrenceOptions, setShowRecurrenceOptions] = useState(false);
  const [showCategoryOptions, setShowCategoryOptions] = useState(false);

  const handleSave = () => {
    if (title.trim() && category) {
      onSave({
        title: title.trim(),
        time,
        date,
        category,
        recurrence,
        completed: false,
        originalDate: date, // Tekrarlı görevler için original date
      });
      onBack();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-6 text-white">
        <div className="max-w-md mx-auto flex items-center gap-4">
          <button
            onClick={onBack}
            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-emerald-600/50 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold flex-1">New Task</h1>
          <button
            onClick={handleSave}
            disabled={!title.trim() || !category}
            className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg font-semibold hover:bg-white/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 max-w-md mx-auto w-full px-6 py-8">
        <div className="space-y-6">
          {/* Task Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Task Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full px-4 py-4 border-2 border-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-lg text-gray-900 placeholder:text-gray-400 bg-white"
              placeholder="What do you need to do?"
              autoFocus
            />
          </div>

          {/* Category Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
            <button
              onClick={() => setShowCategoryOptions(!showCategoryOptions)}
              className="w-full px-4 py-4 border-2 border-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-left flex items-center justify-between bg-white hover:border-emerald-300 transition-all"
            >
              <span className={category ? 'text-gray-900 font-medium' : 'text-gray-400'}>
                {category === 'routines' ? '🏃 Rutinler' : category === 'reading' ? '📚 Okuma Listesi' : 'Select category'}
              </span>
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform ${showCategoryOptions ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showCategoryOptions && (
              <div className="mt-2 border-2 border-emerald-200 rounded-xl overflow-hidden bg-white">
                <button
                  onClick={() => {
                    setCategory('routines');
                    setShowCategoryOptions(false);
                  }}
                  className="w-full px-4 py-4 text-left hover:bg-emerald-50 transition-colors flex items-center gap-3 border-b border-emerald-100"
                >
                  <span className="text-2xl">🏃</span>
                  <div>
                    <div className="font-semibold text-gray-900">Rutinler</div>
                    <div className="text-xs text-gray-500">Daily routines and habits</div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setCategory('reading');
                    setShowCategoryOptions(false);
                  }}
                  className="w-full px-4 py-4 text-left hover:bg-emerald-50 transition-colors flex items-center gap-3"
                >
                  <span className="text-2xl">📚</span>
                  <div>
                    <div className="font-semibold text-gray-900">Okuma Listesi</div>
                    <div className="text-xs text-gray-500">Books and articles to read</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
              <input
                type="date"
                value={`${CURRENT_YEAR}-${String(CURRENT_MONTH + 1).padStart(2, '0')}-${date.padStart(2, '0')}`}
                onChange={(e) => {
                  const dateStr = e.target.value;
                  const day = dateStr.split('-')[2];
                  setDate(parseInt(day, 10).toString());
                }}
                className="w-full px-4 py-3 border-2 border-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Time</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-4 py-3 border-2 border-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
              />
            </div>
          </div>

          {/* Recurrence */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Tekrar</label>
            <button
              onClick={() => setShowRecurrenceOptions(!showRecurrenceOptions)}
              className="w-full px-4 py-4 border-2 border-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-left flex items-center justify-between bg-white hover:border-emerald-300 transition-all"
            >
              <span className={recurrence ? 'text-gray-900 font-medium' : 'text-gray-400'}>
                {recurrence === 'weekly'
                  ? '🔄 Her hafta'
                  : recurrence === 'monthly'
                  ? '📅 Her ay'
                  : recurrence === 'weekdays'
                  ? '📆 Sadece hafta içi'
                  : 'Tekrar yok'}
              </span>
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform ${showRecurrenceOptions ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showRecurrenceOptions && (
              <div className="mt-2 border-2 border-emerald-200 rounded-xl overflow-hidden bg-white">
                <button
                  onClick={() => {
                    setRecurrence('weekly');
                    setShowRecurrenceOptions(false);
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-emerald-50 transition-colors border-b border-emerald-100"
                >
                  🔄 Her hafta
                </button>
                <button
                  onClick={() => {
                    setRecurrence('monthly');
                    setShowRecurrenceOptions(false);
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-emerald-50 transition-colors border-b border-emerald-100"
                >
                  📅 Her ay
                </button>
                <button
                  onClick={() => {
                    setRecurrence('weekdays');
                    setShowRecurrenceOptions(false);
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-emerald-50 transition-colors"
                >
                  📆 Sadece hafta içi
                </button>
                <button
                  onClick={() => {
                    setRecurrence(null);
                    setShowRecurrenceOptions(false);
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-emerald-50 transition-colors border-t border-emerald-100 text-gray-500"
                >
                  Tekrar yok
                </button>
              </div>
            )}
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={!title.trim() || !category}
            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Görevi Oluştur</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// Calendar Modal with Quick Add
function CalendarQuickAddModal({ onClose, onSave, selectedDate, onDateSelect }: any) {
  const [selectedMonth, setSelectedMonth] = useState(0); // 0 = Ocak
  const [selectedYear, setSelectedYear] = useState(2026);
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [quickTaskTime, setQuickTaskTime] = useState('08:00');
  const [quickTaskCategory, setQuickTaskCategory] = useState<'routines' | 'reading' | null>(null);
  const [showCategoryOptions, setShowCategoryOptions] = useState(false);
  const [selectedDay, setSelectedDay] = useState(parseInt(selectedDate));

  const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

  const getDaysInMonth = (month: number, year: number): number => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number): number => {
    return new Date(year, month, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
  const firstDay = getFirstDayOfMonth(selectedMonth, selectedYear);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const handleDateSelect = (day: number) => {
    setSelectedDay(day);
    const dayStr = day.toString();
    onDateSelect(selectedMonth, day);
  };

  const handleQuickAdd = () => {
    if (quickTaskTitle.trim() && quickTaskCategory) {
      onSave({
        title: quickTaskTitle.trim(),
        time: quickTaskTime,
        date: selectedDay.toString(),
        category: quickTaskCategory,
        completed: false,
        originalDate: selectedDay.toString(), // Tekrarlı görevler için original date
      });
      setQuickTaskTitle('');
      setQuickTaskCategory(null);
      onClose();
    }
  };

  const isSelectedDay = (day: number) => {
    return selectedMonth === 0 && selectedYear === 2026 && day === selectedDay;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Select Date & Add Task</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Calendar */}
        <div className="mb-6">
          {/* Month/Year Selector */}
          <div className="flex gap-2 mb-4">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="flex-1 px-3 py-2 border-2 border-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900"
            >
              {months.map((month, index) => (
                <option key={index} value={index}>
                  {month}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="flex-1 px-3 py-2 border-2 border-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900"
            >
              {Array.from({ length: 5 }, (_, i) => 2026 + i).map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'].map((day) => (
              <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {/* Empty cells */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square"></div>
            ))}
            
            {/* Days */}
            {days.map((day) => {
              const isSelected = isSelectedDay(day);
              return (
                <button
                  key={day}
                  onClick={() => handleDateSelect(day)}
                  className={`aspect-square rounded-xl text-sm font-medium transition-all ${
                    isSelected
                      ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg scale-110'
                      : 'bg-gray-50 text-gray-700 hover:bg-emerald-100 hover:text-emerald-700'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Add Task Section */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Add Task</h3>
          
          {/* Task Title */}
          <div className="mb-4">
            <input
              type="text"
              value={quickTaskTitle}
              onChange={(e) => setQuickTaskTitle(e.target.value)}
              placeholder="Task title..."
              className="w-full px-4 py-3 border-2 border-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 placeholder:text-gray-400"
            />
          </div>

          {/* Time & Category */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <input
                type="time"
                value={quickTaskTime}
                onChange={(e) => setQuickTaskTime(e.target.value)}
                className="w-full px-3 py-2 border-2 border-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="relative">
              <button
                onClick={() => setShowCategoryOptions(!showCategoryOptions)}
                className="w-full px-3 py-2 border-2 border-emerald-200 rounded-xl text-left flex items-center justify-between hover:border-emerald-300 transition-all bg-white"
              >
                <span className={quickTaskCategory ? 'text-gray-900' : 'text-gray-400'}>
                  {quickTaskCategory === 'routines' ? '🏃 Routines' : quickTaskCategory === 'reading' ? '📚 Reading' : 'Category'}
                </span>
                <svg
                  className={`w-4 h-4 text-gray-400 transition-transform ${showCategoryOptions ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showCategoryOptions && (
                <div className="absolute top-full left-0 right-0 mt-1 border-2 border-emerald-200 rounded-xl overflow-hidden bg-white z-10">
                  <button
                    onClick={() => {
                      setQuickTaskCategory('routines');
                      setShowCategoryOptions(false);
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-emerald-50 transition-colors"
                  >
                    🏃 Routines
                  </button>
                  <button
                    onClick={() => {
                      setQuickTaskCategory('reading');
                      setShowCategoryOptions(false);
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-emerald-50 transition-colors"
                  >
                    📚 Reading
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Add Button */}
          <button
            onClick={handleQuickAdd}
            disabled={!quickTaskTitle.trim() || !quickTaskCategory}
            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add Task to {selectedDay} {months[selectedMonth]}
          </button>
        </div>
      </div>
    </div>
  );
}

// Tasks Screen - Hybrid View (Calendar + Date Grouped List)
function TasksScreen({ onBack, tasks, onToggleTask, onAddTask }: any) {
  const [selectedDate, setSelectedDate] = useState<string | 'all'>('all');
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(CURRENT_MONTH);
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
  const days = Array.from({ length: DAYS_IN_MONTH }, (_, i) => i + 1);
  
  const months = MONTH_NAMES;

  // Tekrarlı görevleri filtrele
  const filterRecurringTasks = (allTasks: any[], selectedDate: string): any[] => {
    const selectedDayNum = parseInt(selectedDate);
    const selectedDayOfWeek = getDayOfWeek(selectedDayNum);
    
    return allTasks.filter((task) => {
      // Tekrarlı görev değilse, sadece tarih eşleşmesine bak
      if (!task.recurrence) {
        return task.date === selectedDate;
      }
      
      // Tekrarlı görev ise mantığa göre kontrol et
      const originalDate = task.originalDate || task.date;
      const originalDayNum = parseInt(originalDate);
      const originalDayOfWeek = getDayOfWeek(originalDayNum);
      
      switch (task.recurrence) {
        case 'weekly':
          // Her hafta aynı gün: Haftalık gün eşleşmeli
          return selectedDayOfWeek === originalDayOfWeek;
        
        case 'monthly':
          // Her ay aynı gün: Ayın kaçıncı günü eşleşmeli
          return selectedDayNum === originalDayNum;
        
        case 'weekdays':
          // Hafta içi her gün: Pazartesi (1) - Cuma (5) arası
          return selectedDayOfWeek >= 1 && selectedDayOfWeek <= 5;
        
        default:
          return task.date === selectedDate;
      }
    });
  };

  // Tüm görevleri tarihe göre grupla (tekrarlı görevler dahil)
  const getAllDatesWithTasks = (): string[] => {
    const datesSet = new Set<string>();
    
    // Tüm tarihleri topla (normal + tekrarlı görevler için)
    tasks.forEach((task: any) => {
      if (!task.recurrence) {
        datesSet.add(task.date);
      } else {
        // Tekrarlı görevler için tüm olası tarihleri ekle
        days.forEach((day) => {
          const dayStr = day.toString();
          const filtered = filterRecurringTasks([task], dayStr);
          if (filtered.length > 0) {
            datesSet.add(dayStr);
          }
        });
      }
    });
    
    return Array.from(datesSet).sort((a, b) => parseInt(a) - parseInt(b));
  };

  // Tarihleri al
  const allDatesWithTasks = getAllDatesWithTasks();

  // Her tarih için görevleri filtrele ve grupla
  const groupedTasks: any = {};
  allDatesWithTasks.forEach((date) => {
    const filtered = filterRecurringTasks(tasks, date);
    if (filtered.length > 0) {
      groupedTasks[date] = filtered.sort((a: any, b: any) => a.time.localeCompare(b.time));
    }
  });

  const sortedDates = Object.keys(groupedTasks).sort((a, b) => parseInt(a) - parseInt(b));

  // Seçili tarihe göre filtrele veya tümünü göster
  const displayTasks = selectedDate === 'all' 
    ? sortedDates.map((date) => ({ date, tasks: groupedTasks[date] }))
    : [{ date: selectedDate, tasks: groupedTasks[selectedDate] || [] }];

  // Takvim için gün başına görev sayısı (tekrarlı görevler dahil)
  const getTaskCountForDay = (day: number) => {
    const dayStr = day.toString();
    return filterRecurringTasks(tasks, dayStr).length;
  };

  // Scroll to date function
  const scrollToDate = (date: string) => {
    const element = document.getElementById(`date-group-${date}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Date seçildiğinde scroll yap
  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setTimeout(() => scrollToDate(date), 100);
  };

  return (
    <div className="flex-1 overflow-y-auto pb-20">
      <div className="max-w-md mx-auto bg-white min-h-full">
        {/* Header */}
        <div className="sticky top-0 bg-emerald-700 z-10 pb-4 pt-6 px-4 relative">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-white">{months[selectedMonth]} {selectedYear}</h1>
            <div className="flex items-center gap-2">
              {/* Settings İkonu */}
              <button className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-emerald-600 transition-colors">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              {/* Takvim İkonu */}
              <button
                onClick={() => setShowCalendarModal(true)}
                className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-emerald-600 transition-colors"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Kompakt Horizontal Takvim - Sadece Görevli Günler */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2 mb-2">
            <div className="overflow-x-auto scrollbar-hide">
              <div className="flex gap-2 pb-1" style={{ minWidth: 'max-content' }}>
                {/* All Tasks Button */}
                <button
                  onClick={() => {
                    setSelectedDate('all');
                  }}
                  className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    selectedDate === 'all'
                      ? 'bg-white text-emerald-700 shadow-md'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  Tümü
                </button>
                
                {/* Görevli Günler */}
                {sortedDates.map((date) => {
                  const dayNum = parseInt(date);
                  const taskCount = getTaskCountForDay(dayNum);
                  const isSelected = selectedDate === date;
                  
                  if (taskCount === 0) return null;
                  
                  return (
                    <button
                      key={date}
                      onClick={() => handleDateSelect(date)}
                      className={`flex-shrink-0 flex flex-col items-center gap-1 px-2 py-1 rounded-lg transition-all min-w-[50px] ${
                        isSelected
                          ? 'bg-white text-emerald-700 shadow-md'
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

          {/* Filter Buttons */}
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => {
                setSelectedDate('all');
              }}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                selectedDate === 'all'
                  ? 'bg-white text-emerald-700 shadow-md'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              Tüm Görevler
            </button>
            <button
              onClick={() => {
                handleDateSelect(CURRENT_DAY.toString());
              }}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                selectedDate === CURRENT_DAY.toString()
                  ? 'bg-white text-emerald-700 shadow-md'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              Bugün
            </button>
          </div>
        </div>

        {/* Date Grouped Tasks List */}
        {displayTasks.length === 0 || (displayTasks.length === 1 && displayTasks[0].tasks.length === 0) ? (
          <div className="flex flex-col items-center justify-center px-6 py-12">
            <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No tasks yet</h2>
            <p className="text-gray-600 mb-6 text-center">Start organizing your day by creating your first task</p>
            <button
              onClick={() => onAddTask()}
              className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              + Create Your First Task
            </button>
          </div>
        ) : (
          <div className="flex flex-col p-6 bg-white">
            {displayTasks.map((dateGroup: any, groupIndex: number) => {
              if (!dateGroup.tasks || dateGroup.tasks.length === 0) return null;
              
              return (
                <div
                  key={dateGroup.date}
                  id={`date-group-${dateGroup.date}`}
                  className="mb-8 scroll-mt-20"
                >
                  {/* Date Header */}
                  <div className="flex items-center gap-3 mb-4 sticky top-20 bg-white py-2 z-10">
                    <div className="h-px flex-1 bg-gradient-to-r from-emerald-200 to-transparent"></div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-gray-900">
                        {dateGroup.date} {months[selectedMonth]}
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

                  {/* Tasks for this date */}
                  <div className="space-y-4">
                    {dateGroup.tasks.map((task: any, taskIndex: number) => (
                      <div key={task.id || taskIndex} className="flex items-center relative">
                        {/* Saat */}
                        <div className="w-20 text-sm text-gray-500 font-medium text-right pr-4 flex-shrink-0">
                          {task.time}
                        </div>

                        {/* İkon/Çizgi Kolonu */}
                        <div className="w-12 flex-shrink-0 relative flex items-center justify-center">
                          {/* Dikey Çizgi */}
                          <div 
                            className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-200 -translate-x-1/2 z-0"
                            style={{
                              top: taskIndex === 0 ? '0' : '-16px',
                              bottom: taskIndex === dateGroup.tasks.length - 1 ? '0' : '-16px'
                            }}
                          ></div>
                          
                          {/* İkon varsa göster */}
                          {task.icon && (
                            <div className="relative z-10 flex items-center justify-center w-10 h-10 rounded-full bg-white border-2 border-green-500 text-green-600">
                              {task.icon === 'Laptop' && (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                              )}
                              {task.icon === 'Utensils' && (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 2v20" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15V2v0a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15v7" />
                                </svg>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Görev Kartı */}
                        <div className="flex-1 ml-3 bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between hover:border-emerald-300 transition-all">
                          {/* Görev Başlığı */}
                          <div className="text-gray-900 font-medium hover:text-emerald-600 transition-colors text-left flex-1">
                            <div className={task.completed ? 'line-through text-gray-400' : ''}>
                              {task.title}
                            </div>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              {task.category && (
                                <span className="text-xs text-gray-500">
                                  {task.category === 'routines' ? '🏃 Rutinler' : '📚 Okuma Listesi'}
                                </span>
                              )}
                              {task.recurrence && (
                                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                                  {task.recurrence === 'weekly' ? '🔄 Her hafta' : task.recurrence === 'monthly' ? '📅 Her ay' : '📆 Hafta içi'}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Tik Kutusu */}
                          <button
                            onClick={() => onToggleTask(task.id)}
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center border-green-500 transition-all ml-2 flex-shrink-0 ${
                              task.completed ? 'bg-green-500' : 'bg-transparent'
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

        {/* Ekleme Butonu - Sağ Alt Köşe - Yeşil */}
        <button
          onClick={() => onAddTask()}
          className="fixed bottom-24 right-6 w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center hover:scale-110 active:scale-95 z-20"
        >
          <span className="text-3xl font-light">+</span>
        </button>

        {/* Calendar Modal */}
        {showCalendarModal && (
          <CalendarQuickAddModal
            onClose={() => setShowCalendarModal(false)}
            onSave={(task: any) => {
              onAddTask(task);
              setShowCalendarModal(false);
            }}
            selectedDate={selectedDate}
            onDateSelect={(month: number, day: number) => {
              if (month === 0) {
                setSelectedDate(day.toString());
              }
            }}
          />
        )}
      </div>
    </div>
  );
}

// Ana Component
export default function FullPreview() {
  const [currentScreen, setCurrentScreen] = useState<'onboarding1' | 'onboarding2' | 'home' | 'category' | 'tasks' | 'add-task'>('onboarding1');
  const [selectedFocus, setSelectedFocus] = useState<string | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'routines' | 'reading' | null>(null);
  const [tasks, setTasks] = useState<any[]>([]);

  // Component mount olduğunda taskları yükle
  useEffect(() => {
    const loadedTasks = loadTasks();
    setTasks(loadedTasks);
  }, []);

  // Task ekleme - recurrence bilgisini de kaydet
  const handleAddTask = (task: any) => {
    // Event nesnesi veya geçersiz veri kontrolü
    if (!task || !task.title || typeof task.title !== 'string') return;
    
    const newTask = {
      ...task,
      id: Date.now().toString(),
      completed: false,
      originalDate: task.originalDate || task.date, // Tekrarlı görevler için original date
    };
    const updatedTasks = [...tasks, newTask];
    setTasks(updatedTasks);
    saveTasks(updatedTasks);
  };

  // Task toggle (complete/uncomplete)
  const handleToggleTask = (taskId: string) => {
    const updatedTasks = tasks.map((task: any) =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );
    setTasks(updatedTasks);
    saveTasks(updatedTasks);
  };

  // Onboarding Step 1
  if (currentScreen === 'onboarding1') {
    return (
      <OnboardingStep1
        onNext={() => setCurrentScreen('onboarding2')}
        selectedFocus={selectedFocus}
        setSelectedFocus={setSelectedFocus}
      />
    );
  }

  // Onboarding Step 2
  if (currentScreen === 'onboarding2') {
    return (
      <OnboardingStep2
        onComplete={() => setCurrentScreen('home')}
        selectedSchedule={selectedSchedule}
        setSelectedSchedule={setSelectedSchedule}
      />
    );
  }

  // Add Task Screen
  if (currentScreen === 'add-task') {
    return (
      <AddTaskScreen
        onBack={() => setCurrentScreen('tasks')}
        onSave={(task: any) => {
          handleAddTask(task);
          setCurrentScreen('tasks');
        }}
      />
    );
  }

  // Handle task add from calendar modal
  const handleAddTaskFromCalendar = (task: any) => {
    handleAddTask(task);
  };

  // Category Detail
  if (currentScreen === 'category' && selectedCategory) {
    return (
      <CategoryDetailScreen
        category={selectedCategory}
        onBack={() => setCurrentScreen('home')}
        tasks={tasks}
        onAddTask={() => setCurrentScreen('add-task')}
      />
    );
  }

  // Tasks Screen
  if (currentScreen === 'tasks') {
    return (
      <TasksScreen
        onBack={() => setCurrentScreen('home')}
        tasks={tasks}
        onToggleTask={handleToggleTask}
        onAddTask={(task?: any) => {
          if (task) {
            handleAddTask(task);
          } else {
            setCurrentScreen('add-task');
          }
        }}
      />
    );
  }

  // Home Screen
  return (
    <HomeScreen
      tasks={tasks}
      onCategorySelect={(category: 'routines' | 'reading' | 'add-task') => {
        if (category === 'add-task') {
          setCurrentScreen('add-task');
        } else {
          setSelectedCategory(category);
          setCurrentScreen('category');
        }
      }}
      onViewAll={() => setCurrentScreen('tasks')}
    />
  );
}
