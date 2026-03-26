'use client';

interface NotesFoldersPlaceholderViewProps {
  darkMode?: boolean;
  onBack: () => void;
  folders?: import('@cursor-deneme/shared').NoteFolder[];
  totalNotesCount?: number;
  notesCountByFolderId?: Record<string, number>;
}

export default function NotesFoldersPlaceholderView({
  darkMode = false,
  onBack,
  folders = [],
  totalNotesCount = 0,
  notesCountByFolderId = {},
}: NotesFoldersPlaceholderViewProps) {
  const dark = darkMode;
  const pageBg = dark ? '#0f172a' : '#F8FAFC';
  const cardBg = dark ? '#1A2332' : '#ffffff';
  const border = dark ? '#2a1f1a' : '#e5e7eb';

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
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Klasörler</h1>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.14em]">
              Yakında
            </p>
          </div>
          <div className="ml-auto" />
          <button
            type="button"
            className="p-2 rounded-full hover:bg-slate-100 text-slate-600"
            aria-label="Sil"
            disabled
          >
            <span className="material-symbols-outlined">delete</span>
          </button>
        </header>

        <main className="flex-1 px-5 py-6 space-y-4">
          <section
            className="rounded-2xl border p-4"
            style={{ backgroundColor: cardBg, borderColor: border, borderWidth: 1, borderStyle: 'solid' }}
          >
            <div className="space-y-3">
              <button
                type="button"
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{ backgroundColor: dark ? '#1f2937' : '#f8fafc' }}
              >
                <span className="material-symbols-outlined" style={{ color: '#1A2332' }}>check_circle</span>
                <div className="flex-1 text-left">
                  <div className="text-sm font-bold text-slate-900 dark:text-white">Tümü</div>
                </div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">{totalNotesCount}</div>
              </button>

              <button
                type="button"
                onClick={() => {}}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <span className="material-symbols-outlined" style={{ color: '#f59e0b' }}>add</span>
                <span className="text-sm font-bold">Yeni klasör</span>
              </button>

              {folders.slice(0, 6).map((f) => (
                <div
                  key={f.id}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="material-symbols-outlined text-slate-600 dark:text-slate-200">folder</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white truncate">{f.name}</span>
                  </div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">
                    {notesCountByFolderId[f.id] ?? 0}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div
            className="rounded-2xl border border-dashed p-6 flex items-center justify-center"
            style={{ backgroundColor: cardBg, borderColor: border }}
          >
            <div className="w-64 max-w-full h-36 rounded-3xl bg-slate-100 dark:bg-slate-800" />
          </div>
        </main>
      </div>
    </div>
  );
}

