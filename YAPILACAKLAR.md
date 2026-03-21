# Yapılacaklar ve Notlar

## 🔧 Altyapı / domain geçişi (lybell.app)

| # | Madde | Durum / not |
|---|--------|-------------|
| 1 | **E-posta SMTP testi** | Yeni hesap oluştur veya "Şifremi unuttum" dene. Mail **Lybell** adından ve **noreply@lybell.app** adresinden geliyorsa Resend + Supabase SMTP tamamdır. İlk işlerden biri. |
| 2 | **E-posta şablonları – tasarım** | Supabase Email Templates temel düzenleme yapıldı. Sonrası: daha renkli, farklı tasarımlı, Lybell markasına uygun profesyonel e-posta şablonları hazırlamak. |
| 3 | **Mobil deep link** | `lybell://` veya App ID scheme (`com.cursordeneme.app://`) – şu an kullanılmıyor; ileride native OAuth / external browser geri dönüşü için değerlendirilecek. Sonra detaylı konuşulacak. |
| 4 | **Edge function deploy ve secrets** | Supabase CLI ile deploy, Project Settings → Edge Functions → Secrets. Son madde olarak detaylı konuşulacak. |

---

## 📌 Yarın / sonra bakılacaklar (not alındı)

| # | Madde | Not |
|---|--------|-----|
| 1 | **Görev ekle sayfası tasarımı** | ✅ Yapıldı: Başlıktaki 3 not (Şablondan, Kaydet, liste uyarısı) ve alttaki "Şablon olarak kaydet" kaldırıldı. |
| 2 | **Pro özelliğini vurgulama** | ✅ Yapıldı: Takvimde Pro rozeti + Free’de Pro’ya yönlendirme; Görevler’de Pro filtre rozeti; Listeler’de “Pro’da sınırsız”. |
| 3 | **Dışa aktarma → Pro** | ✅ Yapıldı: Ayarlarda dışa aktar + CSV yanına Pro işareti; Free tıklayınca Pro sayfasına yönlendiriliyor. |

---

## 🔜 Sonraki aşamada yapılacaklar (veri / performans)

| Öncelik | Madde | Açıklama |
|--------|--------|----------|
| C | **Görev/liste verisi için merkezi cache** | ✅ Yapıldı: `app/page.tsx` içinde merkezi `tasks` + `loadTasks` ve `categories` + `loadCategories`; tüm ilgili view’lara prop olarak geçiriliyor. Ekran değişince yeniden fetch yok, mutasyonlarda tek seferlik refresh. |

---

## 📱 Arayüz stratejisi
- **Şu an:** Arayüz sadece **app** (mobil/tek ekran) olarak düşünülüyor.
- **Proje bitince:** Ayrı bir **web arayüzü** yapılacak; o zaman web için farklı ilerlenecek.

---

## 🆓 Ücretsiz uygulamalardan / ücretsiz versiyonlardan eklenebilecek özellikler (bizde olmayanlar)

Aşağıdaki liste, tipik ücretsiz to-do uygulamalarında olup **bizde henüz olmayan** veya **eksik** özellikler.

| Özellik | Bizde var mı? | Durum / not |
|--------|----------------|-------------|
| **Görev bazlı hatırlatıcı (reminder)** | ❌ | Ayarlarda "Bildirimler" toggle var ama görev başına hatırlatma saati yok. **Eklendi:** `reminderAt` alanı + form alanı. Bildirim tetikleme sonra. |
| **"Bugün" hızlı filtre** | ✅ | Tarih strip'te "Bugün" butonu var. |
| **"Önemli" / yüksek öncelik hızlı filtre** | ❌→✅ | **Eklendi:** Görevler sayfasında "Önemli" filtre butonu (sadece yüksek öncelikli görevler). |
| **Etiketler (tags)** | ✅ | Var. |
| **Alt görev (checklist)** | ✅ | Var (subtasks). |
| **Sürükle-bırak ile sıralama** | ❌ | Yok. İleride: aynı gün içinde görev sırası (orderIndex + yukarı/aşağı veya drag). |
| **Açık/koyu tema** | ✅ | Var. |
| **Basit istatistik** | Kısmen | Pomodoro ve kategori ilerlemesi var. "Bu hafta X görev tamamlandı" gibi özet eklenebilir. |
| **Widget (ana ekran)** | ❌ | Web/PWA için sonra düşünülebilir. |

---

## 1. Maddede yazanlar – netleştirme ve eklenecekler

(Önceki listedeki: hatırlatıcı, alt görev, etiketler, hızlı filtreler, sürükle-bırak, tema, widget, basit istatistik.)

