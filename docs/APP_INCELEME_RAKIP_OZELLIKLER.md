# App İnceleme: Eksik Özellikler ve Rakip Karşılaştırması

Tarih: 2025-02

## 1. Mevcut Uygulama Özeti

### 1.1 Şu an uygulamada olanlar (eksik değil)

| Alan | Özellik | Durum |
|------|---------|--------|
| **Kimlik** | E-posta/Google giriş, misafir | ✅ |
| **Limitler** | Free: 50 görev, 2 kategori, 3 alt görev; Pro: sınırsız | ✅ |
| **Görev** | CRUD, tarih/saat, öncelik, tekrar (gün/hafta/ay + hafta içi Pro), 1–2 hatırlatma, hatırlatma mesajı (Pro), geri sayım (Pro) | ✅ |
| **Alt görev** | Var; Free 3, Pro sınırsız | ✅ |
| **Etiketler** | Görevde tags, EditTaskView’da seçim | ✅ |
| **Listeler** | Kategoriler, To Do / In Progress / Completed, arama, Pro’da Paylaş butonu + link kopyalama | ✅ |
| **Ana sayfa** | Bugün, Yaklaşan, Gecikmiş, Bugün Odakta (My Day), Pomodoro özeti, listeler özeti | ✅ |
| **Görevler** | Bugün / Yaklaşan / Tamamlanan sekmeleri, arama, **Pro: Öncelik + Tekrar filtreleri** | ✅ |
| **Takvim** | Aylık görünüm, gün seçimi, seçili günde görevler; Pro: Google Takvim okuma | ✅ |
| **Pomodoro** | 25+5 dk, kayıt, bugün/hafta/streak | ✅ |
| **Ayarlar** | Profil, karanlık mod, bildirimler, dil, Pro: dışa aktarma, sekme özelleştirme, özel zil, şablonlar | ✅ |
| **Pro** | Sesle not, şablonlar, liste paylaşımı, Pro filtreleri | ✅ |

**Sonuç:** Kritik eksik özellik yok. Pro filtreleri ve Paylaş butonu eklendi.

---

## 2. Rakip İncelemesi

### 2.1 Teamwork (takım / proje odaklı)

Teamwork daha çok **takım ve proje yönetimi** için; senin uygulama **kişisel todo + hafif liste paylaşımı**. Yine de fikir çıkarılabilecek özellikler:

| Özellik | Teamwork | Bizde | Öneri |
|--------|----------|--------|--------|
| Timeline / Gantt | Var, sürükle-bırak tarih | Yok | Pro’da basit timeline (haftalık görev çubukları) eklenebilir. |
| Takım ataması | Görev atama, iş yükü | Yok (kişisel app) | Kişisel sürümde gerek yok; “liste paylaşımı” ile zaten ortak liste var. |
| AI asistan | AI filtre, planlama, task wizard | Yok | İleride: “Bu görevi parçala”, “tarih öner” gibi Pro özellikleri düşünülebilir. |
| Takvim entegrasyonu | Google + Outlook | Sadece Google (okuma) | Pro’da çift yön (yazma) zaten planlı. |
| İş akışları / otomasyon | Board aşamaları, otomasyon | Yok | Kişisel için “tamamlandığında X” gibi basit kurallar ileride. |
| Raporlama | Gelişmiş raporlar, CSV | Pro’da JSON/CSV dışa aktarma var | Mevcut yeterli; istenirse “bu hafta tamamlanan” özet rapor eklenebilir. |

**Özet:** Teamwork’ten kişisel app’e en mantıklı taşınabilecekler: **basit timeline görünümü (Pro)** ve ileride **hafif AI (görev parçalama / tarih önerisi)**.

---

### 2.2 Todoist

| Özellik | Todoist | Bizde | Öneri |
|--------|---------|--------|--------|
| Doğal dil girişi | “Yarın 14:00’te toplantı @iş #acil” → tarih, proje, öncelik | Manuel tarih/saat, kategori seçimi | **Quick add + doğal dil:** Tek satırda “pazartesi 9’da market” yazınca tarih/saat parse. Öncelikli ekleme. |
| AI (Task Assist / Ramble) | Görevi parçalama, sesle görev | Sesle not (Pro) var; parçalama yok | Pro’da “Bu görevi alt görevlere böl” veya ses → metin ile hızlı görev. |
| Entegrasyonlar | 80+ | Google Takvim, Supabase | Şimdilik yeterli. |
| Filtreler / etiketler | Karmaşık filtreler | Pro: öncelik + tekrar; etiket var | Etiket bazlı filtre (TasksView’da) eklenebilir. |

**Özet:** En büyük fark **quick add + doğal dil**. Bu eklenirse kullanım hızı ciddi artar.

---

### 2.3 TickTick

| Özellik | TickTick | Bizde | Öneri |
|--------|----------|--------|--------|
| Pomodoro | Timer + istatistik, özel süreler | 25+5, bugün/hafta/streak | Pro’da **özel süreler** (örn. 15/20/45 dk) ve daha detaylı istatistik (PRO_FEATURES_TODO’da var). |
| Eisenhower matrisi | 4 kadran görünümü | Yok | **Pro’da Eisenhower görünümü** (Acil+Önemli vb.) planlı; yapılacaklar listesinde. |
| Alışkanlık takibi | Habit tracker, streak | Yok | İleride “günlük tekrarlayan” görevleri habit olarak vurgulayabilir veya ayrı “Alışkanlıklar” bölümü. |
| Takvim | Takvim + görev birleşik | Ayrı takvim sayfası, liste | Mevcut yapı yeterli; istenirse “haftalık” takvim görünümü. |

