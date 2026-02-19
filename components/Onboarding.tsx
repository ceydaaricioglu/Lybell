'use client';

interface OnboardingStep1Props {
  onNext: () => void;
  onSkip: () => void;
  selectedFocus: string | null;
  setSelectedFocus: (focus: string) => void;
  darkMode?: boolean;
}

export function OnboardingStep1({ onNext, onSkip, selectedFocus, setSelectedFocus, darkMode = false }: OnboardingStep1Props) {
  const dark = darkMode;
  const options = [
    { icon: '📚', label: 'Okuma Listesi', value: 'reading' },
    { icon: '🏃', label: 'Günlük Rutinler', value: 'routines' },
    { icon: '💼', label: 'İş Görevleri', value: 'work' },
    { icon: '🎯', label: 'Kişisel Hedefler', value: 'goals' },
  ];
  return (
    <div className={`min-h-screen flex flex-col ${dark ? 'bg-[#0f0f0f] text-zinc-100' : 'bg-[#f5f0ea] text-stone-800'}`}>
      <div className={`border-b px-5 py-4 ${dark ? 'border-zinc-800' : 'border-stone-200'}`}>
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm font-medium ${dark ? 'text-zinc-500' : 'text-stone-500'}`}>Adım 1 / 2</span>
            <span className={`text-sm font-medium ${dark ? 'text-amber-400' : 'text-amber-600'}`}>50%</span>
          </div>
          <div className={`w-full rounded-full h-1.5 ${dark ? 'bg-zinc-700' : 'bg-stone-200'}`}>
            <div className="bg-amber-500 h-1.5 rounded-full transition-all duration-300" style={{ width: '50%' }} />
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-md mx-auto w-full px-5 pt-10 pb-8">
        {dark && <div className="h-px w-12 bg-amber-400/80 mb-5" />}
        <h2 className={`text-2xl font-semibold mb-2 ${dark ? 'text-white' : 'text-stone-900'}`}>Odak alanını seç</h2>
        <p className={`text-sm mb-6 ${dark ? 'text-zinc-500' : 'text-stone-500'}`}>İlk olarak neyi organize etmek istersin?</p>

        <div className="space-y-3 mb-8">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setSelectedFocus(option.value)}
              className={`w-full p-4 rounded-2xl border-2 transition-all text-left flex items-center gap-4 ${
                selectedFocus === option.value
                  ? dark
                    ? 'border-amber-500 bg-amber-500/10'
                    : 'border-amber-500 bg-amber-50/80'
                  : dark
                    ? 'border-zinc-700 bg-zinc-900/60 hover:border-zinc-600'
                    : 'border-stone-100 bg-white shadow-[0_4px_24px_-4px_rgba(0,0,0,0.06)] hover:border-amber-200'
              }`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${dark ? 'bg-zinc-700' : 'bg-stone-100'}`}>
                {option.icon}
              </div>
              <span className={`font-semibold ${dark ? 'text-zinc-100' : 'text-stone-900'}`}>{option.label}</span>
              {selectedFocus === option.value && (
                <span className={`ml-auto w-6 h-6 rounded-full flex items-center justify-center ${dark ? 'bg-amber-500/30 text-amber-400' : 'bg-amber-100 text-amber-600'}`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </span>
              )}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onNext}
          disabled={!selectedFocus}
          className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
        >
          Devam Et
        </button>
        <button
          type="button"
          onClick={onSkip}
          className={`w-full mt-4 py-3 font-medium rounded-xl transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 ${dark ? 'text-zinc-400 hover:text-zinc-200' : 'text-stone-500 hover:text-stone-700'}`}
        >
          Atla
        </button>
      </div>
    </div>
  );
}

interface OnboardingStep2Props {
  onComplete: () => void;
  onBack: () => void;
  onSkip: () => void;
  selectedSchedule: string | null;
  setSelectedSchedule: (schedule: string) => void;
  darkMode?: boolean;
}

export function OnboardingStep2({ onComplete, onBack, onSkip, selectedSchedule, setSelectedSchedule, darkMode = false }: OnboardingStep2Props) {
  const dark = darkMode;
  const options = [
    { icon: '🌅', label: 'Sabah İnsanı', value: 'morning' },
    { icon: '🌆', label: 'Akşam Plancısı', value: 'evening' },
    { icon: '🌙', label: 'Esnek', value: 'flexible' },
  ];
  return (
    <div className={`min-h-screen flex flex-col ${dark ? 'bg-[#0f0f0f] text-zinc-100' : 'bg-[#f5f0ea] text-stone-800'}`}>
      <div className={`border-b px-5 py-4 ${dark ? 'border-zinc-800' : 'border-stone-200'}`}>
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm font-medium ${dark ? 'text-zinc-500' : 'text-stone-500'}`}>Adım 2 / 2</span>
            <span className={`text-sm font-medium ${dark ? 'text-amber-400' : 'text-amber-600'}`}>100%</span>
          </div>
          <div className={`w-full rounded-full h-1.5 ${dark ? 'bg-zinc-700' : 'bg-stone-200'}`}>
            <div className="bg-amber-500 h-1.5 rounded-full transition-all duration-300" style={{ width: '100%' }} />
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-md mx-auto w-full px-5 pt-10 pb-8">
        {dark && <div className="h-px w-12 bg-amber-400/80 mb-5" />}
        <h2 className={`text-2xl font-semibold mb-2 ${dark ? 'text-white' : 'text-stone-900'}`}>Programını ayarla</h2>
        <p className={`text-sm mb-6 ${dark ? 'text-zinc-500' : 'text-stone-500'}`}>Gününü planlamayı ne zaman tercih edersin?</p>

        <div className="space-y-3 mb-8">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setSelectedSchedule(option.value)}
              className={`w-full p-4 rounded-2xl border-2 transition-all text-left flex items-center gap-4 ${
                selectedSchedule === option.value
                  ? dark
                    ? 'border-amber-500 bg-amber-500/10'
                    : 'border-amber-500 bg-amber-50/80'
                  : dark
                    ? 'border-zinc-700 bg-zinc-900/60 hover:border-zinc-600'
                    : 'border-stone-100 bg-white shadow-[0_4px_24px_-4px_rgba(0,0,0,0.06)] hover:border-amber-200'
              }`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${dark ? 'bg-zinc-700' : 'bg-stone-100'}`}>
                {option.icon}
              </div>
              <span className={`font-semibold ${dark ? 'text-zinc-100' : 'text-stone-900'}`}>{option.label}</span>
              {selectedSchedule === option.value && (
                <span className={`ml-auto w-6 h-6 rounded-full flex items-center justify-center ${dark ? 'bg-amber-500/30 text-amber-400' : 'bg-amber-100 text-amber-600'}`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onBack}
            className={`flex-1 py-3.5 rounded-xl font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 ${
              dark
                ? 'border border-zinc-600 text-zinc-300 hover:bg-zinc-800'
                : 'border-2 border-stone-200 text-amber-600 hover:bg-amber-50'
            }`}
          >
            Geri
          </button>
          <button
            type="button"
            onClick={onComplete}
            disabled={!selectedSchedule}
            className="flex-1 py-3.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
          >
            Kurulumu Tamamla
          </button>
        </div>
        <button
          type="button"
          onClick={onSkip}
          className={`w-full mt-4 py-3 font-medium rounded-xl transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 ${dark ? 'text-zinc-400 hover:text-zinc-200' : 'text-stone-500 hover:text-stone-700'}`}
        >
          Atla
        </button>
      </div>
    </div>
  );
}
