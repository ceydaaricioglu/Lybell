import { TimelineTask, Category } from './types';
import { supabase } from './supabaseClient';

// Helper Functions
export const getDayAbbreviation = (dayNumber: number): string => {
  const days = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
  return days[(dayNumber - 1) % 7];
};

export const getDayOfWeek = (dayNumber: number, month?: number, year?: number): number => {
  const now = new Date();
  const m = month !== undefined ? month : now.getMonth();
  const y = year !== undefined ? year : now.getFullYear();
  const date = new Date(y, m, dayNumber);
  return date.getDay();
};

export const isMockUser = (userId: string): boolean => {
  return userId.startsWith('mock-');
};

export const getMockTasks = (userId: string): TimelineTask[] => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(`mock_tasks_${userId}`);
    return stored ? JSON.parse(stored) : [];
  }
  return [];
};

export const saveMockTasks = (userId: string, tasks: TimelineTask[]): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(`mock_tasks_${userId}`, JSON.stringify(tasks));
  }
};

export const getMockCategories = (userId: string): Category[] => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(`mock_categories_${userId}`);
    if (stored) {
      return JSON.parse(stored);
    }
  }
  return [
    { id: 'routines', name: 'Rutinler', icon: '🏃', color: 'blue', userId },
    { id: 'reading', name: 'Okuma Listesi', icon: '📚', color: 'purple', userId },
  ];
};

export const saveMockCategories = (userId: string, categories: Category[]): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(`mock_categories_${userId}`, JSON.stringify(categories));
  }
};

export const fetchTasksFromSupabase = async (userId: string): Promise<TimelineTask[]> => {
  if (isMockUser(userId)) {
    return getMockTasks(userId);
  }
  
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: true })
      .order('time', { ascending: true });

    if (error) {
      console.error('Error fetching tasks:', error);
      return [];
    }

    return (data || []).map((task: any) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      time: task.time,
      date: task.date,
      completed: task.completed || false,
      category: task.category,
      recurrence: task.recurrence,
      originalDate: task.original_date,
      priority: task.priority,
      icon: task.icon,
    }));
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return [];
  }
};

export const saveTaskToSupabase = async (userId: string, task: TimelineTask): Promise<void> => {
  if (isMockUser(userId)) {
    const tasks = getMockTasks(userId);
    if (task.id) {
      const index = tasks.findIndex((t) => t.id === task.id);
      if (index !== -1) {
        tasks[index] = task;
      } else {
        tasks.push(task);
      }
    } else {
      tasks.push({ ...task, id: Date.now().toString() });
    }
    saveMockTasks(userId, tasks);
    return;
  }

  try {
    if (task.id) {
      const { error } = await supabase
        .from('tasks')
        .update({
          title: task.title,
          description: task.description,
          time: task.time,
          date: task.date,
          completed: task.completed,
          category: task.category,
          recurrence: task.recurrence,
          original_date: task.originalDate,
          priority: task.priority,
          icon: task.icon,
        })
        .eq('id', task.id)
        .eq('user_id', userId);

      if (error) {
        console.error('Error updating task:', error);
      }
    } else {
      const { error } = await supabase
        .from('tasks')
        .insert({
          user_id: userId,
          title: task.title,
          description: task.description,
          time: task.time,
          date: task.date,
          completed: task.completed || false,
          category: task.category,
          recurrence: task.recurrence,
          original_date: task.originalDate,
          priority: task.priority,
          icon: task.icon,
        });

      if (error) {
        console.error('Error creating task:', error);
      }
    }
  } catch (error) {
    console.error('Error saving task:', error);
  }
};

export const deleteTaskFromSupabase = async (userId: string, taskId: string): Promise<void> => {
  if (!taskId) {
    console.error('deleteTaskFromSupabase: taskId is empty');
    return;
  }

  if (isMockUser(userId)) {
    const tasks = getMockTasks(userId);
    const filtered = tasks.filter((t) => t.id !== taskId);
    
    // Güvenlik: en fazla 1 görev silinmeli
    if (tasks.length - filtered.length > 1) {
      console.error('deleteTaskFromSupabase: birden fazla görev silinmeye çalışıldı, iptal ediliyor');
      return;
    }
    
    saveMockTasks(userId, filtered);
    return;
  }

  try {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting task:', error);
    }
  } catch (error) {
    console.error('Error deleting task:', error);
  }
};

