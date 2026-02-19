/** Bildirim ayarları – localStorage anahtarları ve varsayılanlar */

const KEY_ENABLED = 'app_notifications_enabled';
const KEY_DAILY_DIGEST = 'app_daily_digest_enabled';
const KEY_DAILY_DIGEST_TIME = 'app_daily_digest_time';
const KEY_OVERDUE_REMINDER = 'app_overdue_reminder_enabled';
const KEY_OVERDUE_REMINDER_TIME = 'app_overdue_reminder_time';

const DEFAULT_DIGEST_TIME = '08:00';
const DEFAULT_OVERDUE_TIME = '09:00';

export function getNotificationsEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem(KEY_ENABLED) !== 'false';
}

export function setNotificationsEnabled(value: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY_ENABLED, value ? 'true' : 'false');
}

export function getDailyDigestEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(KEY_DAILY_DIGEST) === 'true';
}

export function setDailyDigestEnabled(value: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY_DAILY_DIGEST, value ? 'true' : 'false');
}

export function getDailyDigestTime(): string {
  if (typeof window === 'undefined') return DEFAULT_DIGEST_TIME;
  return localStorage.getItem(KEY_DAILY_DIGEST_TIME) || DEFAULT_DIGEST_TIME;
}

export function setDailyDigestTime(value: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY_DAILY_DIGEST_TIME, value || DEFAULT_DIGEST_TIME);
}

export function getOverdueReminderEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(KEY_OVERDUE_REMINDER) === 'true';
}

export function setOverdueReminderEnabled(value: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY_OVERDUE_REMINDER, value ? 'true' : 'false');
}

export function getOverdueReminderTime(): string {
  if (typeof window === 'undefined') return DEFAULT_OVERDUE_TIME;
  return localStorage.getItem(KEY_OVERDUE_REMINDER_TIME) || DEFAULT_OVERDUE_TIME;
}

export function setOverdueReminderTime(value: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY_OVERDUE_REMINDER_TIME, value || DEFAULT_OVERDUE_TIME);
}

export const LAST_DAILY_DIGEST_PREFIX = 'last_daily_digest_';
export const LAST_OVERDUE_REMINDER_PREFIX = 'last_overdue_reminder_';