**Özet:** Eisenhower ve gelişmiş Pomodoro, mevcut Pro roadmap ile uyumlu; öncelik verilebilir.

---

### 2.4 Things 3

| Özellik | Things 3 | Bizde | Öneri |
|--------|----------|--------|--------|
| Tasarım / UX | Çok sade, Apple odaklı | Sade tasarım (sıcak arka plan, max-w-md) | Tasarım yeterince sade; küçük animasyonlar (checkbox, kart) ile hissedilen kalite artırılabilir. |
| Bugün / Bu Akşam | Gün içi bölümleme | “Bugün” tek liste | “Bugün” içinde **Bu sabah / Bu akşam** veya zaman dilimi grupları isteğe bağlı. |
| Tek seferlik ödeme | Abonelik yok | Free / Pro abonelik | İş modeli farkı; değiştirmeye gerek yok. |

**Özet:** Things’ten çıkarılacak en iyi şey: **gün içi bölümleme** (sabah/akşam) ve **mikro animasyonlar**.

---

## 3. Eksik veya Zayıf Noktalar (Kısa Liste)

1. **Doğal dil / quick add yok**  
   Görev eklerken tek satırda “yarın 10’da dişçi” gibi yazıp tarih/saatin otomatik parse edilmemesi.

2. **Eisenhower matrisi yok**  
   Pro roadmap’te var; henüz uygulanmadı.

3. **Pomodoro sabit 25+5**  
   Pro’da özel süreler ve daha detaylı istatistik planlı, yapılmadı.

4. **Takvim çift yön yok**  
   Sadece Google → uygulama; uygulama → Google’a yazma yok (planlı).

5. **Şablonların Pro’ya kısıtlanması**  
   Denetimde “opsiyonel” denmiş; UI’da şablonlar Pro’ya kısıtlanmamış olabilir.

6. **Etiket bazlı filtre**  
   Görevler sayfasında etiketle filtreleme yok (öncelik/tekrar var).

7. **Sesle görev ekleme (Pro)**  
   Yeni görev oluştururken “sesle ekle” ile konuşup başlık (ve isteğe bağlı tarih/saat) söyleyerek tek tıkla görev eklenemiyor; sadece mevcut göreve sesle not (Pro) var.

---

## 4. Yeni Eklenebilecek Özellikler (Öncelik Sırasıyla)

### Yüksek değer / rakiplerde güçlü

| # | Özellik | Neden | Zorluk |
|---|---------|--------|--------|
| 1 | **Quick add + doğal dil** | Todoist’in en güçlü tarafı; tek satırda görev + tarih/saat. | Orta (tarih parse kütüphanesi veya basit kurallar). |
| 2 | **Eisenhower görünümü (Pro)** | TickTick/rakiplerde var; öncelik netleşir. | Orta (yeni view + filtre). |
| 3 | **Pomodoro özelleştirme (Pro)** | 15/25/45 dk, mola süresi, detaylı istatistik. | Düşük–orta. |
| 4 | **Sesle görev ekleme (Pro)** | Görev eklerken sesle başlık (ve isteğe bağlı tarih/saat) söyleyip yeni görev oluşturma; Todoist Ramble benzeri. | Orta (Web Speech API veya backend STT). |

### Orta değer

| # | Özellik | Neden | Zorluk |
|---|---------|--------|--------|
| 5 | **Takvim çift yön (Pro)** | Uygulama → Google’a yazma; roadmap’te. | Orta (Google API yazma). |
| 6 | **Etiket bazlı filtre (Görevler)** | Pro’da öncelik/tekrar var; etiket de olursa tutarlı. | Düşük. |
| 7 | **Bugün içinde sabah/akşam bölümü** | Things tarzı gün içi gruplama. | Düşük. |

### Teamwork’ten ilham / ileride

| # | Özellik | Neden | Zorluk |
|---|---------|--------|--------|
| 8 | **Basit timeline (haftalık)** | Pro’da görevleri tarih çubuğu ile görmek. | Orta. |
| 9 | **Hafif AI** | “Bu görevi alt görevlere böl”, “tarih öner” (Pro). | Yüksek. |
| 10 | **Haftalık tamamlanan özet raporu** | Raporlama hissi, dışa aktarmayı tamamlar. | Düşük. |

### Roadmap’te zaten olan

- Takvim çift yön (Pro)  
- Senkron cihaz sayısı (Free 1–2, Pro 5+)  
- Eisenhower matrisi (Pro)  
- Pomodoro gelişmiş (Pro)  
- Rozet / gamification  

---

## 5. Sonuç ve Önerilen Sıra

- **Eksik kritik özellik yok.** Pro filtreleri ve Paylaş tamam.
- **Rakiplere göre en büyük fırsat:** **Quick add + doğal dil** (Todoist benzeri).
- **Teamwork:** Takım odaklı; kişisel app’e en uygun taşınabilir fikirler: basit **timeline** ve ileride **hafif AI**.
- **Hemen eklenebilecek küçük iyileştirmeler:** Etiket filtresi (Görevler), Bugün’de sabah/akşam, şablonların Pro’ya kısıtlanması.

**Önerilen uygulama sırası (kısa vadede):**  
1) Quick add + basit doğal dil (tarih/saat parse)  
2) Eisenhower görünümü (Pro)  
3) Pomodoro özelleştirme (Pro)  
4) **Sesle görev ekleme (Pro)** – görev eklerken sesle başlık/tarih söyleyip yeni görev oluşturma  
5) Etiket filtresi (Pro, Görevler sayfası)

Bu belge yarın “rakipleri incele, eksik var mı, yeni ne ekleyebiliriz?” sorusuna cevap olarak kullanılabilir.
