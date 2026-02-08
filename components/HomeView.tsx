'use client';

import { useState, useEffect } from 'react';
import { Category } from '@/lib/types';
import { getMockCategories, saveMockCategories, fetchTasksFromSupabase } from '@/lib/helpers';
import AddCategoryModal from './AddCategoryModal';

interface HomeViewProps {
  onCategorySelect: (category: string) => void;
  userId: string;
  onViewAll: () => void;
}

export default function HomeView({ onCategorySelect, userId, onViewAll }: HomeViewProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [taskCounts, setTaskCounts] = useState<Record<string, number>>({});
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const loadedCategories = getMockCategories(userId);
      setCategories(loadedCategories);
      
      const loadedTasks = await fetchTasksFromSupabase(userId);
      setAllTasks(loadedTasks);
      const counts: Record<string, number> = {};
      loadedCategories.forEach((cat) => {
        counts[cat.id] = loadedTasks.filter((task) => task.category === cat.id).length;
      });
      setTaskCounts(counts);
      setLoading(false);
    };
    loadData();
  }, [userId]);

  const handleAddCategory = (category: Category) => {
    const updatedCategories = [...categories, category];
    setCategories(updatedCategories);
    saveMockCategories(userId, updatedCategories);
    // Reload task counts after adding category
    fetchTasksFromSupabase(userId).then((loadedTasks) => {
      setAllTasks(loadedTasks);
      const counts: Record<string, number> = {};
      updatedCategories.forEach((cat) => {
        counts[cat.id] = loadedTasks.filter((task) => task.category === cat.id).length;
      });
      setTaskCounts(counts);
    });
  };

  const [allTasks, setAllTasks] = useState<any[]>([]);
  const totalTasks = Object.values(taskCounts).reduce((sum, count) => sum + count, 0);
  const completedTasks = allTasks.filter((t) => t.completed).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-8 text-white">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold mb-2">Hoş Geldin! 🎉</h1>
          <p className="text-emerald-50">Gününü planlamaya hazırsın</p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 py-8">
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 mb-6 border border-emerald-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Kurulum Tamamlandı!</h2>
              <p className="text-sm text-gray-600">Planlamaya başlayalım</p>
            </div>
          </div>
        </div>

        {totalTasks > 0 && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-emerald-100">
              <div className="text-2xl font-bold text-emerald-600 mb-1">{totalTasks}</div>
              <div className="text-xs text-gray-600">Toplam Görev</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-emerald-100">
              <div className="text-2xl font-bold text-teal-600 mb-1">{completedTasks}</div>
              <div className="text-xs text-gray-600">Tamamlanan</div>
            </div>
          </div>
        )}

        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Kategorilerin</h2>
          <div className="space-y-3">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => onCategorySelect(category.id)}
                className="w-full bg-white rounded-xl p-5 shadow-sm border-2 border-emerald-100 hover:border-emerald-300 hover:shadow-md transition-all text-left flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 ${
                    category.color === 'blue' ? 'bg-blue-100' : 
                    category.color === 'purple' ? 'bg-purple-100' : 
                    category.color === 'pink' ? 'bg-pink-100' : 
                    category.color === 'orange' ? 'bg-orange-100' : 
                    category.color === 'yellow' ? 'bg-yellow-100' : 
                    'bg-emerald-100'
                  } rounded-xl flex items-center justify-center text-2xl`}>
                    {category.icon}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{category.name}</div>
                    <div className="text-xs text-gray-500">{taskCounts[category.id] || 0} görev</div>
                  </div>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
            
            {/* Add New Category Button */}
            <button
              type="button"
              onClick={() => setShowAddCategoryModal(true)}
              className="w-full bg-white rounded-xl p-5 shadow-sm border-2 border-dashed border-emerald-200 hover:border-emerald-300 hover:shadow-md transition-all text-left flex items-center justify-between mt-3"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-2xl">
                  +
                </div>
                <div className="font-semibold text-emerald-700">Yeni Kategori Ekle</div>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
          <h3 className="font-semibold text-gray-900 mb-3">Hızlı İşlemler</h3>
          <div className="flex gap-2">
            <button
              onClick={() => onCategorySelect('add-task')}
              className="flex-1 py-2 px-4 bg-white border border-emerald-200 text-emerald-600 rounded-lg font-medium hover:bg-emerald-100 transition-colors text-sm"
            >
              + Görev Ekle
            </button>
            <button
              onClick={onViewAll}
              className="flex-1 py-2 px-4 bg-white border border-emerald-200 text-emerald-600 rounded-lg font-medium hover:bg-emerald-100 transition-colors text-sm"
            >
              Tümünü Gör
            </button>
          </div>
        </div>
      </div>

      {showAddCategoryModal && (
        <AddCategoryModal
          onClose={() => setShowAddCategoryModal(false)}
          onSave={handleAddCategory}
          userId={userId}
        />
      )}
    </div>
  );
}
