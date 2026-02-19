# .env.local – Terminal ile kurulum

Proje kökünde çalıştır. Anon key’i kendin yapıştıracaksın.

---

## 1. Proje klasörüne gir

```bash
cd /Users/ceyda/Desktop/cursor-deneme
```

---

## 2. .env.local dosyasını oluştur (URL ile)

```bash
echo 'NEXT_PUBLIC_SUPABASE_URL=https://gtwugoklzczszvueacxm.supabase.co' > .env.local
```

---

## 3. Anon key satırını ekle (placeholder)

```bash
echo 'NEXT_PUBLIC_SUPABASE_ANON_KEY=buraya_anon_keyini_yapistir' >> .env.local
```

---

## 4. Anon key’i gerçek değerle değiştir

Supabase’den kopyaladığın key’i kullan. **Terminalde** (key’i tek satırda yapıştır):

```bash
# Örnek: Key'in sb_publishable_xxx veya eyJ... ile başladığını varsay
# Aşağıdaki SENIN_KEY_BURAYA kısmını silip kendi key'ini yapıştır, sonra komutu çalıştır.

echo 'NEXT_PUBLIC_SUPABASE_URL=https://gtwugoklzczszvueacxm.supabase.co' > .env.local && echo 'NEXT_PUBLIC_SUPABASE_ANON_KEY=SENIN_KEY_BURAYA' >> .env.local
```

**Veya** 2 ve 3. adımları yaptıktan sonra dosyayı editörle açıp `buraya_anon_keyini_yapistir` yazan yeri kendi key’inle değiştir:

```bash
cursor .env.local
```

veya

```bash
open -e .env.local
```

---

## 5. Dosyanın oluştuğunu kontrol et

```bash
cat .env.local
```

(Key’i başkaları görmesin diye ekrandan silmene gerek yok; sadece kontrol.)

---

## 6. Dev sunucuyu başlat / yeniden başlat

```bash
npm run dev
```

.env.local değişince sunucuyu durdurup (Ctrl+C) tekrar `npm run dev` çalıştırman gerekir.
