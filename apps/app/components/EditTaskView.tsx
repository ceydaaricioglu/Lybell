'use client';

import { useState, useEffect, useRef } from 'react';
import { TimelineTask, Category, SubTask, TaskTemplate } from '@cursor-deneme/shared';
import { getMockCategories, deleteTaskFromSupabase, syncTaskToGoogleCalendar, excludeDateFromTask, setRecurrenceEndDate, DEFAULT_TAGS, getTagColorClasses, fetchTemplates, saveTemplateToSupabase } from '@cursor-deneme/shared';
import { canAddSubtask } from '@cursor-deneme/shared';
import Modal from '@/components/Modal';
import { useLocale } from '@/components/LocaleContext';
import { useToast } from '@/components/Toast';
import { t } from '@cursor-deneme/shared';

interface EditTaskViewProps {
  task?: TimelineTask;
  darkMode?: boolean;
  isPro?: boolean;
  onOpenPro?: () => void;
  onBack: () => void;
  onSave: (task: TimelineTask) => void;
  onDelete?: () => void;
  /** Optimistic silme: ekran hemen kapanır, silme arka planda biter */
  onDeleteStart?: (taskId: string) => void;
  onDeleteDone?: (taskId: string) => void;
  onDeleteFailed?: (taskId: string) => void;
  userId: string;
  defaultDate?: string;
  defaultCategory?: string | null;
  viewingDate?: string;
  /** Merkezi cache: verilirse kullanılır */
  categories?: Category[];
}

