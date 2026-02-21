'use client';

import { useState, useEffect } from 'react';
import { Category, TimelineTask } from '@/lib/types';
import { getMockCategories, saveMockCategories, fetchTasksFromSupabase, deleteTaskFromSupabase, syncTaskToGoogleCalendar } from '@/lib/helpers';
import { getCategoryColor } from '@/lib/constants';
import { canAddCategory } from '@/lib/limits';
import AddCategoryModal from './AddCategoryModal';
import Modal from './Modal';

interface CategoriesViewProps {
  userId: string;
  darkMode?: boolean;
  isPro?: boolean;
  onOpenPro?: () => void;
  onBack: () => void;
  onCategorySelect: (category: string) => void;
  /** Merkezi cache: verilirse kullanılır */
  tasks?: TimelineTask[];
  onRefreshTasks?: () => void;
}

export default function CategoriesView({ userId, darkMode = false, isPro = false, onOpenPro, onBack, onCategorySelect, tasks: tasksFromParent, onRefreshTasks }: CategoriesViewProps) {
  const dark = darkMode;
  const [categories, setCategories] = useState<Category[]>([]);
  const [localTasks, setLocalTasks] = useState<TimelineTask[]>([]);
  const allTasks = tasksFromParent ?? localTasks;
  const [loading, setLoading] = useState(true);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    setCategories(getMockCategories(userId));
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
  }, [userId, tasksFromParent]);

  const loadData = async () => {
    setLoading(true);
    setCategories(getMockCategories(userId));
    if (tasksFromParent === undefined) {
      setLocalTasks(await fetchTasksFromSupabase(userId));
    }
    setLoading(false);
  };

  const handleAddCategory = (category: Category) => {
    const existingIndex = categories.findIndex(c => c.id === category.id);
    const updatedCategories = existingIndex >= 0
      ? categories.map((c, i) => i === existingIndex ? category : c)
      : [...categories, category];
    setCategories(updatedCategories);
    saveMockCategories(userId, updatedCategories);
    setShowAddCategoryModal(false);
    setEditingCategory(null);
    loadData();
  };

  const openAddCategory = () => {
    if (!canAddCategory(isPro, categories.length)) {
      onOpenPro?.();
      return;
    }
    setShowAddCategoryModal(true);
  };

  const handleDeleteCategory = async (categoryId: string) => {
    const categoryTasks = allTasks.filter(t => t.category === categoryId);
    for (const task of categoryTasks) {
      if (task.id) {
        if (task.googleEventId) await syncTaskToGoogleCalendar(userId, task, 'delete');
        await deleteTaskFromSupabase(userId, task.id);
      }
    }
    const updatedCategories = categories.filter(c => c.id !== categoryId);
    setCategories(updatedCategories);
    saveMockCategories(userId, updatedCategories);
    setShowDeleteConfirm(null);
    onRefreshTasks?.();
    loadData();
  };

  const categoryStats = categories.map(cat => {
    const catTasks = allTasks.filter(t => t.category === cat.id);
    return {
      ...cat,
      total: catTasks.length,
      completed: catTasks.filter(t => t.completed).length,
      progress: catTasks.length > 0 ? Math.round((catTasks.filter(t => t.completed).length / catTasks.length) * 100) : 0,
    };
  });

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${dark ? 'bg-[#0f0f0f]' : 'bg-[#f5f0ea]'}`}>
        <div className="text-center">
          <div className={`w-12 h-12 border-4 rounded-full animate-spin mx-auto mb-4 ${dark ? 'border-zinc-700 border-t-amber-400/80' : 'border-stone-200 border-t-amber-500'}`}></div>
          <p className={dark ? 'text-zinc-500' : 'text-stone-500'}>Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen pb-24 ${dark ? 'bg-[#0f0f0f] text-zinc-100' : 'bg-[#f5f0ea] text-stone-800'}`}>
      <div className="max-w-md mx-auto px-5 pt-6 pb-4">
        {/* Header */}
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
        </header>

        {categoryStats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-4xl ${dark ? 'bg-zinc-800/80' : 'bg-white shadow-[0_4px_24px_-4px_rgba(0,0,0,0.06)] border border-stone-100'}`}>
              📁
            </div>
            <h2 className={`text-xl font-bold mb-2 ${dark ? 'text-white' : 'text-stone-800'}`}>Henüz kategori yok</h2>
            <p className={`text-sm mb-6 text-center ${dark ? 'text-zinc-500' : 'text-stone-500'}`}>İlk kategorini oluşturarak başla</p>
            <button
              onClick={openAddCategory}
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${dark ? 'bg-amber-500/90 text-black hover:bg-amber-400' : 'bg-amber-600 text-white hover:shadow-lg hover:scale-[1.02]'}`}
            >
              + Kategori Oluştur
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {categoryStats.map((cat) => {
              const colors = getCategoryColor(cat.color);
              return (
                <div
                  key={cat.id}
                  className={`rounded-[24px] overflow-hidden transition-all ${
                    dark ? 'bg-zinc-900/60 border border-zinc-800/80' : 'bg-white shadow-[0_4px_24px_-4px_rgba(0,0,0,0.06)] border border-stone-100'
                  }`}
                >
                  <button
                    onClick={() => onCategorySelect(cat.id)}
                    className="w-full text-left p-5 transition-transform active:scale-[0.99] active:opacity-95"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 ${
                        dark ? 'bg-zinc-800' : colors.light
                      }`}>
                        {cat.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`font-bold text-lg ${dark ? 'text-white' : 'text-stone-900'}`}>{cat.name}</div>
                        <div className={`flex items-center gap-2 mt-1 text-sm ${dark ? 'text-zinc-500' : 'text-stone-500'}`}>
                          <span>{cat.total} görev</span>
                          {cat.total > 0 && (
                            <>
                              <span className={dark ? 'text-zinc-600' : 'text-stone-300'}>•</span>
                              <span>{cat.completed} tamamlanan</span>
                            </>
                          )}
                        </div>
                      </div>
                      <svg className={`w-5 h-5 flex-shrink-0 ${dark ? 'text-zinc-500' : 'text-stone-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>

                    {cat.total > 0 && (
                      <div className="mb-1">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={`text-xs ${dark ? 'text-zinc-500' : 'text-stone-500'}`}>İlerleme</span>
                          <span className={`text-xs font-semibold ${dark ? 'text-amber-400/90' : colors.text}`}>%{cat.progress}</span>
                        </div>
                        <div className={`w-full rounded-full h-2 ${dark ? 'bg-zinc-800' : 'bg-stone-200'}`}>
                          <div
                            className={`h-2 rounded-full transition-all ${dark ? 'bg-amber-400/80' : colors.bg}`}
                            style={{ width: `${cat.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </button>

                  <div className={`flex gap-2 p-4 pt-0 ${dark ? 'border-t border-zinc-800/80' : 'border-t border-stone-100'}`}>
                    <button
                      onClick={() => { setEditingCategory(cat); setShowAddCategoryModal(true); }}
                      className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
                        dark ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Düzenle
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(cat.id)}
                      className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
                        dark ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50' : 'bg-red-50 text-red-600 hover:bg-red-100'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Sil
                    </button>
                  </div>
                </div>
              );
            })}

            <button
              onClick={() => setShowAddCategoryModal(true)}
              className={`w-full rounded-[24px] p-5 transition-all text-center border-2 border-dashed ${
                dark
                  ? 'border-zinc-700 hover:border-amber-500/40 hover:bg-zinc-900/40'
                  : 'border-stone-200 hover:border-amber-300 bg-white shadow-[0_2px_12px_-2px_rgba(0,0,0,0.08)] hover:shadow-md'
              }`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-2 text-2xl font-light ${
                dark ? 'bg-zinc-800 text-zinc-400' : 'bg-amber-50 text-amber-600'
              }`}>
                +
              </div>
              <div className={`font-semibold ${dark ? 'text-amber-400/90' : 'text-amber-700'}`}>Yeni Liste Ekle</div>
            </button>
          </div>
        )}

        {showAddCategoryModal && (
          <AddCategoryModal
            onClose={() => { setShowAddCategoryModal(false); setEditingCategory(null); }}
            onSave={handleAddCategory}
            userId={userId}
            category={editingCategory || undefined}
            darkMode={dark}
            isPro={isPro}
          />
        )}

        {showDeleteConfirm && (() => {
          const cat = categories.find(c => c.id === showDeleteConfirm);
          const catTasks = allTasks.filter(t => t.category === showDeleteConfirm);
          return (
            <Modal key={showDeleteConfirm} open dark={dark} onClose={() => setShowDeleteConfirm(null)} maxWidth="sm">
              <div className="text-center mb-6">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${dark ? 'bg-red-900/40' : 'bg-red-100'}`}>
                  <svg className={`w-8 h-8 ${dark ? 'text-red-400' : 'text-red-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <h3 className={`text-lg font-bold mb-2 ${dark ? 'text-white' : 'text-stone-900'}`}>Kategoriyi Sil</h3>
                <p className={`text-sm ${dark ? 'text-zinc-400' : 'text-stone-600'}`}>
                  &quot;{cat?.name}&quot; kategorisini silmek istediğinden emin misin?
                  {catTasks.length > 0 && (
                    <span className={`block mt-2 font-semibold ${dark ? 'text-red-400' : 'text-red-600'}`}>
                      Bu kategoriye ait {catTasks.length} görev de silinecek.
                    </span>
                  )}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className={`flex-1 py-3 rounded-xl font-semibold transition-all ${dark ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'}`}
                >
                  İptal
                </button>
                <button
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
    </div>
  );
}
