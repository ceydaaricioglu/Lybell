'use client';

import { useState, useEffect } from 'react';
import { Category, TimelineTask } from '@/lib/types';
import { getMockCategories, saveMockCategories, fetchTasksFromSupabase, deleteTaskFromSupabase } from '@/lib/helpers';
import AddCategoryModal from './AddCategoryModal';

interface CategoriesViewProps {
  userId: string;
  onBack: () => void;
  onCategorySelect: (category: string) => void;
}

export default function CategoriesView({ userId, onBack, onCategorySelect }: CategoriesViewProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [allTasks, setAllTasks] = useState<TimelineTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    setLoading(true);
    const loadedCategories = getMockCategories(userId);
    setCategories(loadedCategories);
    
    const loadedTasks = await fetchTasksFromSupabase(userId);
    setAllTasks(loadedTasks);
    setLoading(false);
  };

  const handleAddCategory = (category: Category) => {
    const existingIndex = categories.findIndex(c => c.id === category.id);
    let updatedCategories: Category[];
    
    if (existingIndex >= 0) {
      // Düzenleme modu
      updatedCategories = [...categories];
      updatedCategories[existingIndex] = category;
    } else {
      // Yeni ekleme
      updatedCategories = [...categories, category];
    }
    
    setCategories(updatedCategories);
    saveMockCategories(userId, updatedCategories);
    setShowAddCategoryModal(false);
    setEditingCategory(null);
    loadData();
  };

  const handleDeleteCategory = async (categoryId: string) => {
    // Kategoriye ait tüm görevleri sil
    const categoryTasks = allTasks.filter(t => t.category === categoryId);
    for (const task of categoryTasks) {
      if (task.id) {
        await deleteTaskFromSupabase(userId, task.id);
      }
    }

    // Kategoriyi sil
    const updatedCategories = categories.filter(c => c.id !== categoryId);
    setCategories(updatedCategories);
    saveMockCategories(userId, updatedCategories);
    setShowDeleteConfirm(null);
    loadData();
  };

  const getCategoryColor = (color?: string) => {
    const colorMap: Record<string, { bg: string; light: string; text: string; border: string }> = {
      blue: { bg: 'bg-blue-600', light: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-200' },
      purple: { bg: 'bg-purple-600', light: 'bg-purple-100', text: 'text-purple-600', border: 'border-purple-200' },
      pink: { bg: 'bg-pink-600', light: 'bg-pink-100', text: 'text-pink-600', border: 'border-pink-200' },
      orange: { bg: 'bg-orange-600', light: 'bg-orange-100', text: 'text-orange-600', border: 'border-orange-200' },
      yellow: { bg: 'bg-yellow-600', light: 'bg-yellow-100', text: 'text-yellow-600', border: 'border-yellow-200' },
      emerald: { bg: 'bg-emerald-600', light: 'bg-emerald-100', text: 'text-emerald-600', border: 'border-emerald-200' },
    };
    return colorMap[color || 'emerald'] || colorMap.emerald;
  };

  const categoryStats = categories.map(cat => {
    const catTasks = allTasks.filter(t => t.category === cat.id);
    const completed = catTasks.filter(t => t.completed).length;
    const total = catTasks.length;
    return {
      ...cat,
      total,
      completed,
      progress: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-5">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Kategoriler</h1>
              <p className="text-sm text-gray-500 mt-1">{categories.length} kategori</p>
            </div>
            <button
              onClick={() => setShowAddCategoryModal(true)}
              className="w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center hover:bg-emerald-600 transition-colors shadow-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6">
        {categoryStats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-20 h-20 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-5 text-4xl">
              📁
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Henüz kategori yok</h2>
            <p className="text-gray-500 text-sm mb-6 text-center">İlk kategorini oluşturarak başla</p>
            <button
              onClick={() => setShowAddCategoryModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              + Kategori Oluştur
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {categoryStats.map((cat) => {
              const colors = getCategoryColor(cat.color);
              return (
                <div
                  key={cat.id}
                  className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all"
                >
                  {/* Ana Kategori Kartı */}
                  <button
                    onClick={() => onCategorySelect(cat.id)}
                    className="w-full text-left"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`w-14 h-14 ${colors.light} rounded-xl flex items-center justify-center text-2xl flex-shrink-0`}>
                        {cat.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-gray-900 text-lg">{cat.name}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-gray-500">{cat.total} görev</span>
                          {cat.total > 0 && (
                            <>
                              <span className="text-gray-300">•</span>
                              <span className="text-sm text-gray-500">{cat.completed} tamamlanan</span>
                            </>
                          )}
                        </div>
                      </div>
                      <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>

                    {/* İlerleme Çubuğu */}
                    {cat.total > 0 && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs text-gray-500">İlerleme</span>
                          <span className={`text-xs font-semibold ${colors.text}`}>%{cat.progress}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`${colors.bg} h-2 rounded-full transition-all`}
                            style={{ width: `${cat.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </button>

                  {/* Yönetim Butonları */}
                  <div className="flex gap-2 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => setEditingCategory(cat)}
                      className="flex-1 py-2 px-3 bg-gray-50 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors flex items-center justify-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Düzenle
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(cat.id)}
                      className="flex-1 py-2 px-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors flex items-center justify-center gap-1"
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

            {/* Yeni Kategori Ekle Butonu */}
            <button
              onClick={() => setShowAddCategoryModal(true)}
              className="w-full bg-white rounded-2xl p-5 shadow-sm border-2 border-dashed border-emerald-200 hover:border-emerald-300 hover:shadow-md transition-all text-center"
            >
                <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto mb-2 text-2xl">
                  +
                </div>
                <div className="font-semibold text-emerald-700">Yeni Kategori Ekle</div>
            </button>
          </div>
        )}
      </div>

      {/* Kategori Ekleme Modal */}
      {showAddCategoryModal && (
        <AddCategoryModal
          onClose={() => {
            setShowAddCategoryModal(false);
            setEditingCategory(null);
          }}
          onSave={handleAddCategory}
          userId={userId}
          category={editingCategory || undefined}
        />
      )}

      {/* Silme Onay Dialogu */}
      {showDeleteConfirm && (() => {
        const cat = categories.find(c => c.id === showDeleteConfirm);
        const catTasks = allTasks.filter(t => t.category === showDeleteConfirm);
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Kategoriyi Sil</h3>
                <p className="text-gray-600 text-sm">
                  "{cat?.name}" kategorisini silmek istediğinden emin misin?
                  {catTasks.length > 0 && (
                    <span className="block mt-2 text-red-600 font-semibold">
                      Bu kategoriye ait {catTasks.length} görev de silinecek.
                    </span>
                  )}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all"
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
            </div>
          </div>
        );
      })()}
    </div>
  );
}
