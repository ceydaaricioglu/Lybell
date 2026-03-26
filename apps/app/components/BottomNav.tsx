'use client';

import { useLocale } from '@/components/LocaleContext';
import { t } from '@cursor-deneme/shared';

interface BottomNavProps {
  currentView: string;
  onNavigate: (view: string) => void;
  darkMode?: boolean;
  /** Pro: Gösterilecek sekme id'leri (şimdilik kullanılmıyor) */
  visibleTabs?: string[];
}

/** Material Symbols Outlined ikon adları – HTML tasarımıyla uyumlu */
const TAB_ICON_NAMES: Record<string, string> = {
  menu: 'menu',
  home: 'home',
  tasks: 'format_list_bulleted',
  calendar: 'calendar_today',
  profile: 'person',
};

const LABEL_KEYS: Record<string, string> = {
  menu: 'nav.menu',
  home: 'nav.home',
  tasks: 'nav.tasks',
  calendar: 'nav.calendar',
  profile: 'nav.profile',
};

export default function BottomNav({ currentView, onNavigate, darkMode = false, visibleTabs }: BottomNavProps) {
  const dark = darkMode;
  const { locale } = useLocale();
  const BRAND = '#1A2332';
  const isActive = (view: string) => {
    if (view === 'profile') return currentView === 'profile';
    if (view === 'menu') return false;
    return currentView === view;
  };
  // Mobile için sabit alt menü: menu + home/tasks/calendar/profile
  // Kategoriler artık drawer içinde.
  const tabsToShow = ['menu', 'home', 'tasks', 'calendar', 'profile'];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 nav-safe-bottom border-t border-slate-200 bg-white/95 backdrop-blur-md">
      <div className="max-w-sm mx-auto flex items-center justify-around px-6 py-4">
        {tabsToShow.map((id) => {
          const active = isActive(id);
          const labelKey = LABEL_KEYS[id] ?? id;
          const label = t(labelKey, locale);
          const iconName = TAB_ICON_NAMES[id] ?? 'circle';
          return (
              <button
              key={id}
              onClick={() => onNavigate(id)}
              className={`flex flex-col items-center gap-1 transition-colors ${active ? 'text-[#1A2332]' : 'text-slate-600 hover:text-[#1A2332]'}`}
              style={active ? { color: BRAND } : undefined}
              aria-label={label}
              aria-current={active ? 'page' : undefined}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: active ? "'FILL' 1, 'wght' 400" : "'FILL' 0, 'wght' 400" }}
              >
                {iconName}
              </span>
                {id !== 'menu' && (
                  <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
                )}
            </button>
          );
        })}
      </div>
      <div className="flex justify-center pb-2">
        <div className="w-32 h-1.5 bg-slate-200 rounded-full" />
      </div>
    </nav>
  );
}
