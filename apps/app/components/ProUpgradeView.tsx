'use client';

import { useLocale } from '@/components/LocaleContext';
import { t } from '@cursor-deneme/shared';

export type PlanId = 'monthly' | 'yearly' | 'lifetime';

interface ProUpgradeViewProps {
  darkMode?: boolean;
  isPro?: boolean;
  selectedPlan: PlanId;
  onSelectPlan: (plan: PlanId) => void;
  onClose: () => void;
  onRestore?: () => void;
  /** Ana CTA "Şimdi Yükselt" tıklandığında (ödeme akışı vb.) */
  onUpgrade?: () => void;
  /** Test aşamasında ücret ödemeden Pro’ya geç (localStorage app_pro_mock) */
  onTestUpgrade?: () => void;
}

const PRO_FEATURES: { feature: string; free: string; pro: string }[] = [
  { feature: 'Sınırsız görev & not', free: '50 görev', pro: '✓' },
  { feature: 'Tekrarlayan görevler (tam)', free: 'temel (gün/hafta/ay)', pro: '✓ (+ hafta içi)' },
  { feature: 'Hatırlatmalar', free: '1', pro: '2 + özel mesaj + özel zil' },
  { feature: 'Özel temalar', free: '2 (açık/koyu)', pro: '✓ (ileride 40+)' },
  { feature: 'Reklamsız', free: '✗', pro: '✓' },
  { feature: 'Görev şablonları', free: '✗', pro: '✓' },
  { feature: 'Geri sayım', free: '✗', pro: '✓' },
  { feature: 'Liste paylaşımı', free: '✗', pro: 'İleride' },
  { feature: 'Takvim & senkron', free: 'okuma, 1–2 cihaz', pro: 'çift yön, 5+ cihaz' },
  { feature: 'Sesle not ekleme', free: '✗', pro: '✓' },
  { feature: 'Eisenhower matrisi', free: '✗', pro: '✓' },
  { feature: 'Pomodoro', free: 'temel', pro: 'gelişmiş süreler' },
  { feature: 'Sekme özelleştirme', free: '✗', pro: '✓' },
];

const PLANS: { id: PlanId; labelKey: string; price: string; originalPrice?: string; subKey: string; badgeKey: string | null }[] = [
  { id: 'monthly', labelKey: 'pro.planMonthly', price: '₺19,99', subKey: 'pro.planSubMonthly', badgeKey: null },
  { id: 'yearly', labelKey: 'pro.planYearly', price: '₺75,99', originalPrice: '₺119,99', subKey: 'pro.planSubYearly', badgeKey: 'pro.badgePopular' },
  { id: 'lifetime', labelKey: 'pro.planLifetime', price: '₺149,99', originalPrice: '₺249,99', subKey: 'pro.planSubLifetime', badgeKey: 'pro.badgeRecommended' },
];

const PRIMARY = '#f97316';
const BG_LIGHT = '#fdfaf7';
const BG_DARK = '#221610';

function isCheck(s: string) { return s === '✓'; }
function isCross(s: string) { return s === '✗'; }

