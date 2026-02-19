# Pro Sürüm – Katma Değer Önerileri ve Yol Haritası

53 görselden ve mevcut uygulamadan çıkarılan **tasarım** ve **işlevsel** öneriler. Hangilerini entegre edeceğimizi ve nasıl ilerleyeceğimizi bu dokümana göre karar verebilirsin.

---

## 1. Tasarım odaklı öneriler

| Öneri | Açıklama | Zorluk |
|-------|----------|--------|
| **Pro / Premium ekranı** | "Pro'ya yükselt" veya "Premium" tek sayfa: başlık + 4–6 özellik (tik), illüstrasyon veya hero görsel, plan kartları (Aylık / Yıllık / Ömür boyu), CTA butonu. Örnek: son görseldeki konfeti + high-five illüstrasyonu. | Orta |
| **Plan kartları** | Aylık / Yıllık / Kalıcı; "Önermek" veya "Popüler" şeridi; çizili eski fiyat + haftalık fiyat ("₺X/hafta"); seçili kart border veya arka plan. | Kolay |
| **Tema / görünüm seçimi** | Ayarlar içinde "Tema": Saf renk (5–10 swatch), isteğe bağlı Doku/Manzara (Pro’da taç). Seçili tema ✓; Pro temalar taç ikonu. | Orta |
| **Sekme çubuğu özelleştirme** | Ayarlar’da "Sekme Çubuğu": Aktif sekmeler (kaldır -), Devre dışı (ekle +), sıralama. Max sekme sayısı (Free: 3–4, Pro: 5+). | Orta |
| **Safe area tutarlılığı** | Tüm yeni modallarda ve full-screen ekranlarda `safe-area-body` / `nav-safe-bottom` kullanımı; APK/iOS’ta üst/alt taşma olmaması. | Kolay |
| **Boş durum illüstrasyonları** | "Görev yok", "Kategori yok", "Rozet yok" gibi ekranlarda kısa metin + basit illüstrasyon veya ikon (referans: PlanWiz, Skylight). | Kolay |
| **Bildirim izni ekranı** | Onboarding veya ilk bildirim açılışında tek ekran: "Bildirimleri aç" + 3–5 fayda (tik) + "Etkinleştir" / "Maybe Later" (referans: 8. görsel). | Kolay |

---

## 2. İşlevsel (Pro) özellik önerileri

| Özellik | Kısa açıklama | Free / Pro ayrımı | Zorluk |
|---------|----------------|-------------------|--------|
| **Sınırsız / sınırlı liste** | Kategori veya görev sayısı limiti (Free: örn. 2 kategori, 20 görev; Pro: sınırsız). | Free: limit, Pro: sınırsız | Orta |
| **Tekrarlayan görevler** | Günlük/haftalık/aylık tekrarlama; özelleştirilebilir (Pro’da tam, Free’de basit). | Free: basit tekrar, Pro: tam özelleştirme | Orta |
| **Gelişmiş hatırlatmalar** | Birden fazla hatırlatma saati, "sürekli hatırlat" (Pro). Free: görev başına 1 hatırlatma. | Free: 1, Pro: çoklu / gelişmiş | Orta |
| **Widget’lar** | Ana ekran widget’ı: bugünün görevleri, mini takvim, geri sayım. Pro: daha fazla boyut/stil. | Free: 1 basit, Pro: 4+ stil / boyut | Yüksek (native) |
| **Temalar** | 4–5 varsayılan tema (Free); 40+ veya "Malzeme Sen" / manzara serisi (Pro). | Free: 4 tema, Pro: 40+ / özel | Orta |
| **Reklamları kaldırma** | Free’de banner veya ara reklam; Pro’da reklam yok. | Free: reklam, Pro: reklamsız | Orta (reklam entegre gerekir) |
| **Görev şablonları** | Hazır şablonlar (örn. "Günlük rutin", "Alışveriş"). Pro: sınırsız özel şablon. | Free: 2–3 sabit, Pro: sınırsız | Orta |
| **Ekler (dosya)** | Göreve dosya/link ekleme. Pro’da açık; Free’de kapalı veya 1 ek/görev. | Free: 0 veya 1, Pro: sınırsız | Yüksek (storage) |
| **Öncelik sembolleri** | Öncelik (yüksek/orta/düşük) + sembol veya renk. Pro: daha fazla sembol/renk. | Her iki sürümde; Pro’da genişletilmiş | Kolay |
| **Geri sayım** | Belirli bir tarihe geri sayım (doğum günü, etkinlik). Pro: sınırsız; Free: 1–2. | Free: 1–2, Pro: sınırsız | Orta |
| **Otomatik senkronizasyon** | Zaten Supabase ile var; Pro’da "tüm cihazlarda anında" vurgusu, Free’de "temel senkron" ifadesi. | Aynı teknik; iletişim farkı | Kolay |
| **Liste / kategori paylaşımı** | Ortak liste (aile, ekip). Pro özelliği. | Pro | Yüksek |
| **Profil / rozetler** | Başarı rozetleri, seviye (Lv.1 Beginner), "My Achievement Score". Pro’da daha fazla rozet. | Free: temel, Pro: tam gamification | Orta |
| **Dört bölge matrisi (Eisenhower)** | Önemli/acil matris görünümü. Sekme çubuğunda veya Pro’da. | Pro veya opsiyonel sekme | Orta |
| **Pomodoro** | Zaten var; Pro’da gelişmiş (istatistik, süre özelleştirme). | Free: temel, Pro: gelişmiş | Kolay |
| **Arama** | Görev/kategori arama. Free’de basit; Pro’da gelişmiş filtreler. | Her iki sürümde; Pro’da filtreler | Orta |

