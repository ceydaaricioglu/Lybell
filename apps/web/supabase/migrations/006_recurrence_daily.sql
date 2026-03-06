-- Free: günlük/haftalık/aylık tekrarlar. Pro: + "Sadece hafta içi" (weekdays).
-- Mevcut DB'de recurrence CHECK constraint'ine 'daily' eklenir.
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_recurrence_check;
ALTER TABLE public.tasks ADD CONSTRAINT tasks_recurrence_check
  CHECK (recurrence IS NULL OR recurrence IN ('daily', 'weekly', 'monthly', 'weekdays'));
