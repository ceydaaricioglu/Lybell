# Supabase migrations

## İlk kurulum (henüz hiç SQL çalıştırmadıysan)

**Tek dosya:** `000_full_schema.sql`  
→ Supabase Dashboard > SQL Editor'da bu dosyanın **tamamını** kopyala, yapıştır, Run.

Bu dosya şunları içerir: tasks, categories, pomodoro_records, profiles, google_calendar_tokens, task_templates, tüm RLS, trigger.

---

## Sonraki güncellemeler (yeni tablo / yeni kolon eklerken)

- **Eski migration dosyasını silip yerine yenisini koyma.**
- **Yeni bir dosya ekle:** örn. `005_yeni_ozellik.sql`  
  İçinde sadece **yeni** olan kısım olsun (yeni tablo veya `ALTER TABLE ... ADD COLUMN`).
- Bu yeni dosyayı **ayrıca** SQL Editor'da çalıştır.

Örnek: ileride "notifications" tablosu eklenecekse → `005_notifications.sql` oluştur, sadece o tabloyu yaz, çalıştır.

---

## 007 – Görev şablonları (task_templates)

000'ı **şablonsuz** çalıştırdıysan şablonlar tablosunu eklemek için:

1. **Supabase SQL Editor:** [https://supabase.com/dashboard](https://supabase.com/dashboard) → projeni seç → sol menü **SQL Editor** → **New query**
2. **Dosya:** `supabase/migrations/007_task_templates.sql` — içeriğini kopyala, SQL Editor'a yapıştır, **Run** ile çalıştır.
