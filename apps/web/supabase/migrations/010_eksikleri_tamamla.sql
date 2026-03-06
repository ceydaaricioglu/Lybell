-- ============================================
-- MEVCUT ŞEMANI GÜNCELLEMEK İÇİN TEK DOSYA
-- ============================================
-- Senin Supabase'te zaten var: tasks, categories, pomodoro_records, profiles,
-- google_calendar_tokens, RLS, trigger + 007 ile task_templates.
--
-- Bu dosya SADECE eksikleri ekler:
--   1) tasks tablosuna: reminder_message, countdown_target (Pro özellikleri)
--   2) list_shares tablosu + get_shared_list fonksiyonu (liste paylaşımı)
--
-- Nasıl çalıştırılır:
--   1. https://supabase.com/dashboard → projeni seç → SQL Editor → New query
--   2. Bu dosyanın TAMAMINI kopyala, yapıştır, Run
-- ============================================

-- 1) Görevlere Pro alanları (gelişmiş hatırlatıcı + geri sayım)
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS reminder_message TEXT;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS countdown_target TEXT;

-- 2) Liste paylaşımı (Pro): link ile kategori paylaşma
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

ALTER TABLE public.list_shares ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "list_shares_select_own" ON public.list_shares;
CREATE POLICY "list_shares_select_own" ON public.list_shares FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "list_shares_insert_own" ON public.list_shares;
CREATE POLICY "list_shares_insert_own" ON public.list_shares FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "list_shares_delete_own" ON public.list_shares;
CREATE POLICY "list_shares_delete_own" ON public.list_shares FOR DELETE USING (auth.uid() = user_id);

-- Paylaşım linki açıldığında (giriş yapmadan) listeyi döndüren fonksiyon
CREATE OR REPLACE FUNCTION public.get_shared_list(p_token TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_category_id TEXT;
  v_name TEXT;
  v_tasks JSON;
BEGIN
  SELECT user_id, category_id INTO v_user_id, v_category_id
  FROM list_shares
  WHERE token = p_token AND (expires_at IS NULL OR expires_at > now());
  IF v_user_id IS NULL THEN
    RETURN json_build_object('error', 'not_found');
  END IF;
  SELECT name INTO v_name FROM categories WHERE id = v_category_id AND user_id = v_user_id LIMIT 1;
  IF v_name IS NULL THEN
    v_name := 'Liste';
  END IF;
  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) INTO v_tasks
  FROM (
    SELECT id, title, description, time, date, completed, priority, recurrence
    FROM tasks
    WHERE user_id = v_user_id AND category = v_category_id
    ORDER BY date, time
  ) t;
  RETURN json_build_object('name', v_name, 'tasks', v_tasks);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_shared_list(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_shared_list(TEXT) TO authenticated;
