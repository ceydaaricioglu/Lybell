'use client';

import { useState, useEffect } from 'react';
import { Category } from '@/lib/types';
import Modal from '@/components/Modal';
import {
  CATEGORY_ICON_IDS,
  CategoryIconSvg,
  getDefaultCategoryIconId,
  type CategoryIconId,
} from '@/lib/categoryIcons';

interface AddCategoryModalProps {
  onClose: () => void;
  onSave: (category: Category) => void;
  userId: string;
  category?: Category;
  darkMode?: boolean;
  isPro?: boolean;
}

const isIconIdType = (s: string): s is CategoryIconId => (CATEGORY_ICON_IDS as readonly string[]).includes(s);

export default function AddCategoryModal({ onClose, onSave, userId, category, darkMode = false, isPro = false }: AddCategoryModalProps) {
  const dark = darkMode;
  const isEditMode = !!category;
  const [categoryName, setCategoryName] = useState(category?.name || '');
  const [selectedIcon, setSelectedIcon] = useState<string>(category?.icon && isIconIdType(category.icon) ? category.icon : getDefaultCategoryIconId());
  const [selectedColor, setSelectedColor] = useState(category?.color || 'emerald');
  const [syncToGoogle, setSyncToGoogle] = useState(!!category?.syncToGoogle);
  const [showIconPicker, setShowIconPicker] = useState(false);

  useEffect(() => {
    if (category) {
      setCategoryName(category.name);
      setSelectedIcon(category.icon && isIconIdType(category.icon) ? category.icon : getDefaultCategoryIconId());
      setSelectedColor(category.color);
      setSyncToGoogle(!!category.syncToGoogle);
    }
  }, [category]);
  const colors = [
    { name: 'emerald', lightBg: 'bg-emerald-100', lightBorder: 'border-emerald-300', darkBg: 'bg-emerald-900/40', darkBorder: 'border-emerald-600' },
    { name: 'blue', lightBg: 'bg-blue-100', lightBorder: 'border-blue-300', darkBg: 'bg-blue-900/40', darkBorder: 'border-blue-600' },
    { name: 'purple', lightBg: 'bg-purple-100', lightBorder: 'border-purple-300', darkBg: 'bg-purple-900/40', darkBorder: 'border-purple-600' },
    { name: 'pink', lightBg: 'bg-pink-100', lightBorder: 'border-pink-300', darkBg: 'bg-pink-900/40', darkBorder: 'border-pink-600' },
    { name: 'orange', lightBg: 'bg-orange-100', lightBorder: 'border-orange-300', darkBg: 'bg-orange-900/40', darkBorder: 'border-orange-600' },
    { name: 'yellow', lightBg: 'bg-yellow-100', lightBorder: 'border-yellow-300', darkBg: 'bg-yellow-900/40', darkBorder: 'border-yellow-600' },
  ];

  const handleSave = () => {
    if (categoryName.trim()) {
      const categoryToSave: Category = {
        id: category?.id || `category-${Date.now()}`,
        name: categoryName.trim(),
        icon: selectedIcon,
        color: selectedColor,
        userId,
        syncToGoogle: isPro ? syncToGoogle : undefined,
      };
      onSave(categoryToSave);
      onClose();
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={isEditMode ? 'Liste Düzenle' : 'Yeni Liste'}
      dark={dark}
      maxWidth="md"
      contentClassName="max-h-[90vh] overflow-y-auto"
    >
      <div className="space-y-6">
          <div>
            <label className={`block text-sm font-semibold mb-2 ${dark ? 'text-zinc-300' : 'text-stone-700'}`}>Liste adı</label>
            <input
              type="text"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              className={`w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 text-lg transition-all ${
                dark
                  ? 'bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus:ring-amber-500/50 focus:border-amber-500/50'
                  : 'bg-white border-2 border-stone-200 text-stone-900 placeholder:text-stone-400 focus:ring-amber-500 focus:border-amber-500'
              }`}
              placeholder="Liste adını gir"
              autoFocus
            />
          </div>

          <div>
            <label className={`block text-sm font-semibold mb-2 ${dark ? 'text-zinc-300' : 'text-stone-700'}`}>Simge</label>
            <button
              onClick={() => setShowIconPicker(!showIconPicker)}
              className={`w-full px-4 py-4 rounded-xl text-left flex items-center justify-between transition-all border-2 ${
                dark
                  ? 'bg-zinc-800 border-zinc-700 hover:border-amber-500/40'
                  : 'bg-white border-stone-200 hover:border-amber-300'
              }`}
            >
              {isIconIdType(selectedIcon) ? (
                <CategoryIconSvg iconId={selectedIcon as CategoryIconId} className={`w-8 h-8 ${dark ? 'text-amber-400' : 'text-amber-600'}`} size={32} />
              ) : (
                <span className="text-2xl">{selectedIcon}</span>
              )}
              <svg className={`w-5 h-5 transition-transform ${dark ? 'text-zinc-400' : 'text-stone-400'} ${showIconPicker ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showIconPicker && (
              <div className={`mt-2 rounded-xl p-4 grid grid-cols-6 gap-2 border-2 ${
                dark ? 'bg-zinc-800/80 border-zinc-700' : 'bg-stone-50 border-stone-200'
              }`}>
                {CATEGORY_ICON_IDS.map((iconId) => (
                  <button
                    key={iconId}
                    type="button"
                    onClick={() => { setSelectedIcon(iconId); setShowIconPicker(false); }}
                    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                      selectedIcon === iconId
                        ? dark ? 'bg-amber-500/30 scale-110 text-amber-400' : 'bg-amber-100 scale-110 text-amber-600'
                        : dark ? 'bg-zinc-700 hover:bg-zinc-600 text-zinc-300' : 'bg-white hover:bg-amber-50 border border-stone-100 text-stone-600'
                    }`}
                  >
                    <CategoryIconSvg iconId={iconId} size={24} className="w-6 h-6" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className={`block text-sm font-semibold mb-2 ${dark ? 'text-zinc-300' : 'text-stone-700'}`}>Renk</label>
            <div className="grid grid-cols-6 gap-2">
              {colors.map((color) => {
                const isSelected = selectedColor === color.name;
                const bg = dark ? (isSelected ? color.darkBg : 'bg-zinc-800') : (isSelected ? color.lightBg : color.lightBg);
                const border = dark ? (isSelected ? color.darkBorder : 'border-transparent') : (isSelected ? color.lightBorder : color.lightBorder);
                return (
                  <button
                    key={color.name}
                    onClick={() => setSelectedColor(color.name)}
                    className={`h-12 rounded-xl border-2 transition-all ${bg} ${border} ${isSelected ? 'scale-110' : 'hover:scale-105'}`}
                  >
                    {isSelected && (
                      <svg className={`w-6 h-6 mx-auto ${dark ? 'text-amber-400' : 'text-stone-700'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {isPro && (
            <div className={`flex items-center justify-between px-4 py-3 rounded-xl ${dark ? 'bg-zinc-800/80' : 'bg-stone-50'}`}>
              <div>
                <p className={`font-medium ${dark ? 'text-zinc-200' : 'text-stone-800'}`}>Google Takvim'e aktar</p>
                <p className={`text-xs mt-0.5 ${dark ? 'text-zinc-500' : 'text-stone-500'}`}>Bu listedeki görevler (işaretlenenler) Google Takvim'de görünebilir</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={syncToGoogle}
                onClick={() => setSyncToGoogle((v) => !v)}
                className={`relative w-12 h-7 rounded-full transition-colors ${syncToGoogle ? (dark ? 'bg-amber-500' : 'bg-amber-500') : dark ? 'bg-zinc-600' : 'bg-stone-300'}`}
              >
                <span className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${syncToGoogle ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={!categoryName.trim()}
            className={`w-full py-4 font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              dark
                ? 'bg-amber-500 text-black hover:bg-amber-400'
                : 'bg-amber-500 text-black hover:bg-amber-600 hover:shadow-lg'
            }`}
          >
            {isEditMode ? 'Değişiklikleri Kaydet' : 'Liste Oluştur'}
          </button>
        </div>
    </Modal>
  );
}
