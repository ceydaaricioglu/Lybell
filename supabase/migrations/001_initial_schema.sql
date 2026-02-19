-- ============================================
-- TODO UYGULAMASI - SUPABASE VERİTABANI ŞEMASI
-- ============================================
-- Bu dosyayı Supabase Dashboard > SQL Editor'da çalıştır.
-- Her tablo gerçek kullanıcılar (Supabase Auth) için user_id ile izole edilir.

-- --------------------------------------------
-- 1. GÖREVLER (tasks)
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  time TEXT NOT NULL,
  date TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  category TEXT,
  recurrence TEXT CHECK (recurrence IN ('weekly', 'monthly', 'weekdays')),
  recurrence_end_date TEXT,
  excluded_dates TEXT[] DEFAULT '{}',
  original_date TEXT,
  priority TEXT CHECK (priority IN ('high', 'medium', 'low')),
  icon TEXT CHECK (icon IN ('Laptop', 'Utensils')),
  tags TEXT[] DEFAULT '{}',
  subtasks JSONB DEFAULT '[]',
  reminder_at TEXT,
  order_index INTEGER,
  completed_at TIMESTAMPTZ,
  attachment_name TEXT,
  attachment_data TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_date ON public.tasks(date);
CREATE INDEX IF NOT EXISTS idx_tasks_user_date ON public.tasks(user_id, date);

-- --------------------------------------------
-- 2. KATEGORİLER (categories)
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_categories_user_id ON public.categories(user_id);

-- --------------------------------------------
-- 3. POMODORO KAYITLARI (pomodoro_records)
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS public.pomodoro_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id TEXT,
  task_title TEXT,
  category TEXT,
  date TEXT NOT NULL,
  duration INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('work', 'break')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pomodoro_user_id ON public.pomodoro_records(user_id);
CREATE INDEX IF NOT EXISTS idx_pomodoro_date ON public.pomodoro_records(date);

-- --------------------------------------------
-- 4. ROW LEVEL SECURITY (RLS)
-- Her kullanıcı sadece kendi verilerini görür/düzenler.
-- --------------------------------------------
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pomodoro_records ENABLE ROW LEVEL SECURITY;

-- tasks: sadece kendi satırları
DROP POLICY IF EXISTS "tasks_select_own" ON public.tasks;
CREATE POLICY "tasks_select_own" ON public.tasks FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "tasks_insert_own" ON public.tasks;
CREATE POLICY "tasks_insert_own" ON public.tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "tasks_update_own" ON public.tasks;
CREATE POLICY "tasks_update_own" ON public.tasks FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "tasks_delete_own" ON public.tasks;
CREATE POLICY "tasks_delete_own" ON public.tasks FOR DELETE USING (auth.uid() = user_id);

-- categories: sadece kendi satırları
DROP POLICY IF EXISTS "categories_select_own" ON public.categories;
CREATE POLICY "categories_select_own" ON public.categories FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "categories_insert_own" ON public.categories;
CREATE POLICY "categories_insert_own" ON public.categories FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "categories_update_own" ON public.categories;
CREATE POLICY "categories_update_own" ON public.categories FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "categories_delete_own" ON public.categories;
CREATE POLICY "categories_delete_own" ON public.categories FOR DELETE USING (auth.uid() = user_id);

-- pomodoro_records: sadece kendi satırları
DROP POLICY IF EXISTS "pomodoro_select_own" ON public.pomodoro_records;
CREATE POLICY "pomodoro_select_own" ON public.pomodoro_records FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "pomodoro_insert_own" ON public.pomodoro_records;
CREATE POLICY "pomodoro_insert_own" ON public.pomodoro_records FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "pomodoro_delete_own" ON public.pomodoro_records;
CREATE POLICY "pomodoro_delete_own" ON public.pomodoro_records FOR DELETE USING (auth.uid() = user_id);

-- --------------------------------------------
-- 5. updated_at otomatik güncelleme (tasks)
-- --------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tasks_updated_at ON public.tasks;
CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
