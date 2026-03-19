'use client';

import { useState, useEffect } from 'react';
import { Category, TimelineTask } from '@cursor-deneme/shared';
import { getMockCategories, saveMockCategories, fetchTasksFromSupabase, deleteTaskFromSupabase, syncTaskToGoogleCalendar } from '@cursor-deneme/shared';
import { CategoryIcon } from '@/lib/categoryIcons';
import { canAddCategory } from '@cursor-deneme/shared';
import AddCategoryModal from './AddCategoryModal';
import Modal from './Modal';

const PRIMARY = '#1A2332';

const COLOR_BOX_CLASS: Record<string, { box: string; icon: string }> = {
  blue: { box: 'bg-blue-50', icon: 'text-blue-500' },
  purple: { box: 'bg-purple-50', icon: 'text-purple-500' },
  pink: { box: 'bg-pink-50', icon: 'text-pink-500' },
  orange: { box: 'bg-orange-50', icon: 'text-orange-500' },
  yellow: { box: 'bg-yellow-50', icon: 'text-yellow-600' },
  emerald: { box: 'bg-emerald-50', icon: 'text-emerald-500' },
};

interface CategoriesViewProps {
  userId: string;
  darkMode?: boolean;
  isPro?: boolean;
  onOpenPro?: () => void;
  onBack: () => void;
  onCategorySelect: (category: string) => void;
  tasks?: TimelineTask[];
  onRefreshTasks?: () => void;
  categories?: Category[];
  onRefreshCategories?: () => void;
}

