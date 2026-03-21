# Google Takvim’i Bağlama – Bebek Adımları

Bu rehber, Google Takvim’i uygulamanıza bağlamak için **sıfırdan**, adım adım ne yapacağınızı anlatır. Her adımı sırayla yapın.

---

## Özet: Ne yapacağız?

1. **Google Cloud**’da bir proje açıp “Google Calendar API”yi açacağız.
2. **OAuth izin ekranı** ayarlayacağız (kullanıcı “Bu uygulama takvimime erişsin” der).
3. **OAuth istemci kimliği** (Client ID + Secret) oluşturacağız.
4. **Supabase**’te `google_calendar_tokens` tablosu ve **Edge Function**’ların hazır olduğundan emin olacağız.
5. **Ortam değişkenleri** (env) dolduracağız.
6. Uygulamada **Takvim** sekmesine gidip **“Google Takvim'i Bağla”** diyeceğiz.

Aşağıda her adım tek tek açıklanıyor.

---

## Adım 1: Google Cloud’da proje açmak

1. Tarayıcıda şu adresi açın: **https://console.cloud.google.com/**
2. Sağ üstte **“Proje Seç”** (veya “Select a project”) tıklayın.
3. Açılan pencerede **“Yeni Proje”** (New Project) tıklayın.
4. **Proje adı** yazın (örn. `Todo App Takvim`).
5. **Oluştur** (Create) tıklayın.
6. Proje oluşunca, üstteki proje seçiciden bu yeni projeyi seçin.

**Bu adımda sadece “bir proje var” olması yeterli.**

---

## Adım 2: Google Calendar API’yi açmak

1. Sol menüden **“API’ler ve Hizmetler”** (APIs & Services) → **“Kütüphane”** (Library) tıklayın.
2. Arama kutusuna **“Google Calendar API”** yazın.
3. **“Google Calendar API”** kartına tıklayın.
4. **“Etkinleştir”** (Enable) butonuna tıklayın.
5. API etkinleşene kadar bekleyin.

**Bu adımda:** Projenizde Calendar API “açık” olmalı.

---

## Adım 3: OAuth izin ekranı (Consent Screen)

Kullanıcı “Google Takvim'i Bağla” dediğinde Google, “Bu uygulama takvimini okumak istiyor, izin veriyor musun?” diye soracak. Bunun için bir “OAuth consent screen” lazım.

1. Sol menüden **“API’ler ve Hizmetler”** → **“OAuth consent screen”** (OAuth onay ekranı) tıklayın.
2. **User Type:** **“Harici”** (External) seçin → **Oluştur** (Create).
3. **Uygulama bilgileri** sayfasında:
   - **Uygulama adı:** Örn. `Todo App`
   - **Kullanıcı destek e-postası:** Kendi Gmail adresinizi seçin.
   - **Geliştirici iletişim bilgisi:** Aynı e-posta yeterli.
4. **Kaydet ve Devam** (Save and Continue) tıklayın.
5. **Kapsamlar (Scopes)** sayfasında **“Kapsam Ekle veya Düzenle”** (Add or Remove Scopes) tıklayın.
6. Arama kutusuna **“calendar.events.readonly”** yazın.
7. **`https://www.googleapis.com/auth/calendar.events.readonly`** kapsamını bulup **yanındaki kutuya tik** koyun → **Güncelle** → **Kaydet ve Devam**.
8. **Test kullanıcılar** sayfasında (eğer uygulama “Test” modundaysa): **“+ ADD USERS”** ile test edeceğiniz Gmail adresini ekleyin. Sadece bu e-postalar “Google Takvim'i Bağla”yı kullanabilir.
9. **Kaydet ve Devam** → **Geri Panoya Dön** (Back to Dashboard).

**Bu adımda:** OAuth consent screen hazır ve `calendar.events.readonly` kapsamı eklenmiş olmalı.

---

## Adım 4: OAuth istemci kimliği (Client ID + Secret) almak

