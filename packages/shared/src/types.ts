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
  recurrence?: 'daily' | 'weekly' | 'monthly' | 'weekdays' | null;
  recurrenceEndDate?: string;
  excludedDates?: string[];
  originalDate?: string;
  category?: 'routines' | 'reading' | string | null;
  priority?: 'high' | 'medium' | 'low' | null;
  tags?: string[];
  subtasks?: SubTask[];
  /** Opsiyonel hatırlatma saati (HH:mm). Free: 1, Pro: 2. */
  reminderAt?: string | null;
  reminderAt2?: string | null;
  /** Pro: Bildirimde gösterilecek özel mesaj. */
  reminderMessage?: string | null;
  /** Pro: Geri sayım hedefi (YYYY-MM-DD veya YYYY-MM-DDTHH:mm). */
  countdownTarget?: string | null;
  /** Aynı gün içinde sıralama (küçük önce). */
  orderIndex?: number | null;
  /** Tamamlanma anı (ISO string); "bu hafta tamamlanan" için kullanılır. */
  completedAt?: string | null;
  /** Ekli dosya adı (tek dosya, küçük limit). */
  attachmentName?: string | null;
  /** Ekli dosya (base64, ~500KB limit). */
  attachmentData?: string | null;
  /** Pro: Ses notu (data URL veya boş). */
  voiceNote?: string | null;
  /** Pro: Bu görev Google Takvim'de görünsün mü (sadece kategori syncToGoogle açıksa anlamlı). */
  syncToGoogle?: boolean | null;
  /** Google Calendar event id (güncelleme/silme için; senkron açıkken doldurulur). */
  googleEventId?: string | null;
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
  /** Pro: Bu listenin görevleri Google Takvim'e aktarılabilsin mi (liste bazlı anahtar). */
  syncToGoogle?: boolean;
}

/** Görev şablonu – tarih ve tamamlanma yok; Free’de kullanılabilir. */
export interface TaskTemplate {
  id: string;
  name: string;
  title: string;
  description?: string;
  time: string;
  category?: string | null;
  recurrence?: TimelineTask['recurrence'];
  priority?: TimelineTask['priority'];
  tags?: string[];
  subtasks?: SubTask[];
  reminderAt?: string | null;
}

/** Kullanıcı profili – Ayarlar > Profil ekranında düzenlenir. */
export interface UserProfile {
  displayName?: string | null;
  dateOfBirth?: string | null; // YYYY-MM-DD
  gender?: 'female' | 'male' | 'other' | null;
}