export default function CategoriesView({
  userId,
  darkMode = false,
  isPro = false,
  onOpenPro,
  onBack,
  onCategorySelect,
  tasks: tasksFromParent,
  onRefreshTasks,
  categories: categoriesFromParent,
  onRefreshCategories,
}: CategoriesViewProps) {
  const dark = darkMode;
  const [localCategories, setLocalCategories] = useState<Category[]>([]);
  const [localTasks, setLocalTasks] = useState<TimelineTask[]>([]);
  const categories = categoriesFromParent ?? localCategories;
  const allTasks = tasksFromParent ?? localTasks;
  const [loading, setLoading] = useState(true);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [tab, setTab] = useState<'all' | 'progress' | 'archived'>('all');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  useEffect(() => {
    if (categoriesFromParent === undefined) setLocalCategories(getMockCategories(userId));
    if (tasksFromParent !== undefined) {
      setLoading(false);
      return;
    }
    const load = async () => {
      setLoading(true);
      setLocalTasks(await fetchTasksFromSupabase(userId));
      setLoading(false);
    };
    load();
  }, [userId, tasksFromParent, categoriesFromParent]);

  const loadData = async () => {
    setLoading(true);
    if (categoriesFromParent === undefined) setLocalCategories(getMockCategories(userId));
    if (tasksFromParent === undefined) setLocalTasks(await fetchTasksFromSupabase(userId));
    setLoading(false);
  };

  const handleAddCategory = (category: Category) => {
    const existingIndex = categories.findIndex((c) => c.id === category.id);
    const updatedCategories =
      existingIndex >= 0 ? categories.map((c, i) => (i === existingIndex ? category : c)) : [...categories, category];
    saveMockCategories(userId, updatedCategories);
    setShowAddCategoryModal(false);
    setEditingCategory(null);
    onRefreshCategories?.();
    loadData();
  };

  const openAddCategory = () => {
    if (!canAddCategory(isPro, categories.length)) {
      onOpenPro?.();
      return;
    }
    setEditingCategory(null);
    setShowAddCategoryModal(true);
  };

  const handleDeleteCategory = async (categoryId: string) => {
    const categoryTasks = allTasks.filter((t) => t.category === categoryId);
    for (const task of categoryTasks) {
      if (task.id) {
        if (task.googleEventId) await syncTaskToGoogleCalendar(userId, task, 'delete');
        await deleteTaskFromSupabase(userId, task.id);
      }
    }
    const updatedCategories = categories.filter((c) => c.id !== categoryId);
    if (categoriesFromParent === undefined) setLocalCategories(updatedCategories);
    saveMockCategories(userId, updatedCategories);
    setShowDeleteConfirm(null);
    setMenuOpenId(null);
    onRefreshCategories?.();
    onRefreshTasks?.();
    loadData();
  };

  const categoryStats = categories.map((cat) => {
    const catTasks = allTasks.filter((t) => t.category === cat.id);
    const completed = catTasks.filter((t) => t.completed).length;
    const total = catTasks.length;
    const left = total - completed;
    return {
      ...cat,
      total,
      completed,
      left,
      progress: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }).sort((a, b) => {
    const pinned = ['routines', 'reading'];
    const ai = pinned.indexOf(a.id);
    const bi = pinned.indexOf(b.id);
    if (ai !== -1 || bi !== -1) return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    return a.name.localeCompare(b.name, 'tr');
  });

  const filtered = categoryStats.filter((cat) => {
    const matchSearch = !searchQuery.trim() || cat.name.toLowerCase().includes(searchQuery.trim().toLowerCase());
    if (!matchSearch) return false;
    if (tab === 'all') return true;
    if (tab === 'progress') return cat.left > 0;
    if (tab === 'archived') return cat.total > 0 && cat.left === 0;
    return true;
  });

  const pageBg = '#F8FAFC';

  if (loading) {
    return (
      <div className="flex flex-col flex-1 min-h-screen overflow-auto" style={{ backgroundColor: pageBg }}>
        <div className="flex items-center justify-center flex-1">
          <div className="text-center">
            <div className="w-12 h-12 border-4 rounded-full animate-spin mx-auto mb-4 border-slate-200" style={{ borderTopColor: PRIMARY }} />
            <p className="text-slate-500">Yükleniyor...</p>
          </div>
        </div>
      </div>
    );
  }

  const colorBox = (color: string) => COLOR_BOX_CLASS[color] ?? COLOR_BOX_CLASS.orange;

  return (
    <div className="flex flex-col flex-1 min-h-screen overflow-auto" style={{ backgroundColor: pageBg }}>
      <div className="relative mx-auto w-full max-w-md flex-1 flex flex-col min-h-0 bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between p-4 sticky top-0 bg-[rgba(248,250,252,0.8)] backdrop-blur-md z-10 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="p-2 rounded-full hover:bg-slate-200 transition-colors text-slate-600"
              aria-label="Geri"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Kategoriler</h1>
          </div>
          <button
            type="button"
            onClick={openAddCategory}
            className="p-2 rounded-full hover:bg-slate-200 transition-colors text-slate-700"
            aria-label="Yeni liste"
          >
            <span className="material-symbols-outlined">notifications</span>
          </button>
        </header>

        <main className="flex-1 overflow-y-auto px-4">
          {/* Search Bar */}
          <div className="my-4">
            <label className="relative block group">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 transition-colors group-focus-within:text-slate-900">
                <span className="material-symbols-outlined">search</span>
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-100 border-none rounded-xl py-3 pl-12 pr-4 focus:ring-2 text-slate-900 placeholder-slate-500"
                style={{ outline: 'none' }}
                placeholder="Listelerde ara..."
              />
            </label>
          </div>

          {/* Filter Toggle */}
          <div className="flex p-1 bg-slate-100 rounded-xl mb-6">
            {[
              { key: 'all' as const, label: 'Tümü' },
              { key: 'progress' as const, label: 'Devam Eden' },
              { key: 'archived' as const, label: 'Arşivlendi' },
            ].map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                  tab === key
                    ? 'bg-white shadow-sm text-slate-900'
                    : 'text-slate-500'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Lists Container */}
          <div className="space-y-4 pb-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 px-1">Listelerim</h2>

            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6">
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 bg-white border border-slate-100">
                  <span className="material-symbols-outlined text-4xl text-slate-400">folder</span>
                </div>
                <h2 className="text-lg font-bold mb-2 text-slate-900">
                  {tab === 'all' ? 'Henüz liste yok' : tab === 'progress' ? 'Devam eden yok' : 'Arşivlenmiş yok'}
                </h2>
                <p className="text-sm mb-6 text-center text-slate-400 max-w-[260px]">
                  {tab === 'all' ? 'Yeni bir liste oluşturarak başlayabilirsin.' : 'Bu filtrede liste görünmüyor.'}
                </p>
                {tab === 'all' && (
                  <button
                    type="button"
                    onClick={openAddCategory}
                    className="px-8 py-3 bg-slate-100 text-slate-900 font-bold rounded-2xl hover:bg-slate-200 transition-all text-sm"
                  >
                    Yeni liste oluştur
                  </button>
                )}
              </div>
            ) : (
              <>
                {filtered.map((cat) => {
                  // Rutinler ve Okuma Listesi için renkleri tasarımla eşleştir
                  const forced =
                    cat.id === 'routines'
                      ? { box: 'bg-blue-100', icon: 'text-blue-600' }
                      : cat.id === 'reading'
                        ? { box: 'bg-purple-100', icon: 'text-purple-600' }
                        : null;
                  const { box, icon } = forced ?? colorBox(cat.color);

                  return (
                    <div
                      key={cat.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => onCategorySelect(cat.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onCategorySelect(cat.id);
                        }
                      }}
                      className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-slate-200 cursor-pointer hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className={`size-12 rounded-xl ${box} flex items-center justify-center ${icon}`}>
                          <CategoryIcon icon={cat.icon} size={24} className="w-6 h-6 shrink-0" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-slate-900 truncate">{cat.name}</h3>
                          <p className="text-xs text-slate-500">
                            {cat.total === 0 ? 'Görev yok' : `${cat.total} Görev`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCategory(cat);
                            setShowAddCategoryModal(true);
                          }}
                          className="text-slate-400 hover:text-slate-600 transition-colors"
                          aria-label="Listeyi düzenle"
                        >
                          <span className="material-symbols-outlined">edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onCategorySelect(cat.id)}
                          className="text-slate-400 hover:text-slate-600 transition-colors"
                          aria-label="Aç"
                        >
                          <span className="material-symbols-outlined">chevron_right</span>
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Add New List Button */}
                <button
                  type="button"
                  onClick={openAddCategory}
                  className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 transition-all group hover:border-slate-900 hover:text-slate-900"
                >
                  <span className="material-symbols-outlined group-hover:scale-110 transition-transform">add_circle</span>
                  <span className="font-medium">Yeni liste oluştur</span>
                </button>
              </>
            )}
          </div>
        </main>
      </div>

      {showAddCategoryModal && (
        <AddCategoryModal
          onClose={() => {
            setShowAddCategoryModal(false);
            setEditingCategory(null);
          }}
          onSave={handleAddCategory}
          userId={userId}
          category={editingCategory ?? undefined}
          darkMode={dark}
          isPro={isPro}
        />
      )}

      {showDeleteConfirm &&
        (() => {
          const cat = categories.find((c) => c.id === showDeleteConfirm);
          const catTasks = allTasks.filter((t) => t.category === showDeleteConfirm);
          return (
            <Modal key={showDeleteConfirm} open dark={dark} onClose={() => setShowDeleteConfirm(null)} maxWidth="sm">
              <div className="text-center mb-6">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${dark ? 'bg-red-900/40' : 'bg-red-100'}`}>
                  <svg className={`w-8 h-8 ${dark ? 'text-red-400' : 'text-red-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <h3 className={`text-lg font-bold mb-2 ${dark ? 'text-white' : 'text-stone-900'}`}>Listeyi sil</h3>
                <p className={`text-sm ${dark ? 'text-zinc-400' : 'text-stone-600'}`}>
                  &quot;{cat?.name}&quot; listesini silmek istediğinden emin misin?
                  {catTasks.length > 0 && (
                    <span className={`block mt-2 font-semibold ${dark ? 'text-red-400' : 'text-red-600'}`}>Bu listeye ait {catTasks.length} görev de silinecek.</span>
                  )}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(null)}
                  className={`flex-1 py-3 rounded-xl font-semibold transition-all ${dark ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-stone-100 text-stone-800 hover:bg-stone-200'}`}
                >
                  İptal
                </button>
                <button
                  type="button"
                  onClick={() => showDeleteConfirm && handleDeleteCategory(showDeleteConfirm)}
                  className="flex-1 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-all"
                >
                  Sil
                </button>
              </div>
            </Modal>
          );
        })()}
    </div>
  );
}
