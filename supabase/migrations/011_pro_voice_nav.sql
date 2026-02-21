-- ============================================
-- Pro: Sesle not (6) – tek SQL, çalıştır ve bitir
-- ============================================
-- Supabase Dashboard > SQL Editor > New query > bu dosyayı yapıştır > Run
--
-- Eklenen: tasks.voice_note (ses kaydı data URL veya boş)
-- 8, 11, 12 için veritabanı değişikliği yok (localStorage / UI).

ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS voice_note TEXT;
