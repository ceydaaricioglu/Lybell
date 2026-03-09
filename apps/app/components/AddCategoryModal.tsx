'use client';

import { useState, useEffect } from 'react';
import { Category } from '@cursor-deneme/shared';
import Modal from '@/components/Modal';
import {
  CATEGORY_ICON_IDS,
  CategoryIconSvg,
  getDefaultCategoryIconId,
  type CategoryIconId,
} from '@/lib/categoryIcons';

const PRIMARY = '#fb923c';

/** İkon id → pastel arka plan + metin rengi (referans tasarım) */
const PASTEL_STYLES: { bg: string; text: string }[] = [
  { bg: '#fef2f2', text: '#ef4444' },
  { bg: '#fff7ed', text: '#f97316' },
  { bg: '#f0fdf4', text: '#22c55e' },
  { bg: '#eff6ff', text: '#3b82f6' },
  { bg: '#f5f3ff', text: '#8b5cf6' },
  { bg: '#fdf2f8', text: '#ec4899' },
  { bg: '#fffbeb', text: '#f59e0b' },
  { bg: '#f0f9ff', text: '#0ea5e9' },
];

/** İkon id → kısa etiket (grid altında) */
const ICON_LABELS: Record<string, string> = {
  folder: 'Klasör',
  briefcase: 'İş',
  book: 'Kitap',
  target: 'Hedef',
  heart: 'Kalp',
  home: 'Ev',
  laptop: 'Bilgisayar',
  palette: 'Sanat',
  music: 'Müzik',
  coffee: 'Kahve',
  lightbulb: 'Fikir',
  star: 'Yıldız',
  phone: 'Telefon',
  code: 'Kod',
  plane: 'Uçak',
  wrench: 'Araç',
  leaf: 'Doğa',
  clipboard: 'Liste',
};

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
  const isEditMode = !!category;
  const [categoryName, setCategoryName] = useState(category?.name || '');
  const [selectedIcon, setSelectedIcon] = useState<string>(category?.icon && isIconIdType(category.icon) ? category.icon : getDefaultCategoryIconId());
  const [syncToGoogle, setSyncToGoogle] = useState(!!category?.syncToGoogle);

  useEffect(() => {
    if (category) {
      setCategoryName(category.name);
      setSelectedIcon(category.icon && isIconIdType(category.icon) ? category.icon : getDefaultCategoryIconId());
      setSyncToGoogle(!!category.syncToGoogle);
    }
  }, [category]);

  const handleSave = () => {
    if (categoryName.trim()) {
      const categoryToSave: Category = {
        id: category?.id || `category-${Date.now()}`,
        name: categoryName.trim(),
        icon: selectedIcon,
        color: category?.color || 'orange',
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
      title=""
      dark={false}
      maxWidth="md"
      contentClassName="max-h-[90vh] overflow-y-auto"
      contentNoPadding
    >
      <div className="relative flex flex-col bg-white overflow-hidden">
        {/* Handle bar (referans) */}
        <div className="flex h-6 w-full items-center justify-center flex-shrink-0">
          <div className="h-1.5 w-12 rounded-full bg-slate-200 mt-2" />
        </div>

        <div className="p-6 pt-2">
          <header className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">{isEditMode ? 'Liste Düzenle' : 'Yeni Liste'}</h2>
              <p className="text-sm text-slate-500 mt-0.5">Listene bir kişilik ver</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex size-10 items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Kapat"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </header>

          {/* Liste adı */}
          <div className="space-y-4 mb-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-700 ml-1">Liste adı</label>
              <input
                type="text"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                className="w-full px-4 py-3.5 bg-slate-100 border-none rounded-xl focus:ring-2 focus:ring-[#fb923c] text-slate-900 placeholder:text-slate-400 outline-none transition-all"
                placeholder="Örn. Sabah Rutini"
                autoFocus
              />
            </div>
          </div>

          {/* Simge grid (referans: 4 sütun, pastel daireler) */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-4 ml-1 text-center">Simge seç</h3>
            <div className="grid grid-cols-4 gap-4">
              {CATEGORY_ICON_IDS.map((iconId, index) => {
                const style = PASTEL_STYLES[index % PASTEL_STYLES.length];
                const isSelected = selectedIcon === iconId;
                return (
                  <button
                    key={iconId}
                    type="button"
                    onClick={() => setSelectedIcon(iconId)}
                    className="flex flex-col items-center gap-2 group"
                  >
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-sm flex-shrink-0"
                      style={{
                        backgroundColor: style.bg,
                        color: style.text,
                        outline: isSelected ? `2px solid ${PRIMARY}` : '2px solid transparent',
                        outlineOffset: 2,
                      }}
                    >
                      <CategoryIconSvg iconId={iconId as CategoryIconId} size={28} className="w-7 h-7" />
                    </div>
                    <span className={`text-xs font-medium ${isSelected ? 'text-[#fb923c] font-semibold' : 'text-slate-500'}`}>
                      {ICON_LABELS[iconId] ?? iconId}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Google Takvim'e aktar — her zaman göster (referans) */}
          <div className="mb-6 px-4 py-3 rounded-xl bg-slate-100 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="font-semibold text-slate-900">Google Takvim&apos;e aktar</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Bu listedeki görevler (işaretlenenler) Google Takvim&apos;de görünebilir
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={syncToGoogle}
              onClick={() => isPro && setSyncToGoogle((v) => !v)}
              className={`relative w-12 h-7 rounded-full transition-colors flex-shrink-0 ${!isPro ? 'opacity-60 cursor-not-allowed' : ''}`}
              style={{ backgroundColor: syncToGoogle ? PRIMARY : '#cbd5e1' }}
            >
              <span
                className="absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow transition-transform"
                style={{ transform: syncToGoogle ? 'translateX(22px)' : 'translateX(2px)' }}
              />
            </button>
          </div>

          {/* Footer: İptal + Liste Oluştur */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3.5 px-4 text-slate-600 font-semibold bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
            >
              İptal
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!categoryName.trim()}
              className="flex-1 py-3.5 px-4 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: PRIMARY, boxShadow: `0 10px 24px ${PRIMARY}4D` }}
            >
              {isEditMode ? 'Kaydet' : 'Liste Oluştur'}
            </button>
          </div>
        </div>

        {/* Dekoratif blur (referans) */}
        <div className="absolute -bottom-24 -left-24 w-48 h-48 rounded-full blur-3xl pointer-events-none opacity-50" style={{ backgroundColor: PRIMARY }} />
        <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl pointer-events-none opacity-50" style={{ backgroundColor: PRIMARY }} />
      </div>
    </Modal>
  );
}
