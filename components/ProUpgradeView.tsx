'use client';

import { useLocale } from '@/components/LocaleContext';
import { t } from '@/lib/i18n';

export type PlanId = 'monthly' | 'yearly' | 'lifetime';

interface ProUpgradeViewProps {
  darkMode?: boolean;
  isPro?: boolean;
  selectedPlan: PlanId;
  onSelectPlan: (plan: PlanId) => void;
  onClose: () => void;
  onRestore?: () => void;
  /** Test aşamasında ücret ödemeden Pro’ya geç (localStorage app_pro_mock) */
  onTestUpgrade?: () => void;
}

const PRO_FEATURES: { feature: string; free: string; pro: string }[] = [
  { feature: 'Sınırsız görev & not', free: '50 görev', pro: '✓' },
  { feature: 'Sınırsız alt görev (kontrol listesi)', free: '✗', pro: '✓' },
  { feature: 'Tekrarlayan görevler (tam)', free: 'temel (gün/hafta/ay)', pro: '✓ (+ hafta içi)' },
  { feature: 'Birden fazla hatırlatma', free: '1', pro: '2' },
  { feature: 'Gelişmiş hatırlatıcılar', free: '✗', pro: '✓' },
  { feature: 'Temalar', free: '2 (açık/koyu)', pro: '2 (ileride 40+)' },
  { feature: 'Reklamsız', free: '✗', pro: '✓' },
  { feature: 'Görev şablonları', free: '✗', pro: '✓' },
  { feature: 'Geri sayım', free: '✗', pro: '✓' },
  { feature: 'Liste paylaşımı', free: '✗', pro: '✓' },
  { feature: 'Takvim bağlama', free: 'okuma', pro: '✓ (ileride çift yön)' },
  { feature: 'Sesle not ekleme', free: '✗', pro: '✓' },
  { feature: 'Senkron cihaz sayısı', free: '1–2', pro: '5+' },
  { feature: 'Özel zil sesi', free: '✗', pro: '✓' },
  { feature: 'Eisenhower matrisi', free: '✗', pro: '✓' },
  { feature: 'Pomodoro', free: 'temel', pro: 'gelişmiş' },
  { feature: 'Arama & filtreler', free: 'basit', pro: 'gelişmiş' },
  { feature: 'Sekme özelleştirme', free: '✗', pro: '✓' },
  { feature: 'Rozet / gamification', free: '✗/temel', pro: '✓' },
];

const PLANS: { id: PlanId; labelKey: string; price: string; originalPrice?: string; subKey: string; badgeKey: string | null }[] = [
  { id: 'monthly', labelKey: 'pro.planMonthly', price: '₺19,99', subKey: 'pro.planSubMonthly', badgeKey: null },
  { id: 'yearly', labelKey: 'pro.planYearly', price: '₺75,99', originalPrice: '₺119,99', subKey: 'pro.planSubYearly', badgeKey: 'pro.badgePopular' },
  { id: 'lifetime', labelKey: 'pro.planLifetime', price: '₺149,99', originalPrice: '₺249,99', subKey: 'pro.planSubLifetime', badgeKey: 'pro.badgeRecommended' },
];

