# Monorepo: App + Web

Aynı ürünün iki sürümü; **ortak database** (Supabase).

## Yapı

- **`packages/shared`** – Ortak katman: tipler, Supabase client, API helper'ları, sabitler, i18n. Her iki uygulama da bunu kullanır.
- **`apps/app`** – Mobil uygulama (Capacitor). Giriş, ana sayfa, görevler, takvim, **bottom nav**. Port **3000**. APK/IPA buradan üretilir.
- **`apps/web`** – Web sitesi. **Sidebar**, dashboard, aynı ekranlar masaüstü düzeninde. Port **3001**.

## Çalıştırma

Kök dizinde (`cursor-deneme/`):

```bash
npm install
```

**App (mobil):**
```bash
npm run dev:app
# http://127.0.0.1:3000
```

**Web (site):**
```bash
npm run dev:web
# http://127.0.0.1:3001
```

**Android (app):**
```bash
npm run android
# veya: cd apps/app && npm run android
```

## Ortam değişkenleri

Her uygulama kendi `.env.local` dosyasını kullanır. Aynı Supabase projesi:

- `apps/app/.env.local`
- `apps/web/.env.local`

İçerik (örnek):
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

Google Takvim (isteğe bağlı):
```
NEXT_PUBLIC_GOOGLE_CLIENT_ID=...
NEXT_PUBLIC_GOOGLE_CALLBACK_URL=...
```

## Kök dizindeki eski dosyalar

`app/`, `components/`, `lib/` vb. kök dizinde duruyorsa bunlar **eski tek-proje** yapısıdır. Artık kaynak kod **apps/app** ve **apps/web** içindedir; ortak kod **packages/shared** içindedir.
