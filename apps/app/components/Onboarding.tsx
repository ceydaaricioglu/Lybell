'use client';

interface OnboardingStep1Props {
  onNext: () => void;
  onSkip: () => void;
  darkMode?: boolean;
}

const ONBOARDING_PRIMARY = '#F5871F';
const ONBOARDING_BG_LIGHT = '#FDFBF7';
const ONBOARDING_BG_DARK = '#221610';

/** Hoş geldin – Nudge tanıtımı, Devam ile 2. ekrana */
export function OnboardingStep1({ onNext, onSkip, darkMode = false }: OnboardingStep1Props) {
  const dark = darkMode;
  return (
    <div
      className="relative flex min-h-screen w-full flex-col justify-between overflow-hidden font-display"
      style={{ backgroundColor: dark ? ONBOARDING_BG_DARK : ONBOARDING_BG_LIGHT }}
    >
      <div className="flex flex-1 flex-col px-8 pt-20 pb-12">
        {/* Top App Bar / Brand Header */}
        <div className="flex items-center justify-center">
          <h2 className="text-sm font-bold uppercase tracking-[0.2em]" style={{ color: ONBOARDING_PRIMARY }}>
            Nudge
          </h2>
        </div>

        {/* Main Visual Content */}
        <div className="flex flex-grow flex-col items-center justify-center space-y-12">
          {/* Illustration Container */}
          <div className="relative flex h-64 w-64 items-center justify-center rounded-full" style={{ backgroundColor: `${ONBOARDING_PRIMARY}0D` }}>
            <div className="absolute inset-0 rounded-full opacity-30 blur-3xl" style={{ backgroundColor: `${ONBOARDING_PRIMARY}1A` }} />
            <span
              className="material-symbols-outlined font-light"
              style={{ fontSize: '120px', color: ONBOARDING_PRIMARY, fontVariationSettings: "'wght' 200, 'opsz' 48" }}
              aria-hidden
            >
              wb_sunny
            </span>
          </div>
          {/* Typography */}
          <div className="max-w-xs space-y-4 text-center">
            <h1 className="text-3xl font-semibold leading-tight tracking-tight" style={{ color: dark ? '#f5f0ea' : '#1a1a1a' }}>
              Küçük bir dokunuş, büyük bir fark.
            </h1>
            <p className={`text-base font-normal leading-relaxed opacity-80 ${dark ? 'text-slate-400' : 'text-slate-600'}`}>
              Karmaşadan kurtulun, odağınızı geri kazanın. Nudge ile gününüzü nazikçe planlayın.
            </p>
          </div>
        </div>

        {/* Footer: indicators + CTA */}
        <div className="flex flex-col items-center gap-8">
          <div className="flex flex-row items-center justify-center gap-2">
            <div className="h-1.5 w-6 rounded-full" style={{ backgroundColor: ONBOARDING_PRIMARY }} />
            <div className="h-1.5 w-1.5 rounded-full opacity-20" style={{ backgroundColor: ONBOARDING_PRIMARY }} />
            <div className="h-1.5 w-1.5 rounded-full opacity-20" style={{ backgroundColor: ONBOARDING_PRIMARY }} />
          </div>
          <button
            type="button"
            onClick={onNext}
            className="w-full rounded-xl py-4 font-semibold text-white shadow-lg transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ backgroundColor: ONBOARDING_PRIMARY, boxShadow: `0 10px 24px ${ONBOARDING_PRIMARY}33` }}
          >
            Devam
          </button>
          <button type="button" onClick={onSkip} className={`text-sm font-medium ${dark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-500 hover:text-slate-700'}`}>
            Atla
          </button>
        </div>
      </div>

      {/* Decorative blur circles */}
      <div className="pointer-events-none absolute top-0 right-0 -z-10 h-64 w-64 rounded-full blur-[100px]" style={{ backgroundColor: `${ONBOARDING_PRIMARY}0D` }} />
      <div className="pointer-events-none absolute bottom-0 left-0 -z-10 h-80 w-80 rounded-full blur-[120px]" style={{ backgroundColor: `${ONBOARDING_PRIMARY}0D` }} />
    </div>
  );
}

interface OnboardingStep2Props {
  onComplete: () => void;
  onBack: () => void;
  onSkip: () => void;
  darkMode?: boolean;
}

const ONBOARDING2_PRIMARY = '#2463eb';

