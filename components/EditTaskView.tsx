'use client';

import { useState, useEffect } from 'react';
import { TimelineTask, Category } from '@/lib/types';
import { getMockCategories, deleteTaskFromSupabase, excludeDateFromTask, setRecurrenceEndDate } from '@/lib/helpers';

interface EditTaskViewProps {
  task?: TimelineTask;
  onBack: () => void;
  onSave: (task: TimelineTask) => void;
  onDelete?: () => void;
  userId: string;
  defaultDate?: string;
  viewingDate?: string;
}

export default function EditTaskView({ task, onBack, onSave, onDelete, userId, defaultDate, viewingDate }: EditTaskViewProps) {
  const isNewTask = !task || !task.id;
  const [title, setTitle] = useState(task?.title || '');
  const [time, setTime] = useState(task?.time || '08:00');
  const [date, setDate] = useState(task?.date || defaultDate || new Date().getDate().toString());
  const [category, setCategory] = useState<'routines' | 'reading' | string | null>(task?.category || null);
  const [recurrence, setRecurrence] = useState<'weekly' | 'monthly' | 'weekdays' | null>(task?.recurrence || null);
  const [priority, setPriority] = useState<'high' | 'medium' | 'low' | null>(task?.priority || null);
  const [description, setDescription] = useState(task?.description || '');
  const [showRecurrenceOptions, setShowRecurrenceOptions] = useState(false);
  const [showCategoryOptions, setShowCategoryOptions] = useState(false);
  const [showPriorityOptions, setShowPriorityOptions] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const categories = getMockCategories(userId);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setTime(task.time);
      setDate(task.date);
      setCategory(task.category || null);
      setRecurrence(task.recurrence || null);
      setPriority(task.priority || null);
    } else {
      setTitle('');
      setDescription('');
      setTime('08:00');
      setDate(defaultDate || new Date().getDate().toString());
      setCategory(null);
      setRecurrence(null);
      setPriority(null);
    }
  }, [task, defaultDate]);

  const handleSave = () => {
    if (!title.trim()) return;
    
    if (isNewTask) {
      if (!category) return;
      const taskToSave: TimelineTask = {
        id: Date.now().toString(),
        title: title.trim(),
        description: description.trim() || undefined,
        time,
        date,
        category,
        completed: false,
        recurrence,
        priority,
        originalDate: date,
      };
      onSave(taskToSave);
    } else {
      const taskToSave: TimelineTask = {
        ...task!,
        title: title.trim(),
        description: description.trim() || undefined,
        time,
        date,
        category: category || task!.category,
        recurrence,
        priority,
      };
      onSave(taskToSave);
    }
  };

  const isRecurring = !!task?.recurrence;
  const currentViewDate = viewingDate || task?.date || date;

  // Tekrarlı görev: sadece bu günü sil
  const handleDeleteThisOnly = async () => {
    if (task?.id && currentViewDate) {
      await excludeDateFromTask(userId, task.id, currentViewDate);
      setShowDeleteConfirm(false);
      if (onDelete) onDelete();
      else onBack();
    }
  };

  // Tekrarlı görev: bu ve sonrakileri sil
  const handleDeleteThisAndFuture = async () => {
    if (task?.id && currentViewDate) {
      // Bitiş tarihini bu günün 1 öncesine ayarla
      const endDate = (parseInt(currentViewDate) - 1).toString();
      await setRecurrenceEndDate(userId, task.id, endDate);
      setShowDeleteConfirm(false);
      if (onDelete) onDelete();
      else onBack();
    }
  };

  // Tüm tekrarlı görevleri sil (veya tekrarsız görev sil)
  const handleDeleteAll = async () => {
    if (task?.id) {
      await deleteTaskFromSupabase(userId, task.id);
      setShowDeleteConfirm(false);
      if (onDelete) onDelete();
      else onBack();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex flex-col">
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-6 text-white">
        <div className="max-w-md mx-auto flex items-center gap-4">
          <button
            onClick={onBack}
            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-emerald-600/50 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold flex-1">{isNewTask ? 'Yeni Görev' : 'Görevi Düzenle'}</h1>
          <button
            onClick={handleSave}
            disabled={!title.trim() || (!category && !task)}
            className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg font-semibold hover:bg-white/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isNewTask ? 'Kaydet' : 'Kaydet'}
          </button>
        </div>
      </div>

      <div className="flex-1 max-w-md mx-auto w-full px-6 py-8">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Görev Başlığı</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-4 border-2 border-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-lg text-gray-900 placeholder:text-gray-400 bg-white"
              placeholder="Ne yapman gerekiyor?"
              autoFocus
            />
          </div>

          {/* Açıklama / Not */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Açıklama / Not</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border-2 border-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 placeholder:text-gray-400 bg-white resize-none"
              placeholder="Detay veya not ekle (isteğe bağlı)"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Kategori</label>
            <button
              onClick={() => setShowCategoryOptions(!showCategoryOptions)}
              className="w-full px-4 py-4 border-2 border-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-left flex items-center justify-between bg-white hover:border-emerald-300 transition-all"
            >
              <span className={category ? 'text-gray-900 font-medium' : 'text-gray-400'}>
                {category ? categories.find(c => c.id === category)?.name || category : 'Kategori seç'}
              </span>
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform ${showCategoryOptions ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showCategoryOptions && (
              <div className="mt-2 border-2 border-emerald-200 rounded-xl overflow-hidden bg-white">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setCategory(cat.id);
                      setShowCategoryOptions(false);
                    }}
                    className="w-full px-4 py-4 text-left hover:bg-emerald-50 transition-colors flex items-center gap-3 border-b border-emerald-100 last:border-b-0"
                  >
                    <span className="text-2xl">{cat.icon}</span>
                    <div>
                      <div className="font-semibold text-gray-900">{cat.name}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Tarih</label>
              <input
                type="date"
                value={(() => {
                  const now = new Date();
                  const y = now.getFullYear();
                  const m = String(now.getMonth() + 1).padStart(2, '0');
                  const d = date.padStart(2, '0');
                  return `${y}-${m}-${d}`;
                })()}
                onChange={(e) => {
                  const dateStr = e.target.value;
                  const day = dateStr.split('-')[2];
                  setDate(parseInt(day, 10).toString());
                }}
                className="w-full px-4 py-3 border-2 border-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Saat</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-4 py-3 border-2 border-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Tekrar</label>
            <button
              onClick={() => setShowRecurrenceOptions(!showRecurrenceOptions)}
              className="w-full px-4 py-4 border-2 border-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-left flex items-center justify-between bg-white hover:border-emerald-300 transition-all"
            >
              <span className={recurrence ? 'text-gray-900 font-medium' : 'text-gray-400'}>
                {recurrence === 'weekly'
                  ? '🔄 Her hafta'
                  : recurrence === 'monthly'
                  ? '📅 Her ay'
                  : recurrence === 'weekdays'
                  ? '📆 Sadece hafta içi'
                  : 'Tekrar yok'}
              </span>
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform ${showRecurrenceOptions ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showRecurrenceOptions && (
              <div className="mt-2 border-2 border-emerald-200 rounded-xl overflow-hidden bg-white">
                <button
                  onClick={() => {
                    setRecurrence('weekly');
                    setShowRecurrenceOptions(false);
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-emerald-50 transition-colors border-b border-emerald-100"
                >
                  🔄 Her hafta
                </button>
                <button
                  onClick={() => {
                    setRecurrence('monthly');
                    setShowRecurrenceOptions(false);
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-emerald-50 transition-colors border-b border-emerald-100"
                >
                  📅 Her ay
                </button>
                <button
                  onClick={() => {
                    setRecurrence('weekdays');
                    setShowRecurrenceOptions(false);
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-emerald-50 transition-colors"
                >
                  📆 Sadece hafta içi
                </button>
                <button
                  onClick={() => {
                    setRecurrence(null);
                    setShowRecurrenceOptions(false);
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-emerald-50 transition-colors border-t border-emerald-100 text-gray-500"
                >
                  Tekrar yok
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Öncelik</label>
            <button
              onClick={() => setShowPriorityOptions(!showPriorityOptions)}
              className="w-full px-4 py-4 border-2 border-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-left flex items-center justify-between bg-white hover:border-emerald-300 transition-all"
            >
              <span className={priority ? 'text-gray-900 font-medium' : 'text-gray-400'}>
                {priority === 'high'
                  ? '🔴 Yüksek Öncelik'
                  : priority === 'medium'
                  ? '🟡 Orta Öncelik'
                  : priority === 'low'
                  ? '🟢 Düşük Öncelik'
                  : 'Öncelik yok'}
              </span>
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform ${showPriorityOptions ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showPriorityOptions && (
              <div className="mt-2 border-2 border-emerald-200 rounded-xl overflow-hidden bg-white">
                <button
                  onClick={() => {
                    setPriority('high');
                    setShowPriorityOptions(false);
                  }}
                  className="w-full px-4 py-4 text-left hover:bg-red-50 transition-colors flex items-center gap-3 border-b border-emerald-100"
                >
                  <span className="text-xl">🔴</span>
                  <div>
                    <div className="font-semibold text-gray-900">Yüksek Öncelik</div>
                    <div className="text-xs text-gray-500">Acil ve önemli</div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setPriority('medium');
                    setShowPriorityOptions(false);
                  }}
                  className="w-full px-4 py-4 text-left hover:bg-yellow-50 transition-colors flex items-center gap-3 border-b border-emerald-100"
                >
                  <span className="text-xl">🟡</span>
                  <div>
                    <div className="font-semibold text-gray-900">Orta Öncelik</div>
                    <div className="text-xs text-gray-500">Önemli ama acil değil</div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setPriority('low');
                    setShowPriorityOptions(false);
                  }}
                  className="w-full px-4 py-4 text-left hover:bg-green-50 transition-colors flex items-center gap-3"
                >
                  <span className="text-xl">🟢</span>
                  <div>
                    <div className="font-semibold text-gray-900">Düşük Öncelik</div>
                    <div className="text-xs text-gray-500">Daha sonra yapılabilir</div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setPriority(null);
                    setShowPriorityOptions(false);
                  }}
                  className="w-full px-4 py-4 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 border-t border-emerald-100"
                >
                  <span className="text-xl">⚪</span>
                  <div>
                    <div className="font-semibold text-gray-900">Öncelik Yok</div>
                    <div className="text-xs text-gray-500">Önceliği kaldır</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          <button
            onClick={handleSave}
            disabled={!title.trim() || (!category && !task)}
            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>{isNewTask ? 'Görevi Oluştur' : 'Değişiklikleri Kaydet'}</span>
          </button>

          {/* Silme Butonu - sadece mevcut görevlerde göster */}
          {!isNewTask && task?.id && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full py-4 bg-white border-2 border-red-200 text-red-600 font-semibold rounded-xl hover:bg-red-50 hover:border-red-300 transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>Görevi Sil</span>
            </button>
          )}
        </div>
      </div>

      {/* Silme Onay Dialogu */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="text-center mb-5">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                {isRecurring ? 'Tekrarlı Görevi Sil' : 'Görevi Sil'}
              </h3>
              <p className="text-gray-600 text-sm">
                {isRecurring
                  ? 'Bu tekrarlı görev için ne yapmak istersin?'
                  : 'Bu görevi silmek istediğinden emin misin? Bu işlem geri alınamaz.'}
              </p>
            </div>

            {isRecurring ? (
              <div className="space-y-2">
                {/* Sadece bu günü sil */}
                <button
                  onClick={handleDeleteThisOnly}
                  className="w-full py-3.5 px-4 bg-white border-2 border-gray-200 text-gray-900 rounded-xl font-medium hover:bg-gray-50 hover:border-gray-300 transition-all text-left flex items-center gap-3"
                >
                  <div className="w-9 h-9 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Sadece bu günü sil</div>
                    <div className="text-xs text-gray-500">Diğer tekrarlar kalır</div>
                  </div>
                </button>

                {/* Bu ve sonrakileri sil */}
                <button
                  onClick={handleDeleteThisAndFuture}
                  className="w-full py-3.5 px-4 bg-white border-2 border-gray-200 text-gray-900 rounded-xl font-medium hover:bg-red-50 hover:border-red-200 transition-all text-left flex items-center gap-3"
                >
                  <div className="w-9 h-9 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Bu ve sonrakileri sil</div>
                    <div className="text-xs text-gray-500">Önceki tekrarlar kalır</div>
                  </div>
                </button>

                {/* Tüm tekrarları sil */}
                <button
                  onClick={handleDeleteAll}
                  className="w-full py-3.5 px-4 bg-white border-2 border-red-200 text-red-600 rounded-xl font-medium hover:bg-red-50 hover:border-red-300 transition-all text-left flex items-center gap-3"
                >
                  <div className="w-9 h-9 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Tüm tekrarları sil</div>
                    <div className="text-xs text-gray-500">Görev tamamen kaldırılır</div>
                  </div>
                </button>

                {/* İptal */}
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all mt-2"
                >
                  İptal
                </button>
              </div>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all"
                >
                  İptal
                </button>
                <button
                  onClick={handleDeleteAll}
                  className="flex-1 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-all"
                >
                  Sil
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
