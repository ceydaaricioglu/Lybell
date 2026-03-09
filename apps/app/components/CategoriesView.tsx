'use client';

import { useState, useEffect } from 'react';
import { Category, TimelineTask } from '@cursor-deneme/shared';
import { getMockCategories, saveMockCategories, fetchTasksFromSupabase, deleteTaskFromSupabase, syncTaskToGoogleCalendar } from '@cursor-deneme/shared';
import { CategoryIcon } from '@/lib/categoryIcons';
import { canAddCategory } from '@cursor-deneme/shared';
import AddCategoryModal from './AddCategoryModal';
import Modal from './Modal';

const PRIMARY = '#fb923c';

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
  // Referans tasarım: bu sayfa her zaman açık tema (beyaz kart, koyu metin)
  const dark = false;
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
  });

  const filtered = categoryStats.filter((cat) => {
    const matchSearch = !searchQuery.trim() || cat.name.toLowerCase().includes(searchQuery.trim().toLowerCase());
    if (!matchSearch) return false;
    if (tab === 'all') return true;
    if (tab === 'progress') return cat.left > 0;
    if (tab === 'archived') return cat.total > 0 && cat.left === 0;
    return true;
  });

  const pageBg = '#fdfdfd';

  if (loading) {
    return (
      <div className="flex flex-col flex-1 min-h-0 overflow-auto" style={{ backgroundColor: pageBg }}>
        <div className="flex items-center justify-center flex-1">
          <div className="text-center">
            <div className="w-12 h-12 border-4 rounded-full animate-spin mx-auto mb-4 border-slate-200 border-t-orange-500" />
            <p className="text-slate-500">Yükleniyor...</p>
          </div>
        </div>
      </div>
    );
  }

  const colorBox = (color: string) => COLOR_BOX_CLASS[color] ?? COLOR_BOX_CLASS.orange;

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-auto pb-24" style={{ backgroundColor: pageBg }}>
      {/* Kart container — referans: beyaz kart */}
      <div className="relative mx-auto w-full max-w-md flex-1 flex flex-col min-h-screen bg-white shadow-xl">
        {/* Header — referans: pt-20 (safe area / 80px) */}
        <header className="pt-20 px-6 pb-4">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onBack}
              className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-slate-100 transition-colors"
              aria-label="Geri"
            >
              <span className="material-symbols-outlined text-slate-700">arrow_back</span>
            </button>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Kategoriler</h1>
            <button
              type="button"
              onClick={openAddCategory}
              className="flex items-center justify-center w-10 h-10 rounded-full transition-colors"
              style={{ backgroundColor: `${PRIMARY}20`, color: PRIMARY }}
              aria-label="Kategori ekle"
            >
              <span className="material-symbols-outlined font-bold">add</span>
            </button>
          </div>
        </header>

        {/* Search — referans: icon sol, focus ring primary */}
        <div className="px-6 py-4">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-slate-400 group-focus-within:text-[#fb923c] transition-colors text-xl">search</span>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Listelerinde ara..."
              className="block w-full pl-11 pr-4 py-3 border-none rounded-xl focus:ring-2 focus:ring-[#fb923c]/30 transition-all placeholder:text-slate-400 text-sm bg-slate-100 text-slate-900"
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="px-6 py-2">
          <div className="flex gap-2 p-1 bg-slate-100/50 rounded-xl">
            {[
              { key: 'all' as const, label: 'Tümü' },
              { key: 'progress' as const, label: 'Devam Eden' },
              { key: 'archived' as const, label: 'Arşiv' },
            ].map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                  tab === key
                    ? 'bg-white shadow-sm font-semibold'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
                style={tab === key ? { color: PRIMARY } : undefined}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* List content */}
        <div className="flex-1 px-6 py-6 space-y-4">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 bg-white border border-slate-100">
                <span className="material-symbols-outlined text-4xl text-slate-400">folder</span>
              </div>
              <h2 className="text-xl font-bold mb-2 text-slate-900">
                {tab === 'all' ? 'Henüz kategori yok' : tab === 'progress' ? 'Devam eden yok' : 'Arşivlenmiş yok'}
              </h2>
              <p className="text-sm mb-6 text-center text-slate-500">
                {tab === 'all' ? 'İlk kategorini oluşturarak başla' : 'Bu filtrede liste görünmüyor.'}
              </p>
              {tab === 'all' && (
                <button
                  type="button"
                  onClick={openAddCategory}
                  className="px-6 py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90"
                  style={{ backgroundColor: PRIMARY }}
                >
                  + Kategori Oluştur
                </button>
              )}
            </div>
          ) : (
            <>
              {filtered.map((cat) => {
                const { box, icon } = colorBox(cat.color);
                return (
                  <div
                    key={cat.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => onCategorySelect(cat.id)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onCategorySelect(cat.id); } }}
                    className="group flex items-center justify-between p-4 bg-white border border-slate-100 rounded-xl hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className="flex-1 flex items-center gap-4 min-w-0">
                      <div className={`flex items-center justify-center w-12 h-12 rounded-xl flex-shrink-0 ${box} ${icon}`}>
                        <CategoryIcon icon={cat.icon} size={24} className="w-6 h-6 shrink-0" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-slate-900">{cat.name}</h3>
                        <p className="text-xs text-slate-500">
                          {cat.total === 0 ? 'Görev yok' : `${cat.completed} tamamlandı`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      <span className="text-sm font-medium text-slate-400">{cat.total} görev</span>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === cat.id ? null : cat.id); }}
                          className="p-1.5 rounded-lg transition-colors text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                          aria-label="Menü"
                        >
                          <span className="material-symbols-outlined text-xl">more_vert</span>
                        </button>
                        {menuOpenId === cat.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setMenuOpenId(null)} aria-hidden />
                            <div className="absolute right-0 top-full mt-1 py-1 rounded-lg shadow-lg z-20 min-w-[120px] bg-white border border-slate-200">
                              <button
                                type="button"
                                onClick={() => { setEditingCategory(cat); setShowAddCategoryModal(true); setMenuOpenId(null); }}
                                className="w-full text-left px-4 py-2 text-sm font-medium flex items-center gap-2 text-slate-800 hover:bg-slate-50"
                              >
                                <span className="material-symbols-outlined text-lg">edit</span>
                                Düzenle
                              </button>
                              <button
                                type="button"
                                onClick={() => { setShowDeleteConfirm(cat.id); setMenuOpenId(null); }}
                                className="w-full text-left px-4 py-2 text-sm font-medium flex items-center gap-2 text-red-500 hover:bg-red-500/10"
                              >
                                <span className="material-symbols-outlined text-lg">delete</span>
                                Sil
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Add new list — referans: border-dashed, hover primary */}
              <button
                type="button"
                onClick={openAddCategory}
                className="w-full flex items-center justify-center gap-2 p-6 border-2 border-dashed rounded-xl transition-all text-slate-400 border-slate-200 hover:border-[#fb923c]/50 hover:bg-[#fb923c]/5 hover:text-[#fb923c] group"
              >
                <span className="material-symbols-outlined">add_circle</span>
                <span className="font-semibold">Yeni liste ekle</span>
              </button>
            </>
          )}
        </div>
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
