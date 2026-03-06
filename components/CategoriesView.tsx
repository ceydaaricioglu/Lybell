'use client';

import { useState, useEffect } from 'react';
import { Category, TimelineTask } from '@/lib/types';
import { getMockCategories, saveMockCategories, fetchTasksFromSupabase, deleteTaskFromSupabase, syncTaskToGoogleCalendar } from '@/lib/helpers';
import { getCategoryColor } from '@/lib/constants';
import { CategoryIcon } from '@/lib/categoryIcons';
import { canAddCategory } from '@/lib/limits';
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
      <div className={`min-h-screen flex items-center justify-center ${dark ? 'bg-[#0f172a]' : 'bg-white'}`}>
        <div className={`w-12 h-12 border-4 rounded-full animate-spin ${dark ? 'border-slate-700 border-t-orange-500' : 'border-slate-200 border-t-orange-500'}`} />
      </div>
    );
  }

  return (
    <div className={`min-h-screen pb-24 md:pb-8 ${dark ? 'bg-[#0f172a] text-slate-100' : 'bg-white text-slate-900'}`}>
      <div className="p-4 md:p-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3 md:gap-4">
            <button
              onClick={onBack}
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Geri"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Proje Portföyü</h2>
              <p className="text-slate-600 dark:text-slate-400 mt-1 text-sm">Listelerini ve görev akışını yönet.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 md:flex-none min-w-0">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Proje ara..."
                className={`w-full md:w-64 pl-10 pr-4 py-2 rounded-lg text-sm border outline-none transition-all ${
                  dark ? 'bg-slate-900 border-slate-800 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500' : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500'
                }`}
              />
            </div>
            <button
              type="button"
              className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 border transition-colors ${
                dark ? 'bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
              Filtre
            </button>
            <button
              type="button"
              onClick={openAddCategory}
              className="text-white px-5 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:opacity-90 transition-all shadow-md"
              style={{ backgroundColor: PRIMARY }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
              Yeni Proje
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 mb-8 gap-6 md:gap-8">
          <button
            type="button"
            onClick={() => setTab('all')}
            className={`pb-4 border-b-2 text-sm font-bold transition-colors ${
              tab === 'all' ? 'border-orange-500 text-orange-500' : 'border-transparent text-slate-600 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            Tümü ({categories.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('progress')}
            className={`pb-4 border-b-2 text-sm font-bold transition-colors ${
              tab === 'progress' ? 'border-orange-500 text-orange-500' : 'border-transparent text-slate-600 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            Devam Eden
          </button>
          <button
            type="button"
            onClick={() => setTab('archived')}
            className={`pb-4 border-b-2 text-sm font-bold transition-colors ${
              tab === 'archived' ? 'border-orange-500 text-orange-500' : 'border-transparent text-slate-600 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            Arşiv
          </button>
        </div>

        {/* Project cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((cat) => {
            const colors = getCategoryColor(cat.color);
            return (
              <div
                key={cat.id}
                className={`rounded-xl border p-6 shadow-sm hover:shadow-md transition-shadow group ${
                  dark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.06)]'
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div
                    className={`size-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      dark ? `${colors.light} bg-opacity-30 ${colors.text}` : colors.light
                    } ${!dark ? colors.text : ''}`}
                  >
                    <CategoryIcon icon={cat.icon} size={28} className="w-7 h-7 shrink-0" />
                  </div>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpenId(menuOpenId === cat.id ? null : cat.id);
                      }}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      aria-label="Menü"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" /></svg>
                    </button>
                    {menuOpenId === cat.id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setMenuOpenId(null)} aria-hidden />
                        <div className={`absolute right-0 top-full mt-1 py-1 rounded-lg shadow-lg z-20 min-w-[120px] ${dark ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'}`}>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCategory(cat);
                              setShowAddCategoryModal(true);
                              setMenuOpenId(null);
                            }}
                            className={`w-full text-left px-4 py-2 text-sm font-medium flex items-center gap-2 ${dark ? 'text-slate-200 hover:bg-slate-700' : 'text-slate-800 hover:bg-slate-50'}`}
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
                            className={`w-full text-left px-4 py-2 text-sm font-medium flex items-center gap-2 text-red-500 hover:bg-red-500/10`}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            Sil
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onCategorySelect(cat.id)}
                  className="w-full text-left"
                >
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 group-hover:text-orange-500 transition-colors">{cat.name}</h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm mb-6 line-clamp-2 leading-relaxed">
                    {cat.total} görev{cat.completed > 0 ? ` · ${cat.completed} tamamlandı` : ''}
                  </p>
                </button>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                    <span className="text-slate-500 dark:text-slate-400">İlerleme</span>
                    <span className="text-slate-900 dark:text-white">%{cat.progress}</span>
                  </div>
                  <div className={`w-full h-2 rounded-full overflow-hidden ${dark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                    <div className={`h-full rounded-full transition-all ${colors.bg}`} style={{ width: `${cat.progress}%` }} />
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex -space-x-2">
                      <div className={`size-8 rounded-full border-2 flex items-center justify-center text-xs font-bold ${dark ? 'bg-slate-700 border-slate-900 text-slate-400' : 'bg-slate-200 border-white text-slate-600'}`}>
                        ?
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs font-medium">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                      {cat.left} görev kaldı
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Add new project card */}
          <button
            type="button"
            onClick={openAddCategory}
            className={`rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-6 min-h-[240px] transition-all group ${
              dark
                ? 'border-slate-800 bg-slate-900/50 hover:bg-slate-800 hover:border-orange-500'
                : 'border-slate-200 bg-white hover:bg-slate-50 hover:border-orange-500'
            }`}
          >
            <div
              className={`size-12 rounded-full flex items-center justify-center mb-3 transition-all ${
                dark ? 'bg-slate-800 text-slate-400 group-hover:bg-orange-500 group-hover:text-white' : 'bg-slate-100 text-slate-600 group-hover:bg-orange-500 group-hover:text-white'
              }`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            </div>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white">Yeni proje başlat</span>
          </button>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              {tab === 'all' ? 'Henüz proje yok.' : tab === 'progress' ? 'Devam eden proje yok.' : 'Arşivlenmiş proje yok.'}
            </p>
            {tab === 'all' && (
              <button
                type="button"
                onClick={openAddCategory}
                className="text-white px-5 py-2.5 rounded-lg text-sm font-bold inline-flex items-center gap-2 hover:opacity-90"
                style={{ backgroundColor: PRIMARY }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Yeni Proje
              </button>
            )}
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
                <h3 className={`text-lg font-bold mb-2 ${dark ? 'text-white' : 'text-slate-900'}`}>Projeyi sil</h3>
                <p className={`text-sm ${dark ? 'text-slate-400' : 'text-slate-600'}`}>
                  &quot;{cat?.name}&quot; projesini silmek istediğinden emin misin?
                  {catTasks.length > 0 && (
                    <span className={`block mt-2 font-semibold ${dark ? 'text-red-400' : 'text-red-600'}`}>Bu projeye ait {catTasks.length} görev de silinecek.</span>
                  )}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(null)}
                  className={`flex-1 py-3 rounded-xl font-semibold transition-all ${dark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-800 hover:bg-slate-200'}`}
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
