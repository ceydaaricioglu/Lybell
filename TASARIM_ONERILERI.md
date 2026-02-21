# Tasarım İncelemesi ve Öneriler

Her sayfayı tek tek ele alıp tutarlılık, diğer uygulamalardan esinlenmeler ve iyileştirme fikirleri bu dosyada toplandı. İstediğin maddeleri sırayla uygulayabilirsin.

---

## 1. Genel tutarlılık (ana sayfa ile uyum)

### Şu an iyi gidenler
- **Arka plan:** Light `#f5f0ea`, dark `#0f0f0f` – Ana sayfa, Görevler, Takvim, Ayarlar, Görev düzenleme aynı paleti kullanıyor.
- **Vurgu rengi:** Amber (turuncu-sarı) butonlarda ve aktif durumda tutarlı.
- **Kartlar:** `rounded-2xl`, hafif gölge veya border – çoğu sayfada aynı.
- **Alt navigasyon:** Sayfa arka planı ile uyumlu, amber FAB ortak.

### Dikkat edilmesi gerekenler
| Konu | Durum | Öneri |
|------|--------|--------|
| **Header yüksekliği** | ✅ Uygulandı | Tüm sayfalarda `pt-6 pb-4` (sticky’de `py-5`) kullanılıyor. |
| **Geri butonu** | Hep `w-10 h-10 rounded-xl` | ✅ Tutarlı; bırakılabilir. |
| **Başlık fontu** | Kimi `text-2xl`, kimi `text-xl`, kimi `text-3xl` | Ana sayfa “Hoş geldin” büyükse diğer sayfa başlıkları bir alt seviye (örn. `text-xl` / `text-2xl`) olsun; hiyerarşi net kalsın. |
| **Modal arka planı** | ✅ Uygulandı | Tüm modallar `bg-black/50` overlay ve `rounded-3xl` kutu kullanıyor. |
| **Input stilleri** | EditTaskView ve AddCategoryModal’da `rounded-xl`, focus ring amber | ✅ Tutarlı; formlarda aynı `inputBase` / label stili kullanılmaya devam edilmeli. |

---

## 2. Sayfa sayfa öneriler

### Ana sayfa (HomeView)
- **Güçlü yanlar:** Gecikmiş / Bugün Odakta / Bugün blokları net; Pomodoro özeti okunaklı.
- **Öneriler:**
  - Boş gün durumunda (bugün hiç görev yok) tek CTA yerine kısa bir “İlk görevini ekle” + “Takvime git” gibi iki seçenek düşünülebilir (Todoist / TickTick tarzı).
  - Kategori özet kartlarına tıklanınca ilgili listeye gitme (zaten var mı kontrol et).
  - “Bu hafta X tamamlandı” metni biraz daha vurgulu (küçük bir rozet veya ikon) yapılabilir.

### Görevler (TasksView)
- **Güçlü yanlar:** Tarih strip, filtreler, arama ve liste düzeni işlevsel.
- **Öneriler:**
  - Tarih strip’te “Bugün” her zaman görünür olsun (kaydırılınca kaybolmasın); birçok uygulama bugünü sabit tutar.
  - Boş durumda (bu ayda görev yok) illüstrasyon veya ikon + kısa metin (şu an var), tek buton yeterli.
  - Görev kartında yukarı/aşağı butonları mobilde biraz küçük kalabilir; tıklanabilir alan 44px civarı olursa daha rahat olur.

### Takvim (CalendarView)
- **Güçlü yanlar:** Grid okunaklı, Google bağlantı alanı net.
- **Öneriler:**
  - Takvim hücrelerinde görev sayısı (nokta yerine “3” gibi) isteğe bağlı; bazı uygulamalar sayı gösterir.
  - Seçili gün vurgusu (border veya dolgu) ana sayfa amber tonu ile uyumlu olsun.
  - “Google Takvim’i Bağla” butonu, diğer birincil aksiyonlarla (amber, rounded-xl) aynı aileden olsun.

### Listeler (CategoriesView)
- **Güçlü yanlar:** Liste kartları renkli, ilerleme çubuğu anlaşılır.
- **Öneriler:**
  - Liste kartına tıklanınca hafif bir “press” (scale veya opacity) feedback (active state) eklenebilir.
  - Boş liste durumunda “İlk listeni oluştur” CTA’sı net olsun.

### Liste detayı (CategoryTaskView)
- **Güçlü yanlar:** Başlık alanı gradient, tarih seçici ve filtreler net.
- **Öneriler:**
  - Header’daki “X görev · Y tamamlanan” satırı, ana sayfa alt başlık tipi ile aynı font boyutu / rengi (ör. `text-sm`, opacity 0.8) kullanabilir.
  - Görev kartları (beyaz kutu) gölge/border değerleri EditTaskView veya TasksView kartları ile aynı setten seçilebilir; böylece “kart” hissi tüm uygulamada aynı olur.

### Görev düzenleme (EditTaskView)
- **Güçlü yanlar:** Form grupları ve “Liste seç” / “Google’da görünsün” mantığı net.
- **Öneriler:**
  - Çok uzun form; “Temel” / “Detay” (tekrarlama, öncelik, etiketler, alt görevler) gibi bölüm başlıkları veya accordion ile toplanabilir (Todoist / Things tarzı).
  - Sil butonu ve “Şablon olarak kaydet” aynı blokta; sil kırmızı, şablon nötr tonda kalsın (şu an öyle, korunabilir).
  - Başarılı kayıt sonrası kısa bir toast (“Görev kaydedildi”) zaten varsa tutarlı kullan.

