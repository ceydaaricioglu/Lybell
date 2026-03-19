'use client';

import { useLocale } from '@/components/LocaleContext';

interface FirstTaskPromptViewProps {
  onCreateFirstTask: () => void;
  onLater: () => void;
}

export default function FirstTaskPromptView({ onCreateFirstTask, onLater }: FirstTaskPromptViewProps) {
  const { locale } = useLocale();

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-auto bg-[#F8FAFC]">
      <div className="max-w-md mx-auto w-full px-6 py-10">
        <div className="rounded-3xl border border-slate-100 bg-white shadow-sm p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#1A2332] text-white flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined">add_task</span>
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-slate-900">
                {locale === 'tr' ? 'İlk görevinizi ekleyin' : 'Add your first task'}
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                {locale === 'tr' ? 'Başlamak için tek bir görev yeter.' : 'One task is all you need to start.'}
              </p>
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            <button
              type="button"
              onClick={onCreateFirstTask}
              className="flex-1 py-3.5 px-4 rounded-2xl text-white font-semibold shadow-lg transition-colors"
              style={{ backgroundColor: '#1A2332' }}
            >
              {locale === 'tr' ? 'Şimdi oluştur' : 'Create now'}
            </button>
            <button
              type="button"
              onClick={onLater}
              className="flex-1 py-3.5 px-4 rounded-2xl text-slate-600 font-semibold border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              {locale === 'tr' ? 'Daha sonra' : 'Maybe later'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

