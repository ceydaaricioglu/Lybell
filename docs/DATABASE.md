# Veritabanı Kurulumu (Supabase)

Proje **Supabase** kullanıyor. Supabase, PostgreSQL tabanlı bir Backend-as-a-Service; yani hem veritabanı hem Auth hem de API’yi sunuyor.

---

## Nasıl ilerleniyor? (Özet)

1. **Supabase projesi** – Zaten `lib/supabaseClient.ts` içinde URL ve anon key var; yani bir Supabase projen var.
2. **Tabloları oluşturma** – Aşağıdaki SQL’i Supabase Dashboard’da **SQL Editor**’da çalıştırıyorsun.
3. **Uygulama tarafı** – Kod zaten `tasks` tablosunu kullanıyor; ileride `categories` ve `pomodoro_records` için de API çağrıları eklenebilir.

Mock kullanıcı (“Giriş yapmadan dene”) hâlâ localStorage kullanır; sadece **Supabase ile giriş yapan** kullanıcılar bu veritabanını kullanır.

---

## Adım adım ne yapacaksın?

### 1. Supabase Dashboard’a gir

- [supabase.com](https://supabase.com) → Projeyi seç (veya yeni proje oluştur).
- Sol menüden **SQL Editor**’ı aç.

### 2. Migration dosyasını çalıştır

- Projedeki **`supabase/migrations/001_initial_schema.sql`** dosyasını aç.
- İçeriğin tamamını kopyala.
- SQL Editor’a yapıştır ve **Run** (veya Ctrl/Cmd + Enter) ile çalıştır.

Bu script şunları yapar:

- **`tasks`** – Görevler: başlık, tarih, saat, kategori, tekrar, öncelik, etiketler, alt görevler, **hatırlatma saati (reminder_at)**, **sıra (order_index)**, **tamamlanma anı (completed_at)**, **dosya eki (attachment_name, attachment_data)**.
- **`categories`** – Kullanıcıya özel kategoriler.
- **`pomodoro_records`** – Pomodoro oturum kayıtları (isteğe bağlı; uygulama şu an localStorage kullanıyor).
- **RLS** – Her kullanıcı sadece kendi verilerini görür/düzenler.

**Daha önce 001’i çalıştırdıysan:** Yeni kolonları eklemek için **`supabase/migrations/002_add_task_columns.sql`** dosyasını da SQL Editor’da çalıştır.

**Profil (Ayarlar > Profil):** **`supabase/migrations/003_profiles.sql`** — `profiles` tablosu (display_name, date_of_birth, gender). İstersen 001’den sonra çalıştır.

### 3. `.env.local` – Supabase bağlantısı (yapman gereken adım)

Uygulamanın **senin** Supabase projenle (To Do App) konuşması için ortam değişkenleri gerekir. Bunları `.env.local` dosyasında tanımlarsın.

#### 3.1. Supabase’den URL ve Key’i al

1. [supabase.com](https://supabase.com) → **To Do App** projesini aç.
2. Sol altta dişli ikonuna tıkla → **Project Settings** (Proje Ayarları).
3. Sol menüden **API** sekmesine gir.
4. Şunları kopyala:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL` olarak kullanacaksın (örn. `https://xxxxx.supabase.co`).
   - **Project API keys** bölümünde **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY` olarak kullanacaksın (uzun JWT token, `eyJ...` ile başlar).
   - ⚠️ **service_role** key’i kullanma; sadece **anon public** kullan (tarayıcıda güvenli).

#### 3.2. Projede `.env.local` oluştur

1. Proje kökünde (`package.json`’ın olduğu yerde) **`.env.local`** adında bir dosya oluştur.
2. İçine şunu yaz (kendi değerlerinle değiştir):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://buraya-project-url-yapistir.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.buraya_anon_key_yapistir
```

- Satır sonu boşluk veya tırnak ekleme; değerler tek satırda olsun.
- `NEXT_PUBLIC_` önekini silme; Next.js bu değişkenleri istemci tarafında kullanıyor.

#### 3.3. Kontrol

- `.env.local` dosyası **git’e eklenmez** (Next.js ve `.gitignore` bunu zaten yok sayar); key’ler repoda görünmez.
- Değişiklikten sonra dev sunucuyu **yeniden başlat**: terminalde `npm run dev`’i durdurup tekrar çalıştır. Next.js ortam değişkenlerini sadece başlangıçta okur.

Şablon için projede **`.env.example`** dosyası da var; orada sadece değişken adları yazıyor, gerçek key’ler yok.

---

## Tablolar ve kodla ilişkisi

| Tablo               | Amaç                    | Uygulama durumu |
|---------------------|-------------------------|------------------|
| **tasks**           | Görevler                | `fetchTasksFromSupabase`, `saveTaskToSupabase`, `deleteTaskFromSupabase` kullanıyor. Tüm kolonlar (reminder_at, order_index, completed_at, attachment dahil) helpers ile uyumlu. |
| **categories**      | Kategoriler             | Şu an sadece localStorage (mock). İleride Supabase’den çekilebilir. |
| **pomodoro_records**| Pomodoro istatistikleri | Şu an localStorage. İleride Supabase’e taşınabilir. |

---

## Özet

- **Senin yapman gereken:** Supabase Dashboard → SQL Editor → `001_initial_schema.sql` içeriğini yapıştırıp çalıştırmak. (Daha önce eski 001’i çalıştırdıysan ayrıca `002_add_task_columns.sql` çalıştır.)
- **Commit için:** Migration dosyası ve bu doküman projede olduğu için istersen “Database schema eklendi” gibi bir commit mesajıyla commit edebilirsin.

Sonrasında gerçek kullanıcı ile giriş yaptığında görevler bu veritabanına yazılacak ve oradan okunacak.

---

## Auth (Giriş) – Google OAuth kullanacaksan

**Google ile Giriş** butonu çalışsın istiyorsan Supabase’de yönlendirme adresini tanımla:

1. Supabase Dashboard → **Authentication** → **URL Configuration** (veya **Providers** → Google ayarları).
2. **Redirect URLs** listesine uygulama adresini ekle:
   - Yerel: `http://localhost:3000`, `http://localhost:3001`
   - Canlı: `https://senin-domain.com`
3. Google provider’ı açıp Client ID / Secret’ı (Google Cloud Console’dan) ekle.

E-posta + şifre ile giriş/kayıt için ekstra ayar gerekmez; Supabase varsayılan olarak Email provider’ı açar.