export default function ProUpgradeView({
  darkMode = false,
  isPro = false,
  selectedPlan,
  onSelectPlan,
  onClose,
  onRestore,
  onTestUpgrade,
}: ProUpgradeViewProps) {
  const dark = darkMode;
  const { locale } = useLocale();

  const handleTestUpgrade = () => {
    if (typeof window !== 'undefined') localStorage.setItem('app_pro_mock', '1');
    onTestUpgrade?.();
    onClose();
  };

  return (
    <div className={`min-h-screen pb-8 ${dark ? 'bg-[#0f0f0f]' : 'bg-[#f0f4f8]'}`}>
      {/* Header */}
      <div className={`sticky top-0 z-10 flex items-center justify-between px-4 py-3 safe-area-body ${dark ? 'bg-[#0f0f0f] border-b border-zinc-800' : 'bg-[#f0f4f8] border-b border-stone-200'}`}>
        <button
          type="button"
          onClick={onClose}
          className="p-2 -ml-2 rounded-full hover:opacity-80"
          aria-label={t('common.close', locale)}
        >
          <svg className={`w-6 h-6 ${dark ? 'text-zinc-300' : 'text-stone-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <h1 className={`text-lg font-bold ${dark ? 'text-white' : 'text-stone-900'}`}>
          {t('pro.title', locale)}
        </h1>
        <div className="w-10" />
      </div>

      <div className="w-full max-w-md md:max-w-none mx-auto md:mx-0 px-4 pt-6 pb-24">
        <p className={`text-center text-sm mb-6 ${dark ? 'text-zinc-400' : 'text-stone-500'}`}>
          {t('pro.subtitle', locale)}
        </p>

        {/* Free vs Pro özellik tablosu */}
        <div className={`rounded-2xl overflow-hidden mb-6 ${dark ? 'bg-zinc-900/60 border border-zinc-800' : 'bg-white border border-stone-100 shadow-sm'}`}>
          <div className={`px-4 py-3 border-b ${dark ? 'border-zinc-800' : 'border-stone-100'}`}>
            <h3 className={`text-sm font-semibold ${dark ? 'text-white' : 'text-stone-900'}`}>Free vs Pro</h3>
          </div>
          <div className="overflow-x-auto max-h-[50vh] overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className={`${dark ? 'bg-zinc-800/50' : 'bg-stone-50'}`}>
                  <th className={`px-3 py-2 font-semibold ${dark ? 'text-zinc-400' : 'text-stone-500'}`}>Özellik</th>
                  <th className={`px-3 py-2 font-semibold w-20 ${dark ? 'text-zinc-400' : 'text-stone-500'}`}>Free</th>
                  <th className={`px-3 py-2 font-semibold w-24 ${dark ? 'text-emerald-400' : 'text-emerald-600'}`}>Pro</th>
                </tr>
              </thead>
              <tbody>
                {PRO_FEATURES.map((row, i) => (
                  <tr key={i} className={`border-b last:border-b-0 ${dark ? 'border-zinc-800' : 'border-stone-100'}`}>
                    <td className={`px-3 py-2.5 ${dark ? 'text-zinc-200' : 'text-stone-800'}`}>{row.feature}</td>
                    <td className={`px-3 py-2.5 ${dark ? 'text-zinc-500' : 'text-stone-500'}`}>{row.free}</td>
                    <td className={`px-3 py-2.5 font-medium ${dark ? 'text-emerald-400' : 'text-emerald-600'}`}>{row.pro}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {PLANS.map((plan) => {
            const isSelected = selectedPlan === plan.id;
            const label = t(plan.labelKey, locale);
            const sub = t(plan.subKey, locale);
            const badge = plan.badgeKey ? t(plan.badgeKey, locale) : null;
            return (
              <button
                key={plan.id}
                type="button"
                onClick={() => onSelectPlan(plan.id)}
                className={`relative rounded-xl p-4 text-left transition-all border-2 ${
                  isSelected
                    ? 'border-amber-500 bg-amber-500/10'
                    : dark
                      ? 'border-zinc-700 bg-zinc-900/60 hover:border-zinc-600'
                      : 'border-stone-200 bg-white hover:border-stone-300 shadow-sm'
                }`}
              >
                {badge && (
                  <span className={`absolute -top-2 left-1/2 -translate-x-1/2 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    plan.badgeKey === 'pro.badgePopular' ? 'bg-amber-400 text-stone-900' : 'bg-orange-500 text-white'
                  }`}>
                    {badge}
                  </span>
                )}
                <div className={`font-semibold text-sm mb-0.5 ${dark ? 'text-white' : 'text-stone-900'}`}>{label}</div>
                <div className="flex items-baseline gap-1">
                  <span className={`text-lg font-bold ${dark ? 'text-white' : 'text-stone-900'}`}>{plan.price}</span>
                  {plan.originalPrice && (
                    <span className={`text-xs line-through ${dark ? 'text-zinc-500' : 'text-stone-400'}`}>{plan.originalPrice}</span>
                  )}
                </div>
                <div className={`text-[10px] mt-1 ${dark ? 'text-zinc-500' : 'text-stone-500'}`}>{sub}</div>
              </button>
            );
          })}
        </div>

        {/* CTA */}
        <div className="mb-3">
          {isPro ? (
            <div className={`rounded-2xl py-4 px-5 text-center ${dark ? 'bg-emerald-500/20 border border-emerald-500/40' : 'bg-emerald-50 border border-emerald-200'}`}>
              <span className={`font-semibold ${dark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                {t('pro.alreadyPro', locale)}
              </span>
            </div>
          ) : (
            <>
              <button
                type="button"
                className="w-full py-4 rounded-2xl font-semibold text-white bg-gradient-to-r from-blue-500 to-violet-500 hover:opacity-95 active:opacity-90 shadow-lg"
              >
                {t('pro.cta', locale)}
              </button>
              {onTestUpgrade && (
                <button
                  type="button"
                  onClick={handleTestUpgrade}
                  className="w-full mt-3 py-3 rounded-2xl font-medium border-2 border-dashed border-amber-500/60 text-amber-600 hover:bg-amber-500/10 active:opacity-90 transition-colors"
                >
                  Ücret ödemeden yükselt (test)
                </button>
              )}
            </>
          )}
        </div>

        {/* Legal links */}
        <div className="flex flex-wrap justify-center gap-4 text-xs mb-4">
          <button type="button" className={`underline ${dark ? 'text-zinc-500 hover:text-zinc-400' : 'text-stone-500 hover:text-stone-600'}`}>
            {t('pro.terms', locale)}
          </button>
          <button type="button" className={`underline ${dark ? 'text-zinc-500 hover:text-zinc-400' : 'text-stone-500 hover:text-stone-600'}`}>
            {t('pro.privacy', locale)}
          </button>
          {onRestore && (
            <button type="button" onClick={onRestore} className={`underline ${dark ? 'text-zinc-500 hover:text-zinc-400' : 'text-stone-500 hover:text-stone-600'}`}>
              {t('pro.restore', locale)}
            </button>
          )}
        </div>

        <p className={`text-[10px] text-center max-w-sm mx-auto ${dark ? 'text-zinc-600' : 'text-stone-400'}`}>
          {t('pro.disclaimer', locale)}
        </p>
      </div>
    </div>
  );
}
