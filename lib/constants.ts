/**
 * Uygulama genelinde kullanılan sabitler (ay isimleri, liste/kategori renkleri).
 */

/** Türkçe ay isimleri (Ocak = 0) */
export const MONTHS_TR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'] as const;

export type CategoryColorKey = 'blue' | 'purple' | 'pink' | 'orange' | 'yellow' | 'emerald';

export interface CategoryColorClasses {
  bg: string;
  light: string;
  text: string;
  gradient: string;
}

const CATEGORY_COLOR_MAP: Record<CategoryColorKey, CategoryColorClasses> = {
  blue: { bg: 'bg-blue-600', light: 'bg-blue-100', text: 'text-blue-600', gradient: 'from-blue-500 to-blue-600' },
  purple: { bg: 'bg-purple-600', light: 'bg-purple-100', text: 'text-purple-600', gradient: 'from-purple-500 to-purple-600' },
  pink: { bg: 'bg-pink-600', light: 'bg-pink-100', text: 'text-pink-600', gradient: 'from-pink-500 to-pink-600' },
  orange: { bg: 'bg-orange-600', light: 'bg-orange-100', text: 'text-orange-600', gradient: 'from-orange-500 to-orange-600' },
  yellow: { bg: 'bg-yellow-600', light: 'bg-yellow-100', text: 'text-yellow-600', gradient: 'from-yellow-500 to-yellow-600' },
  emerald: { bg: 'bg-emerald-600', light: 'bg-emerald-100', text: 'text-emerald-600', gradient: 'from-emerald-500 to-teal-500' },
};

const DEFAULT_CATEGORY_COLOR: CategoryColorClasses = CATEGORY_COLOR_MAP.emerald;

/**
 * Liste/kategori rengine göre Tailwind sınıfları (bg, light, text, gradient).
 * Tüm görünümlerde tutarlı renk için tek kaynak.
 */
export function getCategoryColor(color?: string | null): CategoryColorClasses {
  const key = (color || 'emerald') as CategoryColorKey;
  return CATEGORY_COLOR_MAP[key] ?? DEFAULT_CATEGORY_COLOR;
}
