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
