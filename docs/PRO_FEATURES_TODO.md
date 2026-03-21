# Pro özellikleri – Bitenler ve yapılacaklar

**Veritabanı:** Bundan sonra ekleme yapılacağı zaman sana **tek bir SQL dosyası** verilecek; "Şu dosyayı Supabase SQL Editor’da çalıştır" denilecek. Adım adım karışıklık olmayacak.

---

## Bitenler (Pro’da uygulandı)

| # | Özellik | Ne yapıldı |
|---|---------|------------|
| 1 | Sınırsız alt görev | Free: görev başına 3, Pro: sınırsız. Limite ulaşınca Pro’ya yönlendirme. |
| 2 | Gelişmiş hatırlatıcılar | Pro: hatırlatma mesajı alanı; bildirimde bu metin gösteriliyor. |
| 3 | Geri sayım | Pro: geri sayım hedefi (tarih/saat); kartlarda "X gün kaldı" etiketi. |
| 4 | Liste paylaşımı | Pro: kategoride "Paylaş" → link; `/share?t=TOKEN` ile salt okunur liste. |
| 6 | Sesle not ekleme | Pro: göreve ses kaydı; kayıt/oynat/sil; kartlarda 🎤. |
| 8 | Özel zil sesi (Pro) | Pro: Varsayılan/Sessiz/Zil/Çan/Yumuşak; bildirimde çalıyor. |
| 11 | Arama & filtreler gelişmiş | Pro: öncelik + tekrar filtreleri (Tümü/Yüksek/Orta/Düşük, Tekrarlayan/Tekrarsız). |
| 12 | Sekme özelleştirme | Pro: Ayarlar’da alt menü sekmeleri aç/kapa; localStorage + BottomNav. |

Bunlara ek olarak daha önce bitmiş olanlar: sınırsız görev/kategori (Free limitleri), tekrarlayan görevler (Free 3 tip / Pro + hafta içi), birden fazla hatırlatma (1 vs 2), görev şablonları, takvim okuma (Google).

---

## Kalan yapılacaklar (Pro tablosunda vaat, henüz uygulama yok)

| # | Özellik | Kısa not |
|---|---------|----------|
| 5 | Takvim çift yön | Şu an Google → uygulama. Pro: uygulama → Google’a da yazma. |
| 7 | Senkron cihaz sayısı | Free 1–2, Pro 5+; backend/abonelik ile sınır. |
| 9 | Eisenhower matrisi | 4 kadran görünümü (Acil+Önemli vb.); sadece Pro. |
| 10 | Pomodoro gelişmiş | Özel süreler, detaylı istatistik, sesler. |
| 13 | Rozet / gamification | Rozetler, streak, puan. |

---

## İleride – platform entegrasyonları

| # | Özellik | Kısa not |
|---|---------|----------|
| 14 | **Apple Takvim (iOS)** | iPhone’daki **Takvim** uygulaması (veri kaynağı çoğunlukla **iCloud Takvim**). Şu an yalnızca **Google Calendar** bağlantısı var; ileride **EventKit** (yerel okuma/yazma) ve/veya **CalDAV** ile Lybell görevlerini Apple takvimiyle senkron veya paylaşım hedefi olarak eklenebilir. Capacitor tarafında native izinler + iOS ayarları gerekir. |

---

## Ürün / UX yol haritası (backlog – kullanıcı maddeleri)

> **Öncelik sırası (güncel):**  
> ~~(1) L0 logosu~~ ✓ · ~~(2) R0 EditTaskView koyu mod~~ ✓ →  
> (3) **Liste paylaşımı testi** (R1).  
> Aşağıdaki **C1–C18** maddeleri rakip incelemesinden; hepsi yapılacaklar listesinde, **zamanla adım adım** işlenecek.

### P0 – hemen

