'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@cursor-deneme/shared';
import { isMockUser, getTodayPomodoroCount, getWeekPomodoroCount, getMonthPomodoroCount, getPomodoroStreak, getTotalFocusTime, getWeeklyPomodoroDistribution, getPomodoroRecords, getMockCategories, getProfile, fetchTasksFromSupabase, fetchTemplates, deleteTemplateFromSupabase } from '@cursor-deneme/shared';
import type { TimelineTask } from '@cursor-deneme/shared';
import type { TaskTemplate } from '@cursor-deneme/shared';
import { useToast } from '@/components/Toast';
import { useLocale } from '@/components/LocaleContext';
import { t, SUPPORTED_LOCALES, getLocaleLabel } from '@cursor-deneme/shared';
import {
  getNotificationsEnabled,
  setNotificationsEnabled,
  getDailyDigestEnabled,
  setDailyDigestEnabled,
  getDailyDigestTime,
  setDailyDigestTime as persistDailyDigestTime,
  getOverdueReminderEnabled,
  setOverdueReminderEnabled,
  getOverdueReminderTime,
  setOverdueReminderTime as persistOverdueReminderTime,
  getNotificationSound,
  setNotificationSound,
  type NotificationSound,
} from '@cursor-deneme/shared';
import { DEFAULT_NAV_TABS, getVisibleNavTabs, setVisibleNavTabs } from '@cursor-deneme/shared';
import Modal from '@/components/Modal';

interface SettingsViewProps {
  userId: string;
  onLogout: () => void;
  onSessionLost?: () => void;
  darkMode?: boolean;
  onDarkModeChange?: (value: boolean) => void;
  onOpenProfile?: () => void;
  onOpenPro?: () => void;
  isPro?: boolean;
  onNavTabsChange?: (tabs: string[]) => void;
  /** Hoş geldin / onboarding ekranlarını tekrar göstermek için */
  onShowOnboarding?: () => void;
  /** Test: Pro’dan çık (Free’yi denemek için) */
  onExitPro?: () => void;
  onBack?: () => void;
}

const PRIMARY = '#ec5b13';
const BG_LIGHT = '#f8f6f6';
const BG_DARK = '#221610';
const NEUTRAL_LIGHT = '#e5e1df';
const NEUTRAL_DARK = '#3d2e27';

