'use client';

import { useState, useEffect } from 'react';
import { TimelineTask, Category, SubTask, TaskTemplate } from '@/lib/types';
import { getMockCategories, deleteTaskFromSupabase, syncTaskToGoogleCalendar, excludeDateFromTask, setRecurrenceEndDate, DEFAULT_TAGS, getTagColorClasses, fetchTemplates, saveTemplateToSupabase } from '@/lib/helpers';
import { canAddSubtask } from '@/lib/limits';
import Modal from '@/components/Modal';

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
}

export default function EditTaskView({ task, darkMode = false, isPro = false, onOpenPro, onBack, onSave, onDelete, onDeleteStart, onDeleteDone, onDeleteFailed, userId, defaultDate, defaultCategory, viewingDate }: EditTaskViewProps) {
  const dark = darkMode;
  const isNewTask = !task || !task.id;
  const [title, setTitle] = useState(task?.title || '');
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
  const categories = getMockCategories(userId);
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

  const inputBase = dark
    ? 'w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder:text-zinc-500'
    : 'w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 bg-white border border-stone-200 text-stone-900 placeholder:text-stone-400';
  const labelClass = dark ? 'block text-sm font-semibold text-zinc-400 mb-2' : 'block text-sm font-semibold text-stone-600 mb-2';
  const selectBtn = dark
    ? 'w-full px-4 py-4 rounded-xl text-left flex items-center justify-between border border-zinc-700 bg-zinc-900 hover:border-zinc-600 transition-all'
    : 'w-full px-4 py-4 rounded-xl text-left flex items-center justify-between border border-stone-200 bg-white hover:border-amber-300 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.06)] transition-all';
  const dropdownPanel = dark ? 'mt-2 border border-zinc-700 rounded-xl overflow-hidden bg-zinc-900' : 'mt-2 border border-stone-200 rounded-xl overflow-hidden bg-white shadow-[0_4px_16px_-4px_rgba(0,0,0,0.08)]';

  return (
    <div className={`min-h-screen flex flex-col ${dark ? 'bg-[#0f0f0f]' : 'bg-[#f5f0ea]'}`}>
      <header className="px-5 pt-6 pb-4">
        <div className="max-w-md mx-auto flex items-center gap-4">
          <button onClick={onBack} className={`w-10 h-10 flex items-center justify-center rounded-xl transition-colors ${dark ? 'hover:bg-zinc-800' : 'hover:bg-white/80'}`} aria-label="Geri">
            <svg className={`w-6 h-6 ${dark ? 'text-zinc-300' : 'text-stone-700'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className={`text-xl font-semibold flex-1 ${dark ? 'text-white' : 'text-stone-800'}`}>{isNewTask ? 'Yeni Görev' : 'Görevi Düzenle'}</h1>
          {isNewTask && (
            <button
              type="button"
              onClick={() => { loadTemplates(); setShowTemplateList(true); }}
              className={`text-sm font-medium px-3 py-2 rounded-xl ${dark ? 'text-amber-400 hover:bg-zinc-800' : 'text-amber-600 hover:bg-amber-50'}`}
            >
              Şablondan
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={!(title ?? '').trim() || (!effectiveCategory && !task)}
            className={`px-4 py-2 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${dark ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30' : 'bg-amber-100 text-amber-800 hover:bg-amber-200'}`}
          >
            Kaydet
          </button>
          {isNewTask && !effectiveCategory && (
            <p className={`text-xs mt-1 ${dark ? 'text-amber-400/90' : 'text-amber-700'}`}>Görevi kaydetmek için aşağıdan bir liste seçin.</p>
          )}
        </div>
      </header>

      <div className="flex-1 max-w-md mx-auto w-full px-5 pb-24">
        <div className="space-y-6">
          <div>
            <label className={labelClass}>Görev Başlığı</label>
            <input
              type="text"
              value={title ?? ''}
              onChange={(e) => setTitle(e.target.value)}
              className={`${inputBase} py-4 text-lg`}
              placeholder="Ne yapman gerekiyor?"
              autoFocus
            />
          </div>
          <div>
            <label className={labelClass}>Açıklama / Not</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className={`${inputBase} resize-none`}
              placeholder="Detay veya not ekle (isteğe bağlı)"
            />
          </div>

          {!defaultCategory && (
            <div>
              <label className={labelClass}>Liste</label>
              <button onClick={() => setShowCategoryOptions(!showCategoryOptions)} className={selectBtn}>
                <span className={category ? (dark ? 'text-zinc-100 font-medium' : 'text-stone-900 font-medium') : (dark ? 'text-zinc-500' : 'text-stone-400')}>
                  {category ? categories.find(c => c.id === category)?.name || category : 'Liste seç'}
                </span>
                <svg className={`w-5 h-5 transition-transform ${dark ? 'text-zinc-500' : 'text-stone-400'} ${showCategoryOptions ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showCategoryOptions && (
                <div className={dropdownPanel}>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setCategory(cat.id);
                        if (cat.syncToGoogle) setSyncToGoogle(true);
                        else setSyncToGoogle(false);
                        setShowCategoryOptions(false);
                      }}
                      className={`w-full px-4 py-4 text-left flex items-center gap-3 border-b last:border-b-0 ${dark ? 'border-zinc-800 hover:bg-zinc-800' : 'border-stone-100 hover:bg-amber-50/50'}`}
                    >
                      <span className="text-2xl">{cat.icon}</span>
                      <div className={dark ? 'font-semibold text-zinc-200' : 'font-semibold text-stone-900'}>{cat.name}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {isPro && selectedCategorySyncToGoogle && (
            <div className={`flex items-center justify-between px-4 py-3 rounded-xl ${dark ? 'bg-zinc-800/80' : 'bg-stone-50'}`}>
              <div>
                <p className={`font-medium ${dark ? 'text-zinc-200' : 'text-stone-800'}`}>Google Takvim'de görünsün</p>
                <p className={`text-xs mt-0.5 ${dark ? 'text-zinc-500' : 'text-stone-500'}`}>Bu görev Google Takvim'e aktarılır</p>
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Tarih</label>
              <input
                type="date"
                value={(() => { const now = new Date(); const y = now.getFullYear(); const m = String(now.getMonth() + 1).padStart(2, '0'); const d = (date ?? now.getDate().toString()).padStart(2, '0'); return `${y}-${m}-${d}`; })()}
                onChange={(e) => { const dateStr = e.target.value; const day = dateStr.split('-')[2]; setDate(parseInt(day, 10).toString()); }}
                className={inputBase}
              />
            </div>
            <div>
              <label className={labelClass}>Saat</label>
              <input type="time" value={time ?? ''} onChange={(e) => setTime(e.target.value || '08:00')} className={inputBase} />
            </div>
          </div>

          {/* Detay bölümü (accordion) */}
          <button
            type="button"
            onClick={() => setShowDetaySection((v) => !v)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${dark ? 'bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300' : 'bg-stone-100 hover:bg-stone-200 text-stone-700'}`}
          >
            <span className="font-medium">Detay (Tekrarlama, öncelik, etiketler…)</span>
            <svg className={`w-5 h-5 transition-transform ${showDetaySection ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

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
                    className={`shrink-0 p-2 rounded-lg ${dark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700'}`}
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
                    className={`shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium ${dark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700'}`}
                  >
                    İndir
                  </a>
                )}
              </div>
            ) : (
              <label className={`flex items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-4 cursor-pointer transition-colors ${dark ? 'border-zinc-600 hover:border-amber-500/40 bg-zinc-900/40' : 'border-stone-200 hover:border-amber-300 bg-stone-50/50'}`}>
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
                  <button key={v} onClick={() => { setRecurrence(v); setShowRecurrenceOptions(false); }} className={`w-full px-4 py-3 text-left border-b last:border-b-0 ${dark ? 'border-zinc-800 hover:bg-zinc-800 text-zinc-200' : 'border-stone-100 hover:bg-amber-50/50 text-stone-800'}`}>{l}</button>
                ))}
                <button onClick={() => { setRecurrence(null); setShowRecurrenceOptions(false); }} className={`w-full px-4 py-3 text-left ${dark ? 'hover:bg-zinc-800 text-zinc-500' : 'hover:bg-amber-50/50 text-stone-500'}`}>Tekrar yok</button>
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
                      className={`w-full px-4 py-3 text-left transition-colors flex items-center gap-3 border-b last:border-b-0 ${dark ? 'border-zinc-800 ' : 'border-stone-100 '}${isSelected ? (dark ? 'bg-amber-500/20' : 'bg-amber-50') : (dark ? 'hover:bg-zinc-800' : 'hover:bg-amber-50/50')}`}
                    >
                      <div className={`w-8 h-8 ${colors.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <span className={`text-sm font-bold ${colors.text}`}>#</span>
                      </div>
                      <div className="flex-1">
                        <div className={dark ? 'font-semibold text-zinc-200' : 'font-semibold text-stone-900'}>{tag.name}</div>
                      </div>
                      {isSelected && (
                        <svg className={`w-5 h-5 flex-shrink-0 ${dark ? 'text-amber-400' : 'text-amber-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                          ? (dark ? 'bg-amber-400/80 border-amber-400/80' : 'bg-amber-500 border-amber-500')
                          : (dark ? 'border-zinc-600 hover:border-zinc-500' : 'border-stone-300 hover:border-amber-400')
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
                  <div className={`mt-3 p-3 rounded-xl border ${dark ? 'bg-zinc-800/60 border-zinc-700' : 'bg-amber-50/80 border-amber-100'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs font-semibold ${dark ? 'text-amber-400/90' : 'text-amber-700'}`}>
                        {subtasks.filter(s => s.completed).length}/{subtasks.length} tamamlandı
                      </span>
                      <span className={`text-xs font-bold ${dark ? 'text-amber-400' : 'text-amber-700'}`}>
                        %{Math.round((subtasks.filter(s => s.completed).length / subtasks.length) * 100)}
                      </span>
                    </div>
                    <div className={`w-full rounded-full h-2 ${dark ? 'bg-zinc-700' : 'bg-amber-200'}`}>
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${dark ? 'bg-amber-400/80' : 'bg-amber-500'}`}
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
                className={`px-4 py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed ${dark ? 'bg-amber-500/90 text-black hover:bg-amber-400' : 'bg-amber-600 text-white hover:bg-amber-700'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>

          </>
          )}

          <button
            onClick={handleSave}
            disabled={!(title ?? '').trim() || (!effectiveCategory && !task)}
            className={`w-full py-4 font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${dark ? 'bg-amber-500/90 text-black hover:bg-amber-400' : 'bg-amber-600 text-white shadow-lg hover:shadow-xl hover:bg-amber-700'}`}
            aria-label={isNewTask ? 'Görevi oluştur' : 'Değişiklikleri kaydet'}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>{isNewTask ? 'Görevi Oluştur' : 'Değişiklikleri Kaydet'}</span>
          </button>
          {isNewTask && !effectiveCategory && (
            <p className={`text-center text-sm mt-2 ${dark ? 'text-amber-400/90' : 'text-amber-700'}`}>Görevi kaydetmek için yukarıdan <strong>Liste</strong> seçin.</p>
          )}

          {/* Silme Butonu - sadece mevcut görevlerde göster */}
          <button
              type="button"
              onClick={() => { setTemplateName(title.trim() || ''); setShowSaveAsTemplate(true); }}
              className={`w-full py-3 font-medium rounded-xl transition-all flex items-center justify-center gap-2 ${dark ? 'bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700' : 'bg-stone-100 border border-stone-200 text-stone-700 hover:bg-stone-200'}`}
            >
              <span>📋 Şablon olarak kaydet</span>
            </button>

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
                <button key={t.id} onClick={() => applyTemplate(t)} className={`w-full text-left px-4 py-3 rounded-xl mb-1 ${dark ? 'hover:bg-zinc-800 text-zinc-100' : 'hover:bg-amber-50 text-stone-900'}`}>
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
            <button onClick={handleSaveAsTemplate} className="flex-1 py-3 rounded-xl font-medium bg-amber-500 text-black hover:bg-amber-400">Kaydet</button>
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
                  <div className="w-9 h-9 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
