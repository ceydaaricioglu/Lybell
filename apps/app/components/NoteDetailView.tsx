'use client';

import type { Note } from '@cursor-deneme/shared';

interface NoteDetailViewProps {
  darkMode?: boolean;
  note: Note | null;
  onBack: () => void;
}

export default function NoteDetailView({ darkMode = false, note, onBack }: NoteDetailViewProps) {
  const dark = darkMode;
  const pageBg = dark ? '#0f172a' : '#F8FAFC';
  const cardBg = dark ? '#1A2332' : '#ffffff';
  const border = dark ? '#2a1f1a' : '#e5e7eb';

  const title = note?.title?.trim() || 'Not';
  const body = (note?.transcript || note?.content || '').toString().trim();

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
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white truncate">{title}</h1>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.14em]">
              Not detayı
            </p>
          </div>
        </header>

        <main className="flex-1 px-5 py-6 space-y-4">
          <section
            className="rounded-2xl border p-4"
            style={{ backgroundColor: cardBg, borderColor: border, borderWidth: 1, borderStyle: 'solid' }}
          >
            {body ? (
              <p className="text-sm text-slate-800 dark:text-slate-100 whitespace-pre-wrap leading-relaxed">
                {body}
              </p>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Bu notta metin yok.
              </p>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

