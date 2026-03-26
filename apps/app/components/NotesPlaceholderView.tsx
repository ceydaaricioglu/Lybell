'use client';

import { useState } from 'react';
import type { Note, NoteFolder } from '@cursor-deneme/shared';

interface NotesPlaceholderViewProps {
  darkMode?: boolean;
  onBack: () => void;
  onOpenFolders?: () => void;
  onCreateNote?: () => void;
  onOpenNote?: (noteId: string) => void;
  notes?: Note[];
  folders?: NoteFolder[];
  notesLoading?: boolean;
}

export default function NotesPlaceholderView({
  darkMode = false,
  onBack,
  onOpenFolders,
  onCreateNote,
  onOpenNote,
  notes,
}: NotesPlaceholderViewProps) {
  const dark = darkMode;
  const pageBg = dark ? '#0f172a' : '#F8FAFC';
  const cardBg = dark ? '#1A2332' : '#ffffff';
  const border = dark ? '#2a1f1a' : '#e5e7eb';

  const [searchOpen, setSearchOpen] = useState(false);

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
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Notlar</h1>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.14em]">
              Yakında
            </p>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenFolders}
              className="p-2 rounded-full hover:bg-slate-100 text-slate-600"
              aria-label="Klasörler"
            >
              <span className="material-symbols-outlined">folder</span>
            </button>
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="p-2 rounded-full hover:bg-slate-100 text-slate-600"
              aria-label="Ara"
            >
              <span className="material-symbols-outlined">search</span>
            </button>
          </div>
        </header>

        <main className="flex-1 px-5 py-6 space-y-4">
          {searchOpen && (
            <section
              className="rounded-2xl border p-4"
              style={{ backgroundColor: cardBg, borderColor: border, borderWidth: 1, borderStyle: 'solid' }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-slate-600 dark:text-slate-200">search</span>
                  <span className="text-sm font-semibold">Arama</span>
                </div>
                <button type="button" className="text-xs font-bold text-slate-500" onClick={() => setSearchOpen(false)}>
                  Kapat
                </button>
              </div>

              <div className="mt-4">
                <div className="h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
              </div>
            </section>
          )}

          <section
            className="rounded-2xl border p-4"
            style={{ backgroundColor: cardBg, borderColor: border, borderWidth: 1, borderStyle: 'solid' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-slate-600 dark:text-slate-200">notes</span>
                <span className="text-sm font-semibold">Liste / Kart görünümü</span>
              </div>
              <button
                type="button"
                onClick={() => onCreateNote?.()}
                className="px-3 py-2 rounded-xl text-xs font-bold"
                style={{ backgroundColor: '#1A2332', color: '#fff' }}
              >
                + Yeni
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              {notes && notes.length > 0 ? (
                notes.map((n) => {
                  const title = n.title || 'Not';
                  const body = (n.transcript || n.content || '').toString().trim();
                  const snippet = body ? (body.length > 52 ? `${body.slice(0, 52)}...` : body) : 'Metin yok';
                  const audio = !!(n.audioUrl || n.transcript);

                  return (
                    <button
                      type="button"
                      key={n.id}
                      className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800 p-3 space-y-2"
                      onClick={() => onOpenNote?.(n.id)}
                      aria-label={`Notu aç: ${title}`}
                    >
                      <div className="h-10 rounded-xl bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600" />
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-[12px] font-bold text-slate-900 dark:text-white truncate">{title}</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{snippet}</div>
                        </div>
                        {audio ? (
                          <span className="material-symbols-outlined text-[#1A2332] dark:text-slate-200" style={{ fontSize: 18 }}>
                            mic
                          </span>
                        ) : (
                          <span className="material-symbols-outlined text-slate-300 dark:text-slate-600" style={{ fontSize: 18 }}>
                            link
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              ) : (
                <div
                  className="col-span-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800 p-4"
                  style={{ minHeight: 112 }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-[#1A2332] dark:text-slate-200" style={{ fontSize: 24 }}>
                        note_add
                      </span>
                      <div>
                        <div className="text-[14px] font-bold text-slate-900 dark:text-white">Henüz not yok</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                          İlk notunu oluşturmak için sağ üstteki <span className="font-bold">+ Yeni</span>’ye dokun.
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="px-3 py-2 rounded-xl text-xs font-bold"
                      onClick={() => onCreateNote?.()}
                      style={{ backgroundColor: '#1A2332', color: '#fff' }}
                    >
                      + Yeni
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

