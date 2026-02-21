'use client';

import { useLocale } from '@/components/LocaleContext';
import { t } from '@/lib/i18n';
import { DEFAULT_NAV_TABS } from '@/lib/navTabs';

interface BottomNavProps {
  currentView: string;
  onNavigate: (view: string) => void;
  darkMode?: boolean;
  /** Pro: Gösterilecek sekme id'leri; yoksa hepsi */
  visibleTabs?: string[];
}

const TAB_ICONS: Record<string, React.ReactNode> = {
  home: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />,
  tasks: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />,
  calendar: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />,
  'add-task': <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />,
  categories: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />,
  settings: <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></>,
};

const LABEL_KEYS: Record<string, string> = {
  home: 'nav.home',
  tasks: 'nav.tasks',
  calendar: 'nav.calendar',
  'add-task': 'nav.add',
  categories: 'nav.categories',
  settings: 'nav.settings',
};

export default function BottomNav({ currentView, onNavigate, darkMode = false, visibleTabs }: BottomNavProps) {
  const dark = darkMode;
  const { locale } = useLocale();
  const isActive = (view: string) => currentView === view;
  const isCategoriesActive = currentView === 'category' || currentView === 'categories';
  const tabsToShow = visibleTabs && visibleTabs.length > 0 ? DEFAULT_NAV_TABS.filter(id => visibleTabs.includes(id)) : [...DEFAULT_NAV_TABS];

  const navBg = dark ? 'bg-[#0f0f0f] border-zinc-800' : 'bg-[#f5f0ea] border-stone-200';
  const activeColor = 'text-amber-600';
  const inactiveColor = dark ? 'text-zinc-500 hover:text-zinc-300' : 'text-stone-500 hover:text-stone-700';
  const dotColor = dark ? 'bg-amber-400' : 'bg-amber-500';

  return (
    <div className={`fixed bottom-0 left-0 right-0 border-t z-30 nav-safe-bottom ${navBg}`}>
      <div className="max-w-md mx-auto flex items-center justify-around py-2 px-4">
        {tabsToShow.map((id) => {
          if (id === 'add-task') {
            return (
              <button key={id} onClick={() => onNavigate('add-task')} className="flex flex-col items-center -mt-6" aria-label={t('nav.add', locale)}>
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all hover:scale-105 active:scale-95 ${dark ? 'bg-amber-500 text-black hover:shadow-amber-500/25' : 'bg-amber-500 text-black hover:shadow-xl'}`}>
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">{TAB_ICONS[id]}</svg>
                </div>
              </button>
            );
          }
          const active = id === 'categories' ? isCategoriesActive : isActive(id);
          const labelKey = LABEL_KEYS[id] ?? id;
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all ${active ? activeColor : inactiveColor}`}
              aria-label={t(labelKey, locale)}
              aria-current={active ? 'page' : undefined}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">{TAB_ICONS[id]}</svg>
              <span className={`text-[10px] ${active ? 'font-semibold' : 'font-medium'}`}>{t(labelKey, locale)}</span>
              {active && <div className={`w-1.5 h-1.5 ${dotColor} rounded-full`} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