1. Sol menüden **“API’ler ve Hizmetler”** → **“Kimlik Bilgileri”** (Credentials) tıklayın.
2. Üstte **“+ Kimlik Bilgisi Oluştur”** (Create Credentials) tıklayın.
3. Açılan listeden **“OAuth istemci kimliği”** (OAuth client ID) seçin.
4. **Uygulama türü:** **“Web uygulaması”** (Web application) seçin.
5. **Ad:** Örn. `Todo App Web` yazın.
6. **Yetkili yönlendirme URI’leri** (Authorized redirect URIs) bölümüne **bir satır ekleyin:**
   - Önce Supabase proje referansınızı bulun:
     - **Supabase Dashboard** → https://supabase.com/dashboard → Projenizi açın.
     - Sol altta **Project Settings** (Proje Ayarları) → **General**.
     - **Reference ID** (veya Project ID) kopyalayın (örn. `abcdefghijklmnop`).
   - Yönlendirme URI’si tam olarak şu formatta olmalı (kendi Reference ID’nizi yazın):
     ```
     https://BURAYA_SUPABASE_REFERENCE_ID.supabase.co/functions/v1/google-calendar-callback
     ```
     Örnek: `https://abcdefghijklmnop.supabase.co/functions/v1/google-calendar-callback`
7. **Oluştur** (Create) tıklayın.
8. Açılan pencerede **İstemci Kimliği** (Client ID) ve **İstemci Parolası** (Client Secret) görünecek. İkisini de **güvenli bir yere** kopyalayın (bir daha tam gösterilmez; gerekirse yeni secret üretirsiniz).

**Bu adımda:** Elinizde bir **Client ID** ve bir **Client Secret** olmalı.

---

## Adım 5: Veritabanında `google_calendar_tokens` tablosu

Projede bu tablo migration ile tanımlı. Supabase’te migration’ları uyguladıysanız tablo vardır.

- **Kontrol:** Supabase Dashboard → **Table Editor** → listede **`google_calendar_tokens`** görünüyor mu?
- **Yoksa:** `supabase/migrations/004_google_calendar_tokens.sql` dosyasının içeriğini Supabase **SQL Editor**’da çalıştırın (New query → yapıştır → Run).

**Bu adımda:** `google_calendar_tokens` tablosu var olmalı.

---

## Adım 6: Ortam değişkenleri (env)

### 6.1 Uygulama tarafı (Next.js) – `.env.local`

Proje kökünde `.env.local` dosyası açın (yoksa oluşturun). Şunları ekleyin (kendi değerlerinizi yazın):

```env
# Google Takvim – kendi değerlerinizi yazın
NEXT_PUBLIC_GOOGLE_CLIENT_ID=123456789-xxxx.apps.googleusercontent.com
NEXT_PUBLIC_GOOGLE_CALLBACK_URL=https://BURAYA_SUPABASE_REFERENCE_ID.supabase.co/functions/v1/google-calendar-callback
```

- **NEXT_PUBLIC_GOOGLE_CLIENT_ID:** Adım 4’te kopyaladığınız **Client ID**.
- **NEXT_PUBLIC_GOOGLE_CALLBACK_URL:** Adım 4’te kullandığınız **redirect URI** ile **birebir aynı** olmalı (Supabase Reference ID dahil).

**Önemli:** `NEXT_PUBLIC_GOOGLE_CALLBACK_URL` ile Google Cloud’da yazdığınız “Yetkili yönlendirme URI” **tamamen aynı** olmalı; yoksa Google “redirect_uri_mismatch” hatası verir.

### 6.2 Supabase Edge Functions (gizli değişkenler)

Bunlar tarayıcıda görünmez; sadece sunucuda kullanılır.

1. Bilgisayarınızda terminal açın.
2. Proje klasörüne gidin: `cd /Users/ceyda/Desktop/cursor-deneme` (veya kendi yolunuz).
3. Supabase’e giriş yapılı değilse: `npx supabase login`
4. Projeyi bağlayın: `npx supabase link --project-ref BURAYA_SUPABASE_REFERENCE_ID`
5. Şu üç secret’ı ayarlayın (kendi değerlerinizi yazın):

```bash
npx supabase secrets set GOOGLE_CLIENT_ID="Adım 4'teki Client ID"
npx supabase secrets set GOOGLE_CLIENT_SECRET="Adım 4'teki Client Secret"
npx supabase secrets set APP_URL="https://lybell.app"
```

