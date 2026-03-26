'use client';

import { useEffect, useMemo, useState } from 'react';

interface WidgetPlaceholderViewProps {
  darkMode?: boolean;
  onBack: () => void;
}

type WidgetItem = { id: string; title: string };

export default function WidgetPlaceholderView({ darkMode = false, onBack }: WidgetPlaceholderViewProps) {
  const dark = darkMode;
  const pageBg = dark ? '#0f172a' : '#F8FAFC';
  const cardBg = dark ? '#1A2332' : '#ffffff';
  const border = dark ? '#2a1f1a' : '#e5e7eb';

  const storageKey = 'app_widgets_panel';
  const [widgets, setWidgets] = useState<WidgetItem[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as WidgetItem[];
      if (Array.isArray(parsed)) setWidgets(parsed);
    } catch {
      // noop
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(widgets));
    } catch {
      // noop
    }
  }, [widgets]);

  const nextWidgetIndex = useMemo(() => widgets.length + 1, [widgets.length]);

  const addWidget = () => {
    const id =
      typeof crypto !== 'undefined' && (crypto as any).randomUUID
        ? (crypto as any).randomUUID()
        : `w-${Date.now()}`;
    setWidgets((prev) => [{ id, title: `Widget ${nextWidgetIndex}` }, ...prev]);
  };

  return (
    <div className="flex flex-col flex-1 min-h-screen overflow-auto" style={{ backgroundColor: pageBg }}>
      <div className="relative mx-auto w-full max-w-md flex-1 flex flex-col bg-transparent">
        <header className="flex items-center gap-3 px-4 pt-10 pb-4 border-b border-slate-100 bg-white/95 backdrop-blur-md z-10">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-600"
            aria-label="Geri"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Widget</h1>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.14em]">Panel</p>
          </div>
        </header>

        <main className="flex-1 px-5 py-6 space-y-4">
          <section
            className="rounded-2xl border p-4"
            style={{ backgroundColor: cardBg, borderColor: border, borderWidth: 1, borderStyle: 'solid' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-slate-600 dark:text-slate-200">dashboard</span>
                <span className="text-sm font-semibold">Widget Paneli</span>
              </div>
              <button
                type="button"
                onClick={addWidget}
                className="px-3 py-2 rounded-xl text-xs font-bold"
                style={{ backgroundColor: '#1A2332', color: '#fff' }}
              >
                + Eklenecek
              </button>
            </div>

            {widgets.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800 p-4">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-[#1A2332] dark:text-slate-200" style={{ fontSize: 24 }}>
                    grid_on
                  </span>
                  <div>
                    <div className="text-[14px] font-bold text-slate-900 dark:text-white">Henüz widget yok</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      “+ Eklenecek” ile ilk widget kutunu ekle.
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-3">
                {widgets.map((w) => (
                  <div
                    key={w.id}
                    className="h-28 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 flex flex-col justify-between"
                  >
                    <div className="text-[12px] font-bold text-slate-900 dark:text-white truncate">{w.title}</div>
                    <button
                      type="button"
                      className="text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:opacity-80 self-end"
                      onClick={() => setWidgets((prev) => prev.filter((x) => x.id !== w.id))}
                    >
                      kaldır
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

