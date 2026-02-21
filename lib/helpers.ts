import { TimelineTask, Category, UserProfile, TaskTemplate } from './types';
import { supabase } from './supabaseClient';
import { taskToStartEnd } from './googleCalendar';

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

/** Geri sayım hedefi (YYYY-MM-DD veya YYYY-MM-DDTHH:mm) için "X gün kaldı" / "Bugün!" / "X gün geçti" metni. */
export function getCountdownLabel(countdownTarget: string | null | undefined): string | null {
  if (!countdownTarget?.trim()) return null;
  const target = new Date(countdownTarget);
  if (Number.isNaN(target.getTime())) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  const diffMs = target.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Bugün!';
  if (diffDays === 1) return '1 gün kaldı';
  if (diffDays > 1 && diffDays <= 365) return `${diffDays} gün kaldı`;
  if (diffDays === -1) return '1 gün geçti';
  if (diffDays < -1) return `${Math.abs(diffDays)} gün geçti`;
  return `${diffDays} gün kaldı`;
}

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

const MOCK_TEMPLATES_KEY = (userId: string) => `mock_templates_${userId}`;

export const getMockTemplates = (userId: string): TaskTemplate[] => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(MOCK_TEMPLATES_KEY(userId));
    return stored ? JSON.parse(stored) : [];
  }
  return [];
};

export const saveMockTemplate = (userId: string, template: TaskTemplate): void => {
  if (typeof window !== 'undefined') {
    const list = getMockTemplates(userId);
    const idx = list.findIndex((t) => t.id === template.id);
    if (idx >= 0) list[idx] = template;
    else list.push(template);
    localStorage.setItem(MOCK_TEMPLATES_KEY(userId), JSON.stringify(list));
  }
};

export const deleteMockTemplate = (userId: string, templateId: string): void => {
  if (typeof window !== 'undefined') {
    const list = getMockTemplates(userId).filter((t) => t.id !== templateId);
    localStorage.setItem(MOCK_TEMPLATES_KEY(userId), JSON.stringify(list));
  }
};

export const fetchTemplates = async (userId: string): Promise<TaskTemplate[]> => {
  if (isMockUser(userId)) {
    return getMockTemplates(userId);
  }
  try {
    const { data, error } = await supabase
      .from('task_templates')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching templates:', error);
      return [];
    }
    return (data || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      title: row.title,
      description: row.description ?? undefined,
      time: row.time || '08:00',
      category: row.category ?? null,
      recurrence: row.recurrence ?? null,
      priority: row.priority ?? null,
      tags: row.tags || [],
      subtasks: row.subtasks || [],
      reminderAt: row.reminder_at ?? undefined,
    }));
  } catch (e) {
    console.error('Error fetching templates:', e);
    return [];
  }
};

export const saveTemplateToSupabase = async (userId: string, template: TaskTemplate): Promise<void> => {
  if (isMockUser(userId)) {
    saveMockTemplate(userId, template);
    return;
  }
  try {
    const row = {
      user_id: userId,
      name: template.name,
      title: template.title,
      description: template.description ?? null,
      time: template.time,
      category: template.category ?? null,
      recurrence: template.recurrence ?? null,
      priority: template.priority ?? null,
      tags: template.tags || [],
      subtasks: template.subtasks || [],
      reminder_at: template.reminderAt ?? null,
    };
    if (template.id && template.id.length === 36) {
      await supabase.from('task_templates').update(row).eq('id', template.id).eq('user_id', userId);
    } else {
      const { data } = await supabase.from('task_templates').insert({ ...row, id: undefined }).select('id').single();
      if (data?.id) (template as { id: string }).id = data.id;
    }
  } catch (e) {
    console.error('Error saving template:', e);
  }
};

export const deleteTemplateFromSupabase = async (userId: string, templateId: string): Promise<void> => {
  if (isMockUser(userId)) {
    deleteMockTemplate(userId, templateId);
    return;
  }
  try {
    await supabase.from('task_templates').delete().eq('id', templateId).eq('user_id', userId);
  } catch (e) {
    console.error('Error deleting template:', e);
  }
};

