/**
 * Google Calendar (Free: okuma) – OAuth URL ve etkinlik çekme.
 * Pro'da çift yön eklenebilir.
 */

export interface GoogleCalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  date: string;   // day of month "1".."31"
  time: string;   // "HH:mm" or ""
  source: 'google';
}

export interface GoogleCalendarEventsResponse {
  connected: boolean;
  events: GoogleCalendarEvent[];
}

/** Google OAuth URL – redirect_uri = Supabase Edge Function callback. */
export function getGoogleCalendarAuthUrl(userId: string): string {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const callbackUrl = process.env.NEXT_PUBLIC_GOOGLE_CALLBACK_URL;
  if (!clientId || !callbackUrl) return '';
  const scope = encodeURIComponent('https://www.googleapis.com/auth/calendar.events');
  const state = encodeURIComponent(userId);
  const redirectUri = encodeURIComponent(callbackUrl);
  return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&state=${state}&access_type=offline&prompt=consent`;
}

/** Takvim görünümü için ay başı/sonu (ISO). */
export function getMonthRange(year: number, month: number): { timeMin: string; timeMax: string } {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0, 23, 59, 59);
  return {
    timeMin: start.toISOString(),
    timeMax: end.toISOString(),
  };
}

/** Görev tarih+saatinden ISO start/end (Pro – Google sync). */
export function taskToStartEnd(task: { date: string; time?: string | null }): { startDateTime: string; endDateTime: string } {
  const time = (task.time || '09:00').trim();
  const [hh, mm] = time.split(':').map((x) => parseInt(x, 10) || 0);
  let year: number, month: number, day: number;
  if (task.date.length >= 10) {
    const [y, m, d] = task.date.split('-').map((x) => parseInt(x, 10));
    year = y;
    month = (m || 1) - 1;
    day = d || 1;
  } else {
    const d = new Date();
    year = d.getFullYear();
    month = d.getMonth();
    day = parseInt(task.date, 10) || 1;
  }
  const start = new Date(year, month, day, hh, mm, 0);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  return {
    startDateTime: start.toISOString(),
    endDateTime: end.toISOString(),
  };
}
