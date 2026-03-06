-- ============================================
-- TODO UYGULAMASI - SUPABASE VERİTABANI ŞEMASI (TEK DOSYA)
-- ============================================
-- Sıfırdan kurulum: Bu dosyanın TAMAMINI kopyala, Supabase Dashboard > SQL Editor'a
-- yapıştır, Run. Tek seferde tüm tablolar, RLS ve trigger oluşur.
--
-- İçerik: tasks (reminder_at_2, daily/weekly/monthly/weekdays), categories,
-- pomodoro_records, profiles, google_calendar_tokens, RLS, updated_at trigger.
--
-- Sonraki güncellemelerde: bu dosyayı silmeyin; yeni migration dosyası ekleyin (007_xxx.sql).

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
  recurrence TEXT CHECK (recurrence IS NULL OR recurrence IN ('daily', 'weekly', 'monthly', 'weekdays')),
  recurrence_end_date TEXT,
  excluded_dates TEXT[] DEFAULT '{}',
  original_date TEXT,
  priority TEXT CHECK (priority IN ('high', 'medium', 'low')),
  icon TEXT CHECK (icon IN ('Laptop', 'Utensils')),
  tags TEXT[] DEFAULT '{}',
  subtasks JSONB DEFAULT '[]',
  reminder_at TEXT,
  reminder_at_2 TEXT,
  reminder_message TEXT,
  countdown_target TEXT,
  order_index INTEGER,
  completed_at TIMESTAMPTZ,
  attachment_name TEXT,
  attachment_data TEXT,
  voice_note TEXT,
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
-- 4. PROFİLLER (profiles) – Ayarlar > Profil
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('female', 'male', 'other')),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_id ON public.profiles(id);

-- --------------------------------------------
-- 5. GOOGLE CALENDAR TOKENS – Takvim bağlantısı (Free: okuma)
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS public.google_calendar_tokens (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  refresh_token TEXT NOT NULL,
  access_token TEXT,
  expires_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_google_calendar_tokens_user_id ON public.google_calendar_tokens(user_id);

-- --------------------------------------------
-- 5b. GÖREV ŞABLONLARI (task_templates) – Free’de kullanılabilir
-- --------------------------------------------
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

-- --------------------------------------------
-- 5c. LİSTE PAYLAŞIMI (list_shares) – Pro
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS public.list_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_list_shares_user_id ON public.list_shares(user_id);
CREATE INDEX IF NOT EXISTS idx_list_shares_token ON public.list_shares(token);

CREATE OR REPLACE FUNCTION public.get_shared_list(p_token TEXT)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user_id UUID; v_category_id TEXT; v_name TEXT; v_tasks JSON;
BEGIN
  SELECT user_id, category_id INTO v_user_id, v_category_id FROM list_shares WHERE token = p_token AND (expires_at IS NULL OR expires_at > now());
  IF v_user_id IS NULL THEN RETURN json_build_object('error', 'not_found'); END IF;
  SELECT name INTO v_name FROM categories WHERE id = v_category_id AND user_id = v_user_id LIMIT 1;
  IF v_name IS NULL THEN v_name := 'Liste'; END IF;
  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) INTO v_tasks FROM (
    SELECT id, title, description, time, date, completed, priority, recurrence FROM tasks WHERE user_id = v_user_id AND category = v_category_id ORDER BY date, time
  ) t;
  RETURN json_build_object('name', v_name, 'tasks', v_tasks);
END; $$;
GRANT EXECUTE ON FUNCTION public.get_shared_list(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_shared_list(TEXT) TO authenticated;

-- --------------------------------------------
-- 6. ROW LEVEL SECURITY (RLS)
-- --------------------------------------------
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pomodoro_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_calendar_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.list_shares ENABLE ROW LEVEL SECURITY;

-- tasks
DROP POLICY IF EXISTS "tasks_select_own" ON public.tasks;
CREATE POLICY "tasks_select_own" ON public.tasks FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "tasks_insert_own" ON public.tasks;
CREATE POLICY "tasks_insert_own" ON public.tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "tasks_update_own" ON public.tasks;
CREATE POLICY "tasks_update_own" ON public.tasks FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "tasks_delete_own" ON public.tasks;
CREATE POLICY "tasks_delete_own" ON public.tasks FOR DELETE USING (auth.uid() = user_id);

-- categories
DROP POLICY IF EXISTS "categories_select_own" ON public.categories;
CREATE POLICY "categories_select_own" ON public.categories FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "categories_insert_own" ON public.categories;
CREATE POLICY "categories_insert_own" ON public.categories FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "categories_update_own" ON public.categories;
CREATE POLICY "categories_update_own" ON public.categories FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "categories_delete_own" ON public.categories;
CREATE POLICY "categories_delete_own" ON public.categories FOR DELETE USING (auth.uid() = user_id);

-- pomodoro_records
DROP POLICY IF EXISTS "pomodoro_select_own" ON public.pomodoro_records;
CREATE POLICY "pomodoro_select_own" ON public.pomodoro_records FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "pomodoro_insert_own" ON public.pomodoro_records;
CREATE POLICY "pomodoro_insert_own" ON public.pomodoro_records FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "pomodoro_delete_own" ON public.pomodoro_records;
CREATE POLICY "pomodoro_delete_own" ON public.pomodoro_records FOR DELETE USING (auth.uid() = user_id);

-- profiles
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- google_calendar_tokens
DROP POLICY IF EXISTS "google_calendar_tokens_select_own" ON public.google_calendar_tokens;
CREATE POLICY "google_calendar_tokens_select_own" ON public.google_calendar_tokens FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "google_calendar_tokens_insert_own" ON public.google_calendar_tokens;
CREATE POLICY "google_calendar_tokens_insert_own" ON public.google_calendar_tokens FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "google_calendar_tokens_update_own" ON public.google_calendar_tokens;
CREATE POLICY "google_calendar_tokens_update_own" ON public.google_calendar_tokens FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "google_calendar_tokens_delete_own" ON public.google_calendar_tokens;
CREATE POLICY "google_calendar_tokens_delete_own" ON public.google_calendar_tokens FOR DELETE USING (auth.uid() = user_id);

-- task_templates
DROP POLICY IF EXISTS "task_templates_select_own" ON public.task_templates;
CREATE POLICY "task_templates_select_own" ON public.task_templates FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "task_templates_insert_own" ON public.task_templates;
CREATE POLICY "task_templates_insert_own" ON public.task_templates FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "task_templates_update_own" ON public.task_templates;
CREATE POLICY "task_templates_update_own" ON public.task_templates FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "task_templates_delete_own" ON public.task_templates;
CREATE POLICY "task_templates_delete_own" ON public.task_templates FOR DELETE USING (auth.uid() = user_id);

-- list_shares
DROP POLICY IF EXISTS "list_shares_select_own" ON public.list_shares;
CREATE POLICY "list_shares_select_own" ON public.list_shares FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "list_shares_insert_own" ON public.list_shares;
CREATE POLICY "list_shares_insert_own" ON public.list_shares FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "list_shares_delete_own" ON public.list_shares;
CREATE POLICY "list_shares_delete_own" ON public.list_shares FOR DELETE USING (auth.uid() = user_id);

-- --------------------------------------------
-- 7. updated_at otomatik güncelleme (tasks)
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
