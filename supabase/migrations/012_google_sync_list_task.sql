-- Pro: Liste bazlı "Google Takvim'e aktar" + görev bazlı "Google'da görünsün"
-- Kategoriler (liste) için: sync_to_google (bu liste açıksa görevler aktarılabilir)
-- Görevler için: sync_to_google (bu görev aktarılsın mı), google_event_id (güncelleme/silme için)

ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS sync_to_google BOOLEAN DEFAULT false;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS sync_to_google BOOLEAN DEFAULT false;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS google_event_id TEXT;
