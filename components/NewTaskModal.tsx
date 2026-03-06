'use client';

import { useState, useEffect } from 'react';
import { Category, TimelineTask } from '@/lib/types';

const PRIMARY = '#f97316';

interface NewTaskModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (task: TimelineTask) => void;
  userId: string;
  categories: Category[];
  defaultCategory?: string | null;
  defaultDate?: string;
  darkMode?: boolean;
}

export default function NewTaskModal({
  open,
  onClose,
  onSave,
  userId,
  categories,
  defaultCategory = null,
  defaultDate,
  darkMode = false,
}: NewTaskModalProps) {
  const dark = darkMode;
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<string>(defaultCategory || (categories[0]?.id ?? ''));
  const [dueDate, setDueDate] = useState(defaultDate || todayStr);
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');

  useEffect(() => {
    if (open) {
      setCategoryId((defaultCategory || categories[0]?.id) ?? '');
      setDueDate(defaultDate || new Date().toISOString().slice(0, 10));
    }
  }, [open, defaultCategory, defaultDate, categories]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = title.trim();
    if (!t) return;
    const d = dueDate ? new Date(dueDate) : today;
    const day = d.getDate().toString();
    const task: TimelineTask = {
      title: t,
      description: description.trim() || undefined,
      time: '08:00',
      date: day,
      originalDate: dueDate || undefined,
      completed: false,
      category: categoryId || null,
      priority,
    };
    onSave(task);
    setTitle('');
    setDescription('');
    setDueDate(todayStr);
    setPriority('medium');
    setCategoryId(categories[0]?.id ?? '');
    onClose();
  };

  const handleClose = () => {
    setTitle('');
    setDescription('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[8px]"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-[560px] overflow-hidden rounded-xl shadow-2xl border transition-all ${
          dark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        <div className={`flex items-center justify-between border-b px-6 py-4 ${dark ? 'border-slate-800' : 'border-slate-100'}`}>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Yeni Görev Oluştur</h3>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Kapat"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Görev Başlığı</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Örn. Yeni açılış sayfası tasarla"
                className={`w-full rounded-lg border px-4 py-3 outline-none transition-all placeholder-slate-400 focus:ring-2 focus:ring-[#f97316]/20 focus:border-[#f97316] ${
                  dark ? 'border-slate-700 bg-slate-800 text-white' : 'border-slate-200 bg-white text-slate-900'
                }`}
                autoFocus
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Açıklama</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Bu görev hakkında daha fazla detay..."
                rows={3}
                className={`w-full rounded-lg border px-4 py-3 resize-none outline-none transition-all placeholder-slate-400 focus:ring-2 focus:ring-[#f97316]/20 focus:border-[#f97316] ${
                  dark ? 'border-slate-700 bg-slate-800 text-white' : 'border-slate-200 bg-white text-slate-900'
                }`}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Proje / Liste</label>
                <div className="relative">
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className={`w-full appearance-none rounded-lg border px-4 py-3 pr-10 outline-none transition-all focus:ring-2 focus:ring-[#f97316]/20 focus:border-[#f97316] ${
                      dark ? 'border-slate-700 bg-slate-800 text-white' : 'border-slate-200 bg-white text-slate-900'
                    }`}
                  >
                    {categories.length === 0 ? (
                      <option value="">Liste yok</option>
                    ) : (
                      categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))
                    )}
                  </select>
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Bitiş Tarihi</label>
                <div className="relative">
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className={`w-full rounded-lg border px-4 py-3 pr-10 outline-none transition-all focus:ring-2 focus:ring-[#f97316]/20 focus:border-[#f97316] ${
                      dark ? 'border-slate-700 bg-slate-800 text-white' : 'border-slate-200 bg-white text-slate-900'
                    }`}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Öncelik</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setPriority('low')}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-lg border py-2 text-sm font-medium transition-colors ${
                    priority === 'low'
                      ? 'border-blue-500 bg-blue-500/10 text-blue-500'
                      : dark
                        ? 'border-slate-700 hover:bg-slate-800 text-slate-300'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                  Düşük
                </button>
                <button
                  type="button"
                  onClick={() => setPriority('medium')}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-lg border py-2 text-sm font-bold transition-colors ${
                    priority === 'medium'
                      ? 'border-[#f97316] bg-[#f97316]/10 text-[#f97316]'
                      : dark
                        ? 'border-slate-700 hover:bg-slate-800 text-slate-300'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className="h-2 w-2 rounded-full bg-[#f97316]" />
                  Orta
                </button>
                <button
                  type="button"
                  onClick={() => setPriority('high')}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-lg border py-2 text-sm font-medium transition-colors ${
                    priority === 'high'
                      ? 'border-red-500 bg-red-500/10 text-red-500'
                      : dark
                        ? 'border-slate-700 hover:bg-slate-800 text-slate-300'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className="h-2 w-2 rounded-full bg-red-500" />
                  Yüksek
                </button>
              </div>
            </div>
          </div>

          <div className={`flex items-center justify-end gap-3 border-t px-6 py-4 ${dark ? 'border-slate-800 bg-slate-800/30' : 'border-slate-100 bg-slate-50/50'}`}>
            <button
              type="button"
              onClick={handleClose}
              className="px-5 py-2.5 rounded-lg text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="px-6 py-2.5 rounded-lg text-white text-sm font-bold hover:opacity-90 shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: PRIMARY }}
            >
              Görev Oluştur
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