export default function SettingsView({ userId, onLogout, onSessionLost, darkMode = false, onDarkModeChange, onOpenProfile, onOpenPro, isPro = false, onNavTabsChange, onShowOnboarding, onExitPro, onBack }: SettingsViewProps) {
  const dark = darkMode;
  const { showToast } = useToast();
  const { locale, setLocale } = useLocale();
  const [notifications, setNotifications] = useState(() => getNotificationsEnabled());
  const [dailyDigest, setDailyDigest] = useState(() => getDailyDigestEnabled());
  const [dailyDigestTime, setDailyDigestTime] = useState(() => getDailyDigestTime());
  const [overdueReminder, setOverdueReminder] = useState(() => getOverdueReminderEnabled());
  const [overdueReminderTime, setOverdueReminderTime] = useState(() => getOverdueReminderTime());
  const [notificationSound, setNotificationSoundState] = useState<NotificationSound>(() => getNotificationSound());
  const [displayName, setDisplayName] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(`displayName_${userId}`) ?? null;
    } catch {
      return null;
    }
  });
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLangModal, setShowLangModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [visibleNavTabs, setVisibleNavTabsState] = useState<string[]>(() => getVisibleNavTabs(true));
  useEffect(() => {
    if (isPro) setVisibleNavTabsState(getVisibleNavTabs(true));
  }, [isPro]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!userId) return;
      const cacheKey = `displayName_${userId}`;

      // 1) Meta'dan (auth.getUser) ismi hızlı al: kullanıcı kartı gecikmesin.
      if (!isMockUser(userId)) {
        try {
          const { data } = await supabase.auth.getUser();
          const meta = (data?.user?.user_metadata ?? {}) as Record<string, any>;
          const metaName =
            (meta.full_name as string | undefined) ||
            (meta.name as string | undefined) ||
            (meta.first_name && meta.last_name ? `${meta.first_name} ${meta.last_name}` : '');
          if (metaName && !cancelled) {
            setDisplayName(metaName);
            try {
              localStorage.setItem(cacheKey, metaName);
            } catch {
              // noop
            }
          }
        } catch {
          // sessiz geç
        }
      }

      // 2) Ardından profiles tablosundaki nihai değeri al.
      try {
        const p = await getProfile(userId);
        if (cancelled) return;
        const next = p.displayName || null;
        setDisplayName(next);
        try {
          if (next) localStorage.setItem(cacheKey, next);
          else localStorage.removeItem(cacheKey);
        } catch {
          // noop
        }
      } catch {
        // sessiz geç
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    fetchTemplates(userId).then(setTemplates);
  }, [userId]);

  // Gerçek kullanıcı görünüyor ama Supabase oturumu yoksa state'i düzelt (girişe yönlendir)
  useEffect(() => {
    if (!userId || isMockUser(userId) || !onSessionLost) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) onSessionLost();
    });
  }, [userId, onSessionLost]);

  const isMock = isMockUser(userId);
  const userSubtitle = isMock ? 'Hesap olmadan kullanılıyor' : (displayName?.trim() ? 'Kayıtlı hesap' : 'Kayıtlı kullanıcı');
  const userDisplayTitle = displayName?.trim() || (isMock ? 'Misafir Kullanıcı' : 'Kullanıcı');
  const userInitial = displayName?.trim()?.[0]?.toUpperCase() || (isMock ? '?' : 'U');

  const [activeSection, setActiveSection] = useState<'profile' | 'appearance' | 'notifications' | 'account'>('profile');
  const profileRef = useRef<HTMLDivElement>(null);
  const appearanceRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);

  const scrollToSection = (section: 'profile' | 'appearance' | 'notifications' | 'account') => {
    setActiveSection(section);
    const ref = section === 'profile' ? profileRef : section === 'appearance' ? appearanceRef : section === 'notifications' ? notificationsRef : accountRef;
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const Toggle = ({ enabled, onChange }: { enabled: boolean; onChange: () => void }) => (
    <button
      onClick={onChange}
      className={`relative w-12 h-7 rounded-full transition-all duration-300 ${
        enabled ? '' : dark ? 'bg-slate-600' : 'bg-slate-300'
      }`}
      style={enabled ? { backgroundColor: PRIMARY } : undefined}
    >
      <div
        className={`absolute top-0.5 w-6 h-6 rounded-full shadow-md transition-all duration-300 ${dark ? 'bg-slate-200' : 'bg-white'}`}
        style={{ left: enabled ? '22px' : '2px' }}
      />
    </button>
  );

  const handleLogout = async () => {
    if (isMock) {
      localStorage.removeItem('mock_user_id');
      localStorage.removeItem(`onboarding_${userId}`);
      localStorage.removeItem(`mock_tasks_${userId}`);
      localStorage.removeItem(`mock_categories_${userId}`);
    } else {
      await supabase.auth.signOut();
    }
    onLogout();
  };

  const handleDeleteAllData = () => {
    if (isMock) {
      localStorage.removeItem(`mock_tasks_${userId}`);
      localStorage.removeItem(`mock_categories_${userId}`);
    }
    showToast('Tüm veriler silindi', 'info');
    setShowDeleteConfirm(false);
    // Sayfayı yenile
    setTimeout(() => window.location.reload(), 500);
  };

  const handleExportData = async () => {
    setExporting(true);
    try {
      const [tasks, categories, templates, profile] = await Promise.all([
        fetchTasksFromSupabase(userId),
        Promise.resolve(getMockCategories(userId)),
        fetchTemplates(userId),
        getProfile(userId),
      ]);
      const exportData = {
        version: 1,
        exportDate: new Date().toISOString(),
        app: 'TaskFlow',
        data: {
          tasks,
          categories,
          templates,
          profile,
        },
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `taskflow-yedek-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast(locale === 'tr' ? 'Veriler başarıyla dışa aktarıldı' : 'Data exported successfully', 'success');
    } catch {
      showToast(locale === 'tr' ? 'Dışa aktarma başarısız' : 'Export failed', 'error');
    } finally {
      setExporting(false);
    }
  };

  /** Görev listesini CSV olarak indir (Excel vb. için). */
  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const tasks = await fetchTasksFromSupabase(userId);
      const categories = getMockCategories(userId);
      const header = 'Başlık,Tarih,Saat,Liste,Tamamlandı,Öncelik,Tekrar,Hatırlatma,Açıklama';
      const rows = tasks.map((t: TimelineTask) => {
        const catName = t.category ? (categories.find(c => c.id === t.category)?.name ?? t.category) : '';
        const escape = (v: string) => (v == null ? '' : String(v).replace(/"/g, '""'));
        return [
          `"${escape(t.title ?? '')}"`,
          t.date ?? '',
          t.time ?? '',
          `"${escape(catName)}"`,
          t.completed ? 'Evet' : 'Hayır',
          t.priority ?? '',
          t.recurrence ?? '',
          t.reminderAt ?? '',
          `"${escape((t.description ?? '').slice(0, 200))}"`,
        ].join(',');
      });
      const csv = '\uFEFF' + header + '\n' + rows.join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `taskflow-gorevler-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast(locale === 'tr' ? 'Görev listesi CSV olarak indirildi' : 'Tasks exported as CSV', 'success');
    } catch {
      showToast(locale === 'tr' ? 'CSV dışa aktarma başarısız' : 'CSV export failed', 'error');
    } finally {
      setExporting(false);
    }
  };

  const handleArchiveCompleted = () => {
    const tasksStr = localStorage.getItem(`mock_tasks_${userId}`);
    if (tasksStr) {
      const tasks = JSON.parse(tasksStr);
      const activeTasks = tasks.filter((t: any) => !t.completed);
      const archivedTasks = tasks.filter((t: any) => t.completed);
      
      localStorage.setItem(`mock_tasks_${userId}`, JSON.stringify(activeTasks));
      
      // Arşivi sakla
      const existingArchive = localStorage.getItem(`mock_archive_${userId}`);
      const archive = existingArchive ? JSON.parse(existingArchive) : [];
      localStorage.setItem(`mock_archive_${userId}`, JSON.stringify([...archive, ...archivedTasks]));
      
      showToast(`${archivedTasks.length} tamamlanan görev arşivlendi`, 'success');
    }
  };

  return (
    <div className="min-h-screen flex flex-col pb-24" style={{ backgroundColor: dark ? BG_DARK : BG_LIGHT }}>
      {/* Header - TaskMaster colors */}
      <div className="border-b px-4 md:px-8 py-4" style={{ borderColor: dark ? NEUTRAL_DARK : NEUTRAL_LIGHT, backgroundColor: dark ? BG_DARK : BG_LIGHT }}>
        <div className="w-full max-w-md md:max-w-none mx-auto md:mx-0 flex items-center gap-4">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              aria-label={locale === 'tr' ? 'Geri' : 'Back'}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
          )}
          <div>
            <h1 className={`text-xl md:text-2xl font-bold tracking-tight ${dark ? 'text-white' : 'text-slate-900'}`}>{t('settings.title', locale)}</h1>
            <p className={`text-sm mt-0.5 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{t('settings.subtitle', locale)}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Sidebar - TaskMaster (lg only) */}
        <aside className={`w-64 border-r overflow-y-auto hidden lg:block p-4 flex-shrink-0 ${dark ? 'bg-black/10' : 'bg-white'}`} style={{ borderColor: dark ? NEUTRAL_DARK : NEUTRAL_LIGHT }}>
          <div className="space-y-1">
            <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{locale === 'tr' ? 'Kişisel' : 'Personal'}</p>
            <button type="button" onClick={() => scrollToSection('profile')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-colors ${activeSection === 'profile' ? 'font-semibold' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`} style={activeSection === 'profile' ? { backgroundColor: `${PRIMARY}1A`, color: PRIMARY } : undefined}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              <span className="text-sm">{locale === 'tr' ? 'Profil' : 'Profile'}</span>
            </button>
            <button type="button" onClick={() => scrollToSection('account')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-colors ${activeSection === 'account' ? 'font-semibold' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`} style={activeSection === 'account' ? { backgroundColor: `${PRIMARY}1A`, color: PRIMARY } : undefined}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              <span className="text-sm">{locale === 'tr' ? 'Hesap' : 'Account'}</span>
            </button>
            <button type="button" onClick={() => scrollToSection('appearance')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-colors ${activeSection === 'appearance' ? 'font-semibold' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`} style={activeSection === 'appearance' ? { backgroundColor: `${PRIMARY}1A`, color: PRIMARY } : undefined}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>
              <span className="text-sm">{locale === 'tr' ? 'Görünüm' : 'Appearance'}</span>
            </button>
            <button type="button" onClick={() => scrollToSection('notifications')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-colors ${activeSection === 'notifications' ? 'font-semibold' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`} style={activeSection === 'notifications' ? { backgroundColor: `${PRIMARY}1A`, color: PRIMARY } : undefined}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
              <span className="text-sm">{locale === 'tr' ? 'Bildirimler' : 'Notifications'}</span>
            </button>
          </div>
          <div className="mt-8 space-y-1">
            <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{locale === 'tr' ? 'Uygulama' : 'App Settings'}</p>
            <button type="button" onClick={onOpenPro} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
              <span className="text-sm">{locale === 'tr' ? 'Abonelik' : 'Subscription'}</span>
            </button>
          </div>
          <div className="mt-auto pt-10">
            <div className="p-4 rounded-xl border" style={{ backgroundColor: `${PRIMARY}0D`, borderColor: `${PRIMARY}33` }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase" style={{ color: PRIMARY }}>{locale === 'tr' ? 'Pro Plan' : 'Pro Plan'}</span>
                {isPro && <svg className="w-4 h-4" style={{ color: PRIMARY }} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                {isPro ? (locale === 'tr' ? 'Mevcut fatura döneminizde 12 gün kaldı.' : 'You have 12 days left on your current billing cycle.') : (locale === 'tr' ? 'Tüm özellikleri açmak için yükseltin.' : 'Upgrade to unlock all features.')}
              </p>
              <button type="button" onClick={onOpenPro} className="w-full py-2 text-xs font-bold text-white rounded-lg hover:opacity-90 transition-colors" style={{ backgroundColor: PRIMARY }}>
                {locale === 'tr' ? 'Faturalamayı Yönet' : 'Manage Billing'}
              </button>
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto">
      <div className="w-full max-w-3xl mx-auto px-4 md:px-8 py-6 space-y-6">
        {/* Profil - scroll target */}
        <div ref={profileRef} />
        {/* Profil Kartı – tıklanınca Profil ekranına gider */}
        <div
          className="sticky top-0 z-30"
          style={{ backgroundColor: dark ? BG_DARK : BG_LIGHT, paddingTop: '1rem', paddingBottom: '0.5rem' }}
        >
          <button
            type="button"
            onClick={onOpenProfile}
            className={`w-full rounded-xl p-5 text-left transition-all border shadow-sm hover:shadow-md ${
              dark ? 'bg-slate-900 border-slate-800 hover:bg-slate-800/80' : 'bg-white border-slate-200 hover:bg-slate-50/80'
            }`}
          >
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold text-white"
                style={{ backgroundColor: PRIMARY }}
              >
                {userInitial}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className={`text-base font-bold ${dark ? 'text-white' : 'text-slate-900'}`}>
                  {userDisplayTitle}
                </h2>
                <p className={`text-sm truncate ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{userSubtitle}</p>
                <span
                  className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                    isMock ? (dark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600') : ''
                  }`}
                  style={!isMock ? { backgroundColor: `${PRIMARY}20`, color: PRIMARY } : undefined}
                >
                  {isMock ? 'Misafir' : 'Kayıtlı Hesap'}
                </span>
              </div>
              <svg className={`w-5 h-5 flex-shrink-0 ${dark ? 'text-slate-500' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        </div>

        {/* Pro: üyeyse bilgi, değilse yükselt butonu */}
        {isPro ? (
          <div className={`w-full rounded-xl p-5 text-left border ${dark ? 'bg-[#f97316]/10 border-[#f97316]/30' : 'bg-[#f97316]/5 border-[#f97316]/20'}`}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl text-white" style={{ backgroundColor: PRIMARY }}>
                <span className="text-2xl">👑</span>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-bold" style={{ color: PRIMARY }}>
                  {locale === 'tr' ? 'Pro üyesisiniz' : 'You are Pro'}
                </h2>
                <p className={`text-sm mt-0.5 ${dark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {locale === 'tr' ? 'Tüm Pro özellikleri açık' : 'All Pro features are enabled'}
                </p>
              </div>
            </div>
            {onExitPro && (
              <button
                type="button"
                onClick={onExitPro}
                className={`mt-4 w-full py-2.5 rounded-lg text-sm font-medium transition-colors border ${dark ? 'text-slate-400 hover:bg-slate-800/60 border-slate-700' : 'text-slate-600 hover:bg-slate-100 border-slate-200'}`}
              >
                {locale === 'tr' ? "Pro'dan çık (test)" : 'Exit Pro (test)'}
              </button>
            )}
          </div>
        ) : onOpenPro ? (
          <button
            type="button"
            onClick={onOpenPro}
            className={`w-full rounded-xl p-5 text-left transition-all border shadow-sm hover:shadow-md ${dark ? 'bg-[#f97316]/10 border-[#f97316]/30 hover:bg-[#f97316]/15' : 'bg-[#f97316]/5 border-[#f97316]/20 hover:bg-[#f97316]/10'}`}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl text-white" style={{ backgroundColor: PRIMARY }}>
                <span className="text-2xl">👑</span>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-bold" style={{ color: PRIMARY }}>
                  {t('settings.upgradePro', locale)}
                </h2>
                <p className={`text-sm mt-0.5 ${dark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {locale === 'tr' ? 'Tüm özelliklerin kilidini aç' : 'Unlock all features'}
                </p>
              </div>
              <svg className="w-5 h-5 flex-shrink-0" style={{ color: PRIMARY }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        ) : null}

        {/* Genel Ayarlar / Appearance scroll target */}
        <div ref={appearanceRef}>
          <h3 className={`text-xs font-semibold uppercase tracking-wider px-1 mb-3 ${dark ? 'text-slate-500' : 'text-slate-500'}`}>Genel</h3>
          <div className={`rounded-xl overflow-hidden divide-y border shadow-sm ${dark ? 'bg-slate-900 border-slate-800 divide-slate-800' : 'bg-white border-slate-200 divide-slate-100'}`}>
            <div ref={notificationsRef} />
            {onShowOnboarding && (
              <button
                type="button"
                onClick={onShowOnboarding}
                className={`w-full flex items-center justify-between px-5 py-4 ${dark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'} transition-colors text-left`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${PRIMARY}20` }}>
                    <svg className="w-5 h-5" style={{ color: PRIMARY }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className={`font-medium ${dark ? 'text-slate-100' : 'text-slate-900'}`}>{locale === 'tr' ? "Hoş geldin ekranını tekrar gör" : 'Show welcome screens again'}</span>
                </div>
                <svg className={`w-5 h-5 flex-shrink-0 ${dark ? 'text-slate-500' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}

            <div className={`flex items-center justify-between px-5 py-4 ${dark ? 'hover:bg-slate-800/50' : ''}`}>
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${dark ? 'bg-slate-800' : 'bg-red-100'}`}>
                  <svg className={`w-5 h-5 ${dark ? 'text-red-400' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <span className={`font-medium ${dark ? 'text-slate-100' : 'text-slate-900'}`}>{t('settings.notifications', locale)}</span>
              </div>
              <Toggle
                enabled={notifications}
                onChange={() => {
                  const next = !notifications;
                  setNotifications(next);
                  setNotificationsEnabled(next);
                  if (next && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
                    Notification.requestPermission();
                  }
                }}
              />
            </div>

            {notifications && (
              <>
                <div className={`flex items-center justify-between px-5 py-3 ${dark ? 'hover:bg-slate-800/50' : ''}`}>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm ${dark ? 'text-slate-300' : 'text-slate-700'}`}>{locale === 'tr' ? 'Günlük özet' : 'Daily digest'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={dailyDigestTime}
                      onChange={(e) => {
                        const v = e.target.value;
                        setDailyDigestTime(v);
                        persistDailyDigestTime(v);
                      }}
                      className={`text-sm rounded-lg border px-2 py-1.5 ${dark ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                    />
                    <Toggle
                      enabled={dailyDigest}
                      onChange={() => {
                        const next = !dailyDigest;
                        setDailyDigest(next);
                        setDailyDigestEnabled(next);
                      }}
                    />
                  </div>
                </div>
                <div className={`flex items-center justify-between px-5 py-3 ${dark ? 'hover:bg-slate-800/50' : ''}`}>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm ${dark ? 'text-slate-300' : 'text-slate-700'}`}>{locale === 'tr' ? 'Gecikmiş görev uyarısı' : 'Overdue reminder'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={overdueReminderTime}
                      onChange={(e) => {
                        const v = e.target.value;
                        setOverdueReminderTime(v);
                        persistOverdueReminderTime(v);
                      }}
                      className={`text-sm rounded-lg border px-2 py-1.5 ${dark ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                    />
                    <Toggle
                      enabled={overdueReminder}
                      onChange={() => {
                        const next = !overdueReminder;
                        setOverdueReminder(next);
                        setOverdueReminderEnabled(next);
                      }}
                    />
                  </div>
                </div>
                <div className={`flex items-center justify-between px-5 py-3 ${dark ? 'hover:bg-slate-800/50' : ''}`}>
                  <span className={`text-sm ${dark ? 'text-slate-300' : 'text-slate-700'}`}>{locale === 'tr' ? 'Bildirim sesi' : 'Notification sound'}</span>
                  <select
                    value={notificationSound}
                    onChange={(e) => {
                      const v = e.target.value as NotificationSound;
                      setNotificationSoundState(v);
                      setNotificationSound(v);
                    }}
                    className={`text-sm rounded-lg border px-2 py-1.5 ${dark ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                  >
                    <option value="default">{locale === 'tr' ? 'Varsayılan' : 'Default'}</option>
                    <option value="silent">{locale === 'tr' ? 'Sessiz' : 'Silent'}</option>
                    {isPro && (
                      <>
                        <option value="chime">{locale === 'tr' ? 'Zil (Pro)' : 'Chime (Pro)'}</option>
                        <option value="bell">{locale === 'tr' ? 'Çan (Pro)' : 'Bell (Pro)'}</option>
                        <option value="gentle">{locale === 'tr' ? 'Yumuşak (Pro)' : 'Gentle (Pro)'}</option>
                      </>
                    )}
                  </select>
                </div>
              </>
            )}

            {isPro && (
              <div className={`px-5 py-3 ${dark ? 'border-b border-slate-800' : 'border-b border-slate-100'}`}>
                <div className={`text-sm font-medium mb-2 ${dark ? 'text-slate-300' : 'text-slate-700'}`}>
                  {locale === 'tr' ? 'Alt menü sekmeleri (Pro)' : 'Bottom nav tabs (Pro)'}
                </div>
                <div className="flex flex-wrap gap-2">
                  {DEFAULT_NAV_TABS.map((tabId) => {
                    const label = locale === 'tr'
                      ? { home: 'Ana Sayfa', tasks: 'Görevler', calendar: 'Takvim', 'add-task': 'Ekle', categories: 'Listeler', settings: 'Ayarlar' }[tabId] ?? tabId
                      : { home: 'Home', tasks: 'Tasks', calendar: 'Calendar', 'add-task': 'Add', categories: 'Categories', settings: 'Settings' }[tabId] ?? tabId;
                    const isOn = visibleNavTabs.includes(tabId);
                    return (
                      <label
                        key={tabId}
                        className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm cursor-pointer ${
                          dark ? 'bg-slate-800' : 'bg-slate-100'
                        } ${isOn ? '' : (dark ? 'text-slate-500' : 'text-slate-500')}`}
                        style={isOn ? { color: PRIMARY } : undefined}
                      >
                        <input
                          type="checkbox"
                          checked={isOn}
                          onChange={() => {
                            const next = isOn
                              ? visibleNavTabs.filter(t => t !== tabId)
                              : [...visibleNavTabs, tabId].sort((a, b) => DEFAULT_NAV_TABS.indexOf(a as 'home') - DEFAULT_NAV_TABS.indexOf(b as 'home'));
                            if (next.length === 0) return;
                            setVisibleNavTabs(next);
                            setVisibleNavTabsState(next);
                            onNavTabsChange?.(next);
                          }}
                          className="rounded border-stone-300"
                        />
                        {label}
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowLangModal(true)}
              className={`w-full flex items-center justify-between px-5 py-4 transition-colors ${dark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${dark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                  <svg className={`w-5 h-5 ${dark ? 'text-slate-400' : 'text-slate-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                  </svg>
                </div>
                <span className={`font-medium ${dark ? 'text-slate-100' : 'text-slate-900'}`}>{t('settings.language', locale)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm ${dark ? 'text-slate-500' : 'text-slate-500'}`}>{getLocaleLabel(locale)}</span>
                <svg className={`w-4 h-4 ${dark ? 'text-slate-500' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          </div>
        </div>

        {/* Ana ekrana ekle / Widget kısayolu (Free) */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider px-1 mb-3 text-slate-500">{locale === 'tr' ? 'Kısayol' : 'Shortcut'}</h3>
          <div className={`rounded-xl p-5 border shadow-sm ${dark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl" style={{ backgroundColor: `${PRIMARY}20` }}>
                📱
              </div>
              <div>
                <h4 className={`font-semibold ${dark ? 'text-white' : 'text-slate-900'}`}>{locale === 'tr' ? 'Ana ekrana ekle' : 'Add to Home Screen'}</h4>
                <p className={`text-sm mt-0.5 ${dark ? 'text-slate-500' : 'text-slate-500'}`}>
                  {locale === 'tr' ? 'Tarayıcı menüsünden "Ana ekrana ekle" veya "Uygulama olarak yükle" ile hızlı erişim.' : 'Use browser menu "Add to Home Screen" for quick access.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Şablonlarım (Free) */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider px-1 mb-3 text-slate-500">{locale === 'tr' ? 'Şablonlarım' : 'My templates'}</h3>
          <div className={`rounded-xl overflow-hidden border shadow-sm ${dark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            {templates.length === 0 ? (
              <div className={`px-5 py-6 text-center text-sm ${dark ? 'text-slate-500' : 'text-slate-500'}`}>
                {locale === 'tr' ? 'Henüz şablon yok. Görev düzenlerken "Şablon olarak kaydet" ile ekleyebilirsin.' : 'No templates yet. Save a task as template from the task edit screen.'}
              </div>
            ) : (
              <ul className={`divide-y ${dark ? 'divide-slate-800' : 'divide-slate-100'}`}>
                {templates.map((t) => (
                  <li key={t.id} className={`flex items-center justify-between px-5 py-4 ${dark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}`}>
                    <div className="min-w-0 flex-1">
                      <div className={`font-medium truncate ${dark ? 'text-slate-100' : 'text-slate-900'}`}>{t.name}</div>
                      <div className={`text-sm truncate ${dark ? 'text-slate-500' : 'text-slate-500'}`}>{t.title}</div>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        await deleteTemplateFromSupabase(userId, t.id);
                        setTemplates((prev) => prev.filter((x) => x.id !== t.id));
                        showToast(locale === 'tr' ? 'Şablon silindi' : 'Template deleted', 'info');
                      }}
                      className={`ml-2 p-2 rounded-lg shrink-0 ${dark ? 'text-slate-400 hover:bg-slate-800 hover:text-red-400' : 'text-slate-400 hover:bg-red-50 hover:text-red-600'}`}
                      aria-label={locale === 'tr' ? 'Şablonu sil' : 'Delete template'}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Pomodoro İstatistikleri */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider px-1 mb-3 text-slate-500">Üretkenlik</h3>
          <div className={`rounded-xl p-5 mb-4 border shadow-sm ${dark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center justify-between mb-4">
              <h4 className={`text-base font-bold ${dark ? 'text-white' : 'text-slate-900'}`}>🍅 Pomodoro</h4>
              <span className="text-xs text-slate-500">Toplam Odaklanma</span>
            </div>
            <div className="grid grid-cols-4 gap-3 mb-4">
              <div className="text-center">
                <div className="text-xl font-bold mb-0.5" style={{ color: PRIMARY }}>{getTodayPomodoroCount(userId)}</div>
                <div className="text-[10px] text-slate-500">Bugün</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold mb-0.5" style={{ color: PRIMARY }}>{getWeekPomodoroCount(userId)}</div>
                <div className="text-[10px] text-slate-500">Bu Hafta</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold mb-0.5" style={{ color: PRIMARY }}>{getMonthPomodoroCount(userId)}</div>
                <div className="text-[10px] text-slate-500">Bu Ay</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold mb-0.5" style={{ color: PRIMARY }}>{getPomodoroStreak(userId)}</div>
                <div className="text-[10px] text-slate-500">Streak 🔥</div>
              </div>
            </div>
            <div className={`rounded-lg p-3 ${dark ? 'bg-slate-800/80 border border-slate-700' : 'bg-[#f97316]/10 border border-[#f97316]/20'}`}>
              <div className="flex items-center justify-between">
                <span className={`text-sm font-medium ${dark ? 'text-slate-300' : 'text-slate-700'}`}>Toplam Odaklanma Süresi</span>
                <span className="text-sm font-bold" style={{ color: PRIMARY }}>
                  {Math.floor(getTotalFocusTime(userId) / 60)}s {getTotalFocusTime(userId) % 60}dk
                </span>
              </div>
            </div>
          </div>

          <div className={`rounded-xl p-5 mb-4 border shadow-sm ${dark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <h4 className={`text-sm font-semibold mb-4 ${dark ? 'text-white' : 'text-slate-900'}`}>Son 7 Gün</h4>
            <div className="flex items-end justify-between h-32 gap-2">
              {getWeeklyPomodoroDistribution(userId).map((day, idx) => {
                const maxCount = Math.max(...getWeeklyPomodoroDistribution(userId).map(d => d.count), 1);
                const height = (day.count / maxCount) * 100;
                const dayName = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'][new Date(day.date).getDay() === 0 ? 6 : new Date(day.date).getDay() - 1];
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                    <div className="relative w-full flex items-end justify-center" style={{ height: '100px' }}>
                      <div
                        className={`w-full rounded-t-lg transition-all ${day.count > 0 ? '' : (dark ? 'bg-slate-700' : 'bg-slate-200')}`}
                        style={day.count > 0 ? { backgroundColor: PRIMARY } : undefined}
                        style={{ height: `${height}%` }}
                      >
                        {day.count > 0 && <div className="text-xs font-bold text-white text-center pt-1">{day.count}</div>}
                      </div>
                    </div>
                    <div className="text-[10px] font-medium text-slate-500">{dayName}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {(() => {
            const records = getPomodoroRecords(userId);
            const categories = getMockCategories(userId);
            const categoryBreakdown = categories.map(cat => ({
              ...cat,
              count: records.filter(r => r.category === cat.id && r.type === 'work').length,
            })).filter(c => c.count > 0).sort((a, b) => b.count - a.count);
            if (categoryBreakdown.length === 0) return null;
            const totalCategoryPomodoros = categoryBreakdown.reduce((sum, c) => sum + c.count, 0);
            return (
              <div className={`rounded-xl p-4 ${dark ? 'bg-zinc-900/60 border border-zinc-800' : 'bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)] border border-stone-100'}`}>
                <h4 className={`text-sm font-semibold mb-4 ${dark ? 'text-white' : 'text-stone-900'}`}>Kategori Dağılımı</h4>
                <div className="space-y-3">
                  {categoryBreakdown.map(cat => (
                    <div key={cat.id}>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-sm flex items-center gap-2 ${dark ? 'text-zinc-300' : 'text-stone-700'}`}>
                          <span className="text-lg">{cat.icon}</span>
                          {cat.name}
                        </span>
                        <span className="text-sm font-bold" style={{ color: PRIMARY }}>{cat.count} 🍅</span>
                      </div>
                      <div className={`w-full rounded-full h-2 ${dark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                        <div className="h-2 rounded-full transition-all" style={{ width: `${(cat.count / totalCategoryPomodoros) * 100}%`, backgroundColor: PRIMARY }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>

        {/* Veri Yönetimi / Account scroll target */}
        <div ref={accountRef}>
          <h3 className="text-xs font-semibold uppercase tracking-wider px-1 mb-3 text-slate-500">Veri Yönetimi</h3>
          <div className={`rounded-xl overflow-hidden divide-y border shadow-sm ${dark ? 'bg-slate-900 border-slate-800 divide-slate-800' : 'bg-white border-slate-200 divide-slate-100'}`}>
            <button
              onClick={isPro ? handleExportData : () => onOpenPro?.()}
              disabled={isPro && exporting}
              className={`w-full flex items-center justify-between px-5 py-4 transition-colors ${dark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${dark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                  <svg className={`w-5 h-5 ${dark ? 'text-slate-400' : 'text-slate-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </div>
                <span className={`font-medium ${dark ? 'text-slate-100' : 'text-slate-900'}`}>{t('settings.export', locale)}</span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase" style={{ backgroundColor: `${PRIMARY}25`, color: PRIMARY }}>Pro</span>
              </div>
              {isPro && exporting ? (
                <span className="text-xs text-slate-500">{locale === 'tr' ? 'Hazırlanıyor...' : 'Preparing...'}</span>
              ) : !isPro ? (
                <svg className="w-4 h-4" style={{ color: PRIMARY }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              ) : (
                <svg className={`w-4 h-4 ${dark ? 'text-slate-500' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
            </button>
            <button
              onClick={isPro ? handleExportCsv : () => onOpenPro?.()}
              disabled={isPro && exporting}
              className={`w-full flex items-center justify-between px-5 py-4 transition-colors ${dark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${dark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                  <svg className={`w-5 h-5 ${dark ? 'text-slate-400' : 'text-slate-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span className={`font-medium ${dark ? 'text-slate-100' : 'text-slate-900'}`}>{locale === 'tr' ? 'Görevleri CSV olarak indir' : 'Export tasks as CSV'}</span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase" style={{ backgroundColor: `${PRIMARY}25`, color: PRIMARY }}>Pro</span>
              </div>
              {isPro && exporting ? (
                <span className="text-xs text-slate-500">{locale === 'tr' ? 'Hazırlanıyor...' : 'Preparing...'}</span>
              ) : !isPro ? (
                <svg className="w-4 h-4" style={{ color: PRIMARY }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              ) : (
                <svg className={`w-4 h-4 ${dark ? 'text-slate-500' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
            </button>
            <button onClick={handleArchiveCompleted} className={`w-full flex items-center justify-between px-5 py-4 transition-colors ${dark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${dark ? 'bg-slate-800' : 'bg-[#f97316]/10'}`}>
                  <svg className="w-5 h-5" style={{ color: dark ? '#f97316' : PRIMARY }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                </div>
                <span className={`font-medium ${dark ? 'text-slate-100' : 'text-slate-900'}`}>{t('settings.archive', locale)}</span>
              </div>
              <svg className={`w-4 h-4 ${dark ? 'text-slate-500' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button onClick={() => setShowDeleteConfirm(true)} className={`w-full flex items-center justify-between px-5 py-4 transition-colors ${dark ? 'hover:bg-red-900/20' : 'hover:bg-red-50'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${dark ? 'bg-red-900/40' : 'bg-red-100'}`}>
                  <svg className={`w-5 h-5 ${dark ? 'text-red-400' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <span className={`font-medium ${dark ? 'text-red-400' : 'text-red-600'}`}>{t('settings.deleteAll', locale)}</span>
              </div>
              <svg className={`w-4 h-4 ${dark ? 'text-slate-500' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Hakkında */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider px-1 mb-3 text-slate-500">Hakkında</h3>
          <div className={`rounded-xl overflow-hidden divide-y border shadow-sm ${dark ? 'bg-slate-900 border-slate-800 divide-slate-800' : 'bg-white border-slate-200 divide-slate-100'}`}>
            <div className="flex items-center justify-between px-5 py-4">
              <span className={`font-medium ${dark ? 'text-slate-100' : 'text-slate-900'}`}>{t('settings.version', locale)}</span>
              <span className="text-sm text-slate-500">v1.0.0</span>
            </div>
            <button type="button" onClick={() => setShowPrivacyModal(true)} className={`w-full flex items-center justify-between px-5 py-4 transition-colors ${dark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}`}>
              <span className={`font-medium ${dark ? 'text-slate-100' : 'text-slate-900'}`}>{t('settings.privacy', locale)}</span>
              <svg className={`w-4 h-4 ${dark ? 'text-slate-500' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button type="button" onClick={() => setShowTermsModal(true)} className={`w-full flex items-center justify-between px-5 py-4 transition-colors ${dark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}`}>
              <span className={`font-medium ${dark ? 'text-slate-100' : 'text-slate-900'}`}>{t('settings.terms', locale)}</span>
              <svg className={`w-4 h-4 ${dark ? 'text-slate-500' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        <button
          onClick={() => setShowLogoutConfirm(true)}
          className={`w-full py-3 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${
            dark ? 'bg-red-900/30 border border-red-800 text-red-400 hover:bg-red-900/50' : 'bg-white border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 shadow-sm'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {t('settings.logout', locale)}
        </button>

        <p className="text-center text-xs pb-8 text-slate-500">TaskFlow v1.0.0</p>
      </div>
        </main>
      </div>

      {showLogoutConfirm && (
        <Modal open dark={dark} onClose={() => setShowLogoutConfirm(false)} maxWidth="sm">
          <div className="text-center mb-6">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4 ${dark ? 'bg-red-900/40' : 'bg-red-100'}`}>
              <svg className={`w-8 h-8 ${dark ? 'text-red-400' : 'text-red-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
            <h3 className={`text-base font-bold mb-2 ${dark ? 'text-white' : 'text-stone-900'}`}>Çıkış Yap</h3>
            <p className={`text-sm ${dark ? 'text-zinc-400' : 'text-stone-600'}`}>Hesabından çıkış yapmak istediğine emin misin?</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowLogoutConfirm(false)} className={`flex-1 py-3 rounded-xl font-semibold transition-all ${dark ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'}`}>
              İptal
            </button>
            <button onClick={handleLogout} className="flex-1 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-all">
              Çıkış Yap
            </button>
          </div>
        </Modal>
      )}

      {showDeleteConfirm && (
        <Modal open dark={dark} onClose={() => setShowDeleteConfirm(false)} maxWidth="sm">
          <div className="text-center mb-6">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4 ${dark ? 'bg-red-900/40' : 'bg-red-100'}`}>
              <svg className={`w-8 h-8 ${dark ? 'text-red-400' : 'text-red-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className={`text-base font-bold mb-2 ${dark ? 'text-white' : 'text-stone-900'}`}>{t('settings.deleteAll', locale)}</h3>
            <p className={`text-sm ${dark ? 'text-zinc-400' : 'text-stone-600'}`}>{locale === 'tr' ? 'Tüm görevlerin ve kategorilerin silinecek. Bu işlem geri alınamaz.' : 'All your tasks and categories will be deleted. This cannot be undone.'}</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowDeleteConfirm(false)} className={`flex-1 py-3 rounded-xl font-semibold transition-all ${dark ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'}`}>
              {locale === 'tr' ? 'İptal' : 'Cancel'}
            </button>
            <button onClick={handleDeleteAllData} className="flex-1 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-all">
              {locale === 'tr' ? 'Tümünü Sil' : 'Delete All'}
            </button>
          </div>
        </Modal>
      )}

      {showLangModal && (
        <Modal open dark={dark} onClose={() => setShowLangModal(false)} maxWidth="sm">
          <h3 className={`text-base font-bold mb-4 ${dark ? 'text-white' : 'text-stone-900'}`}>{t('settings.language', locale)}</h3>
          <div className="space-y-2">
            {SUPPORTED_LOCALES.map((loc) => (
              <button
                key={loc}
                type="button"
                onClick={() => { setLocale(loc); setShowLangModal(false); }}
                className={`w-full py-3.5 rounded-xl font-medium transition-all text-left px-4 ${locale === loc ? (dark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700') : (dark ? 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700' : 'bg-stone-100 text-stone-800 hover:bg-stone-200')}`}
              >
                {getLocaleLabel(loc)}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => setShowLangModal(false)} className={`mt-4 w-full py-2.5 rounded-xl font-medium ${dark ? 'text-zinc-400 hover:bg-zinc-800' : 'text-stone-500 hover:bg-stone-100'}`}>
            {t('common.close', locale)}
          </button>
        </Modal>
      )}

      {showPrivacyModal && (
        <Modal open dark={dark} onClose={() => setShowPrivacyModal(false)} maxWidth="sm" contentClassName="max-h-[80vh] overflow-y-auto">
          <h3 className={`text-base font-bold mb-3 ${dark ? 'text-white' : 'text-stone-900'}`}>{t('settings.privacy', locale)}</h3>
          <p className={`text-sm ${dark ? 'text-zinc-400' : 'text-stone-600'}`}>
            {locale === 'tr'
              ? 'Gizlilik politikası metni burada yer alacaktır. Uygulama verilerinizi yalnızca hesabınız ve cihazınızla sınırlı tutar; üçüncü taraflarla paylaşmayız.'
              : 'Privacy policy text will appear here. We keep your data limited to your account and device and do not share with third parties.'}
          </p>
          <button type="button" onClick={() => setShowPrivacyModal(false)} className={`mt-4 w-full py-2.5 rounded-xl font-medium ${dark ? 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700' : 'bg-stone-100 text-stone-800 hover:bg-stone-200'}`}>
            {t('common.close', locale)}
          </button>
        </Modal>
      )}

      {showTermsModal && (
        <Modal open dark={dark} onClose={() => setShowTermsModal(false)} maxWidth="sm" contentClassName="max-h-[80vh] overflow-y-auto">
          <h3 className={`text-base font-bold mb-3 ${dark ? 'text-white' : 'text-stone-900'}`}>{t('settings.terms', locale)}</h3>
          <p className={`text-sm ${dark ? 'text-zinc-400' : 'text-stone-600'}`}>
            {locale === 'tr'
              ? 'Kullanım şartları metni burada yer alacaktır. Uygulamayı kullanarak bu şartları kabul etmiş sayılırsınız.'
              : 'Terms of use text will appear here. By using the app you agree to these terms.'}
          </p>
          <button type="button" onClick={() => setShowTermsModal(false)} className={`mt-4 w-full py-2.5 rounded-xl font-medium ${dark ? 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700' : 'bg-stone-100 text-stone-800 hover:bg-stone-200'}`}>
            {t('common.close', locale)}
          </button>
        </Modal>
      )}
    </div>
  );
}
