-- Notlar (global) + Klasörler
-- Table design hedef: Mobilde sesli notu (şimdilik transcript/content) kaydedip daha sonra audio_url eklemek.

-- --------------------------------------------
-- 1) KLASÖRLER (note_folders)
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS public.note_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_note_folders_user_id ON public.note_folders(user_id);

-- --------------------------------------------
-- 2) NOTLAR (notes)
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES public.note_folders(id) ON DELETE SET NULL,

  title TEXT,
  content TEXT,

  -- Ses kaydı (gelecek adım) - şimdilik placeholder
  audio_url TEXT,

  -- Sesin yazıya dökülmüş hali (mobilde ses→yazı yapılınca dolduracağız)
  transcript TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notes_user_id ON public.notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_user_folder_id ON public.notes(user_id, folder_id);
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON public.notes(created_at);

-- updated_at trigger (tasks tarafındaki set_updated_at() fonksiyonunu kullanıyoruz)
DROP TRIGGER IF EXISTS notes_updated_at ON public.notes;
CREATE TRIGGER notes_updated_at
  BEFORE UPDATE ON public.notes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- --------------------------------------------
-- 3) RLS
-- --------------------------------------------
ALTER TABLE public.note_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- note_folders policies
DROP POLICY IF EXISTS "note_folders_select_own" ON public.note_folders;
CREATE POLICY "note_folders_select_own" ON public.note_folders
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "note_folders_insert_own" ON public.note_folders;
CREATE POLICY "note_folders_insert_own" ON public.note_folders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "note_folders_update_own" ON public.note_folders;
CREATE POLICY "note_folders_update_own" ON public.note_folders
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "note_folders_delete_own" ON public.note_folders;
CREATE POLICY "note_folders_delete_own" ON public.note_folders
  FOR DELETE USING (auth.uid() = user_id);

-- notes policies
DROP POLICY IF EXISTS "notes_select_own" ON public.notes;
CREATE POLICY "notes_select_own" ON public.notes
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notes_insert_own" ON public.notes;
CREATE POLICY "notes_insert_own" ON public.notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "notes_update_own" ON public.notes;
CREATE POLICY "notes_update_own" ON public.notes
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notes_delete_own" ON public.notes;
CREATE POLICY "notes_delete_own" ON public.notes
  FOR DELETE USING (auth.uid() = user_id);