| # | Madde | Detay |
|---|--------|--------|
| ~~**L0**~~ | ~~Giriş – logo~~ | **Yapıldı:** `public/lybell-mark.svg` + app/web `LoginView` (giriş, kayıt, şifremi unuttum). |
| ~~**R0**~~ | ~~EditTaskView koyu mod~~ | **Yapıldı:** `html` üzerinde `dark` sınıfı (app/web `page.tsx`); layout arka planları; app/web `EditTaskView` odak halkaları, tarih/saat `color-scheme`, web’de turuncu aksanlar → Lybell lacivert. |
| R1 | **Liste paylaşımı testi** | Paylaşım linki, `/share?t=TOKEN`, salt okunur liste; uçtan uca doğrulanmadı → **öncelikli QA**. |

---

## Backlog – rakip / pazar özellikleri (C1–C18, adım adım)

| # | Yapılacak | Not |
|---|-----------|-----|
| C1 | **Doğal dil ile görev** | “Yarın 9’da her salı …” → tarih/tekrar parse (Todoist tarzı). |
| C2 | **Kayıtlı filtreler / akıllı listeler** | Sık kullanılan filtre kombinasyonunu tek tıkla açma. |
| C3 | **Kanban / pano görünümü** | Sütunlar, sürükle-bırak (isteğe bağlı Pro). |
| C4 | **Eisenhower / öncelik matrisi** | Pro tablosu #9 ile örtüşür; ürünleştirme. |
| C5 | **Konum hatırlatıcısı** | “X’e gelince hatırlat” (iOS/Android native). |
| C6 | **Takvimde zaman bloklama** | Sürükle-bırak ile süre atama / odak blokları. |
| C7 | **Takvim çift yön (Google)** | Uygulama → Google yazma (Pro #5 ile hizala). |
| C8 | **İş birliği genişlemesi** | Yorum, atama, aktivite geçmişi (liste paylaşımının ötesi). |
| C9 | **Alışkanlık modülü** | Görevden ayrı veya entegre habit takibi (TickTick tarzı). |
| C10 | **Widget / kısayol / Siri** | Hızlı ekleme, iOS widget, kısayollar. |
| C11 | **E-postadan görev** | Inbox e-postası ile görev oluşturma. |
| C12 | **Çevrimdışı + senkron durumu** | Offline kuyruk, “senkronlanıyor” net UI (R7 ile ilişkili). |
| C13 | **Yoğunluk / compact görünüm** | Liste sıkılığı, düşük yoğunluk modu. |
| C14 | **Dışa aktarma genişletme** | iCal / CSV takvim, ek formatlar. |
| C15 | **AI: özet & görev kırma** | R9 araştırması sonrası; sekme veya modal. |
| C16 | **Slack / üçüncü parti entegrasyonlar** | İhtiyaç halinde webhook veya resmi entegrasyonlar. |
| C17 | **Çoklu hatırlatma kanalları** | Push dışında e-posta/SMS vb. (maliyet/policy). |
| C18 | **iPad / çok pencere** | Büyük ekran düzeni (ileri faz). |

---

## Rakip / pazar incelemesi – Lybell’de eksik veya güçlendirilebilecek alanlar

*(Todoist, TickTick, Microsoft To Do, Things, Any.do vb. tipik özellik setine göre; hepsi “yapılacak” değil, ürün kararı gerektirir.)*

| Alan | Rakiplerde sık görülen | Lybell’de durum / fırsat |
|------|-------------------------|---------------------------|
| **Hızlı yakalama** | Doğal dil (“yarın 9’da her salı”), tek alan hızlı ekleme, macOS/iOS kısayol widget | İleride NLP veya şablon kısayolları; Siri / widget (Capacitor sonrası). |
| **Görünümler** | Kanban, Eisenhower matrisi, günlük odak “Bugün” | Takvim + liste var; **matris / pano** backlog’ta kısmen (Pro #9). |
| **Alışkanlık + görev** | TickTick’te habit ayrı modül | Rutinler var; **Dear Me tarzı hazır akışlar** (R12) ile yaklaşılabilir. |
| **Hatırlatma çeşitliliği** | Konum bazlı, birden çok hatırlatma, farklı kanallar | Çoklu hatırlatma Pro’da; **konum** yok → ileride native. |
| **İş birliği** | Yorum, atama, paylaşılan proje | **Liste paylaşımı** var; gerçek zamanlı ortak düzenleme yok. |
| **Entegrasyonlar** | Slack, e-postadan görev, takvim iki yön | **Google** ağırlıklı; çift yön yazma (Pro #5), **Apple Takvim** (#14). |
| **Arama & akıllı listeler** | Kayıtlı filtreler, etiket ağları | Arama/filtre Pro’da; **kaydedilmiş görünümler** eklenebilir. |
| **Odak / zaman** | Takvimde sürükle-bırak bloklama, odak modu | Pomodoro var; **takvimde zaman bloklama** + Dear Me tarzı pomodoro açıklaması (R11). |
| **Çevrimdışı & senkron** | Çevrimdışı düzenleme, çakışma çözümü | İyileştirme: **offline kuyruk**, net senkron durumu (R7 ile bağlantılı). |
| **Kişiselleştirme** | Temalar, yoğunluk, yoğunluk düşük mod | Tema stratejisi (R5); **yoğunluk / görünüm yoğunluğu** ayarı. |
| **Güven & veri** | Dışa aktarma, yedek, hesap taşıma | Dışa aktarma Ayarlar’da var; **iCal/CSV takvim** vb. genişletilebilir. |
| **AI** | Özet, görev kırma, öneri | Ayrı sekme planı (R9); önce rakip davranışı araştırması. |

*(Özet maddeler yukarıdaki **C1–C18** tablosunda numaralı olarak backlog’ta.)*

### P1 – yakın

| # | Madde | Detay |
|---|--------|--------|
| R2 | **Ödeme altyapısı** | Abonelik / Pro satın alma için ödeme entegrasyonu (StoreKit, Play Billing veya web checkout + backend). |
| R3 | **Takvim ekranı – mevsimsel görseller** | Dear Me tarzı: takvim görünümü **mevsime göre** farklı arka plan / illüstrasyon / motif. |
| R4 | **Görsel & hareket araştırması** | Uygulama “renksiz / görselsiz” hissi; hafif animasyonlar, illüstrasyon, mikro-etkileşim araştırması. |
| R5 | **Tema stratejisi + konumlandırma** | Rakip to-do uygulamalarındaki güzel temaları incele; **çok profesyonel** çizgide isek çok tema gereksiz olabilir → ürün konumuna göre karar. |
| R6 | **Ayarlar benchmark** | Diğer uygulamaların ayarlar ekranlarında neler var → Lybell ayarlarını çeşitlendirme / eksikleri kapatma. |
| R7 | **Performans & kod temizliği** | Uygulama hızı, gereksiz kod, bundle ve render tekrarlarının gözden geçirilmesi. |

### P2 – orta vade

| # | Madde | Detay |
|---|--------|--------|
| R8 | **Hamburger / yan menü** | Alt menünün başına **üç çizgi**; yan drawer’da ek seçenekler (Microsoft To Do benzeri). |
| R9 | **AI sekmesi (öncesi araştırma)** | İleride **AI sekmesi** eklenecek; öncesinde başka uygulamalarda bu sekmede neler yapıldığı **denenerek / not alınarak** netleştirilecek. |
| R10 | **Profil ekranı (Dear Me tarzı)** | Alt menüde **Profil**; profilde küçük **ayarlar ikonu** → Ayarlar. Profilde pomodoro özeti, kullanıcı bilgileri, istatistikler vb. |
| R11 | **Pomodoro + bilgi içeriği** | Dear Me tarzı: sayaç ekranında “Pomodoro tekniği nasıl çalışır?” tıklanabilir kısa metin → açılan açıklayıcı içerik. |

### P3 – ileri aşama

| # | Madde | Detay |
|---|--------|--------|
| R12 | **Hazır rutin akışları** | Dear Me benzeri: kedi bakımı, ev temizliği gibi **şablon rutin akışları** (çok sonraki faz). |

---

**Güncel şema:** `000_full_schema.sql` (veya senin çalıştırdığın ana şema) + `007_task_templates.sql` + `010_eksikleri_tamamla.sql` ile şu anki yapı tamam. Yeni özellik gelince yine tek SQL dosyası verilecek.
