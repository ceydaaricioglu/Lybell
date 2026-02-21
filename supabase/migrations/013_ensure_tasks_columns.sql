-- Eksik tasks sütunlarını ekle (reminder_at_2, sync_to_google, google_event_id vb.)
-- "Could not find the 'reminder_at_2' column" hatası alıyorsan bu dosyayı Supabase SQL Editor'da çalıştır.

ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS reminder_at_2 TEXT;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS reminder_message TEXT;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS countdown_target TEXT;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS sync_to_google BOOLEAN DEFAULT false;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS google_event_id TEXT;
