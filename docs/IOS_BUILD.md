# iPhone / iOS Derleme (Capacitor + Xcode)

Bu proje iOS için de Capacitor ile derlenir. iPhone’a yüklemek veya App Store’a göndermek için aşağıdaki adımları izle.

## Gereksinimler

- **Mac** (iOS build sadece macOS’ta yapılır)
- **Xcode** — App Store’dan ücretsiz indir: [developer.apple.com/xcode](https://developer.apple.com/xcode/)
- **Apple Developer hesabı** (ücretli, yıllık ~$99) — Gerçek iPhone’a yüklemek veya App Store’a yayınlamak için gerekli. **Sadece simülatörde** denemek için gerekmez.

## Komutlar

| Komut | Açıklama |
|--------|-----------|
| `npm run build` | Next.js static export → `out/` |
| `npm run cap:sync` | `out/` içeriğini iOS projesine kopyalar |
| `npm run cap:ios` | Xcode’u açar |
| `npm run ios` | Build + sync (tek seferde) |

## iOS Build Adımları

1. **Web build al**
   ```bash
   npm run build
   ```

2. **iOS projesine kopyala**
   ```bash
   npm run cap:sync
   ```

3. **Xcode’da aç**
   ```bash
   npm run cap:ios
   ```
   (Xcode yüklü değilse önce App Store’dan **Xcode** indirip kur.)

4. **Xcode içinde**
   - Üstte cihaz olarak **bir iPhone simülatörü** seç (örn. iPhone 15).
   - **Run** (▶) butonuna bas → uygulama simülatörde açılır.  
   - **Gerçek iPhone’a yüklemek için:** Cihaz listesinden kendi iPhone’unu seç, USB ile bağla, Run’a bas. İlk seferde **Signing & Capabilities** sekmesinden Apple ID ile giriş yapman ve “Trust” demen gerekebilir. Gerçek cihaz için Apple Developer hesabı ($99/yıl) gerekir.

## iPhone’a Nasıl İndirilir / Yüklenir?

- **Simülatör (ücretsiz):** Yukarıdaki gibi Xcode’da bir iPhone simülatörü seçip Run’a bas. Sadece Mac’te çalışan sanal iPhone’da test edersin.
- **Gerçek iPhone’a (kendi cihazın):** iPhone’u USB ile bağla, Xcode’da cihazı seç, Run’a bas. Apple ID ile imzalama yeterli olabilir (ücretsiz hesap 7 gün sınırlı); kalıcı ve sınırsız için Apple Developer Program ($99/yıl) gerekir.
- **App Store’dan indirme:** Uygulamayı herkese dağıtmak için App Store’a yüklemen gerekir. Bunun için Apple Developer Program üyeliği ve Xcode’da Archive → Distribute App ile store’a gönderme adımları gerekir (ayrı bir süreç).

## Supabase Auth (iOS)

- **E-posta / şifre** ile kayıt ve giriş iOS’ta da çalışır.
- **Google ile giriş** kullanacaksan Supabase Dashboard’da **Redirect URLs** kısmına iOS URL scheme’ini eklemen gerekir (örn. `com.cursordeneme.app://**`).

## Notlar

- Uygulama adı ve bundle ID: `capacitor.config.ts` → `appName`, `appId` (şu an: "Todo App", `com.cursordeneme.app`).
- Web’de değişiklik yaptıkça: `npm run build` → `npm run cap:sync` → Xcode’da tekrar Run.