/** Sizin temponuz – floating ikonlar + Başla */
export function OnboardingStep2({ onComplete, onBack, onSkip, darkMode = false }: OnboardingStep2Props) {
  const dark = darkMode;
  const floatingClass = 'flex items-center justify-center rounded-2xl shadow-lg drop-shadow-[0_10px_15px_rgba(0,0,0,0.05)]';
  return (
    <div
      className="relative flex min-h-screen w-full max-w-md mx-auto flex-col overflow-hidden antialiased font-display"
      style={{ backgroundColor: dark ? ONBOARDING_BG_DARK : ONBOARDING_BG_LIGHT }}
    >
      {/* Top Safe Area / Header */}
      <div className="flex items-center justify-between px-6 pt-20">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center justify-center rounded-full p-2 text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          aria-label="Geri"
        >
          <span className="material-symbols-outlined text-[24px]">arrow_back</span>
        </button>
        <div className="text-sm font-semibold uppercase tracking-widest opacity-40 text-slate-600 dark:text-slate-400">Nudge</div>
        <div className="w-10" aria-hidden />
      </div>

      {/* Visual + Text */}
      <div className="flex flex-1 flex-col items-center justify-center px-8 py-12 relative">
        <div className="relative w-full aspect-square flex items-center justify-center">
          {/* Center */}
          <div className={`z-10 flex h-32 w-32 items-center justify-center rounded-3xl shadow-xl ${dark ? 'bg-slate-800' : 'bg-white'} ${floatingClass}`}>
            <span className="material-symbols-outlined text-5xl" style={{ color: ONBOARDING2_PRIMARY }}>task_alt</span>
          </div>
          {/* Floating: Coffee */}
          <div className={`absolute top-[10%] left-[15%] flex h-16 w-16 items-center justify-center backdrop-blur-sm ${dark ? 'bg-slate-800/80' : 'bg-white/80'} ${floatingClass}`}>
            <span className="material-symbols-outlined text-3xl text-orange-400">coffee</span>
          </div>
          {/* Floating: Pets */}
          <div className={`absolute bottom-[20%] right-[10%] flex h-20 w-20 items-center justify-center backdrop-blur-sm ${dark ? 'bg-slate-800/80' : 'bg-white/80'} ${floatingClass}`}>
            <span className="material-symbols-outlined text-4xl text-indigo-400">pets</span>
          </div>
          {/* Floating: Fitness */}
          <div className={`absolute top-[25%] right-[15%] flex h-14 w-14 items-center justify-center backdrop-blur-sm ${dark ? 'bg-slate-800/80' : 'bg-white/80'} ${floatingClass}`}>
            <span className="material-symbols-outlined text-2xl text-emerald-400">fitness_center</span>
          </div>
          {/* Floating: Reading */}
          <div className={`absolute bottom-[15%] left-[20%] flex h-12 w-12 items-center justify-center backdrop-blur-sm ${dark ? 'bg-slate-800/80' : 'bg-white/80'} ${floatingClass}`}>
            <span className="material-symbols-outlined text-2xl text-rose-400">auto_stories</span>
          </div>
          <div className="absolute inset-0 -z-10 scale-90 rounded-full blur-3xl opacity-80" style={{ backgroundColor: `${ONBOARDING2_PRIMARY}14` }} />
        </div>

        <div className="mt-12 space-y-4 text-center">
          <h1 className="text-3xl font-bold leading-tight tracking-tight" style={{ color: dark ? '#f5f0ea' : '#1a1a1a' }}>
            Sizin temponuz, <br />sizin kurallarınız.
          </h1>
          <p className={`mx-auto max-w-[280px] text-base leading-relaxed ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
            Rutinlerinizi oluşturun, hedeflerinizi belirleyin ve her adımda başarınızı kutlayın.
          </p>
        </div>

        {/* Pagination */}
        <div className="mt-8 flex w-full flex-row items-center justify-center gap-2">
          <div className={`h-1.5 w-4 rounded-full ${dark ? 'bg-slate-700' : 'bg-slate-200'}`} />
          <div className="h-1.5 w-8 rounded-full" style={{ backgroundColor: ONBOARDING2_PRIMARY }} />
          <div className={`h-1.5 w-4 rounded-full ${dark ? 'bg-slate-700' : 'bg-slate-200'}`} />
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-col gap-3 px-6 pb-12">
        <button
          type="button"
          onClick={onComplete}
          className="w-full rounded-xl py-4 font-semibold text-white shadow-lg transition-all hover:opacity-90"
          style={{ backgroundColor: ONBOARDING2_PRIMARY, boxShadow: `0 10px 24px ${ONBOARDING2_PRIMARY}40` }}
        >
          Başla
        </button>
        <button
          type="button"
          onClick={onBack}
          className={`w-full rounded-xl py-3 font-medium transition-all ${dark ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-100'}`}
        >
          Geri
        </button>
        <button type="button" onClick={onSkip} className={`text-sm font-medium ${dark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-500 hover:text-slate-600'}`}>
          Atla
        </button>
      </div>
    </div>
  );
}
