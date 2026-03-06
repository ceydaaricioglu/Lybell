# App Özellik Denetimi – Free vs Pro ve Eksikler

Tarih: 2025-02

## 1. Eksik / Silinmiş veya Tam Bağlanmamış Özellikler

| Özellik | Durum | Not |
|--------|--------|-----|
| **Görevler sayfası Pro filtreleri** | ❌ Eksik | Eski TasksView'da vardı: **Öncelik** (Tümü / Yüksek / Orta / Düşük) ve **Tekrar** (Tümü / Tekrarlayan / Tekrarsız) filtreleri. Şu an TasksView'da sadece sekme (Bugün / Yaklaşan / Tamamlanan) + arama var. Pro kullanıcılar için bu iki filtre eklenmeli. |
| **Liste paylaşımı (Paylaş butonu)** | ❌ Eksik | `createListShare` shared'da var, `/share?t=TOKEN` sayfası çalışıyor. **CategoryTaskView** içinde `sharing` state var ama **"Paylaş" butonu ve createListShare çağrısı yok**. Pro kullanıcılar liste detayında "Paylaş" ile link oluşturup kopyalayabilmeli. |

Bunlar dışında refactor sırasında **silinen** bir özellik yok; sadece bu iki Pro özelliği hiç eklenmemiş veya arayüzden kaldırılmış durumda.

---

## 2. Free Versiyonda Olan Özellikler (Prod)

- **Kimlik:** E-posta ile giriş/kayıt, Google ile giriş, misafir (hesap olmadan)
- **Limitler:** En fazla **50 görev**, **2 kategori**, görev başına **3 alt görev**
- **Görev:** CRUD, tarih/saat, **1 hatırlatma**, tekrarlı görev (gün / hafta / ay – 3 tip)
- **Kategoriler:** Listeler sayfası, kategori detay (To Do / In Progress / Completed), arama
- **Ana sayfa:** Bugün, Yaklaşan, Gecikmiş, Bugün Odakta (My Day), Pomodoro özeti, Listeler bölümü
- **Görevler sayfası:** Bugün / Yaklaşan / Tamamlanan sekmeleri, arama
- **Takvim:** Aylık görünüm, gün seçimi, seçili günde görev listesi (Google Takvim **sadece Pro**)
- **Pomodoro:** Başlat, kayıt, bugün/hafta/streak istatistikleri (temel)
- **Ayarlar:** Profil, karanlık mod, bildirimler (aç/kapa, günlük özet, gecikmiş hatırlatma), dil, çıkış  
  - Dışa aktarma (JSON/CSV) **Pro**
- **Alt menü:** Ana Sayfa, Görevler, Takvim, +, Listeler, Ayarlar (sabit; özelleştirme **Pro**)
- **Onboarding** ve **Profil** ekranı

---

## 3. Pro’da Olan Özellikler (Uygulamada Açık)

- Sınırsız görev, sınırsız kategori, sınırsız alt görev (`canAddTask`, `canAddCategory`, `canAddSubtask` + `FREE_MAX_*`)
- **2. hatırlatma**, **hatırlatma mesajı**, **geri sayım hedefi** (EditTaskView, isPro ile)
- **Google Takvim** bağlama ve okuma (CalendarView)
- Kategori **syncToGoogle** (AddCategoryModal, isPro)
- **Sesle not** (EditTaskView, HomeView’da 🎤)
- **Görev şablonları** (EditTaskView “Şablon olarak kaydet” / “Şablondan oluştur”; Ayarlar’da “Şablonlarım”)  
  - Not: Şablon UI’ı isPro ile kısıtlanmamış olabilir; tabloya göre sadece Pro’da olmalı.
- **Özel zil sesi** (Ayarlar: Varsayılan / Sessiz / Zil / Çan / Yumuşak – Pro seçenekleri)
- **Dışa aktarma** JSON/CSV (Ayarlar, isPro)
- **Sekme özelleştirme** (Ayarlar’da alt menü sekmeleri aç/kapa; `getVisibleNavTabs`, isPro)
- **Hafta içi tekrarlı** görev (EditTaskView’da “Sadece hafta içi”, isPro)
- **Geri sayım etiketi** (HomeView’da `getCountdownLabel`)

---

## 4. Eklenmesi Gerekenler (Özet)

1. **Görevler sayfası Pro filtreleri**  
   - TasksView’da `isPro` ise:  
     - **Öncelik:** Tümü / Yüksek / Orta / Düşük (dropdown veya pill).  
     - **Tekrar:** Tümü / Tekrarlayan / Tekrarsız (dropdown veya pill).  
   - Liste bu filtrelere göre filtrelenmeli.

2. **Liste paylaşımı**  
   - CategoryTaskView’da Pro kullanıcılar için header’a **“Paylaş”** butonu.  
   - Tıklanınca `createListShare(userId, categoryId)` çağrısı, dönen token ile paylaşım linki oluşturulup kopyalanmalı (örn. `window.location.origin + '/share?t=' + token`).  
   - (İsteğe bağlı) “Link kopyalandı” toast’ı.

3. **Şablonların Pro’ya kısıtlanması (opsiyonel)**  
   - Pro tablosunda “Görev şablonları” Pro’da.  
   - EditTaskView’da “Şablondan oluştur” ve “Şablon olarak kaydet” blokları `isPro` ile sarılabilir; Free’de Pro’ya yönlendirme gösterilebilir.  
   - Ayarlar’daki “Şablonlarım” bölümü de `isPro` ile gösterilebilir.

---

## 5. Referanslar

- Limitler: `packages/shared/src/limits.ts` (FREE_MAX_TASKS, FREE_MAX_CATEGORIES, FREE_MAX_SUBTASKS_PER_TASK)
- Pro özellikler dokümanı: `docs/PRO_FEATURES_TODO.md`
- Liste paylaşımı API: `packages/shared` içinde `createListShare`, `getSharedList`
- Paylaşım sayfası: `apps/app/app/share/page.tsx`
