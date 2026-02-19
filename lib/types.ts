// Type definitions
export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

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
  tags?: string[];
  subtasks?: SubTask[];
  /** Opsiyonel hatırlatma saati (HH:mm). Bildirim tetiklemesi ayrı yapılacak. */
  reminderAt?: string | null;
  /** Aynı gün içinde sıralama (küçük önce). */
  orderIndex?: number | null;
  /** Tamamlanma anı (ISO string); "bu hafta tamamlanan" için kullanılır. */
  completedAt?: string | null;
  /** Ekli dosya adı (tek dosya, küçük limit). */
  attachmentName?: string | null;
  /** Ekli dosya (base64, ~500KB limit). */
  attachmentData?: string | null;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  userId: string;
}

/** Kullanıcı profili – Ayarlar > Profil ekranında düzenlenir. */
export interface UserProfile {
  displayName?: string | null;
  dateOfBirth?: string | null; // YYYY-MM-DD
  gender?: 'female' | 'male' | 'other' | null;
}
