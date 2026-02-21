-- Google Calendar OAuth tokens (Free: okuma; Pro'da çift yön eklenebilir).
-- Her kullanıcı en fazla bir satır (refresh_token ile yenileme).

CREATE TABLE IF NOT EXISTS public.google_calendar_tokens (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  refresh_token TEXT NOT NULL,
  access_token TEXT,
  expires_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_google_calendar_tokens_user_id ON public.google_calendar_tokens(user_id);

ALTER TABLE public.google_calendar_tokens ENABLE ROW LEVEL SECURITY;

-- Sadece kendi satırını görebilir / güncelleyebilir (Edge Function service_role ile yazar)
DROP POLICY IF EXISTS "google_calendar_tokens_select_own" ON public.google_calendar_tokens;
CREATE POLICY "google_calendar_tokens_select_own" ON public.google_calendar_tokens
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "google_calendar_tokens_insert_own" ON public.google_calendar_tokens;
CREATE POLICY "google_calendar_tokens_insert_own" ON public.google_calendar_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "google_calendar_tokens_update_own" ON public.google_calendar_tokens;
CREATE POLICY "google_calendar_tokens_update_own" ON public.google_calendar_tokens
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "google_calendar_tokens_delete_own" ON public.google_calendar_tokens;
CREATE POLICY "google_calendar_tokens_delete_own" ON public.google_calendar_tokens
  FOR DELETE USING (auth.uid() = user_id);
