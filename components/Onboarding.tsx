'use client';

interface OnboardingStep1Props {
  onNext: () => void;
  onSkip: () => void;
  darkMode?: boolean;
}

/** Hoş geldin – tek değer önerisi, Devam ile 2. ekrana */
export function OnboardingStep1({ onNext, onSkip, darkMode = false }: OnboardingStep1Props) {
  const dark = darkMode;
  return (
    <div className={`min-h-screen flex flex-col ${dark ? 'bg-[#0f0f0f] text-zinc-100' : 'bg-[#f5f0ea] text-stone-800'}`}>
      <div className={`border-b px-5 py-4 ${dark ? 'border-zinc-800' : 'border-stone-200'}`}>
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm font-medium ${dark ? 'text-zinc-500' : 'text-stone-500'}`}>1 / 2</span>
          </div>
          <div className={`w-full rounded-full h-1.5 ${dark ? 'bg-zinc-700' : 'bg-stone-200'}`}>
            <div className="bg-amber-500 h-1.5 rounded-full transition-all duration-300" style={{ width: '50%' }} />
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-md mx-auto w-full px-5 pt-6 pb-4 flex flex-col justify-center">
        {/* 3D illüstrasyon – pano / görev teması */}
        <div className="flex justify-center mb-8" aria-hidden>
          <img
            src="/images/onboarding-welcome.png"
            alt=""
            width={240}
            height={160}
            className="w-full max-w-[240px] h-auto object-contain"
          />
        </div>
        {dark && <div className="h-px w-12 bg-amber-400/80 mb-6" />}
        <h2 className={`text-2xl font-semibold mb-3 ${dark ? 'text-white' : 'text-stone-900'}`}>
          Hoş geldin
        </h2>
        <p className={`text-base mb-8 ${dark ? 'text-zinc-400' : 'text-stone-600'}`}>
          Görevlerini topla, gününü planla. Hepsini tek yerden yönet.
        </p>

        <button
          type="button"
          onClick={onNext}
          className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
        >
          Devam
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
  darkMode?: boolean;
}

/** Fayda özeti + Başla butonu */
export function OnboardingStep2({ onComplete, onBack, onSkip, darkMode = false }: OnboardingStep2Props) {
  const dark = darkMode;
  const benefits = [
    { icon: '✓', text: 'Görevlerinizi tek yerde toplayın, tarih ve saate göre planlayın.' },
    { icon: '📅', text: 'Takvim görünümüyle planınızı takip edin; tekrarlayan görevler tanımlayın.' },
    { icon: '🎯', text: 'Listeler ve kategorilerle düzenleyin; hedeflerinize odaklanın.' },
  ];
  return (
    <div className={`min-h-screen flex flex-col ${dark ? 'bg-[#0f0f0f] text-zinc-100' : 'bg-[#f5f0ea] text-stone-800'}`}>
      <div className={`border-b px-5 py-4 ${dark ? 'border-zinc-800' : 'border-stone-200'}`}>
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm font-medium ${dark ? 'text-zinc-500' : 'text-stone-500'}`}>2 / 2</span>
          </div>
          <div className={`w-full rounded-full h-1.5 ${dark ? 'bg-zinc-700' : 'bg-stone-200'}`}>
            <div className="bg-amber-500 h-1.5 rounded-full transition-all duration-300" style={{ width: '100%' }} />
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-md mx-auto w-full px-5 pt-8 pb-4">
        {dark && <div className="h-px w-12 bg-amber-400/80 mb-6" />}
        <h2 className={`text-2xl font-semibold mb-2 ${dark ? 'text-white' : 'text-stone-900'}`}>
          Hemen başla
        </h2>
        <p className={`text-sm mb-6 ${dark ? 'text-zinc-500' : 'text-stone-500'}`}>
          Öne çıkan özellikler:
        </p>

        <ul className="space-y-4 mb-8">
          {benefits.map((item, i) => (
            <li key={i} className={`flex items-center gap-3 ${dark ? 'text-zinc-300' : 'text-stone-700'}`}>
              <span className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-lg ${dark ? 'bg-zinc-800' : 'bg-stone-100'}`}>
                {item.icon}
              </span>
              <span>{item.text}</span>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={onComplete}
          className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
        >
          Başla
        </button>
        <div className="flex gap-3 mt-4">
          <button
            type="button"
            onClick={onBack}
            className={`flex-1 py-3 rounded-xl font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 ${
              dark
                ? 'border border-zinc-600 text-zinc-300 hover:bg-zinc-800'
                : 'border-2 border-stone-200 text-stone-600 hover:bg-stone-50'
            }`}
          >
            Geri
          </button>
          <button
            type="button"
            onClick={onSkip}
            className={`flex-1 py-3 font-medium rounded-xl transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 ${dark ? 'text-zinc-400 hover:text-zinc-200' : 'text-stone-500 hover:text-stone-700'}`}
          >
            Atla
          </button>
        </div>
      </div>
    </div>
  );
}
