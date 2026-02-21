-- Pro: Gelişmiş hatırlatıcı (özel mesaj) + Geri sayım hedefi
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS reminder_message TEXT;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS countdown_target TEXT;