export default function EditTaskView({ task, darkMode = false, isPro = false, onOpenPro, onBack, onSave, onDelete, onDeleteStart, onDeleteDone, onDeleteFailed, userId, defaultDate, defaultCategory, viewingDate, categories: categoriesFromParent }: EditTaskViewProps) {
  const dark = darkMode;
  const { locale } = useLocale();
  const { showToast } = useToast();
  const isNewTask = !task || !task.id;
  const [title, setTitle] = useState(task?.title || '');
  const [isListeningForTitle, setIsListeningForTitle] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [time, setTime] = useState(task?.time ?? '08:00');
  const [date, setDate] = useState(task?.date || defaultDate || new Date().getDate().toString());
  const [category, setCategory] = useState<'routines' | 'reading' | string | null>(task?.category ?? defaultCategory ?? null);
  const [recurrence, setRecurrence] = useState<'daily' | 'weekly' | 'monthly' | 'weekdays' | null>(task?.recurrence || null);
  const [priority, setPriority] = useState<'high' | 'medium' | 'low' | null>(task?.priority || null);
  const [reminderAt, setReminderAt] = useState<string | null>(task?.reminderAt ?? null);
  const [reminderAt2, setReminderAt2] = useState<string | null>(task?.reminderAt2 ?? null);
  const [reminderMessage, setReminderMessage] = useState<string | null>(task?.reminderMessage ?? null);
  const [countdownTarget, setCountdownTarget] = useState<string | null>(task?.countdownTarget ?? null);
  const [voiceNote, setVoiceNote] = useState<string | null>(task?.voiceNote ?? null);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [attachmentName, setAttachmentName] = useState<string | null>(task?.attachmentName ?? null);
  const [attachmentData, setAttachmentData] = useState<string | null>(task?.attachmentData ?? null);
  const [description, setDescription] = useState(task?.description || '');
  const [tags, setTags] = useState<string[]>(task?.tags || []);
  const [subtasks, setSubtasks] = useState<SubTask[]>(task?.subtasks || []);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [showRecurrenceOptions, setShowRecurrenceOptions] = useState(false);
  const [showCategoryOptions, setShowCategoryOptions] = useState(false);
  const [showPriorityOptions, setShowPriorityOptions] = useState(false);
  const [showTagOptions, setShowTagOptions] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showTemplateList, setShowTemplateList] = useState(false);
  const [templateList, setTemplateList] = useState<TaskTemplate[]>([]);
  const [showSaveAsTemplate, setShowSaveAsTemplate] = useState(false);
  const [showDetaySection, setShowDetaySection] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [syncToGoogle, setSyncToGoogle] = useState<boolean>(!!task?.syncToGoogle);
  const categories = categoriesFromParent ?? getMockCategories(userId);
  const effectiveCategory = category || defaultCategory || null;
  const selectedCategorySyncToGoogle = effectiveCategory ? (categories.find(c => c.id === effectiveCategory)?.syncToGoogle) : false;

  const loadTemplates = () => {
    fetchTemplates(userId).then(setTemplateList);
  };

  const applyTemplate = (t: TaskTemplate) => {
    setTitle(t.title);
    setDescription(t.description || '');
    setTime(t.time);
    setCategory(t.category ?? null);
    setRecurrence(t.recurrence ?? null);
    setPriority(t.priority ?? null);
    setTags(t.tags || []);
    setSubtasks(t.subtasks || []);
    setReminderAt(t.reminderAt ?? null);
    setShowTemplateList(false);
  };

  const handleSaveAsTemplate = async () => {
    const name = templateName.trim() || title.trim() || 'Şablonsuz';
    const template: TaskTemplate = {
      id: `template-${Date.now()}`,
      name,
      title: title.trim() || 'Görev',
      description: description.trim() || undefined,
      time,
      category: category ?? undefined,
      recurrence: recurrence ?? undefined,
      priority: priority ?? undefined,
      tags: tags.length > 0 ? tags : undefined,
      subtasks: subtasks.length > 0 ? subtasks : undefined,
      reminderAt: reminderAt ?? undefined,
    };
    await saveTemplateToSupabase(userId, template);
    setShowSaveAsTemplate(false);
    setTemplateName('');
  };

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setTime(task.time);
      setDate(task.date);
      setCategory(task.category || null);
      setRecurrence(task.recurrence || null);
      setPriority(task.priority || null);
      setReminderAt(task.reminderAt ?? null);
      setReminderAt2(task.reminderAt2 ?? null);
      setSyncToGoogle(task.syncToGoogle ?? true);
      setReminderMessage(task.reminderMessage ?? null);
      setCountdownTarget(task.countdownTarget ?? null);
      setVoiceNote(task.voiceNote ?? null);
      setAttachmentName(task.attachmentName ?? null);
      setAttachmentData(task.attachmentData ?? null);
      setTags(task.tags || []);
      setSubtasks(task.subtasks || []);
    } else {
      setTitle('');
      setDescription('');
      setTime('08:00');
      setDate(defaultDate || new Date().getDate().toString());
      setCategory(defaultCategory ?? null);
      setRecurrence(null);
      setPriority(null);
      setReminderAt(null);
      setReminderAt2(null);
      setReminderMessage(null);
      setCountdownTarget(null);
      setVoiceNote(null);
      setAttachmentName(null);
      setAttachmentData(null);
      setTags([]);
      setSubtasks([]);
    }
  }, [task, defaultDate, defaultCategory]);

  // Liste içinden açıldıysa (defaultCategory var) ama category state boş kaldıysa senkronize et
  useEffect(() => {
    if (defaultCategory && !category && isNewTask) setCategory(defaultCategory);
  }, [defaultCategory, category, isNewTask]);

  const handleSave = () => {
    if (!title.trim()) return;
    
    if (isNewTask) {
      if (!effectiveCategory) return;
      const taskToSave: TimelineTask = {
        id: '', // Yeni görev: id boş bırakılır; saveTaskToSupabase insert yapar ve gerçek id döner
        title: title.trim(),
        description: description.trim() || undefined,
        time,
        date,
        category: effectiveCategory,
        completed: false,
        recurrence,
        priority,
        tags: tags.length > 0 ? tags : undefined,
        subtasks: subtasks.length > 0 ? subtasks : undefined,
        reminderAt: reminderAt || undefined,
        reminderAt2: isPro ? (reminderAt2 || undefined) : undefined,
        reminderMessage: isPro ? (reminderMessage || undefined) : undefined,
        countdownTarget: isPro ? (countdownTarget || undefined) : undefined,
        voiceNote: isPro ? (voiceNote || undefined) : undefined,
        attachmentName: attachmentName || undefined,
        attachmentData: attachmentData || undefined,
        originalDate: date,
        syncToGoogle: selectedCategorySyncToGoogle ? syncToGoogle : undefined,
        googleEventId: undefined,
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
        tags: tags.length > 0 ? tags : undefined,
        subtasks: subtasks.length > 0 ? subtasks : undefined,
        reminderAt: reminderAt || undefined,
        reminderAt2: isPro ? (reminderAt2 || undefined) : undefined,
        reminderMessage: isPro ? (reminderMessage || undefined) : undefined,
        countdownTarget: isPro ? (countdownTarget || undefined) : undefined,
        voiceNote: isPro ? (voiceNote || undefined) : undefined,
        attachmentName: attachmentName || undefined,
        attachmentData: attachmentData || undefined,
        completedAt: task!.completed ? (task!.completedAt || new Date().toISOString()) : undefined,
        syncToGoogle: selectedCategorySyncToGoogle ? syncToGoogle : undefined,
        googleEventId: task!.googleEventId ?? undefined,
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
  const handleDeleteAll = () => {
    if (!task?.id) return;
    const taskId = task.id;
    setShowDeleteConfirm(false);

    if (onDeleteStart) {
      // Optimistic: ekranı hemen kapat, silmeyi arka planda yap
      onDeleteStart(taskId);
      if (onDelete) onDelete();
      else onBack();
      const run = async () => {
        try {
          await Promise.all([
            task.googleEventId ? syncTaskToGoogleCalendar(userId, task, 'delete') : Promise.resolve(),
            deleteTaskFromSupabase(userId, taskId),
          ]);
        } catch {
          onDeleteFailed?.(taskId);
        } finally {
          onDeleteDone?.(taskId);
        }
      };
      run();
      return;
    }

    (async () => {
      try {
        await Promise.all([
          task.googleEventId ? syncTaskToGoogleCalendar(userId, task, 'delete') : Promise.resolve(),
          deleteTaskFromSupabase(userId, taskId),
        ]);
      } finally {
        if (onDelete) onDelete();
        else onBack();
      }
    })();
  };

  // Lybell renk paleti
  const PRIMARY = '#1A2332';
  const inputBase = dark
    ? 'w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500/40 focus:border-slate-500/40 bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder:text-zinc-500'
    : 'w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/15 focus:border-slate-900/30 bg-white border border-stone-200 text-stone-900 placeholder:text-stone-400';
  const labelClass = dark ? 'block text-sm font-semibold text-zinc-400 mb-2' : 'block text-sm font-semibold text-stone-600 mb-2';
  const selectBtn = dark
    ? 'w-full px-4 py-4 rounded-xl text-left flex items-center justify-between border border-zinc-700 bg-zinc-900 hover:border-zinc-600 transition-all'
    : 'w-full px-4 py-4 rounded-xl text-left flex items-center justify-between border border-stone-200 bg-white hover:border-slate-300 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.06)] transition-all';
  const dropdownPanel = dark ? 'mt-2 border border-zinc-700 rounded-xl overflow-hidden bg-zinc-900' : 'mt-2 border border-stone-200 rounded-xl overflow-hidden bg-white shadow-[0_4px_16px_-4px_rgba(0,0,0,0.08)]';

  const sectionLabel = 'text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500';
  const underlineInput = `w-full bg-transparent border-0 border-b-2 border-slate-200 dark:border-slate-700 focus:ring-0 focus:border-b-2 px-0 py-2 placeholder:text-slate-300 dark:placeholder:text-slate-600 transition-colors`;
  const dateValue = (() => { const now = new Date(); const y = now.getFullYear(); const m = String(now.getMonth() + 1).padStart(2, '0'); const d = (date ?? now.getDate().toString()).padStart(2, '0'); return `${y}-${m}-${d}`; })();

  return (
    <div className={`min-h-screen flex flex-col ${dark ? 'bg-[#0f172a]' : 'bg-[#f8f6f6]'} text-slate-900 dark:text-slate-100`}>
      <div className="relative flex flex-col flex-1 w-full max-w-md mx-auto bg-white dark:bg-slate-900 min-h-screen">
        {/* Header */}
        <header className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-10">
          <button
            type="button"
            onClick={onBack}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
            aria-label="Geri"
          >
            <span className="material-symbols-outlined text-slate-600 dark:text-slate-400">arrow_back</span>
          </button>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">
            {isNewTask ? 'Yeni Görev' : 'Görevi Düzenle'}
          </h1>
          <button
            type="button"
            onClick={handleSave}
            disabled={!(title ?? '').trim() || (!effectiveCategory && !task)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors disabled:opacity-50"
            aria-label="Kaydet"
          >
            <span className="material-symbols-outlined" style={{ color: dark ? '#ffffff' : PRIMARY }}>done</span>
          </button>
        </header>

        <main className="flex-1 overflow-y-auto pb-16">
          <div className="p-4 space-y-4">
          {/* Task Title Section */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-600 dark:text-slate-400 ml-1">Görev Başlığı</label>
            <div className="relative flex items-center">
              <input
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-4 pl-4 pr-12 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 dark:focus:ring-white/20 dark:focus:border-slate-500 transition-all outline-none"
                placeholder="Görev adını girin..."
                type="text"
                value={title ?? ''}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
              />
              {isPro && (
                <button
                  type="button"
                  className="absolute right-3 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors disabled:opacity-60"
                  onClick={() => {
                    const SpeechRecognitionAPI = typeof window !== 'undefined' && ((window as unknown as { SpeechRecognition?: typeof SpeechRecognition }).SpeechRecognition || (window as unknown as { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition);
                    if (!SpeechRecognitionAPI) { showToast(locale === 'tr' ? 'Tarayıcınız ses tanımayı desteklemiyor.' : 'Your browser does not support speech recognition.', 'error'); return; }
                    if (isListeningForTitle) { try { recognitionRef.current?.stop(); } catch { /* noop */ } setIsListeningForTitle(false); return; }
                    const recognition = new SpeechRecognitionAPI() as SpeechRecognition;
                    recognition.continuous = false; recognition.interimResults = false; recognition.lang = locale === 'tr' ? 'tr-TR' : 'en-US';
                    recognition.onresult = (e: SpeechRecognitionEvent) => { const transcript = Array.from(e.results).map((r) => r[0].transcript).join(' ').trim(); if (transcript) setTitle((prev) => (prev ? `${prev} ${transcript}` : transcript)); };
                    recognition.onend = () => setIsListeningForTitle(false);
                    recognition.onerror = () => { setIsListeningForTitle(false); showToast(locale === 'tr' ? 'Ses algılanamadı.' : 'Speech not detected.', 'error'); };
                    recognitionRef.current = recognition; recognition.start(); setIsListeningForTitle(true);
                  }}
                  disabled={isListeningForTitle}
                  aria-label="Sesle ekle"
                >
                  <span className="material-symbols-outlined">mic</span>
                </button>
              )}
            </div>
          </div>

          {/* Notes Section */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-600 dark:text-slate-400 ml-1">Notlar</label>
            <textarea
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 dark:focus:ring-white/20 dark:focus:border-slate-500 transition-all outline-none resize-none"
              placeholder="Görev detaylarını buraya yazın..."
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Date and Time Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-600 dark:text-slate-400 ml-1">Tarih Seçimi</label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3 text-slate-400">calendar_today</span>
                <input
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-10 pr-4 text-slate-900 dark:text-white cursor-pointer dark:[color-scheme:dark]"
                  type="date"
                  value={dateValue}
                  onChange={(e) => { const day = e.target.value.split('-')[2]; setDate(parseInt(day, 10).toString()); }}
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-600 dark:text-slate-400 ml-1">Saat</label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3 text-slate-400">schedule</span>
                <input
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-10 pr-4 text-slate-900 dark:text-white cursor-pointer dark:[color-scheme:dark]"
                  type="time"
                  value={time ?? ''}
                  onChange={(e) => setTime(e.target.value || '08:00')}
                />
              </div>
            </div>
          </div>

          {/* Kategori - pill veya dropdown */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-slate-600 dark:text-slate-400 ml-1">Kategori</label>
            {!defaultCategory ? (
              <>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => {
                    const isSelected = category === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => { setCategory(cat.id); if (cat.syncToGoogle) setSyncToGoogle(true); else setSyncToGoogle(false); }}
                        className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                          isSelected
                            ? 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-100 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                        style={isSelected ? { borderColor: `${PRIMARY}40`, backgroundColor: `${PRIMARY}15`, color: PRIMARY } : undefined}
                      >
                        {cat.name}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={onOpenPro}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full border border-slate-200 dark:border-slate-700 text-sm font-medium hover:bg-slate-200 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                    Yeni
                  </button>
                </div>
                {showCategoryOptions && (
                  <div className={dropdownPanel}>
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => { setCategory(cat.id); if (cat.syncToGoogle) setSyncToGoogle(true); else setSyncToGoogle(false); setShowCategoryOptions(false); }}
                        className={`w-full px-4 py-4 text-left flex items-center gap-3 border-b last:border-b-0 ${dark ? 'border-zinc-800 hover:bg-zinc-800' : 'border-stone-100 hover:bg-slate-50/80'}`}
                      >
                        <span className="text-2xl">{cat.icon}</span>
                        <div className={dark ? 'font-semibold text-zinc-200' : 'font-semibold text-stone-900'}>{cat.name}</div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <p className={`text-sm font-medium ${dark ? 'text-slate-300' : 'text-slate-700'}`}>{categories.find(c => c.id === defaultCategory)?.name ?? defaultCategory}</p>
            )}
            {isPro && selectedCategorySyncToGoogle && (
              <div className={`flex items-center justify-between px-4 py-3 rounded-xl ${dark ? 'bg-slate-800/80' : 'bg-slate-50'}`}>
                <div>
                  <p className={`font-medium text-sm ${dark ? 'text-slate-200' : 'text-slate-800'}`}>Google Takvim'de görünsün</p>
                </div>
                <button type="button" role="switch" aria-checked={syncToGoogle} onClick={() => setSyncToGoogle((v) => !v)} className={`relative w-12 h-7 rounded-full transition-colors ${syncToGoogle ? '' : dark ? 'bg-slate-600' : 'bg-slate-300'}`} style={syncToGoogle ? { backgroundColor: PRIMARY } : undefined}>
                  <span className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${syncToGoogle ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            )}
          </div>

          {/* Detay bölümü (accordion) */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setShowDetaySection((v) => !v)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all ${dark ? 'bg-slate-800/80 hover:bg-slate-800 text-slate-200' : 'bg-slate-50 hover:bg-slate-100 text-slate-700'} border border-slate-100 dark:border-slate-700`}
            >
              <span className={`text-xs font-bold uppercase tracking-wider ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{t('edit.detail', locale)}</span>
              <span className={`material-symbols-outlined text-xl transition-transform ${showDetaySection ? 'rotate-180' : ''}`}>expand_more</span>
            </button>
          </div>

          {showDetaySection && (
          <>
          <div>
            <label className={labelClass}>Hatırlatma (isteğe bağlı)</label>
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={reminderAt ?? ''}
                onChange={(e) => setReminderAt(e.target.value || null)}
                className={inputBase}
              />
              {reminderAt && (
                <button
                  type="button"
                  onClick={() => setReminderAt(null)}
                  className={`shrink-0 px-3 py-3 rounded-xl text-sm font-medium ${dark ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}
                >
                  Kaldır
                </button>
              )}
            </div>
            <p className={`mt-1 text-xs ${dark ? 'text-zinc-500' : 'text-stone-500'}`}>Bildirimler açıksa bu saatte hatırlatılacaksın.</p>
          </div>

          {isPro && (
            <div>
              <label className={labelClass}>Hatırlatma mesajı (Pro)</label>
              <input
                type="text"
                value={reminderMessage ?? ''}
                onChange={(e) => setReminderMessage(e.target.value || null)}
                placeholder="Bildirimde görünecek özel mesaj (örn: Toplantıyı unutma!)"
                className={inputBase}
              />
            </div>
          )}

          {isPro && (
            <div>
              <label className={labelClass}>İkinci hatırlatma (Pro)</label>
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={reminderAt2 ?? ''}
                  onChange={(e) => setReminderAt2(e.target.value || null)}
                  className={inputBase}
                />
                {reminderAt2 && (
                  <button
                    type="button"
                    onClick={() => setReminderAt2(null)}
                    className={`shrink-0 px-3 py-3 rounded-xl text-sm font-medium ${dark ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}
                  >
                    Kaldır
                  </button>
                )}
              </div>
            </div>
          )}

          {isPro && (
            <div>
              <label className={labelClass}>Geri sayım hedefi (Pro)</label>
              <input
                type="datetime-local"
                value={countdownTarget ?? ''}
                onChange={(e) => setCountdownTarget(e.target.value || null)}
                className={inputBase}
              />
              {countdownTarget && (
                <button
                  type="button"
                  onClick={() => setCountdownTarget(null)}
                  className={`mt-2 text-sm font-medium ${dark ? 'text-zinc-400 hover:text-zinc-300' : 'text-stone-500 hover:text-stone-700'}`}
                >
                  Geri sayımı kaldır
                </button>
              )}
            </div>
          )}

          {isPro && (
            <div>
              <label className={labelClass}>Ses notu (Pro)</label>
              {voiceNote ? (
                <div className={`flex items-center gap-2 rounded-xl px-4 py-3 ${dark ? 'bg-zinc-800 border border-zinc-700' : 'bg-stone-50 border border-stone-200'}`}>
                  <button
                    type="button"
                    onClick={() => {
                      const a = new Audio(voiceNote);
                      a.play().catch(() => {});
                    }}
                    className={`shrink-0 p-2 rounded-lg ${dark ? 'bg-slate-500/25 text-slate-200' : 'bg-slate-100 text-slate-800'}`}
                    title="Oynat"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                  </button>
                  <span className={`text-sm flex-1 ${dark ? 'text-zinc-400' : 'text-stone-600'}`}>Ses kaydı</span>
                  <button
                    type="button"
                    onClick={() => setVoiceNote(null)}
                    className={`shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium ${dark ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-600'}`}
                  >
                    Sil
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {!isRecordingVoice ? (
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                          const recorder = new MediaRecorder(stream);
                          const chunks: BlobPart[] = [];
                          recorder.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
                          recorder.onstop = () => {
                            stream.getTracks().forEach(t => t.stop());
                            const blob = new Blob(chunks, { type: 'audio/webm' });
                            const reader = new FileReader();
                            reader.onload = () => {
                              const data = reader.result as string;
                              const MAX = 500 * 1024;
                              if (data.length > MAX) {
                                alert('Ses kaydı çok uzun (max ~500 KB). Kısa kaydedin.');
                                return;
                              }
                              setVoiceNote(data);
                            };
                            reader.readAsDataURL(blob);
                          };
                          (recorder as unknown as { _stream: MediaStream })._stream = stream;
                          (window as unknown as { __voiceRecorder: MediaRecorder }).__voiceRecorder = recorder;
                          recorder.start();
                          setIsRecordingVoice(true);
                        } catch (err) {
                          alert('Mikrofon erişimi gerekli.');
                        }
                      }}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium ${dark ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-600'}`}
                    >
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> Kaydet
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        const r = (window as unknown as { __voiceRecorder?: MediaRecorder }).__voiceRecorder;
                        if (r && r.state !== 'inactive') r.stop();
                        (window as unknown as { __voiceRecorder?: MediaRecorder }).__voiceRecorder = undefined;
                        setIsRecordingVoice(false);
                      }}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium ${dark ? 'bg-zinc-700 text-zinc-200' : 'bg-stone-200 text-stone-800'}`}
                    >
                      Durdur
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          <div>
            <label className={labelClass}>Dosya ekle (isteğe bağlı, max 500 KB)</label>
            {attachmentName ? (
              <div className={`flex items-center justify-between gap-2 rounded-xl px-4 py-3 ${dark ? 'bg-zinc-800 border border-zinc-700' : 'bg-stone-50 border border-stone-200'}`}>
                <span className={`text-sm truncate flex-1 ${dark ? 'text-zinc-300' : 'text-stone-700'}`}>📎 {attachmentName}</span>
                <button
                  type="button"
                  onClick={() => { setAttachmentName(null); setAttachmentData(null); }}
                  className={`shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium ${dark ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-600'}`}
                >
                  Kaldır
                </button>
                {attachmentData && (
                  <a
                    href={attachmentData}
                    download={attachmentName || 'ek'}
                    className={`shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium ${dark ? 'bg-slate-500/25 text-slate-200' : 'bg-slate-100 text-slate-800'}`}
                  >
                    İndir
                  </a>
                )}
              </div>
            ) : (
              <label className={`flex items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-4 cursor-pointer transition-colors ${dark ? 'border-zinc-600 hover:border-slate-500/50 bg-zinc-900/40' : 'border-stone-200 hover:border-slate-300 bg-stone-50/50'}`}>
                <input
                  type="file"
                  className="hidden"
                  accept="*/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const MAX = 500 * 1024;
                    if (file.size > MAX) {
                      alert('Dosya 500 KB\'dan büyük olamaz.');
                      return;
                    }
                    const reader = new FileReader();
                    reader.onload = () => {
                      const data = reader.result as string;
                      setAttachmentName(file.name);
                      setAttachmentData(data);
                    };
                    reader.readAsDataURL(file);
                    e.target.value = '';
                  }}
                />
                <span className={dark ? 'text-zinc-400' : 'text-stone-500'}>Dosya seç</span>
              </label>
            )}
          </div>

          <div>
            <label className={labelClass}>Tekrar</label>
            <button
              onClick={() => setShowRecurrenceOptions(!showRecurrenceOptions)}
              className={selectBtn}
            >
              <span className={recurrence ? (dark ? 'text-zinc-100 font-medium' : 'text-stone-900 font-medium') : (dark ? 'text-zinc-500' : 'text-stone-400')}>
                {recurrence === 'daily'
                  ? '📆 Her gün'
                  : recurrence === 'weekly'
                  ? '🔄 Her hafta'
                  : recurrence === 'monthly'
                  ? '📅 Her ay'
                  : recurrence === 'weekdays'
                  ? '📆 Sadece hafta içi'
                  : 'Tekrar yok'}
              </span>
              <svg
                className={`w-5 h-5 transition-transform ${dark ? 'text-zinc-500' : 'text-stone-400'} ${showRecurrenceOptions ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showRecurrenceOptions && (
              <div className={dropdownPanel}>
                {[
                  { v: 'daily' as const, l: '📆 Her gün' },
                  { v: 'weekly' as const, l: '🔄 Her hafta' },
                  { v: 'monthly' as const, l: '📅 Her ay' },
                  ...(isPro ? [{ v: 'weekdays' as const, l: '📆 Sadece hafta içi' }] : []),
                ].map(({ v, l }) => (
                  <button key={v} onClick={() => { setRecurrence(v); setShowRecurrenceOptions(false); }} className={`w-full px-4 py-3 text-left border-b last:border-b-0 ${dark ? 'border-zinc-800 hover:bg-zinc-800 text-zinc-200' : 'border-stone-100 hover:bg-slate-50/80 text-stone-800'}`}>{l}</button>
                ))}
                <button onClick={() => { setRecurrence(null); setShowRecurrenceOptions(false); }} className={`w-full px-4 py-3 text-left ${dark ? 'hover:bg-zinc-800 text-zinc-500' : 'hover:bg-slate-50/80 text-stone-500'}`}>Tekrar yok</button>
              </div>
            )}
          </div>

          <div>
            <label className={labelClass}>Öncelik</label>
            <button
              onClick={() => setShowPriorityOptions(!showPriorityOptions)}
              className={selectBtn}
            >
              <span className={priority ? (dark ? 'text-zinc-100 font-medium' : 'text-stone-900 font-medium') : (dark ? 'text-zinc-500' : 'text-stone-400')}>
                {priority === 'high'
                  ? '🔴 Yüksek Öncelik'
                  : priority === 'medium'
                  ? '🟡 Orta Öncelik'
                  : priority === 'low'
                  ? '🟢 Düşük Öncelik'
                  : 'Öncelik yok'}
              </span>
              <svg
                className={`w-5 h-5 transition-transform ${dark ? 'text-zinc-500' : 'text-stone-400'} ${showPriorityOptions ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showPriorityOptions && (
              <div className={dropdownPanel}>
                <button
                  onClick={() => {
                    setPriority('high');
                    setShowPriorityOptions(false);
                  }}
                  className="w-full px-4 py-4 text-left hover:bg-red-50 transition-colors flex items-center gap-3 border-b"
                >
                  <span className="text-xl">🔴</span>
                  <div>
                    <div className={dark ? 'font-semibold text-zinc-200' : 'font-semibold text-stone-900'}>Yüksek Öncelik</div>
                    <div className={dark ? 'text-xs text-zinc-500' : 'text-xs text-stone-500'}>Acil ve önemli</div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setPriority('medium');
                    setShowPriorityOptions(false);
                  }}
                  className="w-full px-4 py-4 text-left hover:bg-yellow-50 transition-colors flex items-center gap-3 border-b"
                >
                  <span className="text-xl">🟡</span>
                  <div>
                    <div className={dark ? 'font-semibold text-zinc-200' : 'font-semibold text-stone-900'}>Orta Öncelik</div>
                    <div className={dark ? 'text-xs text-zinc-500' : 'text-xs text-stone-500'}>Önemli ama acil değil</div>
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
                    <div className={dark ? 'font-semibold text-zinc-200' : 'font-semibold text-stone-900'}>Düşük Öncelik</div>
                    <div className={dark ? 'text-xs text-zinc-500' : 'text-xs text-stone-500'}>Daha sonra yapılabilir</div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setPriority(null);
                    setShowPriorityOptions(false);
                  }}
                  className={`w-full px-4 py-4 text-left transition-colors flex items-center gap-3 border-t ${dark ? 'border-zinc-800 hover:bg-zinc-800 text-zinc-500' : 'border-stone-100 hover:bg-stone-50 text-stone-500'}`}
                >
                  <span className="text-xl">⚪</span>
                  <div>
                    <div className={dark ? 'font-semibold text-zinc-200' : 'font-semibold text-stone-900'}>Öncelik Yok</div>
                    <div className={dark ? 'text-xs text-zinc-500' : 'text-xs text-stone-500'}>Önceliği kaldır</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Tags */}
          <div>
            <label className={labelClass}>Etiketler</label>
            
            {/* Seçili Tag'ler */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {tags.map((tag) => {
                  const tagObj = DEFAULT_TAGS.find(t => t.id === tag || t.name === tag);
                  const colors = getTagColorClasses(tagObj?.color || 'gray');
                  return (
                    <span
                      key={tag}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 ${colors.bg} ${colors.text} rounded-full text-xs font-medium border ${colors.border}`}
                    >
                      #{tagObj?.name || tag}
                      <button
                        onClick={() => setTags(tags.filter(t => t !== tag))}
                        className="hover:opacity-70"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  );
                })}
              </div>
            )}

            <button
              onClick={() => setShowTagOptions(!showTagOptions)}
              className={selectBtn}
            >
              <span className={tags.length > 0 ? (dark ? 'text-zinc-100 font-medium' : 'text-stone-900 font-medium') : (dark ? 'text-zinc-500' : 'text-stone-400')}>
                {tags.length > 0 ? `${tags.length} etiket seçildi` : 'Etiket ekle'}
              </span>
              <svg
                className={`w-5 h-5 transition-transform ${dark ? 'text-zinc-500' : 'text-stone-400'} ${showTagOptions ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showTagOptions && (
              <div className={`${dropdownPanel} max-h-64 overflow-y-auto`}>
                {DEFAULT_TAGS.map((tag) => {
                  const isSelected = tags.includes(tag.id);
                  const colors = getTagColorClasses(tag.color);
                  
                  return (
                    <button
                      key={tag.id}
                      onClick={() => {
                        if (isSelected) {
                          setTags(tags.filter(t => t !== tag.id));
                        } else {
                          setTags([...tags, tag.id]);
                        }
                      }}
                      className={`w-full px-4 py-3 text-left transition-colors flex items-center gap-3 border-b last:border-b-0 ${dark ? 'border-zinc-800 ' : 'border-stone-100 '}${isSelected ? (dark ? 'bg-slate-600/25' : 'bg-slate-100') : (dark ? 'hover:bg-zinc-800' : 'hover:bg-slate-50/80')}`}
                    >
                      <div className={`w-8 h-8 ${colors.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <span className={`text-sm font-bold ${colors.text}`}>#</span>
                      </div>
                      <div className="flex-1">
                        <div className={dark ? 'font-semibold text-zinc-200' : 'font-semibold text-stone-900'}>{tag.name}</div>
                      </div>
                      {isSelected && (
                        <svg className={`w-5 h-5 flex-shrink-0 ${dark ? 'text-slate-300' : 'text-slate-700'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Alt Görevler */}
          <div>
            <label className={labelClass}>
              Alt Görevler
              {!isPro && (
                <span className={`ml-2 text-xs font-normal ${dark ? 'text-zinc-500' : 'text-stone-500'}`}>
                  (Free: en fazla 3)
                </span>
              )}
            </label>
            
            {/* Mevcut Alt Görevler */}
            {subtasks.length > 0 && (
              <div className="mb-3 space-y-2">
                {subtasks.map((subtask, index) => (
                  <div
                    key={subtask.id}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all ${dark ? 'bg-zinc-900/60 border border-zinc-700' : 'bg-white border border-stone-200 shadow-sm'}`}
                  >
                    <button
                      onClick={() => {
                        const updated = [...subtasks];
                        updated[index] = { ...subtask, completed: !subtask.completed };
                        setSubtasks(updated);
                      }}
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        subtask.completed
                          ? (dark ? 'bg-slate-500 border-slate-400' : 'bg-slate-800 border-slate-800')
                          : (dark ? 'border-zinc-600 hover:border-zinc-500' : 'border-stone-300 hover:border-slate-500')
                      }`}
                    >
                      {subtask.completed && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                    <span className={`flex-1 text-sm ${subtask.completed ? 'line-through opacity-70' : ''} ${dark ? 'text-zinc-200' : 'text-stone-900'}`}>
                      {subtask.title}
                    </span>
                    <button
                      onClick={() => setSubtasks(subtasks.filter((_, i) => i !== index))}
                      className="text-red-400 hover:text-red-600 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
                
                {/* İlerleme Çubuğu */}
                {subtasks.length > 0 && (
                  <div className={`mt-3 p-3 rounded-xl border ${dark ? 'bg-zinc-800/60 border-zinc-700' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs font-semibold ${dark ? 'text-slate-300' : 'text-slate-800'}`}>
                        {subtasks.filter(s => s.completed).length}/{subtasks.length} tamamlandı
                      </span>
                      <span className={`text-xs font-bold ${dark ? 'text-slate-300' : 'text-slate-800'}`}>
                        %{Math.round((subtasks.filter(s => s.completed).length / subtasks.length) * 100)}
                      </span>
                    </div>
                    <div className={`w-full rounded-full h-2 ${dark ? 'bg-zinc-700' : 'bg-slate-200'}`}>
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${dark ? 'bg-slate-500' : 'bg-slate-800'}`}
                        style={{ width: `${(subtasks.filter(s => s.completed).length / subtasks.length) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Alt Görev Ekleme */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && newSubtaskTitle.trim()) {
                    if (!canAddSubtask(isPro, subtasks.length)) {
                      onOpenPro?.();
                      return;
                    }
                    setSubtasks([...subtasks, {
                      id: `subtask-${Date.now()}`,
                      title: newSubtaskTitle.trim(),
                      completed: false,
                    }]);
                    setNewSubtaskTitle('');
                  }
                }}
                className={`flex-1 ${inputBase}`}
                placeholder="Alt görev ekle..."
              />
              <button
                onClick={() => {
                  if (!newSubtaskTitle.trim()) return;
                  if (!canAddSubtask(isPro, subtasks.length)) {
                    onOpenPro?.();
                    return;
                  }
                  setSubtasks([...subtasks, {
                    id: `subtask-${Date.now()}`,
                    title: newSubtaskTitle.trim(),
                    completed: false,
                  }]);
                  setNewSubtaskTitle('');
                }}
                disabled={!newSubtaskTitle.trim()}
                className={`px-4 py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed ${dark ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>

          </>
          )}

          <div className="p-0 mt-auto pt-4">
            <button
              type="button"
              onClick={handleSave}
              disabled={!(title ?? '').trim() || (!effectiveCategory && !task)}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl shadow-lg shadow-slate-200 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              aria-label={isNewTask ? 'Görevi oluştur' : 'Değişiklikleri kaydet'}
            >
              <span>{isNewTask ? 'Görev Oluştur' : 'Kaydet'}</span>
              <span className="material-symbols-outlined">add_task</span>
            </button>
          </div>

          {!isNewTask && task?.id && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className={`w-full py-4 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${dark ? 'bg-red-900/30 border border-red-800 text-red-400 hover:bg-red-900/50' : 'bg-white border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>Görevi Sil</span>
            </button>
          )}
          </div>
        </main>
      </div>

      {/* Şablondan oluştur listesi */}
      {showTemplateList && (
        <Modal open dark={dark} onClose={() => setShowTemplateList(false)} maxWidth="sm" contentClassName="max-h-[70vh] overflow-hidden flex flex-col" contentNoPadding>
          <div className={`p-4 border-b flex items-center justify-between ${dark ? 'border-zinc-800' : 'border-stone-200'}`}>
            <h3 className={`font-semibold ${dark ? 'text-white' : 'text-stone-900'}`}>Şablondan oluştur</h3>
            <button onClick={() => setShowTemplateList(false)} className={`p-2 rounded-xl ${dark ? 'hover:bg-zinc-800' : 'hover:bg-stone-100'}`} aria-label="Kapat">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="overflow-y-auto max-h-[60vh] p-2">
            {templateList.length === 0 ? (
              <p className={`py-6 text-center text-sm ${dark ? 'text-zinc-500' : 'text-stone-500'}`}>Henüz şablon yok. Bir görevi &quot;Şablon olarak kaydet&quot; ile kaydedebilirsin.</p>
            ) : (
              templateList.map((t) => (
                <button key={t.id} onClick={() => applyTemplate(t)} className={`w-full text-left px-4 py-3 rounded-xl mb-1 ${dark ? 'hover:bg-zinc-800 text-zinc-100' : 'hover:bg-slate-50 text-stone-900'}`}>
                  <span className="font-medium">{t.name}</span>
                  <span className={`block text-sm truncate ${dark ? 'text-zinc-500' : 'text-stone-500'}`}>{t.title}</span>
                </button>
              ))
            )}
          </div>
        </Modal>
      )}

      {/* Şablon olarak kaydet */}
      {showSaveAsTemplate && (
        <Modal open dark={dark} onClose={() => { setShowSaveAsTemplate(false); setTemplateName(''); }} maxWidth="sm">
          <h3 className={`font-semibold mb-3 ${dark ? 'text-white' : 'text-stone-900'}`}>Şablon olarak kaydet</h3>
          <input
            type="text"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="Şablon adı (örn. Haftalık toplantı)"
            className={`${inputBase} mb-4`}
          />
          <div className="flex gap-2">
            <button onClick={() => { setShowSaveAsTemplate(false); setTemplateName(''); }} className={`flex-1 py-3 rounded-xl font-medium ${dark ? 'bg-zinc-800 text-zinc-300' : 'bg-stone-100 text-stone-700'}`}>İptal</button>
            <button onClick={handleSaveAsTemplate} className="flex-1 py-3 rounded-xl font-medium bg-slate-900 text-white hover:bg-slate-800">Kaydet</button>
          </div>
        </Modal>
      )}

      {/* Silme Onay Dialogu */}
      {showDeleteConfirm && (
        <Modal open dark={dark} onClose={() => setShowDeleteConfirm(false)} maxWidth="sm">
          <div className="text-center mb-5">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${dark ? 'bg-red-900/40' : 'bg-red-100'}`}>
              <svg className={`w-8 h-8 ${dark ? 'text-red-400' : 'text-red-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className={`text-lg font-bold mb-2 ${dark ? 'text-white' : 'text-stone-900'}`}>
              {isRecurring ? 'Tekrarlı Görevi Sil' : 'Görevi Sil'}
              </h3>
              <p className={`text-sm ${dark ? 'text-zinc-400' : 'text-stone-600'}`}>
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
                  className={`w-full py-3.5 px-4 rounded-xl font-medium transition-all text-left flex items-center gap-3 ${dark ? 'bg-zinc-800 border border-zinc-700 text-zinc-200 hover:bg-zinc-700' : 'bg-white border-2 border-stone-200 text-stone-900 hover:bg-stone-50 hover:border-stone-300'}`}
                >
                  <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Sadece bu günü sil</div>
                    <div className={dark ? 'text-xs text-zinc-500' : 'text-xs text-stone-500'}>Diğer tekrarlar kalır</div>
                  </div>
                </button>

                {/* Bu ve sonrakileri sil */}
                <button
                  onClick={handleDeleteThisAndFuture}
                  className={`w-full py-3.5 px-4 rounded-xl font-medium transition-all text-left flex items-center gap-3 ${dark ? 'bg-zinc-800 border border-zinc-700 text-zinc-200 hover:bg-red-900/30' : 'bg-white border-2 border-stone-200 text-stone-900 hover:bg-red-50 hover:border-red-200'}`}
                >
                  <div className="w-9 h-9 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Bu ve sonrakileri sil</div>
                    <div className={dark ? 'text-xs text-zinc-500' : 'text-xs text-stone-500'}>Önceki tekrarlar kalır</div>
                  </div>
                </button>

                {/* Tüm tekrarları sil */}
                <button
                  onClick={handleDeleteAll}
                  className={`w-full py-3.5 px-4 rounded-xl font-medium transition-all text-left flex items-center gap-3 ${dark ? 'bg-red-900/30 border border-red-800 text-red-400 hover:bg-red-900/50' : 'bg-white border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300'}`}
                >
                  <div className="w-9 h-9 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Tüm tekrarları sil</div>
                    <div className={dark ? 'text-xs text-zinc-500' : 'text-xs text-stone-500'}>Görev tamamen kaldırılır</div>
                  </div>
                </button>

                {/* İptal */}
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className={`w-full py-3 rounded-xl font-semibold transition-all mt-2 ${dark ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'}`}
                >
                  İptal
                </button>
              </div>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className={`flex-1 py-3 rounded-xl font-semibold transition-all ${dark ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'}`}
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
        </Modal>
      )}
    </div>
  );
}
