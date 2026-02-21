# Supabase Migration – Adım Adım

Sadece **004_google_calendar_tokens** tablosunu eklemek için (001, 002, 003 zaten uygulandıysa) aşağıdaki **Yol B** yeterli.

---

## Yol A: Supabase CLI ile (isteğe bağlı)

CLI kurulu ve proje bağlıysa kullanabilirsin.

### 1. Supabase CLI kur (yoksa)

```bash
npm install -g supabase
```

### 2. Projeye bağlan

```bash
cd /Users/ceyda/Desktop/cursor-deneme
supabase login
supabase link --project-ref PROJE_REF
```

`PROJE_REF`: Supabase Dashboard → **Project Settings** → **General** → **Reference ID** (örn. `dxlpmaamgvfbzjzogdkw`).

### 3. Migration’ları uygula

```bash
supabase db push
```

Bu komut henüz uygulanmamış tüm migration dosyalarını (001, 002, 003, 004) sırayla çalıştırır.

---

## Yol B: Dashboard’dan SQL çalıştır (en kolay)

CLI kullanmak istemiyorsan sadece bu yolu yap.

### 1. Supabase’e gir

1. Tarayıcıda **https://supabase.com/dashboard** aç.
2. Projeyi seç (cursor-deneme’nin bağlı olduğu proje).

### 2. SQL Editor’ü aç

1. Sol menüden **SQL Editor**’e tıkla.
2. **New query** (Yeni sorgu) ile boş bir sorgu sayfası aç.

### 3. Migration SQL’ini yapıştır

1. Bilgisayarındaki bu dosyayı aç:  
   `supabase/migrations/004_google_calendar_tokens.sql`
2. **Tümünü** kopyala (Ctrl+A, Ctrl+C).
3. SQL Editor’deki boş alana yapıştır (Ctrl+V).

### 4. Çalıştır

1. Sağ altta **Run** (veya Ctrl+Enter) tuşuna bas.
2. Altta “Success” veya “Success. No rows returned” görmelisin.

### 5. Kontrol et

1. Sol menüden **Table Editor**’e gir.
2. Listede **google_calendar_tokens** tablosu görünmeli.

Bu kadar. Migration tamamlanmış olur.

---

## Hata alırsan

- **“relation auth.users does not exist”**  
  Proje Auth kapalı veya farklı bir Supabase projesine bakıyorsun. Doğru projeyi seçtiğinden emin ol.

- **“already exists”**  
  Tablo zaten oluşturulmuş; migration daha önce uygulanmış. Bir şey yapmana gerek yok.

- **001 / 002 / 003 hiç uygulanmadıysa**  
  Önce 001’i, sonra 002’yi, sonra 003’ü, en son 004’ü SQL Editor’de tek tek çalıştır (her dosyanın tamamını kopyala-yapıştır → Run).
