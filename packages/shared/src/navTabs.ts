/** Pro: Alt menü sekmeleri – localStorage ile özelleştirme */

const KEY = 'app_nav_visible_tabs';
/** Alt menü: Ana Sayfa, Görevler, Kategoriler, Takvim, Profil (ekle sayfa içinde) */
export const DEFAULT_NAV_TABS = ['home', 'tasks', 'categories', 'calendar', 'profile'] as const;
export type NavTabId = (typeof DEFAULT_NAV_TABS)[number];

export function getVisibleNavTabs(isPro: boolean): string[] {
  if (typeof window === 'undefined') return [...DEFAULT_NAV_TABS];
  if (!isPro) return [...DEFAULT_NAV_TABS];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [...DEFAULT_NAV_TABS];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed) || parsed.length === 0) return [...DEFAULT_NAV_TABS];
    const migrated = parsed.map((id: unknown) => (id === 'settings' ? 'profile' : id)).filter((id): id is string => typeof id === 'string');
    const valid = migrated.filter((id) => DEFAULT_NAV_TABS.includes(id as NavTabId));
    if (valid.length === 0) return [...DEFAULT_NAV_TABS];
    if (!valid.includes('profile')) valid.push('profile');
    return valid.sort((a, b) => DEFAULT_NAV_TABS.indexOf(a as NavTabId) - DEFAULT_NAV_TABS.indexOf(b as NavTabId));
  } catch {
    return [...DEFAULT_NAV_TABS];
  }
}

export function setVisibleNavTabs(tabs: string[]): void {
  if (typeof window === 'undefined') return;
  const valid = tabs.filter(id => DEFAULT_NAV_TABS.includes(id as NavTabId));
  if (valid.length === 0) return;
  localStorage.setItem(KEY, JSON.stringify(valid));
}