| Madde | Bizde | Eklendi / yapılacak |
|-------|-------|----------------------|
| Hatırlatıcı (görev başına saat) | Yoktu | ✅ Görev modeline `reminderAt` (opsiyonel), görev formunda "Hatırlatma" saati alanı eklendi. Bildirim tetiklemesi sonra. |
| Alt görev | Var | — |
| Etiketler | Var | — |
| "Bugün" / "Önemli" hızlı filtre | Bugün var, Önemli yoktu | ✅ Görevler sayfasına "Önemli" filtre butonu eklendi. |
| Sürükle-bırak sıralama | Yok | Sonra: orderIndex + sıralama UI. |
| Tema | Var | — |
| Widget | Yok | Proje bitince / web arayüzü ile değerlendirilebilir. |
| Basit istatistik | Kısmen | İstenirse "Bu hafta X tamamlandı" eklenebilir. |

---

---

## 🔍 Geniş rakip incelemesi (ücretsiz versiyonlar)

Çok sayıda to-do / task uygulamasının ücretsiz versiyonları incelendi. Aşağıda incelenen uygulamalar ve “bizde eksik olabilecek” özelliklerin özeti var.

### İncelenen uygulamalar (örnekler)

| Uygulama | Tip | Ücretsiz versiyonda dikkat çekenler |
|----------|-----|--------------------------------------|
| **Todoist** | Genel | Projeler, tekrarlayan, öncelik, doğal dil; ücretsizde hatırlatma yok, 5 proje |
| **TickTick** | Genel | Pomodoro, alışkanlık, takvim, etiketler, öncelik, birden fazla görünüm, konum hatırlatıcısı (iOS), sesle ekleme |
| **Microsoft To Do** | Genel | Sınırsız liste, My Day, yıldız, alt görev, not, dosya (25MB), paylaşım, atama, temalar |
| **Google Tasks** | Genel | Listeler, alt görev, tarih, bildirim, sürükle-bırak sıralama, yıldız, Gmail/Calendar entegrasyonu |
| **Any.do** | Genel | Günlük planlayıcı, takvim, renkli etiketler, zamanlı/tekrarlayan hatırlatma, widget, paylaşılan listeler |
| **Apple Reminders** | Apple | Akıllı listeler (Bugün, Zamanlanmış, Bayraklı, Tamamlanan), etiketler, konum hatırlatıcısı, paylaşım, bölümler |
| **Remember The Milk** | Genel | Smart Add (tek satırda tarih/öncelik/tekrar/etiket), güçlü arama, Smart Lists, e-posta/Siri ile ekleme |
| **Trello** | Kanban | Tahtalar, listeler, kartlar, sürükle-bırak, atama, son tarih, otomasyon (sınırlı), Power-Ups |
| **Notion** | Workspace | Veritabanı, tablo/liste/takvim görünümü, özelleştirilebilir alanlar, şablonlar |
| **ClickUp** | Genel | Birden fazla görünüm, cömert ücretsiz plan |
| **Asana** | Takım | Zaman çizelgesi, iş akışları, entegrasyonlar |
| **Google Keep** | Notlar | Ses notu, konum hatırlatıcısı, OCR (daha çok not uygulaması) |
| **Workflowy** | Minimal | Sonsuz iç içe listeler, hızlı arama |
| **Tweek** | Minimal | Haftalık takvim, otomatik task rollover |
| **TeuxDeux** | Minimal | Günlük görünüm, task rollover, Someday listesi |
| **Things 3** | Apple | Bugün görünümü, Markdown, tek seferlik satın alma |
| **OmniFocus** | Apple | Inbox, perspektifler, tahmin görünümü, etiketler, tekrarlayan |
| **Tasks.org** | Açık kaynak | Özel filtreler (tarih, öncelik, AND/OR/NOT) |
| **Habitica** | Oyunlaştırma | Görev + alışkanlık, rozetler (farklı niş) |
| **Flask / Todoi** | Minimal | Hesapsız, tarayıcıda kalır |

---

### Ücretsiz versiyonlarda sık görülen özellikler – bizim durumumuz