### Ayarlar (SettingsView)
- **Güçlü yanlar:** Bölüm başlıkları (Genel, Bildirimler, Veri) ve kart yapısı net.
- **Öneriler:**
  - “Verileri dışa aktar” ve “Görevleri CSV olarak indir” yan yana veya alt alta aynı kart içinde; ikisi de “veri” ailesinde görünsün.
  - Pro yükselt alanı gradient ile öne çıkıyor; diğer tek CTA’lar (örn. “Tüm verileri sil”) daha nötr/tehlike renginde kalsın.

### Giriş (LoginView)
- **Güçlü yanlar:** E-posta/şifre ve “Atla” seçenekleri var.
- **Öneriler:**
  - Arka plan: Ana uygulama light modda `#f5f0ea` ise giriş ekranı da aynı veya çok yakın bir ton kullansın; böylece giriş yapınca “ekran değişti” hissi azalır.
  - Hata mesajı kırmızı bir kutu veya satır içi metin; stil Ana sayfa / Ayarlar uyarıları ile aynı aileden olsun.
  - “Google ile giriş” butonu, diğer sayfalardaki birincil butonlarla (amber) çakışmıyorsa farklı (beyaz/gri çerçeve) kalabilir; net “ikincil” aksiyon olsun.

### Onboarding
- **Öneriler:**
  - Adımlar arası geçişte hafif geçiş animasyonu (slide veya fade) kullanılabilir (globals.css’teki slideIn/fadeIn ile uyumlu).
  - “Atla” her adımda aynı yerde (örn. sağ üst) olsun.

### Modallar (AddCategoryModal, şablon seçici, dil seçimi vb.)
- **Tutarlılık kontrolü:**
  - Hepsi `fixed inset-0` + overlay + ortada kutu.
  - Overlay: `bg-black/50` (veya hepsi `bg-black/40`).
  - Kutu: `rounded-3xl`, max-width `max-w-md`, dark’ta `bg-zinc-900`, light’ta `bg-white`.
  - Kapatma: Sağ üst X, aynı boyut ve hover rengi.
- **Öneri:** Bu kuralları tek bir “Modal” wrapper bileşeninde topla; tüm modallar bu wrapper’ı kullansın. Böylece yeni modal eklerken de tutarlılık korunur.

---

## 3. Diğer uygulamalardan esinlenebilecekler

| Konu | Örnek uygulamalar | Öneri |
|------|-------------------|--------|
| **Boş durumlar** | Todoist, Things, MS To Do | Her boş durumda kısa metin + tek net CTA; gerekiyorsa ikon/illüstrasyon. |
| **Yükleme** | Genel | Skeleton (şu an bazı yerlerde var) tüm liste sayfalarında kullanılabilir; spinner sadece ilk açılışta. |
| **Kart dokunuş feedback** | Çoğu mobil uygulama | `active:scale-[0.98]` veya `active:opacity-90` ile basılı hissi. |
| **Form hiyerarşisi** | Todoist, TickTick | Görev formunda “Temel” (başlık, tarih, saat, liste) her zaman görünür; “Tekrarlama”, “Öncelik”, “Etiketler” açılır/kapanır blok. |
| **Renk anlamı** | Yaygın | Kırmızı: silme/tehlike; yeşil: tamamlandı; amber: birincil aksiyon. Şu an uygulama buna yakın; korunabilir. |
| **Alt navigasyon** | Çoğu uygulama | Aktif sekme metni biraz daha kalın (font-semibold); pasif sade (font-medium). |
| **Erişilebilirlik** | Genel | Önemli butonlarda `aria-label`; kontrast oranları (özellikle dark modda gri metin). |

---

## 4. Yapılacaklar özeti (öncelik sırasıyla)

### Hızlı (tek dosya / tek sayfa)
1. Tüm sayfa header’larında padding’i standartlaştır (örn. `py-5` veya `pt-6 pb-4`).
2. Modal overlay ve kutu stilini tek yerde topla; AddCategoryModal ve diğer modallar aynı wrapper’ı kullansın.
3. Görev/ liste kartlarına `active:scale-[0.99]` veya `active:opacity-95` ekleyerek dokunuş feedback’i ver.

### Orta (birkaç bileşen)
4. EditTaskView’da “Temel” ve “Detay” (veya “Tekrarlama & öncelik”) bölümlerini accordion/collapse ile topla.
5. Takvim’de seçili gün stilini ana tema amber ile netleştir.
6. Login sayfası arka planını ana sayfa ile aynı `#f5f0ea` / dark `#0f0f0f` yap.

### İsteğe bağlı
7. Ana sayfa boş gün durumunda iki CTA (görev ekle + takvime git).
8. Tarih strip’te “Bugün”ü sabit (sticky) konumda göster.
9. Erişilebilirlik: Kritik butonlarda `aria-label`, kontrast kontrolü.

---

## 5. Kontrol listesi (her yeni ekran / modal için)

- [ ] Arka plan: Light `#f5f0ea`, dark `#0f0f0f`
- [ ] Birincil buton: Amber tonu, `rounded-xl`
- [ ] Kartlar: `rounded-2xl`, border veya hafif shadow
- [ ] Header: Geri butonu `w-10 h-10 rounded-xl`, başlık `text-xl` veya `text-2xl` font-semibold
- [ ] Modal: Overlay `bg-black/50`, kutu `rounded-3xl`, dark `bg-zinc-900`
- [ ] Input: `rounded-xl`, focus ring amber
- [ ] Boş durum: Kısa metin + tek net CTA

Bu dosyayı referans alarak sayfa sayfa veya bileşen bazlı ilerleyebilirsin. Belirli bir sayfayı önce ele almak istersen söylemen yeterli.