export default function ProUpgradeView({
  darkMode = false,
  isPro = false,
  selectedPlan,
  onSelectPlan,
  onClose,
  onRestore,
  onUpgrade,
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
    <div className="relative flex min-h-screen w-full flex-col max-w-md mx-auto overflow-x-hidden font-display" style={{ backgroundColor: dark ? BG_DARK : BG_LIGHT }}>
      {/* Top Bar */}
      <div className="flex items-center justify-between p-6 pt-12">
        <button
          type="button"
          onClick={onClose}
          className={`flex size-10 shrink-0 items-center justify-center rounded-full ${dark ? 'bg-slate-800/50' : 'bg-slate-200/50'}`}
          aria-label={t('common.close', locale)}
        >
          <span className="material-symbols-outlined text-slate-600 dark:text-slate-400">close</span>
        </button>
        <h2 className="text-lg font-bold leading-tight flex-1 text-center mr-10" style={{ color: dark ? '#f5f0ea' : '#1a1a1a' }}>
          {t('pro.title', locale)}
        </h2>
      </div>

      {/* Hero */}
      <div className="px-6 pb-6 pt-4 text-center">
        <h1 className="text-3xl font-extrabold leading-tight tracking-tight mb-2" style={{ color: dark ? '#f5f0ea' : '#1a1a1a' }}>
          {locale === 'tr' ? 'Verimliliğinizi Artırın' : 'Boost your productivity'}
        </h1>
        <p className="text-sm dark:text-slate-400" style={{ color: dark ? undefined : '#374151' }}>
          {t('pro.subtitle', locale)}
        </p>
      </div>

      {/* Feature Comparison */}
      <div className="px-6 py-4">
        <div className={`rounded-xl border overflow-hidden ${dark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className={`grid grid-cols-3 border-b p-4 ${dark ? 'bg-slate-800/50 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Özellik</div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 text-center">{locale === 'tr' ? 'Ücretsiz' : 'Free'}</div>
            <div className="text-xs font-bold uppercase tracking-wider text-center" style={{ color: PRIMARY }}>Pro</div>
          </div>
          <div className={`divide-y max-h-[40vh] overflow-y-auto ${dark ? 'divide-slate-800' : 'divide-slate-100'}`}>
            {PRO_FEATURES.map((row, i) => (
              <div key={i} className="flex justify-between items-center py-4 px-4">
                <p className={`text-sm font-medium flex-1 min-w-0 pr-2 ${dark ? 'text-slate-300' : 'text-slate-700'}`}>{row.feature}</p>
                <div className="flex w-1/2 justify-around shrink-0">
                  <span className="flex items-center justify-center min-w-[2rem]">
                    {isCross(row.free) ? (
                      <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 text-sm">remove</span>
                    ) : (
                      <span className={`text-xs ${dark ? 'text-slate-500' : 'text-slate-500'}`}>{row.free}</span>
                    )}
                  </span>
                  <span className="flex items-center justify-center min-w-[2rem]">
                    {isCheck(row.pro) ? (
                      <span className="material-symbols-outlined text-sm font-bold" style={{ color: PRIMARY }}>check_circle</span>
                    ) : (
                      <span className={`text-xs font-medium ${dark ? 'text-slate-300' : 'text-slate-700'}`}>{row.pro}</span>
                    )}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="flex flex-col gap-4 px-6 py-4">
        {PLANS.map((plan) => {
          const isSelected = selectedPlan === plan.id;
          const label = t(plan.labelKey, locale);
          const sub = t(plan.subKey, locale);
          const badge = plan.badgeKey ? t(plan.badgeKey, locale) : null;
          const isPopular = plan.badgeKey === 'pro.badgePopular';
          const isRecommended = plan.badgeKey === 'pro.badgeRecommended';
          return (
            <button
              key={plan.id}
              type="button"
              onClick={() => onSelectPlan(plan.id)}
              className={`relative flex items-center justify-between gap-4 rounded-xl p-5 text-left transition-colors cursor-pointer ${
                isSelected
                  ? 'border-2 bg-primary/5 dark:bg-primary/10'
                  : dark ? 'border border-slate-800 bg-slate-900 hover:border-slate-700' : 'border border-slate-200 bg-white hover:border-slate-300'
              }`}
              style={isSelected ? { borderColor: PRIMARY } : undefined}
            >
              {isPopular && isSelected && (
                <span className="absolute -top-3 right-6 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white" style={{ backgroundColor: PRIMARY }}>
                  {badge}
                </span>
              )}
              <div className="flex flex-col gap-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-slate-900 dark:text-slate-100 text-sm font-bold uppercase tracking-wide">{label}</h3>
                  {isRecommended && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0" style={{ color: PRIMARY, backgroundColor: `${PRIMARY}1A` }}>
                      {locale === 'tr' ? 'ÖNERİLEN' : 'RECOMMENDED'}
                    </span>
                  )}
                </div>
                <p className="flex items-baseline gap-1 text-slate-900 dark:text-slate-100">
                  <span className="text-2xl font-black">{plan.price}</span>
                  {plan.originalPrice && (
                    <span className={`text-xs line-through ml-1 ${dark ? 'text-slate-500' : 'text-slate-500'}`}>{plan.originalPrice}</span>
                  )}
                </p>
                <span className={`text-xs ${dark ? 'text-slate-500' : 'text-slate-500'}`}>{sub}</span>
              </div>
              <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? '' : dark ? 'border-slate-700' : 'border-slate-200'}`} style={isSelected ? { borderColor: PRIMARY } : undefined}>
                <div className={`h-3 w-3 rounded-full ${isSelected ? '' : 'opacity-0'}`} style={{ backgroundColor: PRIMARY }} />
              </div>
            </button>
          );
        })}
      </div>

      {/* Sticky Bottom — safe-area ile sistem çubuğunun üstünde kalır */}
      <div
        className="sticky bottom-0 mt-auto px-6 pt-8 backdrop-blur-md"
        style={{
          backgroundColor: `${dark ? BG_DARK : BG_LIGHT}CC`,
          paddingBottom: 'max(2rem, calc(2rem + env(safe-area-inset-bottom, 0px)))',
        }}
      >
        {isPro ? (
          <div className={`rounded-xl py-4 px-5 text-center ${dark ? 'bg-emerald-500/20 border border-emerald-500/40' : 'bg-emerald-50 border border-emerald-200'}`}>
            <span className={`font-semibold ${dark ? 'text-emerald-400' : 'text-emerald-700'}`}>{t('pro.alreadyPro', locale)}</span>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={onUpgrade}
              className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl h-14 text-white text-lg font-bold shadow-lg transition-transform active:scale-[0.98] touch-manipulation min-h-[48px]"
              style={{ backgroundColor: PRIMARY, boxShadow: `0 10px 24px ${PRIMARY}4D` }}
            >
              <span className="truncate">{t('pro.cta', locale)}</span>
            </button>
            {onTestUpgrade && (
              <button
                type="button"
                onClick={handleTestUpgrade}
                className="w-full mt-3 py-3 rounded-xl font-medium border-2 border-dashed transition-colors hover:opacity-90"
                style={{ borderColor: `${PRIMARY}99`, color: PRIMARY }}
              >
                Ücret ödemeden yükselt (test)
              </button>
            )}
          </>
        )}
        <p className="mt-4 text-center text-xs text-slate-400 dark:text-slate-500">
          {locale === 'tr' ? 'İstediğin zaman iptal edebilirsin.' : 'Cancel anytime.'}
          <br />
          <button type="button" className="underline">{t('pro.terms', locale)}</button>
          {' & '}
          <button type="button" className="underline">{t('pro.privacy', locale)}</button>
          {onRestore && (
            <>
              {' · '}
              <button type="button" onClick={onRestore} className="underline">{t('pro.restore', locale)}</button>
            </>
          )}
        </p>
        <p className={`mt-2 text-[10px] text-center max-w-sm mx-auto ${dark ? 'text-zinc-600' : 'text-stone-400'}`}>
          {t('pro.disclaimer', locale)}
        </p>
      </div>
      <div className="h-8" />
    </div>
  );
}
