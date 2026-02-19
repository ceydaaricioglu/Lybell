-- ============================================
-- Mevcut projeye ek kolonlar (001 daha önce çalıştırıldıysa)
-- ============================================
-- 001'i zaten çalıştırdıysan bu dosyayı SQL Editor'da çalıştır.
-- Yeni kurulum yapıyorsan sadece 001 yeterli (içinde bu kolonlar var).

ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS reminder_at TEXT;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS order_index INTEGER;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS attachment_name TEXT;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS attachment_data TEXT;
