# iPhone'da Test Etme (Capacitor)

Bu proje **Next.js + Capacitor** ile kurulu. **Expo Go ile çalışmaz**; Expo Go sadece Expo/React Native projeleri içindir.

## Gereksinimler

- Mac
- Xcode (App Store’dan)
- Node.js ve proje bağımlılıkları yüklü

## Adımlar

### 1. Web build al

```bash
npm run build
```

Bu komut `out/` klasörüne statik site üretir (Next.js `output: "export"` sayesinde).

### 2. iOS’a sync et

```bash
npx cap sync ios
```

### 3. Xcode’da aç ve çalıştır

```bash
npx cap open ios
```

Xcode açıldıktan sonra:

- **Simulator:** Üstte cihaz olarak bir iPhone simülatörü seçip ▶️ Run’a bas.
- **Gerçek cihaz:** iPhone’u USB ile bağla, imzalama için Apple ID (Signing & Capabilities) ayarla, cihazı seçip Run.

## Tek komutla (build + sync + aç)

```bash
npm run ios
```

(Bu script `next build && cap sync ios` yapar; Xcode’u `npx cap open ios` ile ayrıca açarsınız.)

## Özet

| Yöntem        | Bu proje için |
|---------------|----------------|
| **Expo Go**   | ❌ Uygun değil (Expo/RN projesi değil) |
| **Capacitor + Xcode** | ✅ Uygun (zaten kurulu) |

Projeyi iPhone’da test etmek için **Expo Go yerine** yukarıdaki Capacitor + Xcode adımlarını kullanın.
