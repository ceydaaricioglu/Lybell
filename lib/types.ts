// Type definitions
export interface TimelineTask {
  id?: string;
  time: string;
  title: string;
  description?: string;
  date: string;
  icon?: 'Laptop' | 'Utensils';
  completed: boolean;
  recurrence?: 'weekly' | 'monthly' | 'weekdays' | null;
  recurrenceEndDate?: string;
  excludedDates?: string[];
  originalDate?: string;
  category?: 'routines' | 'reading' | string | null;
  priority?: 'high' | 'medium' | 'low' | null;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  userId: string;
}
