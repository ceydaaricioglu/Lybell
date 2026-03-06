'use client';

import { useLocale } from '@/components/LocaleContext';
import { t } from '@cursor-deneme/shared';
import { DEFAULT_NAV_TABS } from '@cursor-deneme/shared';

const PRIMARY = '#ec5b13';

const ICONS: Record<string, React.ReactNode> = {
  home: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />,
  tasks: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />,
  calendar: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />,
  'add-task': <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />,
  categories: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />,
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

interface WebSidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  darkMode?: boolean;
  visibleTabs?: string[];
  isPro?: boolean;
  onOpenPro?: () => void;
}

export default function WebSidebar({ currentView, onNavigate, darkMode = false, visibleTabs, isPro, onOpenPro }: WebSidebarProps) {
  const dark = darkMode;
  const { locale } = useLocale();
  const tabs = visibleTabs?.length ? DEFAULT_NAV_TABS.filter((id) => visibleTabs.includes(id)) : [...DEFAULT_NAV_TABS];
  const isActive = (view: string) => currentView === view || (view === 'categories' && (currentView === 'category' || currentView === 'categories'));

  const navBg = dark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200';
  const activeBg = 'bg-[#ec5b13]/10 text-[#ec5b13]';
  const inactiveClass = dark ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100';

  return (
    <aside
      className={`hidden md:flex md:flex-col md:w-64 md:flex-shrink-0 md:border-r md:fixed md:inset-y-0 md:left-0 md:z-50 ${navBg}`}
    >
      <div className="p-4 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white flex-shrink-0" style={{ backgroundColor: PRIMARY }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
        </div>
        <div className="min-w-0">
          <h1 className="font-display font-bold text-sm leading-tight text-slate-900 dark:text-white truncate">TaskMaster</h1>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">Productivity Pro</p>
        </div>
      </div>
      <nav className="flex-1 px-3 py-3 space-y-1">
        {tabs.map((id) => {
          const active = id === 'add-task' ? false : isActive(id);
          const label = t(LABEL_KEYS[id] ?? id, locale);
          if (id === 'add-task') {
            return (
              <button
                key={id}
                onClick={() => onNavigate('add-task')}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-white hover:opacity-90"
                style={{ backgroundColor: PRIMARY }}
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">{ICONS[id]}</svg>
                <span>{locale === 'tr' ? 'Görev Ekle' : 'Add Task'}</span>
              </button>
            );
          }
          if (id === 'settings') {
            return (
              <div key={id}>
                <div className="pt-3 pb-1.5 px-3 text-[9px] font-bold uppercase tracking-widest text-slate-400">{t('sidebar.settingsLabel', locale)}</div>
                <button
                  onClick={() => onNavigate(id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${active ? activeBg : inactiveClass}`}
                  aria-current={active ? 'page' : undefined}
                >
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">{ICONS[id]}</svg>
                  <span>{locale === 'tr' ? 'Tercihler' : 'Preferences'}</span>
                </button>
              </div>
            );
          }
          if (id === 'categories') {
            return (
              <button
                key={id}
                onClick={() => onNavigate(id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${active ? activeBg : inactiveClass}`}
                aria-current={active ? 'page' : undefined}
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">{ICONS[id]}</svg>
                <span>{locale === 'tr' ? 'Projeler' : 'Projects'}</span>
              </button>
            );
          }
          const displayLabel = id === 'home' ? (locale === 'tr' ? 'Panel' : 'Dashboard') : label;
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${active ? activeBg : inactiveClass}`}
              aria-current={active ? 'page' : undefined}
            >
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">{ICONS[id]}</svg>
              <span>{displayLabel}</span>
            </button>
          );
        })}
      </nav>
      {!isPro && onOpenPro && (
        <div className="p-3 mt-auto">
          <div className={`p-3 rounded-xl border ${dark ? 'bg-[#ec5b13]/10 border-[#ec5b13]/20' : 'bg-[#ec5b13]/5 border-[#ec5b13]/10'}`}>
            <p className="text-[11px] font-semibold text-[#ec5b13] mb-0.5">{locale === 'tr' ? 'Pro\'ya Yükselt' : 'Upgrade to Pro'}</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-2">{locale === 'tr' ? 'Sınırsız proje ve daha fazlası.' : 'Get unlimited projects and AI insights.'}</p>
            <button
              type="button"
              onClick={onOpenPro}
              className="w-full py-1.5 text-white text-[11px] font-bold rounded-md hover:opacity-90 transition-all"
              style={{ backgroundColor: PRIMARY }}
            >
              {locale === 'tr' ? 'Şimdi Yükselt' : 'Upgrade Now'}
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
