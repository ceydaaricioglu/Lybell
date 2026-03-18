'use client';

import { useState } from 'react';
import { OnboardingStep1, OnboardingStep2 } from '@/components/Onboarding';

export default function OnboardingPreviewPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [darkMode, setDarkMode] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Önizleme çubuğu – sadece bu sayfada */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-2 bg-black/80 text-white text-sm">
        <span>Onboarding önizleme</span>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={darkMode}
              onChange={(e) => setDarkMode(e.target.checked)}
              className="rounded"
            />
            Koyu mod
          </label>
          <a
            href="/"
            className="text-amber-400 hover:text-amber-300 underline"
          >
            Ana uygulama
          </a>
        </div>
      </div>

      <div className="pt-12">
        {step === 1 ? (
          <OnboardingStep1
            onNext={() => setStep(2)}
            onSkip={() => (window.location.href = '/')}
            darkMode={false}
          />
        ) : (
          <OnboardingStep2
            onComplete={() => (window.location.href = '/')}
            onBack={() => setStep(1)}
            onSkip={() => (window.location.href = '/')}
            darkMode={false}
          />
        )}
      </div>
    </div>
  );
}