/**
 * Uygulama genelinde kullanılabilecek ikon seti (Material Symbols Outlined).
 * Kategori ikonları, liste tipleri vb. için kullanılır.
 *
 * Font: Google Material Symbols Outlined
 * https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined
 */

export interface IconSetEntry {
  /** Material Symbol adı (material-symbols-outlined içinde kullanılır) */
  id: string;
  /** Türkçe etiket */
  label: string;
  /** Tailwind renk sınıfı (örn. orange, blue, purple) – blob/arka plan için */
  color: string;
}

/** Blob border-radius varyasyonları (CSS ile kullanmak için). Varsayılan: 42% 58% 70% 30% / 45% 45% 55% 55% */
export const BLOB_RADII: Record<string, string> = {
  default: '42% 58% 70% 30% / 45% 45% 55% 55%',
  blue: '60% 40% 30% 70% / 60% 30% 70% 40%',
  purple: '30% 70% 70% 30% / 30% 30% 70% 70%',
  rose: '50% 50% 30% 70% / 50% 50% 70% 30%',
  amber: '40% 60% 74% 26% / 48% 30% 70% 52%',
  cyan: '71% 29% 21% 79% / 26% 77% 23% 74%',
};

/**
 * İkon kütüphanesi – kategoriler / listeler için kullanılabilecek ikonlar.
 * material-symbols-outlined fontu ile gösterilir.
 */
export const ICON_SET: IconSetEntry[] = [
  { id: 'pets', label: 'Evcil Hayvan', color: 'orange' },
  { id: 'auto_stories', label: 'Okuma Listesi', color: 'blue' },
  { id: 'self_improvement', label: 'Meditasyon', color: 'purple' },
  { id: 'edit_note', label: 'Günlük', color: 'rose' },
  { id: 'fitness_center', label: 'Fitness', color: 'emerald' },
  { id: 'cooking', label: 'Yemek', color: 'amber' },
  { id: 'explore', label: 'Seyahat', color: 'cyan' },
  { id: 'work', label: 'İş', color: 'slate' },
  { id: 'coffee', label: 'Kahve', color: 'yellow' },
  { id: 'shopping_bag', label: 'Alışveriş', color: 'pink' },
  { id: 'payments', label: 'Finans', color: 'lime' },
  { id: 'potted_plant', label: 'Bitkiler', color: 'green' },
  { id: 'music_note', label: 'Müzik', color: 'violet' },
  { id: 'sports_esports', label: 'Oyun', color: 'indigo' },
  { id: 'favorite', label: 'Özbakım', color: 'red' },
  { id: 'cached', label: 'Alışkanlıklar', color: 'teal' },
];

/** İkon id'sine göre kayıt bulur */
export function getIconSetEntry(id: string): IconSetEntry | undefined {
  return ICON_SET.find((e) => e.id === id);
}

/** Arama metninde geçen ikonları döner (label veya id) */
export function searchIconSet(query: string): IconSetEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return ICON_SET;
  return ICON_SET.filter(
    (e) => e.label.toLowerCase().includes(q) || e.id.toLowerCase().includes(q)
  );
}