---

## 3. Abonelik / fiyatlandırma (entegrasyon)

| Öğe | Açıklama |
|-----|----------|
| **Plan yapısı** | Aylık, Yıllık (indirimli + "Popüler"), Ömür boyu ("Önermek"). Haftalık fiyat vurgusu (₺X/hafta). |
| **Ücretsiz deneme** | 3–14 gün; deneme bitince otomatik ücretlendirme; "İstediğin zaman iptal et" metni. |
| **Mevcut abone** | "ZATEN AYLIK PRO'SUNUZ" / "ZATEN PRO'SUNUZ" banner veya buton; Şartlar, Gizlilik, Geri Yükle linkleri. |
| **Teknik** | Google Play Billing (Android), App Store (iOS); backend’de abonelik durumu (Supabase veya kendi API). |

---

## 4. Önerilen ilerleme sırası (nasıl entegre edelim)

**Faz 1 – Temel Pro iskeleti (hızlı kazanım)**  
1. **Pro/Premium ekranı** (tek sayfa): Başlık, 4–6 özellik listesi, "Şimdi Yükselt" butonu. Ayarlar’dan veya belirli bir limite takılınca açılsın.  
2. **Abonelik durumu (mock)** : `isPro` veya `subscriptionStatus` state (başta hep false); buton metni "Pro'ya Yükselt" veya "Zaten Pro'sunuz" (test için manuel değiştirilebilir).  
3. **Plan kartları UI** : Aylık / Yıllık / Kalıcı kartları; fiyat placeholder; "Önermek" / "Popüler" etiketleri. Gerçek ödeme entegre edilmeden sadece tasarım.

**Faz 2 – Free / Pro ayrımı (limitler)**  
4. **Limitler** : Kategori sayısı (Free: 2, Pro: sınırsız), görev sayısı (Free: 50, Pro: sınırsız) veya benzeri. Limite ulaşınca Pro ekranına yönlendir.  
5. **Tekrarlayan görev** : Free’de basit (günlük/haftalık sabit), Pro’da özel tekrarlama kuralları.  
6. **Hatırlatma** : Free’de görev başına 1; Pro’da çoklu hatırlatma.

**Faz 3 – Tema ve görünüm**  
7. **Tema seçimi** : Ayarlar’da 4–5 renk/tema (Free); ek temalar veya "Malzeme Sen" (Pro). Taç ikonu ile Pro temaları işaretle.  
8. **Sekme çubuğu özelleştirme** : Hangi sekmelerin görüneceği; max sekme sayısı Free’de 4, Pro’da 5+.

**Faz 4 – İleri özellikler**  
9. **Widget** (Android/iOS native): En az 1 basit widget (bugünün görevleri); Pro’da ek boyutlar.  
10. **Paylaşım** : Liste/kategori paylaşımı (Pro).  
11. **Şablonlar, ekler, geri sayım** : İhtiyaca göre sırayla.

**Faz 5 – Gelir ve yasal**  
12. **Google Play / App Store faturalandırma** gerçek entegrasyonu.  
13. **Şartlar & Gizlilik** metinlerini doldur; "Geri Yükle" ile satın alımı geri yükleme.

---

## 5. Hızlı karar listesi (senin seçimin)

Aşağıdakileri **evet / hayır / sonra** diye işaretleyebilirsin; ona göre ilk sprint’i netleştiririz.

- [ ] Pro ekranı (tek sayfa, özellik listesi + plan kartları)  
- [ ] Abonelik durumu (mock: isPro)  
- [ ] Kategori / görev limiti (Free vs Pro)  
- [ ] Tekrarlayan görev (basit vs gelişmiş)  
- [ ] Çoklu hatırlatma (Pro)  
- [ ] Tema seçimi (4–5 Free, ek Pro)  
- [ ] Sekme çubuğu özelleştirme  
- [ ] Widget (en az 1 tane)  
- [ ] Reklam (Free) + reklam kaldırma (Pro)  
- [ ] Görev şablonları  
- [ ] Geri sayım bileşeni  
- [ ] Profil / rozet / başarı puanı  
- [ ] Dört bölge matrisi (Eisenhower)  
- [ ] Liste paylaşımı  

İlk adım olarak **Faz 1** (Pro ekranı + plan kartları + mock abonelik) ile başlamak mantıklı; sonra limitleri ve tekrarlayan görevi ekleyerek Free/Pro ayrımını hissettiririz. Hangilerini önce yapalım, söylemen yeterli.
