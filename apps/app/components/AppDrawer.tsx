'use client';

import { useEffect } from 'react';

type DrawerViewId =
  | 'home'
  | 'tasks'
  | 'calendar'
  | 'categories'
  | 'notes'
  | 'widget'
  | 'profile'
  | 'settings';

interface AppDrawerProps {
  open: boolean;
  darkMode?: boolean;
  currentView: string;
  onNavigate: (view: DrawerViewId) => void;
  onClose: () => void;
}

const PRIMARY = '#1A2332';

function DrawerItem({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
        active ? 'bg-[#1A2332]/10 text-[#1A2332]' : 'hover:bg-slate-100 text-slate-700'
      }`}
      style={active ? { backgroundColor: `${PRIMARY}10` } : undefined}
      aria-current={active ? 'page' : undefined}
    >
      <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
        {icon}
      </span>
      <span className="text-sm font-semibold">{label}</span>
    </button>
  );
}

export default function AppDrawer({ open, darkMode = false, currentView, onNavigate, onClose }: AppDrawerProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  const dark = darkMode;
  const drawerBg = dark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200';
  const overlayBg = 'bg-black/30';

  const navigateAndClose = (view: DrawerViewId) => {
    onNavigate(view);
    onClose();
  };

  return (
    <>
      {open && (
        <div
          // Z-index’i BottomNav (z-30) altına alıyoruz ki drawer açıkken alt menü tıklanabilir kalsın.
          className={`fixed inset-0 z-20 ${overlayBg}`}
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed top-0 left-0 bottom-[4.5rem] z-50 w-80 max-w-[85vw] transform transition-transform duration-200 ${
          open ? 'translate-x-0' : '-translate-x-full'
        } ${drawerBg} border-r shadow-lg`}
        role="dialog"
        aria-modal="true"
        aria-label="Uygulama menüsü"
      >
        <div className="px-4 pt-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white" style={{ backgroundColor: PRIMARY }}>
              <span className="material-symbols-outlined">bolt</span>
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-slate-900 dark:text-white truncate">Lybell</div>
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Menu</div>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-2 overflow-y-auto h-[calc(100%-160px)]">
          <DrawerItem
            label="Panel"
            icon="home"
            active={currentView === 'home'}
            onClick={() => navigateAndClose('home')}
          />
          <DrawerItem
            label="Görevler"
            icon="format_list_bulleted"
            active={currentView === 'tasks' || currentView === 'edit-task' || currentView === 'category'}
            onClick={() => navigateAndClose('tasks')}
          />
          <DrawerItem
            label="Takvim"
            icon="calendar_today"
            active={currentView === 'calendar'}
            onClick={() => navigateAndClose('calendar')}
          />
          <DrawerItem
            label="Projeler"
            icon="folder"
            active={currentView === 'categories' || currentView === 'category'}
            onClick={() => navigateAndClose('categories')}
          />
          <DrawerItem
            label="Notlar"
            icon="notes"
            active={currentView === 'notes'}
            onClick={() => navigateAndClose('notes')}
          />
          <DrawerItem
            label="Ayarlar"
            icon="tune"
            active={currentView === 'settings'}
            onClick={() => navigateAndClose('settings')}
          />
        </nav>

        <div className="p-4 border-t border-slate-100" />
      </aside>
    </>
  );
}

