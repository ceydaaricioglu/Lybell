'use client';

interface OnboardingStep1Props {
  onNext: () => void;
  onSkip: () => void;
  darkMode?: boolean;
}

/** 1. ekran – Odak/Enerji/Gelişim/Denge kartları (sadece açık tema) */
export function OnboardingStep1({ onNext, onSkip }: OnboardingStep1Props) {
  return (
    <div
      className="onboarding-reset relative flex min-h-screen w-full flex-col max-w-md mx-auto px-6 pt-4 pb-2 font-display antialiased"
      style={{ backgroundColor: '#F8FAFC', color: '#020617' }}
    >
      {/* Üst: Atla */}
      <div className="w-full flex justify-end mb-3">
        <button
          type="button"
          onClick={onSkip}
          className="text-slate-500 font-medium text-sm hover:text-primary transition-colors"
        >
          Atla
        </button>
      </div>

      {/* Orta: kartlar + metin (ekrana göre ortalanır) */}
      <div className="flex-1 flex flex-col items-center justify-center w-full">
        <div className="grid grid-cols-2 gap-4 p-3 mb-4 mt-3">
          {/* Odak */}
          <div className="flex flex-col items-center justify-center aspect-square w-28 h-28 bg-white rounded-2xl shadow-sm border border-slate-100">
            <span className="material-symbols-outlined text-4xl" style={{ color: '#020617' }}>
              local_cafe
            </span>
            <span className="mt-2 text-xs font-medium text-slate-400 uppercase tracking-widest">ODAK</span>
          </div>
          {/* Enerji */}
          <div
            className="flex flex-col items-center justify-center aspect-square w-28 h-28 rounded-2xl shadow-lg"
            style={{ backgroundColor: '#020617' }}
          >
            <span className="material-symbols-outlined text-4xl text-white">
              fitness_center
            </span>
            <span className="mt-2 text-xs font-medium text-slate-200 uppercase tracking-widest">ENERJİ</span>
          </div>
          {/* Gelişim */}
          <div className="flex flex-col items-center justify-center aspect-square w-28 h-28 bg-white rounded-2xl shadow-sm border border-slate-100">
            <span className="material-symbols-outlined text-4xl" style={{ color: '#020617' }}>
              menu_book
            </span>
            <span className="mt-2 text-xs font-medium text-slate-400 uppercase tracking-widest">GELİŞİM</span>
          </div>
          {/* Denge */}
          <div className="flex flex-col items-center justify-center aspect-square w-28 h-28 bg-white rounded-2xl shadow-sm border border-slate-100">
            <span className="material-symbols-outlined text-4xl" style={{ color: '#020617' }}>
              pets
            </span>
            <span className="mt-2 text-xs font-medium text-slate-400 uppercase tracking-widest">DENGE</span>
          </div>
        </div>

        <div className="text-center px-4 mt-1">
          <h3
            className="tracking-tight text-2xl font-bold leading-tight pb-3"
            style={{ color: '#020617' }}
          >
            Sizin temponuz, sizin kurallarınız.
          </h3>
          <p className="text-sm font-normal leading-relaxed" style={{ color: '#4b5563' }}>
            Rutinlerinizi oluşturun, hedeflerinizi belirleyin ve her adımda başarınızı kutlayın.
          </p>
        </div>
      </div>

      {/* Alt: İndikatör + buton */}
      <div className="w-full flex flex-col gap-2.5 mt-6 pb-2">
        <div className="flex justify-center gap-2">
          <div className="h-1.5 w-8 rounded-full" style={{ backgroundColor: '#020617' }} />
          <div className="h-1.5 w-2 rounded-full bg-slate-300" />
          <div className="h-1.5 w-2 rounded-full bg-slate-300" />
        </div>
        <div className="flex w-full">
          <button
            type="button"
            onClick={onNext}
            className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl h-14 px-5 text-lg font-bold leading-normal tracking-wide transition-all active:scale-95 shadow-lg"
            style={{ backgroundColor: '#020617', color: '#ffffff', boxShadow: '0 10px 24px rgba(15,23,42,0.25)' }}
          >
            <span className="truncate">Başla</span>
          </button>
        </div>
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

/** 2. ekran – planlama illüstrasyonu + Devam (sadece açık tema) */
export function OnboardingStep2({ onComplete, onBack, onSkip }: OnboardingStep2Props) {
  return (
    <div
      className="onboarding-reset relative flex min-h-screen w-full flex-col items-center justify-start overflow-x-hidden font-display antialiased max-w-md mx-auto pb-4"
      style={{ backgroundColor: '#F8FAFC', color: '#020617' }}
    >
      {/* Top Navigation */}
      <div className="flex w-full items-center justify-between p-6">
        <div className="w-10" />
        <button
          type="button"
          onClick={onSkip}
          className="text-slate-500 hover:text-primary transition-colors font-medium"
        >
          Atla
        </button>
      </div>

      {/* Orta içerik: illüstrasyon + metin (ekrana göre ortalanır) */}
      <div className="flex-1 flex flex-col items-center px-6 w-full max-w-md justify-center">
        <div className="w-full aspect-square flex items-center justify-center relative mb-8">
          {/* Background circle */}
          <div
            className="absolute inset-0 rounded-full scale-90"
            style={{ backgroundColor: 'rgba(30,41,59,0.05)' }}
          />

          <div className="relative w-72 h-72">
            {/* Main Card */}
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-60 rounded-2xl shadow-2xl flex flex-col p-4 gap-3 z-10"
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                boxShadow: '0 25px 50px rgba(15,23,42,0.12)',
              }}
            >
              <div
                className="w-full h-8 rounded-lg flex items-center px-2"
                style={{ backgroundColor: '#f8fafc' }}
              >
                <div
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: 'rgba(30,41,59,0.2)' }}
                />
                <div
                  className="w-16 h-2 rounded-full"
                  style={{ backgroundColor: '#e5e7eb' }}
                />
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded border"
                    style={{ borderColor: 'rgba(30,41,59,0.3)' }}
                  />
                  <div
                    className="w-24 h-2 rounded-full"
                    style={{ backgroundColor: '#f1f5f9' }}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded flex items-center justify-center"
                    style={{ backgroundColor: '#1e293b' }}
                  >
                    <span className="material-symbols-outlined text-[10px] text-white font-bold">
                      check
                    </span>
                  </div>
                  <div
                    className="w-20 h-2 rounded-full"
                    style={{ backgroundColor: '#f1f5f9' }}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded border"
                    style={{ borderColor: 'rgba(30,41,59,0.3)' }}
                  />
                  <div
                    className="w-28 h-2 rounded-full"
                    style={{ backgroundColor: '#f1f5f9' }}
                  />
                </div>
              </div>
              <div
                className="mt-auto pt-2 flex justify-between items-center"
                style={{ borderTop: '1px solid #f9fafb' }}
              >
                <div
                  className="w-8 h-8 rounded-full"
                  style={{ backgroundColor: '#f1f5f9' }}
                />
                <div
                  className="w-12 h-6 rounded-lg"
                  style={{ backgroundColor: 'rgba(30,41,59,0.08)' }}
                />
              </div>
            </div>

            {/* Target icon */}
            <div
              className="absolute -top-4 -right-4 w-20 h-20 rounded-2xl shadow-xl flex items-center justify-center z-20 transform rotate-6"
              style={{
                backgroundColor: '#1e293b',
                color: '#ffffff',
                boxShadow: '0 20px 40px rgba(15,23,42,0.4)',
              }}
            >
              <span className="material-symbols-outlined text-4xl">target</span>
            </div>

            {/* Calendar icon */}
            <div
              className="absolute -bottom-2 -left-6 w-24 h-24 rounded-full shadow-lg border flex items-center justify-center z-20"
              style={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb' }}
            >
              <span
                className="material-symbols-outlined text-4xl"
                style={{ color: '#1e293b' }}
              >
                calendar_today
              </span>
            </div>

            {/* Decorative dots */}
            <div
              className="absolute top-10 -left-4 w-3 h-3 rounded-full"
              style={{ backgroundColor: 'rgba(30,41,59,0.3)' }}
            />
            <div
              className="absolute bottom-10 -right-2 w-4 h-4 rounded-full"
              style={{ backgroundColor: 'rgba(30,41,59,0.15)' }}
            />
          </div>
        </div>

        {/* Text */}
        <div className="text-center space-y-3">
          <h1
            className="text-3xl font-bold leading-tight tracking-tight"
            style={{ color: '#020617' }}
          >
            Küçük bir dokunuş,
            <br />
            büyük bir fark.
          </h1>
          <p
            className="text-lg font-normal leading-relaxed"
            style={{ color: '#4b5563' }}
          >
            Karmaşadan kurtulun, odağınızı geri kazanın. Lybell ile gününüzü nazikçe planlayın.
          </p>
        </div>
      </div>

      {/* Alt: indicators + button */}
      <div className="w-full max-w-md px-6 pt-6 pb-2 flex flex-col items-center gap-6">
        <div className="flex flex-row items-center justify-center gap-3">
          <div className="h-2 w-2 rounded-full bg-slate-200" />
          <div
            className="h-2 w-6 rounded-full"
            style={{ backgroundColor: '#1e293b' }}
          />
          <div className="h-2 w-2 rounded-full bg-slate-200" />
        </div>
        <div className="w-full">
          <button
            type="button"
            onClick={onComplete}
            className="w-full font-semibold py-4 px-8 rounded-xl transition-all flex items-center justify-center gap-2"
            style={{ backgroundColor: '#1e293b', color: '#ffffff', boxShadow: '0 20px 40px rgba(15,23,42,0.35)' }}
          >
            <span style={{ color: '#ffffff' }}>Devam</span>
            <span className="material-symbols-outlined text-xl" style={{ color: '#ffffff' }}>
              arrow_forward
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
