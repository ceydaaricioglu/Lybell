'use client';

import { useLocale } from '@/components/LocaleContext';
import { t } from '@/lib/i18n';

interface BottomNavProps {
  currentView: string;
  onNavigate: (view: string) => void;
  darkMode?: boolean;
}

export default function BottomNav({ currentView, onNavigate, darkMode = false }: BottomNavProps) {
  const dark = darkMode;
  const { locale } = useLocale();
  const isActive = (view: string) => currentView === view;
  const isCategoriesActive = currentView === 'category' || currentView === 'categories';

  const navBg = dark ? 'bg-[#0f0f0f] border-zinc-800' : 'bg-[#f5f0ea] border-stone-200';
  const activeColor = 'text-amber-600';
  const inactiveColor = dark ? 'text-zinc-500 hover:text-zinc-300' : 'text-stone-500 hover:text-stone-700';
  const dotColor = dark ? 'bg-amber-400' : 'bg-amber-500';

  return (
    <div className={`fixed bottom-0 left-0 right-0 border-t z-30 nav-safe-bottom ${navBg}`}>
      <div className="max-w-md mx-auto flex items-center justify-around py-2 px-4">
        {/* Ana Sayfa */}
        <button
          onClick={() => onNavigate('home')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all ${
            isActive('home') ? activeColor : inactiveColor
          }`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className="text-[10px] font-medium">{t('nav.home', locale)}</span>
          {isActive('home') && <div className={`w-1.5 h-1.5 ${dotColor} rounded-full`} />}
        </button>

        {/* Görevler */}
        <button
          onClick={() => onNavigate('tasks')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all ${
            isActive('tasks') ? activeColor : inactiveColor
          }`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <span className="text-[10px] font-medium">{t('nav.tasks', locale)}</span>
          {isActive('tasks') && <div className={`w-1.5 h-1.5 ${dotColor} rounded-full`} />}
        </button>

        {/* Takvim */}
        <button
          onClick={() => onNavigate('calendar')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all ${
            isActive('calendar') ? activeColor : inactiveColor
          }`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-[10px] font-medium">{t('nav.calendar', locale)}</span>
          {isActive('calendar') && <div className={`w-1.5 h-1.5 ${dotColor} rounded-full`} />}
        </button>

        {/* Ekle Butonu (Ortada) */}
        <button
          onClick={() => onNavigate('add-task')}
          className="flex flex-col items-center -mt-6"
        >
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all hover:scale-105 active:scale-95 ${
            dark ? 'bg-amber-500 text-black hover:shadow-amber-500/25' : 'bg-amber-500 text-black hover:shadow-xl'
          }`}>
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
          </div>
        </button>

        {/* Kategoriler */}
        <button
          onClick={() => onNavigate('categories')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all ${
            isCategoriesActive ? activeColor : inactiveColor
          }`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <span className="text-[10px] font-medium">{t('nav.categories', locale)}</span>
          {isCategoriesActive && <div className={`w-1.5 h-1.5 ${dotColor} rounded-full`} />}
        </button>

        {/* Ayarlar */}
        <button
          onClick={() => onNavigate('settings')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all ${
            isActive('settings') ? activeColor : inactiveColor
          }`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-[10px] font-medium">{t('nav.settings', locale)}</span>
          {isActive('settings') && <div className={`w-1.5 h-1.5 ${dotColor} rounded-full`} />}
        </button>
      </div>
    </div>
  );
}
