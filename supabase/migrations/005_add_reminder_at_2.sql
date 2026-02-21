-- Pro: görev başına 2. hatırlatma (Free: 1, Pro: 2).
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS reminder_at_2 TEXT;
