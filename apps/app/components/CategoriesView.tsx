'use client';

import { useState, useEffect } from 'react';
import { Category, TimelineTask } from '@cursor-deneme/shared';
import { getMockCategories, saveMockCategories, fetchTasksFromSupabase, deleteTaskFromSupabase, syncTaskToGoogleCalendar } from '@cursor-deneme/shared';
import { getCategoryColor } from '@cursor-deneme/shared';
import { CategoryIcon } from '@/lib/categoryIcons';
import { canAddCategory } from '@cursor-deneme/shared';
import AddCategoryModal from './AddCategoryModal';
import Modal from './Modal';

const PRIMARY = '#f97316';

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
  });

  const filtered = categoryStats.filter((cat) => {
    const matchSearch = !searchQuery.trim() || cat.name.toLowerCase().includes(searchQuery.trim().toLowerCase());
    if (!matchSearch) return false;
    if (tab === 'all') return true;
    if (tab === 'progress') return cat.left > 0;
    if (tab === 'archived') return cat.total > 0 && cat.left === 0;
    return true;
  });

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${dark ? 'bg-[#0f0f0f]' : 'bg-[#f5f0ea]'}`}>
        <div className="text-center">
          <div className={`w-12 h-12 border-4 rounded-full animate-spin mx-auto mb-4 ${dark ? 'border-zinc-700 border-t-amber-400/80' : 'border-stone-200 border-t-amber-500'}`} />
          <p className={dark ? 'text-zinc-500' : 'text-stone-500'}>Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen pb-24 ${dark ? 'bg-[#0f0f0f] text-zinc-100' : 'bg-[#f5f0ea] text-stone-800'}`}>
      <div className="max-w-md mx-auto px-4 sm:px-5 pt-6 pb-4">
        {/* Header - eski sade tasarım */}
        <header className="mb-6">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className={`w-10 h-10 flex items-center justify-center rounded-xl transition-colors ${dark ? 'hover:bg-zinc-800' : 'hover:bg-white/80'}`}
              aria-label="Geri"
            >
              <svg className={`w-6 h-6 ${dark ? 'text-zinc-300' : 'text-stone-700'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className={`text-xl font-semibold ${dark ? 'text-white' : 'text-stone-800'}`}>Listeler</h1>
            <button
              onClick={openAddCategory}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                dark ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
          <p className={`text-sm mt-1 ${dark ? 'text-zinc-500' : 'text-stone-500'}`}>{categories.length} liste</p>
          {/* Arama */}
          <div className="mt-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Liste ara..."
              className={`w-full px-4 py-2.5 rounded-xl text-sm border transition-all placeholder:opacity-70 ${
                dark ? 'bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-500' : 'bg-white border-stone-200 text-stone-800 placeholder:text-stone-400'
              }`}
            />
          </div>
          {/* Tabs - pill style */}
          {categories.length > 0 && (
            <div className="flex gap-2 mt-3 flex-wrap">
              {[
                { key: 'all' as const, label: `Tümü (${categories.length})` },
                { key: 'progress' as const, label: 'Devam Eden' },
                { key: 'archived' as const, label: 'Arşiv' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key)}
                  className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    tab === key
                      ? dark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-800'
                      : dark ? 'bg-zinc-800/80 text-zinc-400 hover:bg-zinc-700' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </header>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-4xl ${dark ? 'bg-zinc-800/80' : 'bg-white shadow-[0_4px_24px_-4px_rgba(0,0,0,0.06)] border border-stone-100'}`}>
              📁
            </div>
            <h2 className={`text-xl font-bold mb-2 ${dark ? 'text-white' : 'text-stone-800'}`}>
              {tab === 'all' ? 'Henüz kategori yok' : tab === 'progress' ? 'Devam eden yok' : 'Arşivlenmiş yok'}
            </h2>
            <p className={`text-sm mb-6 text-center ${dark ? 'text-zinc-500' : 'text-stone-500'}`}>
              {tab === 'all' ? 'İlk kategorini oluşturarak başla' : 'Bu filtrede liste görünmüyor.'}
            </p>
            {tab === 'all' && (
              <button
                onClick={openAddCategory}
                className={`px-6 py-3 rounded-xl font-semibold transition-all ${dark ? 'bg-amber-500/90 text-black hover:bg-amber-400' : 'bg-amber-600 text-white hover:shadow-lg hover:scale-[1.02]'}`}
              >
                + Kategori Oluştur
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((cat) => {
              const colors = getCategoryColor(cat.color);
              return (
                <div
                  key={cat.id}
                  className={`rounded-2xl overflow-hidden transition-all ${
                    dark ? 'bg-zinc-900/60 border border-zinc-800' : 'bg-white shadow-[0_4px_24px_-4px_rgba(0,0,0,0.06)] border border-stone-100'
                  }`}
                >
                  <div className="flex items-start justify-between p-5">
                    <button
                      type="button"
                      onClick={() => onCategorySelect(cat.id)}
                      className="flex-1 text-left min-w-0 flex items-center gap-4"
                    >
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${dark ? 'bg-zinc-800' : colors.light} ${!dark ? colors.text : ''}`}>
                        <CategoryIcon icon={cat.icon} size={28} className="w-7 h-7 shrink-0" />
                      </div>
                      <div className="min-w-0">
                        <div className={`font-bold text-lg ${dark ? 'text-white' : 'text-stone-900'}`}>{cat.name}</div>
                        <div className={`flex items-center gap-2 mt-1 text-sm ${dark ? 'text-zinc-500' : 'text-stone-500'}`}>
                          {cat.total} görev{cat.completed > 0 ? ` · ${cat.completed} tamamlandı` : ''}
                        </div>
                        <div className={`w-full h-1.5 rounded-full mt-3 overflow-hidden ${dark ? 'bg-zinc-800' : 'bg-stone-100'}`}>
                          <div className={`h-full rounded-full transition-all ${colors.bg}`} style={{ width: `${cat.progress}%` }} />
                        </div>
                      </div>
                    </button>
                    <div className="relative flex-shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpenId(menuOpenId === cat.id ? null : cat.id);
                        }}
                        className={`p-1.5 rounded-lg transition-colors ${dark ? 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200' : 'text-stone-500 hover:bg-stone-100 hover:text-stone-700'}`}
                        aria-label="Menü"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" /></svg>
                      </button>
                      {menuOpenId === cat.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setMenuOpenId(null)} aria-hidden />
                          <div className={`absolute right-0 top-full mt-1 py-1 rounded-lg shadow-lg z-20 min-w-[120px] ${dark ? 'bg-zinc-800 border border-zinc-700' : 'bg-white border border-stone-200'}`}>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCategory(cat);
                                setShowAddCategoryModal(true);
                                setMenuOpenId(null);
                              }}
                              className={`w-full text-left px-4 py-2 text-sm font-medium flex items-center gap-2 ${dark ? 'text-zinc-200 hover:bg-zinc-700' : 'text-stone-800 hover:bg-stone-50'}`}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                              Düzenle
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setShowDeleteConfirm(cat.id);
                                setMenuOpenId(null);
                              }}
                              className="w-full text-left px-4 py-2 text-sm font-medium flex items-center gap-2 text-red-500 hover:bg-red-500/10"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
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

            {/* Yeni liste ekle kartı */}
            <button
              type="button"
              onClick={openAddCategory}
              className={`w-full rounded-2xl border-2 border-dashed flex flex-col items-center justify-center py-6 transition-all group ${
                dark
                  ? 'border-zinc-700 bg-zinc-900/40 hover:bg-zinc-800 hover:border-amber-500/50'
                  : 'border-stone-200 bg-white/60 hover:bg-amber-50/80 hover:border-amber-300'
              }`}
            >
              <div className={`size-12 rounded-xl flex items-center justify-center mb-2 transition-colors ${dark ? 'bg-zinc-800 text-zinc-400 group-hover:bg-amber-500/20 group-hover:text-amber-400' : 'bg-stone-100 text-stone-500 group-hover:bg-amber-100 group-hover:text-amber-700'}`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              </div>
              <span className={`text-sm font-semibold ${dark ? 'text-zinc-400 group-hover:text-amber-400' : 'text-stone-600 group-hover:text-amber-700'}`}>Yeni liste ekle</span>
            </button>
          </div>
        )}
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