/** Liste paylaşımı (Pro): paylaşım linki oluşturur, token döner. Mock kullanıcıda null. */
export const createListShare = async (userId: string, categoryId: string): Promise<string | null> => {
  if (isMockUser(userId)) return null;
  try {
    const token = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `share-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const { error } = await supabase.from('list_shares').insert({ user_id: userId, category_id: categoryId, token });
    if (error) {
      console.error('Error creating list share:', error);
      return null;
    }
    return token;
  } catch (e) {
    console.error('Error creating list share:', e);
    return null;
  }
};

export interface SharedListResult {
  name: string;
  tasks: { id: string; title: string; description?: string; time: string; date: string; completed: boolean; priority?: string; recurrence?: string }[];
}

/** Paylaşım linki ile listeyi getirir (giriş gerekmez). */
export const getSharedList = async (token: string): Promise<SharedListResult | { error: string }> => {
  try {
    const { data, error } = await supabase.rpc('get_shared_list', { p_token: token });
    if (error) {
      console.error('Error fetching shared list:', error);
      return { error: 'not_found' };
    }
    if (data?.error) return { error: data.error };
    return data as SharedListResult;
  } catch (e) {
    console.error('Error fetching shared list:', e);
    return { error: 'not_found' };
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
      reminderAt: task.reminder_at ?? undefined,
      reminderAt2: task.reminder_at_2 ?? undefined,
      reminderMessage: task.reminder_message ?? undefined,
      countdownTarget: task.countdown_target ?? undefined,
      orderIndex: task.order_index ?? undefined,
      completedAt: task.completed_at ?? undefined,
      attachmentName: task.attachment_name ?? undefined,
      attachmentData: task.attachment_data ?? undefined,
      voiceNote: task.voice_note ?? undefined,
      syncToGoogle: task.sync_to_google ?? undefined,
      googleEventId: task.google_event_id ?? undefined,
    }));
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return [];
  }
};

/** Kaydettikten sonra görevin id'sini döndürür (insert'te Supabase UUID). */
export const saveTaskToSupabase = async (userId: string, task: TimelineTask): Promise<string | null> => {
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
      const newId = Date.now().toString();
      tasks.push({ ...task, id: newId });
    }
    saveMockTasks(userId, tasks);
    return task.id || null;
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
          reminder_at: task.reminderAt ?? null,
          reminder_at_2: task.reminderAt2 ?? null,
          reminder_message: task.reminderMessage ?? null,
          countdown_target: task.countdownTarget ?? null,
          order_index: task.orderIndex ?? null,
          completed_at: task.completedAt ?? null,
          attachment_name: task.attachmentName ?? null,
          attachment_data: task.attachmentData ?? null,
          voice_note: task.voiceNote ?? null,
          sync_to_google: task.syncToGoogle ?? null,
          google_event_id: task.googleEventId ?? null,
        })
        .eq('id', task.id)
        .eq('user_id', userId);

      if (error) {
        console.error('Error updating task:', error.message || error.code || error);
        return null;
      }
      return task.id;
    } else {
      const { data: inserted, error } = await supabase
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
          reminder_at: task.reminderAt ?? null,
          reminder_at_2: task.reminderAt2 ?? null,
          reminder_message: task.reminderMessage ?? null,
          countdown_target: task.countdownTarget ?? null,
          order_index: task.orderIndex ?? null,
          completed_at: task.completedAt ?? null,
          attachment_name: task.attachmentName ?? null,
          attachment_data: task.attachmentData ?? null,
          voice_note: task.voiceNote ?? null,
          sync_to_google: task.syncToGoogle ?? null,
          google_event_id: task.googleEventId ?? null,
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error creating task:', error.message || error.code || error);
        return null;
      }
      return inserted?.id ?? null;
    }
  } catch (error) {
    console.error('Error saving task:', error);
    return null;
  }
};

/** Pro: Görevi Google Takvim'de oluştur / güncelle / sil. */
export const syncTaskToGoogleCalendar = async (
  userId: string,
  task: TimelineTask,
  action: 'create' | 'update' | 'delete',
  savedTaskId?: string | null
): Promise<boolean> => {
  if (isMockUser(userId)) return false;
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gtwugoklzczszvueacxm.supabase.co') + '/functions/v1/google-calendar-sync-task';
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) return false;
  const taskId = action === 'create' ? (savedTaskId || task.id) : task.id;
  if (!taskId) return false;

  let body: Record<string, unknown>;
  if (action === 'delete') {
    body = { action: 'delete', taskId, googleEventId: task.googleEventId || null };
  } else {
    const { startDateTime, endDateTime } = taskToStartEnd(task);
    body = {
      action,
      taskId,
      title: task.title,
      startDateTime,
      endDateTime,
      description: task.description || '',
      googleEventId: task.googleEventId || null,
    };
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(body),
  }).catch(() => null);
  if (!res) return false;
  const data = await res.json().catch(() => ({})) as { ok?: boolean };
  return !!data.ok;
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
      case 'daily':
        return true;
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

// Bu hafta tamamlanan görev sayısı (completedAt bu hafta olanlar)
export async function getWeekCompletedCount(userId: string): Promise<number> {
  const tasks = isMockUser(userId) ? getMockTasks(userId) : await fetchTasksFromSupabase(userId);
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay() + 1);
  weekStart.setHours(0, 0, 0, 0);
  const weekStartStr = weekStart.toISOString();
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const weekEndStr = weekEnd.toISOString();
  return tasks.filter((t: TimelineTask) => t.completed && t.completedAt && t.completedAt >= weekStartStr && t.completedAt < weekEndStr).length;
}

// My Day (Bugün Odakta) – günlük sıfırlanan görev ID listesi. Tarih YYYY-MM-DD.
export function getMyDayTaskIds(userId: string): string[] {
  if (typeof window === 'undefined') return [];
  const today = new Date().toISOString().split('T')[0];
  const key = `myDay_${userId}_${today}`;
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : [];
}

export function setMyDayTaskIds(userId: string, taskIds: string[]): void {
  if (typeof window === 'undefined') return;
  const today = new Date().toISOString().split('T')[0];
  const key = `myDay_${userId}_${today}`;
  localStorage.setItem(key, JSON.stringify(taskIds));
}

export function toggleMyDayTask(userId: string, taskId: string): boolean {
  const ids = getMyDayTaskIds(userId);
  const i = ids.indexOf(taskId);
  if (i >= 0) {
    ids.splice(i, 1);
    setMyDayTaskIds(userId, ids);
    return false;
  }
  ids.push(taskId);
  setMyDayTaskIds(userId, ids);
  return true;
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

// Profil (display name, doğum tarihi, cinsiyet) – mock: localStorage; gerçek: Supabase profiles
export async function getProfile(userId: string): Promise<UserProfile> {
  if (isMockUser(userId)) {
    if (typeof window === 'undefined') return {};
    const raw = localStorage.getItem(`profile_${userId}`);
    return raw ? JSON.parse(raw) : {};
  }
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('display_name, date_of_birth, gender')
      .eq('id', userId)
      .maybeSingle();
    if (error) return {};
    if (!data) return {};
    return {
      displayName: data.display_name ?? null,
      dateOfBirth: data.date_of_birth ?? null,
      gender: (data.gender as UserProfile['gender']) ?? null,
    };
  } catch {
    return {};
  }
}

export async function saveProfile(userId: string, profile: UserProfile): Promise<void> {
  if (isMockUser(userId)) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(`profile_${userId}`, JSON.stringify(profile));
    return;
  }
  try {
    await supabase.from('profiles').upsert({
      id: userId,
      display_name: profile.displayName ?? null,
      date_of_birth: profile.dateOfBirth ?? null,
      gender: profile.gender ?? null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });
  } catch {
    // ignore
  }
}
