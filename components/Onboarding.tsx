'use client';

interface OnboardingStep1Props {
  onNext: () => void;
  selectedFocus: string | null;
  setSelectedFocus: (focus: string) => void;
}

export function OnboardingStep1({ onNext, selectedFocus, setSelectedFocus }: OnboardingStep1Props) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex flex-col">
      <div className="bg-white border-b border-emerald-100 px-6 py-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Adım 1 / 2</span>
            <span className="text-sm font-medium text-emerald-600">50%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full transition-all duration-300" style={{ width: '50%' }}></div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">Odak Alanını Seç</h2>
          <p className="text-gray-600 text-center mb-8">İlk olarak neyi organize etmek istersin?</p>

          <div className="space-y-3 mb-8">
            {[
              { icon: "📚", label: "Okuma Listesi", value: "reading", color: "from-purple-400 to-pink-400" },
              { icon: "🏃", label: "Günlük Rutinler", value: "routines", color: "from-blue-400 to-cyan-400" },
              { icon: "💼", label: "İş Görevleri", value: "work", color: "from-orange-400 to-red-400" },
              { icon: "🎯", label: "Kişisel Hedefler", value: "goals", color: "from-emerald-400 to-teal-400" }
            ].map((option, index) => (
              <button
                key={index}
                onClick={() => setSelectedFocus(option.value)}
                className={`w-full p-4 bg-white rounded-xl border-2 transition-all text-left flex items-center gap-4 hover:shadow-md ${
                  selectedFocus === option.value
                    ? 'border-emerald-500 bg-emerald-50 shadow-md'
                    : 'border-emerald-100 hover:border-emerald-300'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${option.color} flex items-center justify-center text-2xl`}>
                  {option.icon}
                </div>
                <span className="font-semibold text-gray-900">{option.label}</span>
                {selectedFocus === option.value && (
                  <svg className="w-6 h-6 text-emerald-500 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>

          <button
            onClick={onNext}
            disabled={!selectedFocus}
            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Devam Et
          </button>
        </div>
      </div>
    </div>
  );
}

interface OnboardingStep2Props {
  onComplete: () => void;
  onBack: () => void;
  selectedSchedule: string | null;
  setSelectedSchedule: (schedule: string) => void;
}

export function OnboardingStep2({ onComplete, onBack, selectedSchedule, setSelectedSchedule }: OnboardingStep2Props) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex flex-col">
      <div className="bg-white border-b border-emerald-100 px-6 py-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Adım 2 / 2</span>
            <span className="text-sm font-medium text-emerald-600">100%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full transition-all duration-300" style={{ width: '100%' }}></div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">Programını Ayarla</h2>
          <p className="text-gray-600 text-center mb-8">Gününü planlamayı ne zaman tercih edersin?</p>

          <div className="space-y-3 mb-8">
            {[
              { icon: "🌅", label: "Sabah İnsanı", value: "morning", color: "from-yellow-400 to-orange-400" },
              { icon: "🌆", label: "Akşam Plancısı", value: "evening", color: "from-indigo-400 to-purple-400" },
              { icon: "🌙", label: "Esnek", value: "flexible", color: "from-gray-400 to-gray-600" }
            ].map((option, index) => (
              <button
                key={index}
                onClick={() => setSelectedSchedule(option.value)}
                className={`w-full p-4 bg-white rounded-xl border-2 transition-all text-left flex items-center gap-4 hover:shadow-md ${
                  selectedSchedule === option.value
                    ? 'border-emerald-500 bg-emerald-50 shadow-md'
                    : 'border-emerald-100 hover:border-emerald-300'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${option.color} flex items-center justify-center text-2xl`}>
                  {option.icon}
                </div>
                <span className="font-semibold text-gray-900">{option.label}</span>
                {selectedSchedule === option.value && (
                  <svg className="w-6 h-6 text-emerald-500 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={onBack}
              className="flex-1 py-3 bg-white border-2 border-emerald-200 text-emerald-600 rounded-xl font-semibold hover:bg-emerald-50 transition-all"
            >
              Geri
            </button>
            <button
              onClick={onComplete}
              disabled={!selectedSchedule}
              className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Kurulumu Tamamla
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
