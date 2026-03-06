# Todo App – Web Arayüz Ekranları ve Tasarım Kılavuzu

## 1. Araştırma Özeti: Popüler Todo / Proje Yönetimi Uygulamaları

### Teamwork
- **Giriş:** Basit login, proje odaklı.
- **Ana görünümler:** Sol menü (Projeler, Planlama, İnsanlar), proje özeti, görev durumları (Late, Started, Today, Upcoming, No date).
- **Görev detay:** Slide-out panel veya tam sayfa; yorumlar, aktivite, inline düzenleme, breadcrumb.
- **Planlama:** Tablo görünümü, sütun filtreleme, bar chart (zaman / kapasite), haftalık/aylık/özel aralıklar.

### Todoist
- **Giriş:** Minimal, sade form; web/iOS/Android tutarlı.
- **Ana ekranlar:** Today (bugünkü görevler), Upcoming (takvim benzeri planlama, sürükle-bırak), List / Calendar / Board görünümleri.
- **Stil:** Sade, “calm over chaos”; hızlı görev girişi, doğal dil, filtreler (örn. öncelik 1 + bugün).

### Asana
- Liste, Timeline, Board görünümleri; iş yükü ve hedef dashboard’ları; kurumsal odak, daha karmaşık UI.

### Trello
- Öncelikle **Board (Kanban)**; listeler ve kartlar, liste görünümü yok.

---

## 2. Bizim Uygulamamızda Olması Gereken Ekranlar

| Ekran | Açıklama | Durum |
|-------|----------|--------|
| **Giriş / Kayıt** | E-posta/şifre, Google, “Hesap olmadan devam et”; minimal, güvenilir his. | ✅ Var (LoginView) – sadeleştirilecek |
| **Onboarding** | Hoş geldin + “Hemen başla”; tek seferlik. | ✅ Var |
| **Ana Sayfa (Home)** | Bugün, Yaklaşan, Kategoriler özeti; “Tümünü gör” / Takvim / İstatistik kısayolları. | ✅ Var (HomeView) |
| **Görevler (Liste)** | Tarih gruplu liste, filtre (etiket, öncelik, tekrarlayan), arama, tamamla/düzenle. | ✅ Var (TasksView) |
| **Takvim** | Aylık grid, günlük görev sayısı, tıklayınca o güne git veya görev ekle. | ✅ Var (CalendarView) |
| **Kategoriler** | Kategori listesi, renk, tıklayınca o kategorinin görevleri. | ✅ Var (CategoriesView) |
| **Kategori → Görevler** | Seçilen kategoriye ait görevler, liste. | ✅ Var (CategoryTaskView) |
| **Görev Detay / Düzenle** | Başlık, tarih, saat, tekrarlama, kategori, notlar, sil. | ✅ Var (EditTaskView) |
| **Ayarlar** | Profil, tema, Pro, “Hoş geldin’i tekrar gör”, çıkış. | ✅ Var (SettingsView) |
| **Profil** | İsim, e-posta (okunur). | ✅ Var (ProfileView) |
| **Pro Yükselt** | Pro özellikleri, abonelik. | ✅ Var (ProUpgradeView) |

**Özet:** Tüm temel ekranlar mevcut. Odak: **tutarlı minimal tasarım** (renk, tipografi, kart boyutu, boşluk) ve **giriş ekranının “ürün” hissini güçlendirmek**.

---

## 3. Tasarım İlkeleri (Todoist / Teamwork tarzı)

- **Minimal:** Gereksiz çerçeve ve gölge az; `rounded-xl`, hafif gölge, `p-4`.
- **Tipografi:** Başlıklar `text-xl` / `text-2xl`, gövde `text-sm` / `text-base`; kalınlık sadece vurgularda.
- **Renk:** Mevcut palet (stone/zinc, amber vurgu) korunur; kontrast yeterli.
- **Boşluk:** Sıkı ama nefes alan; `py-3`, `mb-3`, `gap-3`.
- **Giriş ekranı:** Uygulama adı/logo üstte, tek kart (Giriş/Kayıt sekmesi), form, “Google ile devam”, “Hesap olmadan devam” net ve sade.

---

## 4. Yapılacaklar (Bu Sprint)

1. **Giriş ekranı:** App adı alanı, kart hiyerarşisi, buton boyutları ve “Hesap olmadan devam” linki sadeleştirildi.
2. **Ana ekranlar:** Home, Görevler, Takvim – başlık/padding/gölge aynı dilde (docs’taki ilkelere göre).
3. **Domain sonrası:** Aynı kod tabanı; sadece deploy URL ve gerekirse env.

Bu doküman güncel tutulacak; yeni ekran veya kullanıcı akışı eklendiğinde buraya işlenecek.
