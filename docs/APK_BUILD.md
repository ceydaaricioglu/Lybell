# APK Derleme (Capacitor + Android)

Bu proje Next.js static export ile build edilir; Android APK için Capacitor kullanılır.

## Gereksinimler

- **Node.js** (mevcut proje sürümü)
- **Android Studio** ([indir](https://developer.android.com/studio)) — APK imzalama ve derleme için
- **JDK 17** (Android Studio ile gelir)

## Komutlar

| Komut | Açıklama |
|--------|-----------|
| `npm run build` | Next.js static export → `out/` klasörü oluşur |
| `npm run cap:sync` | `out/` içeriğini Android projesine kopyalar |
| `npm run cap:android` | Android Studio’yu açar |
| `npm run android` | Build + sync (tek seferde) |

## APK Üretme Adımları

1. **Web build al**
   ```bash
   npm run build
   ```

2. **Android projesine kopyala**
   ```bash
   npm run cap:sync
   ```

3. **Android Studio’da aç**
   ```bash
   npm run cap:android
   ```

4. **Android Studio içinde**
   - İlk açılışta Gradle sync tamamlansın.
   - Menü: **Build → Build Bundle(s) / APK(s) → Build APK(s)**.
   - APK: `android/app/build/outputs/apk/debug/app-debug.apk` (debug) veya release için **Build → Generate Signed Bundle / APK** ile imzalı APK üret.

## Supabase Auth ve APK

- **E-posta / şifre ile kayıt ve giriş** APK’da aynen çalışır (ek ayar gerekmez).
- **Google ile giriş** için Supabase Dashboard’da Android redirect URL eklemen gerekir:
  1. [Supabase Dashboard](https://supabase.com/dashboard) → Projen → **Authentication** → **URL Configuration**.
  2. **Redirect URLs** listesine şunu ekle (proje ID’ni kendi projenle değiştir):
     - `https://<PROJECT_REF>.supabase.co/auth/v1/callback`
     - Veya custom scheme kullanıyorsan: `com.cursordeneme.app://**` (Capacitor App ID ile).
  3. **Google** provider’da “Authorized redirect URIs” içinde aynı callback URL’in tanımlı olduğundan emin ol.

Bu ayarlardan sonra APK’da da “Kayıt ol” ve “Google ile giriş” akışı çalışır.

## Değişiklik sonrası APK güncelleme

Evet — koda veya tasarıma her değişiklikten sonra yeni APK alman gerekir:

1. `npm run build`
2. `npm run cap:sync`
3. Android Studio’da **Build → Build APK(s)** (veya Run ile doğrudan telefona yükle)

Geliştirme sırasında hızlı denemek için tarayıcıda `npm run dev` ile test edebilirsin; APK’yı sadece gerçek cihazda denemek istediğinde build al.

## Notlar

- Her web değişikliğinden sonra APK’yı yenilemek için: `npm run build` → `npm run cap:sync` → Android Studio’da tekrar Build.
- Debug APK doğrudan cihaza yüklenebilir; dağıtım için **Generate Signed Bundle / APK** ile release APK veya AAB üret.
- Uygulama adı ve paket adı: `capacitor.config.ts` içinde `appName` ve `appId` (şu an: "Todo App", `com.cursordeneme.app`).
