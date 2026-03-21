# iOS / Xcode / TestFlight — sonra yapacağım hatırlatma

Bu dosyayı yapacağın gün aç; eski sürüm / turuncu UI karışıklığını azaltmak için.

## 1. Taze web + Capacitor (şart)

```bash
cd apps/app
rm -rf out .next
npm run build:export
npx cap sync ios
```

## 2. Xcode

- **Product → Clean Build Folder** (⇧⌘K)
- İstersen: **Settings → Locations → Derived Data** → proje ile ilgili klasörü sil (tam temizlik)
- Sonra **Archive** → App Store Connect’e yükle

## 3. Build numarası

- Her yüklemede **CFBundleVersion** (build number) artır; hangi binary olduğu belli olsun.

## 4. Cihaz / tester

- Gerekirse uygulamayı **sil → TestFlight’tan yeniden kur**
- App Store Connect’te test grubunda **en yeni build** seçili olsun

## 5. Silme / silmeme

- **`apps/app/ios` klasörünü komple silme** — `cap sync` ile güncellenir.
- App Store’daki eski build’leri “hepsini sil” diye uğraşmak şart değil; doğru **yeni** build’i dağıtmak yeterli.

İlgili: `docs/REPO_CLEANUP_AUDIT.md` (repo yapısı + mobil route’lar).
