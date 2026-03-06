/** Bildirim ayarları – localStorage anahtarları ve varsayılanlar */

const KEY_ENABLED = 'app_notifications_enabled';
const KEY_DAILY_DIGEST = 'app_daily_digest_enabled';
const KEY_DAILY_DIGEST_TIME = 'app_daily_digest_time';
const KEY_OVERDUE_REMINDER = 'app_overdue_reminder_enabled';
const KEY_OVERDUE_REMINDER_TIME = 'app_overdue_reminder_time';
const KEY_NOTIFICATION_SOUND = 'app_notification_sound';

const DEFAULT_DIGEST_TIME = '08:00';
export type NotificationSound = 'default' | 'silent' | 'chime' | 'bell' | 'gentle';

const VALID_SOUNDS: NotificationSound[] = ['default', 'silent', 'chime', 'bell', 'gentle'];

export function getNotificationSound(): NotificationSound {
  if (typeof window === 'undefined') return 'default';
  const v = localStorage.getItem(KEY_NOTIFICATION_SOUND) as NotificationSound | null;
  return v && VALID_SOUNDS.includes(v) ? v : 'default';
}

export function setNotificationSound(value: NotificationSound): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY_NOTIFICATION_SOUND, value);
}

/** Seçilen zil sesini çalar (Pro: chime, bell, gentle). */
export function playNotificationSound(sound: NotificationSound): void {
  if (typeof window === 'undefined' || sound === 'silent') return;
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.value = 0.15;
    if (sound === 'default') {
      osc.frequency.value = 880;
      osc.type = 'sine';
      gain.gain.setTargetAtTime(0, ctx.currentTime + 0.12, 0.02);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.12);
    } else if (sound === 'chime') {
      osc.frequency.value = 523;
      osc.type = 'sine';
      gain.gain.setTargetAtTime(0, ctx.currentTime + 0.2, 0.03);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.2);
    } else if (sound === 'bell') {
      osc.frequency.value = 784;
      osc.type = 'triangle';
      gain.gain.setTargetAtTime(0, ctx.currentTime + 0.25, 0.04);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.25);
    } else if (sound === 'gentle') {
      osc.frequency.value = 392;
      osc.type = 'sine';
      gain.gain.setTargetAtTime(0, ctx.currentTime + 0.18, 0.03);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.18);
    }
  } catch (_) {}
}
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

/** Tarayıcı bildirim izni ister. */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const permission = await Notification.requestPermission();
  return permission === 'granted';
}
