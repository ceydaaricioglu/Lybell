'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocale } from '@/components/LocaleContext';
import { useToast } from '@/components/Toast';

interface NoteEditorPlaceholderViewProps {
  darkMode?: boolean;
  onBack: () => void;
  onSave?: (input: {
    title: string | null;
    content: string;
    transcript: string | null;
    audioUrl: string | null;
  }) => Promise<void> | void;
  initialTitle?: string | null;
  initialContent?: string | null;
  initialTranscript?: string | null;
  initialAudioUrl?: string | null;
}

export default function NoteEditorPlaceholderView({
  darkMode = false,
  onBack,
  onSave,
  initialTitle,
  initialContent,
  initialTranscript,
  initialAudioUrl,
}: NoteEditorPlaceholderViewProps) {
  const dark = darkMode;
  const pageBg = dark ? '#0f172a' : '#F8FAFC';
  const cardBg = dark ? '#1A2332' : '#ffffff';
  const border = dark ? '#2a1f1a' : '#e5e7eb';
  const PRIMARY = '#1A2332';

  const { locale } = useLocale();
  const { showToast } = useToast();

  const [title, setTitle] = useState(initialTitle ?? '');
  const [content, setContent] = useState(initialContent ?? '');
  const [audioUrl, setAudioUrl] = useState<string | null>(initialAudioUrl ?? null);
  const [listening, setListening] = useState<'dictation' | 'record' | null>(null);
  const [saving, setSaving] = useState(false);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recorderChunksRef = useRef<BlobPart[]>([]);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);

  const SpeechRecognitionAPI = useMemo(() => {
    if (typeof window === 'undefined') return null;
    const w = window as any;
    return w.SpeechRecognition || w.webkitSpeechRecognition || null;
  }, []);

  const startSpeechToText = (mode: 'dictation' | 'record') => {
    if (!SpeechRecognitionAPI) {
      showToast(locale === 'tr' ? 'Tarayıcınız ses tanımayı desteklemiyor.' : 'Speech recognition not supported.', 'error');
      return;
    }
    if (listening) {
      try {
        recognitionRef.current?.stop();
      } catch {
        // noop
      }
      setListening(null);
      return;
    }

    const recognition = new SpeechRecognitionAPI() as SpeechRecognition;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = locale === 'tr' ? 'tr-TR' : 'en-US';

    recognition.onresult = (e: SpeechRecognitionEvent) => {
      const transcript = Array.from(e.results)
        .map((r) => r[0]?.transcript ?? '')
        .join(' ')
        .trim();
      if (!transcript) return;

      setContent((prev) => (prev ? `${prev} ${transcript}` : transcript));
      // Başlık boşsa içerikten küçük bir özet türet
      setTitle((prev) => (prev.trim() ? prev : transcript.slice(0, 40)));
    };

    recognition.onend = () => setListening(null);
    recognition.onerror = () => {
      setListening(null);
      showToast(locale === 'tr' ? 'Ses algılanamadı.' : 'Speech not detected.', 'error');
    };

    recognitionRef.current = recognition;
    setListening(mode);
    recognition.start();
  };

  const canSave = (title.trim().length > 0 || content.trim().length > 0) && !saving;

  const handleSave = async () => {
    if (!onSave) return onBack();
    if (!canSave) return;
    setSaving(true);
    try {
      const t = title.trim() || null;
      const c = content.trim() || (t ?? '');
      await onSave({
        title: t,
        content: c,
        transcript: content.trim() ? c : null,
        audioUrl,
      });
      onBack();
    } catch {
      showToast(locale === 'tr' ? 'Not kaydedilemedi.' : 'Failed to save note.', 'error');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    setTitle(initialTitle ?? '');
    setContent(initialContent ?? '');
    setAudioUrl(initialAudioUrl ?? null);
  }, [initialTitle, initialContent, initialAudioUrl]);

  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recorderChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size) recorderChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(recorderChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onload = () => {
          const data = reader.result as string;
          const MAX = 500 * 1024;
          if (data.length > MAX) {
            showToast(locale === 'tr' ? 'Ses kaydı çok uzun (max ~500KB).' : 'Audio too long (max ~500KB).', 'error');
            return;
          }
          setAudioUrl(data);
        };
        reader.readAsDataURL(blob);
        recorderRef.current = null;
        setIsRecordingAudio(false);
      };

      recorder.start();
      setIsRecordingAudio(true);
    } catch {
      showToast(locale === 'tr' ? 'Mikrofon erişimi gerekli.' : 'Microphone permission required.', 'error');
    }
  };

  const stopAudioRecording = () => {
    const r = recorderRef.current;
    if (r && r.state !== 'inactive') r.stop();
    recorderRef.current = null;
    setIsRecordingAudio(false);
  };

  const toggleAudioRecording = () => {
    if (isRecordingAudio) stopAudioRecording();
    else void startAudioRecording();
  };

  return (
    <div className="flex flex-col flex-1 min-h-screen overflow-auto" style={{ backgroundColor: pageBg }}>
      <div className="relative mx-auto w-full max-w-md flex-1 flex flex-col bg-transparent">
        <header className="flex items-center gap-3 px-4 pt-10 pb-4 border-b border-slate-100 bg-white/95 backdrop-blur-md z-10">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-600"
            aria-label="Geri"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Yeni Not</h1>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.14em]">
              Şimdilik placeholder
            </p>
          </div>
        </header>

        <main className="flex-1 px-5 py-6 space-y-4">
          <section
            className="rounded-2xl border p-4 space-y-3"
            style={{ backgroundColor: cardBg, borderColor: border, borderWidth: 1, borderStyle: 'solid' }}
          >
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-[0.16em]">Başlık</label>
              <input
                className="mt-2 w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none"
                placeholder="Örn. Yarınki plan"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-[0.16em]">İçerik</label>
              <textarea
                className="mt-2 w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none resize-none min-h-36"
                placeholder="Not yaz..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                className="flex-1 py-3 rounded-xl text-sm font-bold"
                style={{ backgroundColor: PRIMARY, color: '#fff' }}
                onClick={() => startSpeechToText('dictation')}
                aria-pressed={listening === 'dictation'}
              >
                {listening === 'dictation' ? 'Dinleniyor...' : 'Sesle yazıya dök'}
              </button>
              <button
                type="button"
                className="flex-1 py-3 rounded-xl text-sm font-bold border"
                style={{ borderColor: border, color: PRIMARY }}
                onClick={toggleAudioRecording}
                aria-pressed={isRecordingAudio}
              >
                {isRecordingAudio ? 'Kayıt sürüyor...' : 'Ses kaydı'}
              </button>
            </div>

            {audioUrl && (
              <div className="pt-2">
                <div className="flex items-center justify-between gap-2 rounded-xl px-4 py-3" style={{ backgroundColor: dark ? 'rgba(15,23,42,0.25)' : '#f8fafc', border: `1px solid ${border}` }}>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="material-symbols-outlined text-[#1A2332]" style={{ fontSize: 18 }}>
                      mic
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">Ses kaydı hazır</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">Not içinde saklanacak</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAudioUrl(null)}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium"
                    style={{ backgroundColor: '#fee2e2', color: '#991b1b' }}
                  >
                    Sil
                  </button>
                </div>
              </div>
            )}
          </section>

          <div className="flex gap-2">
            <button
              type="button"
              className="flex-1 py-3 rounded-xl text-sm font-bold"
              style={{ backgroundColor: '#f1f5f9', color: PRIMARY }}
              onClick={onBack}
            >
              Vazgeç
            </button>
            <button
              type="button"
              className="flex-1 py-3 rounded-xl text-sm font-bold"
              style={{ backgroundColor: PRIMARY, color: '#fff' }}
              onClick={handleSave}
              disabled={!canSave}
            >
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}