export const filterRecurringTasks = (allTasks: TimelineTask[], selectedDate: string): TimelineTask[] => {
  const selectedDayNum = parseInt(selectedDate);
  const selectedDayOfWeek = getDayOfWeek(selectedDayNum);
  
  return allTasks.filter((task) => {
    if (!task.recurrence) {
      return task.date === selectedDate;
    }

    // Hariç tutulan tarihler kontrolü
    if (task.excludedDates && task.excludedDates.includes(selectedDate)) {
      return false;
    }

    // Tekrar bitiş tarihi kontrolü
    if (task.recurrenceEndDate) {
      const endDayNum = parseInt(task.recurrenceEndDate);
      if (selectedDayNum > endDayNum) {
        return false;
      }
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

// Tekrarlı görev için belirli bir tarihi hariç tut
export const excludeDateFromTask = async (userId: string, taskId: string, dateToExclude: string): Promise<void> => {
  if (isMockUser(userId)) {
    const tasks = getMockTasks(userId);
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex !== -1) {
      const task = tasks[taskIndex];
      const excluded = task.excludedDates || [];
      if (!excluded.includes(dateToExclude)) {
        excluded.push(dateToExclude);
      }
      tasks[taskIndex] = { ...task, excludedDates: excluded };
      saveMockTasks(userId, tasks);
    }
    return;
  }

  try {
    // Supabase'den mevcut excluded_dates'i al
    const { data } = await supabase
      .from('tasks')
      .select('excluded_dates')
      .eq('id', taskId)
      .eq('user_id', userId)
      .single();

    const excluded = data?.excluded_dates || [];
    if (!excluded.includes(dateToExclude)) {
      excluded.push(dateToExclude);
    }

    await supabase
      .from('tasks')
      .update({ excluded_dates: excluded })
      .eq('id', taskId)
      .eq('user_id', userId);
  } catch (error) {
    console.error('Error excluding date:', error);
  }
};

// Tekrarlı görevin bitiş tarihini ayarla ("bu ve sonrakileri sil")
export const setRecurrenceEndDate = async (userId: string, taskId: string, endDate: string): Promise<void> => {
  if (isMockUser(userId)) {
    const tasks = getMockTasks(userId);
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex !== -1) {
      tasks[taskIndex] = { ...tasks[taskIndex], recurrenceEndDate: endDate };
      saveMockTasks(userId, tasks);
    }
    return;
  }

  try {
    await supabase
      .from('tasks')
      .update({ recurrence_end_date: endDate })
      .eq('id', taskId)
      .eq('user_id', userId);
  } catch (error) {
    console.error('Error setting recurrence end date:', error);
  }
};

// ============================================
// TAG MANAGEMENT
// ============================================

// Önceden tanımlı popüler tag'ler
export const DEFAULT_TAGS = [
  { id: 'urgent', name: 'Acil', color: 'red' },
  { id: 'important', name: 'Önemli', color: 'orange' },
  { id: 'work', name: 'İş', color: 'blue' },
  { id: 'personal', name: 'Kişisel', color: 'purple' },
  { id: 'home', name: 'Ev', color: 'green' },
  { id: 'shopping', name: 'Alışveriş', color: 'pink' },
  { id: 'health', name: 'Sağlık', color: 'emerald' },
  { id: 'finance', name: 'Finans', color: 'yellow' },
  { id: 'learning', name: 'Öğrenme', color: 'indigo' },
  { id: 'meeting', name: 'Toplantı', color: 'teal' },
];

export function getTagColor(tagName: string): string {
  const tag = DEFAULT_TAGS.find(t => t.name.toLowerCase() === tagName.toLowerCase() || t.id === tagName.toLowerCase());
  return tag?.color || 'gray';
}

export function getTagColorClasses(color: string) {
  const colorMap: Record<string, { bg: string; text: string; border: string }> = {
    red: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
    orange: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' },
    blue: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
    purple: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
    green: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
    pink: { bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-200' },
    emerald: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200' },
    yellow: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200' },
    indigo: { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-200' },
    teal: { bg: 'bg-teal-100', text: 'text-teal-700', border: 'border-teal-200' },
    gray: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' },
  };
  return colorMap[color] || colorMap.gray;
}

// ============================================
// POMODORO ANALYTICS
// ============================================

export interface PomodoroRecord {
  taskId: string;
  taskTitle: string;
  category?: string;
  date: string; // ISO date string
  duration: number; // dakika cinsinden (25 veya 5)
  type: 'work' | 'break';
}

// Pomodoro kaydı ekle
export function savePomodoroRecord(userId: string, record: PomodoroRecord) {
  const key = `pomodoro_records_${userId}`;
  const existing = localStorage.getItem(key);
  const records: PomodoroRecord[] = existing ? JSON.parse(existing) : [];
  records.push(record);
  localStorage.setItem(key, JSON.stringify(records));
}

// Tüm pomodoro kayıtlarını getir
export function getPomodoroRecords(userId: string): PomodoroRecord[] {
  const key = `pomodoro_records_${userId}`;
  const existing = localStorage.getItem(key);
  return existing ? JSON.parse(existing) : [];
}

// Bugünün pomodoro sayısı
export function getTodayPomodoroCount(userId: string): number {
  const records = getPomodoroRecords(userId);
  const today = new Date().toISOString().split('T')[0];
  return records.filter(r => r.date === today && r.type === 'work').length;
}

// Bu haftanın pomodoro sayısı
export function getWeekPomodoroCount(userId: string): number {
  const records = getPomodoroRecords(userId);
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay() + 1); // Pazartesi
  const weekStartStr = weekStart.toISOString().split('T')[0];
  
  return records.filter(r => r.date >= weekStartStr && r.type === 'work').length;
}

// Bu ayın pomodoro sayısı
export function getMonthPomodoroCount(userId: string): number {
  const records = getPomodoroRecords(userId);
  const today = new Date();
  const monthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  
  return records.filter(r => r.date.startsWith(monthStr) && r.type === 'work').length;
}

// Streak hesapla (kaç gün üst üste)
export function getPomodoroStreak(userId: string): number {
  const records = getPomodoroRecords(userId);
  const workRecords = records.filter(r => r.type === 'work');
  
  if (workRecords.length === 0) return 0;
  
  // Günlük benzersiz tarihler
  const uniqueDates = [...new Set(workRecords.map(r => r.date))].sort().reverse();
  
  let streak = 0;
  const today = new Date().toISOString().split('T')[0];
  let currentDate = new Date(today);
  
  for (const date of uniqueDates) {
    const checkDate = currentDate.toISOString().split('T')[0];
    if (date === checkDate) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }
  
  return streak;
}

// Kategori bazlı pomodoro sayısı
export function getCategoryPomodoroCount(userId: string, categoryId: string): number {
  const records = getPomodoroRecords(userId);
  return records.filter(r => r.category === categoryId && r.type === 'work').length;
}

// Toplam çalışma süresi (dakika)
export function getTotalFocusTime(userId: string): number {
  const records = getPomodoroRecords(userId);
  return records.filter(r => r.type === 'work').reduce((sum, r) => sum + r.duration, 0);
}

// Haftalık günlük dağılım (grafik için)
export function getWeeklyPomodoroDistribution(userId: string): { date: string; count: number }[] {
  const records = getPomodoroRecords(userId);
  const today = new Date();
  const weekData: { date: string; count: number }[] = [];
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const count = records.filter(r => r.date === dateStr && r.type === 'work').length;
    weekData.push({ date: dateStr, count });
  }
  
  return weekData;
}
