'use client';

import { useState, useEffect } from 'react';
import { Category } from '@/lib/types';

interface AddCategoryModalProps {
  onClose: () => void;
  onSave: (category: Category) => void;
  userId: string;
  category?: Category;
}

export default function AddCategoryModal({ onClose, onSave, userId, category }: AddCategoryModalProps) {
  const isEditMode = !!category;
  const [categoryName, setCategoryName] = useState(category?.name || '');
  const [selectedIcon, setSelectedIcon] = useState(category?.icon || '📝');
  const [selectedColor, setSelectedColor] = useState(category?.color || 'emerald');
  const [showIconPicker, setShowIconPicker] = useState(false);

  // Edit mode'da değerleri güncelle
  useEffect(() => {
    if (category) {
      setCategoryName(category.name);
      setSelectedIcon(category.icon);
      setSelectedColor(category.color);
    }
  }, [category]);

  const icons = ['📝', '🏃', '📚', '💼', '🎯', '🏋️', '🎨', '🎵', '🍔', '☕', '💡', '🌟', '📱', '💻', '🎮', '✈️'];
  const colors = [
    { name: 'emerald', bg: 'bg-emerald-100', border: 'border-emerald-300', text: 'text-emerald-700' },
    { name: 'blue', bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-700' },
    { name: 'purple', bg: 'bg-purple-100', border: 'border-purple-300', text: 'text-purple-700' },
    { name: 'pink', bg: 'bg-pink-100', border: 'border-pink-300', text: 'text-pink-700' },
    { name: 'orange', bg: 'bg-orange-100', border: 'border-orange-300', text: 'text-orange-700' },
    { name: 'yellow', bg: 'bg-yellow-100', border: 'border-yellow-300', text: 'text-yellow-700' },
  ];

  const handleSave = () => {
    if (categoryName.trim()) {
      const categoryToSave: Category = {
        id: category?.id || `category-${Date.now()}`,
        name: categoryName.trim(),
        icon: selectedIcon,
        color: selectedColor,
        userId,
      };
      onSave(categoryToSave);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">{isEditMode ? 'Kategori Düzenle' : 'Yeni Kategori'}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Kategori Adı</label>
            <input
              type="text"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              className="w-full px-4 py-3 border-2 border-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-lg text-gray-900 placeholder:text-gray-400"
              placeholder="Kategori adını gir"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Simge</label>
            <button
              onClick={() => setShowIconPicker(!showIconPicker)}
              className="w-full px-4 py-4 border-2 border-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-left flex items-center justify-between bg-white hover:border-emerald-300 transition-all"
            >
              <span className="text-2xl">{selectedIcon}</span>
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform ${showIconPicker ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showIconPicker && (
              <div className="mt-2 border-2 border-emerald-200 rounded-xl p-4 bg-white grid grid-cols-8 gap-2">
                {icons.map((icon) => (
                  <button
                    key={icon}
                    onClick={() => {
                      setSelectedIcon(icon);
                      setShowIconPicker(false);
                    }}
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-all ${
                      selectedIcon === icon ? 'bg-emerald-100 scale-110' : 'bg-gray-50 hover:bg-emerald-50'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Renk</label>
            <div className="grid grid-cols-6 gap-2">
              {colors.map((color) => (
                <button
                  key={color.name}
                  onClick={() => setSelectedColor(color.name)}
                  className={`h-12 rounded-xl border-2 transition-all ${
                    selectedColor === color.name
                      ? `${color.bg} ${color.border} scale-110`
                      : `${color.bg} border-transparent hover:scale-105`
                  }`}
                >
                  {selectedColor === color.name && (
                    <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={!categoryName.trim()}
            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isEditMode ? 'Değişiklikleri Kaydet' : 'Kategori Oluştur'}
          </button>
        </div>
      </div>
    </div>
  );
}
