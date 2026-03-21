# Google Calendar Entegrasyonu – Kararlar & Görünüm Beyin Fırtınası

## 1. Free vs Pro – Yön

| Sürüm | Yön | Açıklama |
|-------|-----|----------|
| **Free** | **Tek yön: Google → Uygulama** | Google Takvim’deki etkinlikler Takvim sekmesinde görünsün. Kullanıcı “Google’ı bağla” der, etkinlikler okunur, grid’de gösterilir. Uygulama görevleri Google’a yazılmaz. |
| **Pro** | **Çift yön: Google ↔ Uygulama** | Free’deki gibi Google etkinlikleri görünsün **+** uygulama içinde oluşturulan görevler (isteğe bağlı) Google Takvim’e de eklensin. Böylece tek yerden yönetim Pro’da olur. |

Bu ayrım hem değer farkı yaratır hem teknik yükü Free’de sınırlı tutar (sadece okuma API’si).

---

## 2. Görünüm – Beyin Fırtınası

Takvim grid’inde **uygulama görevleri** ile **Google etkinlikleri** bir arada; hangisi nereden geldiği anlaşılsın, isteğe göre tür/kategori de vurgulansın istiyoruz. Aşağıdaki seçenekler birbirini dışlamıyor; biri “temel”, diğerleri “ileride” de olabilir.

---

### A) Kaynak bazlı renk (en basit)

- **Uygulama görevleri:** Tek renk (örn. amber/turuncu – mevcut “görev” vurgusu).
- **Google etkinlikleri:** Farklı tek renk (örn. mavi veya Google’ın mavi tonu).
- Artı: Hemen uygulanır, “bu Google’dan, bu uygulama” net olur.
- Eksi: Doğum günü / toplantı / akşam etkinliği ayrımı yok.

---

### B) Kaynak + küçük etiket (örn. “g”)

- Renk yeterli gelmezse veya erişilebilirlik için:
  - Google’dan gelen etkinliklerin yanında/altında **küçük “g”** (veya Google ikonu).
  - Uygulama görevlerinde ikon yok veya ufak uygulama ikonu.
- Artı: Renk körlüğünde de ayırt edilebilir; “g” = Google alışkanlık yaratır.
- Eksi: Grid hücreleri küçükse ikon/ harf sıkışabilir; font/ boyut dikkatli seçilmeli.

---

### C) Tür / kategori bazlı renk (ileride)

- **Hedef:** Doğum günü bir renk, toplantı bir renk, akşam etkinliği başka renk.
- **Google tarafı:** Google Calendar API’de etkinliğin `summary`, takvim adı veya **renk bilgisi** var. Google’da kullanıcı takvime/türe göre renk atayabiliyor; API’den `colorId` veya takvim rengi alınabilir.
- **Uygulama tarafı:** Zaten kategoriler (rutin, okuma, vb.) ve öncelik var; bunları renge çeviririz (yüksek=kırmızımsı vb.).
- Sonuç: Hem “Google vs uygulama” hem “içerik türü” (doğum günü, toplantı, etkinlik) renkle gösterilebilir.
- Artı: Çok bilgi, tek bakışta anlaşılır.
- Eksi: Renk paleti ve kurallar net tanımlanmalı; ilk sürümde karmaşık olabilir.

---

### D) Hibrit öneri (aşamalı)

1. **İlk sürüm (Free – Google → uygulama):**
   - **Kaynak:** İki renk: biri uygulama görevleri (örn. amber), biri Google etkinlikleri (örn. mavi).
   - İsteğe bağlı: Google etkinliklerinde **küçük “g”** veya Google ikonu (B seçeneği).
2. **Sonra (Pro veya güncelleme):**
   - Google’dan gelen etkinliklerde **Google’ın rengini** kullan (API’den `colorId` / takvim rengi) – böylece doğum günü / toplantı / etkinlik kullanıcının Google’da atadığı renkle gelir (C’ye yaklaşır).
   - Uygulama görevlerinde kategori/öncelik rengi (zaten var olan yapı genişletilir).

---

## 3. Özet tablo

| Konu | Karar |
|------|--------|
| Takvim sekmesi | Aynen kalacak; Google entegrasyonu bu sekmede. |
| Free | Sadece **Google → uygulama** (okuma). |
| Pro | **Çift yön:** Google’da görünsün + uygulama görevleri Google’a yazılabilsin. |
| Görünüm (ilk) | İki renk (uygulama vs Google) + isteğe “g”/ikon. |
| Görünüm (ileride) | Google renkleri + kategori/öncelik renkleri. |

---

## 4. Uygulama durumu (A+B tamamlandı)

- **Free:** Google → uygulama (okuma). Takvim sekmesinde "Google Takvim'i Bağla" butonu; bağlandıktan sonra etkinlikler grid’de mavi + **g** ile gösteriliyor. Uygulama görevleri amber.
- **Pro:** Çift yön ileride eklenecek.

---

## 5. Kurulum (Google Calendar entegrasyonunu açmak için)

### 5.1 Google Cloud

1. [Google Cloud Console](https://console.cloud.google.com/) → Proje seç veya oluştur.
2. **API’ler ve Hizmetler** → **Kütüphane** → “Google Calendar API” ara → **Etkinleştir**.
3. **OAuth consent screen:** Dış kullanıcı için “Test” veya “Yayınla”; kapsam: `https://www.googleapis.com/auth/calendar.events.readonly`.
4. **Kimlik bilgileri** → **Oluştur** → **OAuth 2.0 İstemci Kimliği**. Uygulama türü: “Web uygulaması”.
   - **Yetkili yönlendirme URI’leri:**  
     `https://<SUPABASE_PROJECT_REF>.supabase.co/functions/v1/google-calendar-callback`  
     (Supabase proje ref’i: Dashboard → Project Settings → Reference ID.)
   - İstemci kimliği ve istemci parolasını kopyala.

### 5.2 Ortam değişkenleri

**Next.js (uygulama) – `.env.local`:**

- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` = Google OAuth istemci kimliği.
- `NEXT_PUBLIC_GOOGLE_CALLBACK_URL` = `https://<SUPABASE_PROJECT_REF>.supabase.co/functions/v1/google-calendar-callback`  
  (Callback’in Edge Function URL’i ile birebir aynı olmalı.)

**Supabase Edge Functions (gizli):**

```bash
supabase secrets set GOOGLE_CLIENT_ID="..."
supabase secrets set GOOGLE_CLIENT_SECRET="..."
supabase secrets set APP_URL="https://lybell.app"
```

- `APP_URL`: OAuth sonrası kullanıcının yönlendirileceği uygulama adresi. Production: `https://lybell.app`. Geliştirme: `http://localhost:3000` veya `3001` (Supabase secret ile).

### 5.3 Veritabanı

Migration’ı uygula (zaten eklendi):

```bash
supabase db push
# veya
supabase migration up
```

`google_calendar_tokens` tablosu oluşur.

### 5.4 Edge Functions deploy

```bash
supabase functions deploy google-calendar-callback
supabase functions deploy google-calendar-events
```

### 5.5 Notlar

- **Mock kullanıcı:** Google Takvim yalnızca gerçek Supabase girişi yapmış kullanıcılar için çalışır. `mock-` ile başlayan kullanıcıda “Google Takvim'i Bağla” gösterilmez.
- **Redirect:** Kullanıcı “Bağla”ya tıklar → Google’da yetkilendirir → Supabase `google-calendar-callback` çağrılır → token kaydedilir → `APP_URL?google_calendar=callback&success=1` ile uygulamaya yönlendirilir. Uygulama bu parametreyle sayfayı açar ve Google etkinliklerini yükler.
