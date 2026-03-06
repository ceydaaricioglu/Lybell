-- Görev şablonları (Free’de kullanılabilir). 000_full_schema ile sıfırdan kurulumda zaten var.
-- Bu dosyayı yalnızca 000’ı şablonsuz çalıştırdıysan çalıştır.
--
-- Çalıştırmak için:
-- 1. https://supabase.com/dashboard adresine git
-- 2. Projeni seç → sol menüden SQL Editor → New query
-- 3. Bu dosyanın (007_task_templates.sql) tüm içeriğini yapıştır → Run

CREATE TABLE IF NOT EXISTS public.task_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  time TEXT NOT NULL DEFAULT '08:00',
  category TEXT,
  recurrence TEXT CHECK (recurrence IS NULL OR recurrence IN ('daily', 'weekly', 'monthly', 'weekdays')),
  priority TEXT CHECK (priority IS NULL OR priority IN ('high', 'medium', 'low')),
  tags TEXT[] DEFAULT '{}',
  subtasks JSONB DEFAULT '[]',
  reminder_at TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_task_templates_user_id ON public.task_templates(user_id);
ALTER TABLE public.task_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "task_templates_select_own" ON public.task_templates;
CREATE POLICY "task_templates_select_own" ON public.task_templates FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "task_templates_insert_own" ON public.task_templates;
CREATE POLICY "task_templates_insert_own" ON public.task_templates FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "task_templates_update_own" ON public.task_templates;
CREATE POLICY "task_templates_update_own" ON public.task_templates FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "task_templates_delete_own" ON public.task_templates;
CREATE POLICY "task_templates_delete_own" ON public.task_templates FOR DELETE USING (auth.uid() = user_id);
