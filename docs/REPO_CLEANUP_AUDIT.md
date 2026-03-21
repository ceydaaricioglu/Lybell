# Repo temizlik & mükerrerlik denetimi

Son güncelleme: 2026-02-08

## Özet

- **`apps/app` (mobil / Capacitor)** ve **`apps/web` (Next web)** bilinçli olarak **iki ayrı hedef**; birçok bileşen (`TasksView`, `LoginView`, …) **kopya** değil, **paralel kopyalar**. Ortak iş mantığı `packages/shared` içinde.
- **Eski “ikinci uygulama”** repoda ayrı klasör olarak durmuyor; `out/` build çıktısı `.gitignore`’da.
- **TestFlight’ta eski UI** görülmesi genelde **eski commit + export/sync + Archive** veya **web ile app karıştırma** ile ilgilidir; kaynakta gizli bir “eski app” klasörü yok.

## Yapılan temizlikler (bu oturum)

1. **`apps/app` içindeki geliştirici-only rotalar kaldırıldı**  
   `full-preview`, `*-preview`, `home-design-*`, `home-designs` — bunlar `output: 'export'` ile **iOS paketine de giriyordu** (gereksiz boyut + eski/turuncu deneme UI riski).  
   Aynı önizlemeler **`apps/web`** altında duruyor; tasarım incelemesi için web kullanın.

2. **`design-mockups.html`** → **`docs/design-mockups.html`** taşındı (kök dizin sadeleşti).

3. **`apps/web`** bileşenlerinde **`#ec5b13` / turuncu** kalan yerler **Lybell `#1A2332`** ile hizalandı (`DashboardView`, `WebSidebar`, `CalendarView`, `SettingsView`, `CategoriesView`, `CategoryTaskView` ilgili kısımlar).

## Bilinçli “duplicate” yapı

| Alan | Açıklama |
|------|-----------|
| `apps/app/components/*` vs `apps/web/components/*` | İki deploy; değişiklik yaparken **ikisini** veya sadece hedefi güncelleyin. |
| `packages/shared` | Görevler, Supabase yardımcıları, çeviri anahtarları — tek kaynak. |

İleride azaltmak için: ortak UI paketi (`packages/ui`) veya seçili bileşenleri shared’a taşımak (maliyetli refactor).

## `apps/web`’de kalan önizleme / deneme rotaları

Tasarım ve mock ekranlar web’de duruyor (`/full-preview`, `/welcome-preview`, `home-design-*`, …). Prod domain’de yayınlıyorsanız middleware veya env ile kapatmayı düşünün.

## Diğer notlar

- **`apps/web/supabase/.temp`**: Supabase CLI çıktısı; `.gitignore`’da, commit’lenmemeli.
- **Dokümanlarda “turuncu”** geçen yerler (`docs/PRO_FEATURES_RESEARCH.md`, `TASARIM_ONERILERI.md`, …) **rakip/araştırma notu**; uygulama kodu değil.
- **Yerel yedekler**: `page.tsx.backup` gibi dosyalar ara sıra görülür; repoda tutmayın, silin veya `.gitignore`’a alın.

## Mobil build checklist

```bash
cd apps/app
npm run build:export
npx cap sync ios
# Xcode: Clean Build Folder → Archive
```

İsteğe bağlı: Archive notuna `git rev-parse --short HEAD` yazın.