| Özellik | Rakip örnekleri (ücretsiz) | Bizde? | Not |
|--------|----------------------------|--------|-----|
| Görev başına hatırlatma (saat) | Todoist (Pro’da), TickTick, MS To Do, Any.do, Apple, RTM | ✅ Alan var | Bildirim tetiklemesi henüz yok |
| "Bugün" / "My Day" görünümü | MS To Do, Any.do, Apple (Today), Things | ✅ | Tarih strip’te Bugün, ana sayfada bugün |
| Yıldız / bayrak / önemli | MS To Do (star), Google (star), Apple (Flagged) | ✅ | Öncelik + "Önemli" filtre |
| Alt görev / checklist | Hepsi | ✅ | Var |
| Etiketler / tags | Todoist, TickTick, Any.do, Apple, RTM, Notion | ✅ | Var |
| Tekrarlayan görev | Todoist, TickTick, MS To Do, Any.do, Apple, RTM | ✅ | Haftalık, aylık, hafta içi |
| Takvim görünümü | TickTick, Any.do, MS To Do, Notion, Tweek | ✅ | Takvim sayfamız var |
| Kategori / liste / proje | Hepsi | ✅ | Kategoriler |
| Öncelik seviyesi | Todoist, TickTick, Google, RTM, Notion | ✅ | Yüksek / orta / düşük |
| **Görev arama** | Todoist, TickTick, RTM, Workflowy, Tasks.org | ❌ | Metinle görev arama yok |
| **Sürükle-bırak sıralama** | Trello, Google Tasks, birçok uygulama | ❌ | Aynı gün içi sıra değiştirme yok |
| **Geçmiş / overdue vurgulama** | Apple (Today’da overdue), MS To Do, birçok uygulama | ❌ | Geçmiş tarihli görevler özel gösterilmiyor |
| Tamamlananları filtreleme / arşiv | Apple (Completed), RTM (7 gün arşiv), CategoryTaskView’da tamamlanan | Kısmen | Kategori sayfasında var; görevler listesinde "sadece tamamlanan" yok |
| Veri dışa aktarma / yedek | RTM, Todoist (Pro’da tam yedek), MS/Google ekosistemi | Kısmen | Ayarlarda "Verileri dışa aktar" (mock) var |
| Dosya ekleme (görev başına) | MS To Do (25MB), Trello (10MB), Notion | ❌ | Yok |
| Konum hatırlatıcısı | TickTick (iOS), Apple, Google Keep | ❌ | Pro’da düşünülebilir |
| Paylaşım / atama | MS To Do, Google, Any.do, Apple, Trello | ❌ | Pro / takım özelliği |
| "My Day" gibi günlük odak listesi | MS To Do, Any.do | Kısmen | Bugün görünümü var; "her gün sıfırlanan odak listesi" yok |
| Widget | Any.do, birçok mobil uygulama | ❌ | Web/PWA sonra |
| Doğal dil / sesle ekleme | Todoist, TickTick | ❌ | Pro’da düşünülebilir |
| Kanban / farklı görünümler | Trello, Notion, TickTick, ClickUp | ❌ | Sadece liste + takvim |
| Akıllı liste (çok kriterli filtre) | Apple (Smart Lists), RTM (Smart Lists), Tasks.org | Kısmen | Etiket + önemli + tarih var; "kaydedilmiş filtre" yok |

---

### Bizde ücretsiz versiyonda net eksikler (öncelikli eklenebilir)

1. **Görev arama** – Tüm görevlerde başlık/açıklama ile metin araması.
2. **Sürükle-bırak veya yukarı/aşağı ile sıralama** – Aynı gün (veya aynı liste) içinde görev sırasını değiştirme.
3. **Geçmiş (overdue) vurgulama** – Bugünün görünümünde veya listede geçmiş tarihli görevleri farklı gösterme (örn. renk, etiket "Gecikmiş").
4. **Tamamlananları görüntüleme** – Görevler sayfasında "Tamamlanan" filtre veya ayrı bir "Tamamlananlar" görünümü (şu an sadece kategori sayfasında var).
5. **Hatırlatma bildirimi** – `reminderAt` verisi var; tarayıcı bildirimi veya (mobilde) push ile gerçekten hatırlatma.

### İsteğe bağlı (ücretsiz) – tamamlandı

- ✅ Basit "Bu hafta X görev tamamlandı" istatistiği (ana sayfa alt başlık + completedAt ile hesaplama).
- ✅ Görev başına dosya ekleme (tek dosya, max 500 KB; görev düzenleme formunda).
- ✅ "Bugün Odakta" (My Day) listesi: günlük sıfırlanan odak listesi, ana sayfada blok + Bugün listesinde yıldız ile ekleme/çıkarma.

---

## Pro kısım (sonra)

- Sesle not ekleme  
- Pro özellikleri  
- Giriş ekranı – kullanıcı kaydetme  
- Takvime kişisel hesapları (Google/Outlook vb.) bağlama  

Önce ücretsiz özellikler tamamlanacak, sonra pro kısma geçilecek.
