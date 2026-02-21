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

**Güncel şema:** `000_full_schema.sql` (veya senin çalıştırdığın ana şema) + `007_task_templates.sql` + `010_eksikleri_tamamla.sql` ile şu anki yapı tamam. Yeni özellik gelince yine tek SQL dosyası verilecek.