- **APP_URL:** OAuth’tan sonra kullanıcının geri döneceği adres.
  - Canlı sitede test ediyorsanız: `https://your-app-domain.com`
  - Sadece bilgisayarınızda test ediyorsanız: `http://localhost:3000`

**Bu adımda:** Hem `.env.local` hem Supabase secrets doğru doldurulmuş olmalı.

---

## Adım 7: Edge Function’ları yayına almak

Terminalde (proje klasöründe):

```bash
npx supabase functions deploy google-calendar-callback
npx supabase functions deploy google-calendar-events
```

Her ikisi de “Deployed” benzeri mesaj verene kadar bekleyin.

**Bu adımda:** İki Edge Function da Supabase’te çalışır durumda olmalı.

---

## Adım 8: Uygulamada test etmek

1. **Gerçek Supabase girişi** yapın (mock kullanıcı ile Google Takvim açılmaz).
2. Uygulamada **Takvim** sekmesine gidin.
3. **“Google Takvim'i Bağla”** butonuna tıklayın.
4. Google’ın sayfası açılacak; hangi hesabı kullanacağınızı seçin ve **“İzin ver”** (Allow) deyin.
5. Sayfa uygulamanıza geri dönecek (`?google_calendar=callback&success=1` ile).
6. Takvimde kendi Google etkinlikleriniz görünüyor olmalı.

**“Bağla” butonu kaybolmuyorsa (token kaydedilmiyorsa):**  
Google, aynı Gmail hesabı daha önce izin verdiyse bazen **refresh_token** göndermez; callback token’ı yazamaz. O zaman Google’daki erişimi kaldırıp tekrar bağlayın:

1. **https://myaccount.google.com/** → Giriş yapın.
2. **Güvenlik** (veya **Security**) → **Tarafından kullanılan uygulamalar** / **Third-party apps with account access** (veya **Your connections to third-party apps and services**).
3. **gtwugoklzczszvueacxm.supabase.co** (veya uygulamanız) satırını bulun → **Erişimi kaldır** / **Remove access**.
4. Uygulamada Takvim → **Google Takvim'i Bağla** deyip Google’da **Continue** ile tam yetki verin. Bu sefer refresh_token gelir ve kayıt tutar.

**Hata alırsanız:**

- **redirect_uri_mismatch:** Google Cloud’daki “Yetkili yönlendirme URI” ile `NEXT_PUBLIC_GOOGLE_CALLBACK_URL` (ve callback URL’i kullanan Edge Function) birebir aynı mı kontrol edin.
- **access_denied / config:** Supabase secrets’ta `GOOGLE_CLIENT_ID` ve `GOOGLE_CLIENT_SECRET` doğru mu, `APP_URL` doğru mu kontrol edin.
- **Test kullanıcı:** Uygulama “Test” modundaysa, giriş yaptığınız Gmail adresi OAuth consent screen’de “Test users” listesinde olmalı.

---

## Kısa kontrol listesi

- [ ] Google Cloud’da proje var.
- [ ] Google Calendar API etkin.
- [ ] OAuth consent screen ayarlandı, `calendar.events.readonly` kapsamı eklendi.
- [ ] OAuth Web client oluşturuldu; redirect URI = `https://<REF>.supabase.co/functions/v1/google-calendar-callback`.
- [ ] Client ID ve Client Secret kopyalandı.
- [ ] `google_calendar_tokens` tablosu Supabase’te mevcut.
- [ ] `.env.local`’da `NEXT_PUBLIC_GOOGLE_CLIENT_ID` ve `NEXT_PUBLIC_GOOGLE_CALLBACK_URL` doğru.
- [ ] Supabase secrets: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `APP_URL` ayarlandı.
- [ ] `google-calendar-callback` ve `google-calendar-events` deploy edildi.
- [ ] Gerçek hesapla giriş yapıp Takvim’de “Google Takvim'i Bağla” denendi.

Hepsi tamamsa Google Takvim uygulamanızda “okuma” (Free) olarak çalışır. Pro’da ileride “çift yön” (yazma) ayrı bir özellik olarak eklenebilir.
