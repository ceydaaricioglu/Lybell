/** Pro: Alt menü sekmeleri – localStorage ile özelleştirme */

const KEY = 'app_nav_visible_tabs';
export const DEFAULT_NAV_TABS = ['home', 'tasks', 'calendar', 'add-task', 'categories', 'settings'] as const;
export type NavTabId = (typeof DEFAULT_NAV_TABS)[number];

export function getVisibleNavTabs(isPro: boolean): string[] {
  if (typeof window === 'undefined') return [...DEFAULT_NAV_TABS];
  if (!isPro) return [...DEFAULT_NAV_TABS];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [...DEFAULT_NAV_TABS];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed) || parsed.length === 0) return [...DEFAULT_NAV_TABS];
    return parsed.filter((id): id is string => typeof id === 'string' && DEFAULT_NAV_TABS.includes(id as NavTabId));
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
