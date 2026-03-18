'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@cursor-deneme/shared';
import { isMockUser, getTodayPomodoroCount, getWeekPomodoroCount, getMonthPomodoroCount, getPomodoroStreak, getTotalFocusTime, getWeeklyPomodoroDistribution, getPomodoroRecords, getMockCategories, getProfile, fetchTasksFromSupabase, fetchTemplates, deleteTemplateFromSupabase, getPomodoroWorkDuration, setPomodoroWorkDuration, getPomodoroBreakDuration, setPomodoroBreakDuration } from '@cursor-deneme/shared';
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

// Lybell marka renkleri
const PRIMARY = '#1A2332';
const BG_LIGHT = '#f8f6f6';
const BG_DARK = '#1A2332';
const CARD_DARK = '#2a1f1a';
const BORDER_DARK = '#3d2a1f';
const TEXT_DARK = '#f5f0ea';
const TEXT_MUTED = '#b8a99e';

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
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLangModal, setShowLangModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [visibleNavTabs, setVisibleNavTabsState] = useState<string[]>(() => getVisibleNavTabs(true));
  const [showDeleteAccountConfirm, setShowDeleteAccountConfirm] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  useEffect(() => {
    if (isPro) setVisibleNavTabsState(getVisibleNavTabs(true));
  }, [isPro]);

  useEffect(() => {
    getProfile(userId).then((p) => setDisplayName(p.displayName || null));
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

  const Toggle = ({ enabled, onChange }: { enabled: boolean; onChange: () => void }) => (
    <button
      onClick={onChange}
      className="relative w-12 h-7 rounded-full transition-all duration-300 bg-slate-300"
      style={enabled ? { backgroundColor: PRIMARY } : dark ? { backgroundColor: BORDER_DARK } : undefined}
    >
      <div
        className="absolute top-0.5 w-6 h-6 rounded-full shadow-md transition-all duration-300 bg-white"
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

  const weekFocusMinutes = getWeeklyPomodoroDistribution(userId).reduce((sum, d) => sum + d.count * (getPomodoroWorkDuration(userId) || 25), 0);
  const focusHoursLabel = `${(weekFocusMinutes / 60).toFixed(1)} sa`;

  const handleDeleteAccount = async () => {
    setDeletingAccount(true);
    try {
      if (isMock) {
        localStorage.removeItem('mock_user_id');
        localStorage.removeItem(`onboarding_${userId}`);
        localStorage.removeItem(`mock_tasks_${userId}`);
        localStorage.removeItem(`mock_categories_${userId}`);
        showToast(locale === 'tr' ? 'Misafir hesabın temizlendi.' : 'Guest account cleared.', 'success');
        onLogout();
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      if (!accessToken) {
        showToast(locale === 'tr' ? 'Oturum bulunamadı. Lütfen tekrar giriş yap.' : 'No active session. Please sign in again.', 'error');
        return;
      }

      const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gtwugoklzczszvueacxm.supabase.co';
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

      const res = await fetch(`${baseUrl}/functions/v1/delete-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(anonKey ? { apikey: anonKey, Authorization: `Bearer ${anonKey}` } : {}),
        },
        body: JSON.stringify({ accessToken }),
      });

      if (!res.ok) {
        let extra = '';
        try {
          const body = await res.json();
          if (body?.error || body?.reason) {
            extra = ` (${body.error || body.reason})`;
          }
        } catch {
          // ignore
        }
        showToast(
          locale === 'tr'
            ? `Hesap silme işlemi başarısız oldu.${extra}`
            : `Account deletion failed.${extra}`,
          'error',
        );
        return;
      }

      await supabase.auth.signOut();
      showToast(locale === 'tr' ? 'Hesabın kalıcı olarak silindi.' : 'Your account has been deleted.', 'success');
      onLogout();
    } catch {
      showToast(locale === 'tr' ? 'Hesap silme sırasında bir hata oluştu.' : 'Error deleting account.', 'error');
    } finally {
      setDeletingAccount(false);
      setShowDeleteAccountConfirm(false);
    }
  };

  return (
    <div className={`flex flex-col flex-1 min-h-0 overflow-auto ${dark ? '' : ''}`} style={{ backgroundColor: dark ? BG_DARK : BG_LIGHT }}>
      <div className="max-w-md mx-auto w-full relative pb-[100px]">
        {/* Safe area header */}
        <div className="h-20 flex items-end px-6 pb-2">
          {onBack && (
            <button type="button" onClick={onBack} className="absolute left-4 top-8 w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors" style={dark ? { color: TEXT_MUTED } : undefined} aria-label={locale === 'tr' ? 'Geri' : 'Back'}>
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
          )}
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: dark ? TEXT_DARK : '#1a1a1a' }}>{t('settings.title', locale)}</h1>
        </div>

        {/* User Profile Card */}
        <div className="px-4 mt-4">
          <div className={`bg-white rounded-xl p-5 shadow-sm flex items-center justify-between border border-slate-100 ${onOpenProfile ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`} style={dark ? { backgroundColor: CARD_DARK, borderColor: BORDER_DARK } : undefined} onClick={onOpenProfile ? () => onOpenProfile() : undefined} role={onOpenProfile ? 'button' : undefined}>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold border-2 shrink-0" style={{ backgroundColor: `${PRIMARY}1A`, color: PRIMARY, borderColor: `${PRIMARY}33` }}>
                {userInitial}
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-bold truncate" style={{ color: dark ? TEXT_DARK : '#1a1a1a' }}>{userDisplayTitle}</h2>
                <p className="text-slate-500 text-sm" style={dark ? { color: TEXT_MUTED } : undefined}>
                  {isPro ? (locale === 'tr' ? 'Pro Üye' : 'Premium Member') : userSubtitle}
                </p>
              </div>
            </div>
            {onOpenProfile && (
              <button type="button" onClick={(e) => { e.stopPropagation(); onOpenProfile(); }} className="p-2 text-slate-400 hover:opacity-80 transition-colors rounded-lg" style={{ color: PRIMARY }} aria-label={locale === 'tr' ? 'Profili düzenle' : 'Edit profile'}>
                <span className="material-symbols-outlined">edit</span>
              </button>
            )}
          </div>
        </div>

        {/* Pro Upgrade Banner */}
        {!isPro && onOpenPro && (
          <div className="px-4 mt-6">
            <div className="rounded-xl p-5 flex items-center justify-between border" style={{ backgroundColor: `${PRIMARY}0D`, borderColor: `${PRIMARY}1A` }}>
              <div className="flex flex-col gap-1 pr-4 min-w-0">
                <p className="font-bold text-sm uppercase tracking-wider" style={{ color: PRIMARY }}>Lybell Pro</p>
              </div>
              <button type="button" onClick={onOpenPro} className="text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-md shrink-0" style={{ backgroundColor: PRIMARY, boxShadow: `${PRIMARY}33 0 4px 14px` }}>
                {locale === 'tr' ? 'Yükselt' : 'Upgrade'}
              </button>
            </div>
          </div>
        )}
        {isPro && onExitPro && (
          <div className="px-4 mt-4">
            <button type="button" onClick={onExitPro} className="text-sm text-slate-500 hover:underline" style={dark ? { color: TEXT_MUTED } : undefined}>{locale === 'tr' ? "Pro'dan çık (test)" : 'Exit Pro (test)'}</button>
          </div>
        )}

        {/* General Section */}
        <div className="mt-8">
          <h3 className="px-6 text-xs font-bold uppercase tracking-widest mb-3" style={{ color: dark ? TEXT_MUTED : '#64748b' }}>{locale === 'tr' ? 'Genel' : 'General'}</h3>
          <div className="bg-white mx-4 rounded-xl overflow-hidden shadow-sm border border-slate-100" style={dark ? { backgroundColor: CARD_DARK, borderColor: BORDER_DARK } : undefined}>
            {onShowOnboarding && (
              <button type="button" onClick={onShowOnboarding} className="w-full flex items-center justify-between px-5 py-4 border-b border-slate-100 text-left hover:bg-slate-50 transition-colors" style={dark ? { borderColor: BORDER_DARK } : undefined}>
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined" style={{ color: PRIMARY }}>waving_hand</span>
                  <span className="text-sm font-medium text-slate-700" style={dark ? { color: TEXT_DARK } : undefined}>{locale === 'tr' ? 'Hoş geldin ekranı' : 'Welcome Screen'}</span>
                </div>
                <span className="relative flex h-6 w-11 items-center rounded-full shrink-0" style={{ backgroundColor: PRIMARY }}>
                  <span className="absolute left-1 h-4 w-4 rounded-full bg-white shadow" style={{ left: '1.5rem' }} />
                </span>
              </button>
            )}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100" style={dark ? { borderColor: BORDER_DARK } : undefined}>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined" style={{ color: PRIMARY }}>dark_mode</span>
                <span className="text-sm font-medium text-slate-700" style={dark ? { color: TEXT_DARK } : undefined}>{t('settings.darkMode', locale)}</span>
              </div>
              <Toggle enabled={darkMode} onChange={() => onDarkModeChange?.(!darkMode)} />
            </div>
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100" style={dark ? { borderColor: BORDER_DARK } : undefined}>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined" style={{ color: PRIMARY }}>notifications_active</span>
                <span className="text-sm font-medium text-slate-700" style={dark ? { color: TEXT_DARK } : undefined}>{t('settings.notifications', locale)}</span>
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
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100" style={dark ? { borderColor: BORDER_DARK } : undefined}>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined" style={{ color: PRIMARY }}>history_toggle_off</span>
                <span className="text-sm font-medium text-slate-700" style={dark ? { color: TEXT_DARK } : undefined}>{locale === 'tr' ? 'Günlük özet' : 'Daily Summary'}</span>
              </div>
              <button type="button" onClick={() => { const next = !dailyDigest; setDailyDigest(next); setDailyDigestEnabled(next); }} className="text-sm font-bold rounded-lg px-3 py-1 shrink-0" style={{ color: PRIMARY, backgroundColor: `${PRIMARY}1A` }}>
                {dailyDigestTime || '20:00'}
              </button>
            </div>
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100" style={dark ? { borderColor: BORDER_DARK } : undefined}>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined" style={{ color: PRIMARY }}>error_outline</span>
                <span className="text-sm font-medium text-slate-700" style={dark ? { color: TEXT_DARK } : undefined}>{locale === 'tr' ? 'Gecikme uyarısı' : 'Delay Warning'}</span>
              </div>
              <button type="button" className="text-sm font-bold rounded-lg px-3 py-1 shrink-0" style={{ color: PRIMARY, backgroundColor: `${PRIMARY}1A` }}>
                {overdueReminderTime ? overdueReminderTime.slice(0, 5) : '15 dk'}
              </button>
            </div>
            <button type="button" onClick={() => setShowLangModal(true)} className="w-full flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined" style={{ color: PRIMARY }}>language</span>
                <span className="text-sm font-medium text-slate-700" style={dark ? { color: TEXT_DARK } : undefined}>{t('settings.language', locale)}</span>
              </div>
              <span className="text-sm text-slate-500" style={dark ? { color: TEXT_MUTED } : undefined}>{getLocaleLabel(locale)}</span>
            </button>
            {notifications && (
              <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between" style={dark ? { borderColor: BORDER_DARK } : undefined}>
                <span className="text-sm text-slate-500" style={dark ? { color: TEXT_MUTED } : undefined}>{locale === 'tr' ? 'Bildirim sesi' : 'Notification sound'}</span>
                <select
                  value={notificationSound}
                  onChange={(e) => { const v = e.target.value as NotificationSound; setNotificationSoundState(v); setNotificationSound(v); }}
                  className="text-sm rounded-lg border px-2 py-1.5 bg-slate-50 border-slate-200 text-slate-900"
                  style={dark ? { backgroundColor: CARD_DARK, borderColor: BORDER_DARK, color: TEXT_DARK } : undefined}
                >
                  <option value="default">{locale === 'tr' ? 'Varsayılan' : 'Default'}</option>
                  <option value="silent">{locale === 'tr' ? 'Sessiz' : 'Silent'}</option>
                  {isPro && (<><option value="chime">{locale === 'tr' ? 'Zil (Pro)' : 'Chime (Pro)'}</option><option value="bell">{locale === 'tr' ? 'Çan (Pro)' : 'Bell (Pro)'}</option><option value="gentle">{locale === 'tr' ? 'Yumuşak (Pro)' : 'Gentle (Pro)'}</option></>)}
                </select>
              </div>
            )}
            {isPro && (
              <div className="px-5 py-4 border-t border-slate-100" style={dark ? { borderColor: BORDER_DARK } : undefined}>
                <div className="text-sm font-medium mb-2 text-slate-600" style={dark ? { color: TEXT_MUTED } : undefined}>{locale === 'tr' ? 'Alt menü sekmeleri (Pro)' : 'Bottom nav tabs (Pro)'}</div>
                <div className="flex flex-wrap gap-2">
                  {DEFAULT_NAV_TABS.map((tabId) => {
                    const label = locale === 'tr' ? { home: 'Ana Sayfa', tasks: 'Görevler', calendar: 'Takvim', categories: 'Kategoriler', profile: 'Profil' }[tabId] ?? tabId : { home: 'Home', tasks: 'Tasks', calendar: 'Calendar', categories: 'Categories', profile: 'Profile' }[tabId] ?? tabId;
                    const isOn = visibleNavTabs.includes(tabId);
                    return (
                      <label key={tabId} className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm cursor-pointer bg-slate-100 ${isOn ? '' : 'text-slate-500'}`} style={dark ? { backgroundColor: CARD_DARK, color: isOn ? PRIMARY : TEXT_MUTED } : isOn ? { color: PRIMARY } : undefined}>
                        <input type="checkbox" checked={isOn} onChange={() => { const next = isOn ? visibleNavTabs.filter(t => t !== tabId) : [...visibleNavTabs, tabId].sort((a, b) => DEFAULT_NAV_TABS.indexOf(a as 'home') - DEFAULT_NAV_TABS.indexOf(b as 'home')); if (next.length === 0) return; setVisibleNavTabs(next); setVisibleNavTabsState(next); onNavTabsChange?.(next); }} className="rounded border-stone-300" />
                        {label}
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Productivity Section */}
        <div className="mt-8">
          <h3 className="px-6 text-xs font-bold uppercase tracking-widest mb-3" style={{ color: dark ? TEXT_MUTED : '#64748b' }}>{locale === 'tr' ? 'Üretkenlik' : 'Productivity'}</h3>
          <div className="bg-white mx-4 rounded-xl p-5 shadow-sm border border-slate-100" style={dark ? { backgroundColor: CARD_DARK, borderColor: BORDER_DARK } : undefined}>
            <div className="flex justify-between items-end mb-4">
              <div>
                <p className="text-slate-400 text-xs font-medium" style={dark ? { color: TEXT_MUTED } : undefined}>{locale === 'tr' ? 'Odak saati (7 gün)' : 'Focus Hours (7 Days)'}</p>
                <p className="text-2xl font-bold mt-1" style={{ color: dark ? TEXT_DARK : '#1a1a1a' }}>{focusHoursLabel}</p>
              </div>
              <span className="text-green-500 text-xs font-bold bg-green-50 px-2 py-1 rounded-full">+12%</span>
            </div>
            <div className="flex items-end justify-between h-16 gap-1 px-1 overflow-hidden">
              {getWeeklyPomodoroDistribution(userId).map((day, i) => {
                const dist = getWeeklyPomodoroDistribution(userId);
                const maxCount = Math.max(...dist.map(d => d.count), 1);
                const pct = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
                const h = Math.max(15, pct);
                return (
                  <div key={i} className="flex-1 rounded-t-sm min-w-0" style={{ height: `${h}%`, backgroundColor: day.count > 0 ? PRIMARY : `${PRIMARY}33` }} title={`${day.count}`} />
                );
              })}
            </div>
            <div className="flex justify-between mt-2 text-[10px] text-slate-400 font-medium">
              <span>PZT</span><span>SAL</span><span>ÇAR</span><span>PER</span><span>CUM</span><span>CMT</span><span>PAZ</span>
            </div>
            {isPro && (
              <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-4" style={dark ? { borderColor: BORDER_DARK } : undefined}>
                <div>
                  <label className="block text-xs font-medium mb-2 text-slate-500" style={dark ? { color: TEXT_MUTED } : undefined}>{locale === 'tr' ? 'Çalışma (dk)' : 'Work (min)'}</label>
                  <select value={getPomodoroWorkDuration(userId)} onChange={(e) => { const v = parseInt(e.target.value, 10); setPomodoroWorkDuration(userId, v); showToast(locale === 'tr' ? `Çalışma ${v} dk` : `Work ${v} min`, 'success'); }} className="w-full rounded-lg border px-3 py-2 text-sm bg-slate-50 border-slate-200 text-slate-900" style={dark ? { backgroundColor: CARD_DARK, borderColor: BORDER_DARK, color: TEXT_DARK } : undefined}>
                    <option value={15}>15</option><option value={25}>25</option><option value={45}>45</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-2 text-slate-500" style={dark ? { color: TEXT_MUTED } : undefined}>{locale === 'tr' ? 'Mola (dk)' : 'Break (min)'}</label>
                  <select value={getPomodoroBreakDuration(userId)} onChange={(e) => { const v = parseInt(e.target.value, 10); setPomodoroBreakDuration(userId, v); showToast(locale === 'tr' ? `Mola ${v} dk` : `Break ${v} min`, 'success'); }} className="w-full rounded-lg border px-3 py-2 text-sm bg-slate-50 border-slate-200 text-slate-900" style={dark ? { backgroundColor: CARD_DARK, borderColor: BORDER_DARK, color: TEXT_DARK } : undefined}>
                    <option value={5}>5</option><option value={10}>10</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Şablonlar bölümü ileri faz için kaldırıldı */}

        {/* Data Management */}
        <div className="mt-8">
          <h3 className="px-6 text-xs font-bold uppercase tracking-widest mb-3" style={{ color: dark ? TEXT_MUTED : '#64748b' }}>{locale === 'tr' ? 'Veri Yönetimi' : 'Data Management'}</h3>
          <div className="bg-white mx-4 rounded-xl overflow-hidden shadow-sm border border-slate-100" style={dark ? { backgroundColor: CARD_DARK, borderColor: BORDER_DARK } : undefined}>
            <button type="button" onClick={isPro ? handleExportData : () => onOpenPro?.()} disabled={isPro && exporting} className="w-full flex items-center justify-between px-5 py-4 border-b border-slate-100 text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors text-left" style={dark ? { borderColor: BORDER_DARK, color: TEXT_DARK } : undefined}>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-slate-400">cloud_download</span>
                <span className="text-sm font-medium">{t('settings.export', locale)}</span>
              </div>
              {!isPro && <span className="material-symbols-outlined text-slate-300">chevron_right</span>}
              {isPro && exporting && <span className="text-xs text-slate-500">{locale === 'tr' ? 'Hazırlanıyor...' : 'Preparing...'}</span>}
              {isPro && !exporting && <span className="material-symbols-outlined text-slate-300">chevron_right</span>}
            </button>
            {isPro && (
              <button type="button" onClick={handleExportCsv} disabled={exporting} className="w-full flex items-center justify-between px-5 py-4 border-b border-slate-100 text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors text-left" style={dark ? { borderColor: BORDER_DARK, color: TEXT_DARK } : undefined}>
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-slate-400">description</span>
                  <span className="text-sm font-medium">{locale === 'tr' ? 'CSV indir' : 'Export CSV'}</span>
                </div>
                <span className="material-symbols-outlined text-slate-300">chevron_right</span>
              </button>
            )}
            <button type="button" onClick={handleArchiveCompleted} className="w-full flex items-center justify-between px-5 py-4 border-b border-slate-100 text-slate-700 hover:bg-slate-50 transition-colors text-left" style={dark ? { borderColor: BORDER_DARK, color: TEXT_DARK } : undefined}>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-slate-400">archive</span>
                <span className="text-sm font-medium">{t('settings.archive', locale)}</span>
              </div>
              <span className="material-symbols-outlined text-slate-300">chevron_right</span>
            </button>
            <button type="button" onClick={() => setShowDeleteConfirm(true)} className="w-full flex items-center justify-between px-5 py-4 text-red-500 hover:bg-red-50 transition-colors text-left">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined">delete_forever</span>
                <span className="text-sm font-medium">{t('settings.deleteAll', locale)}</span>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteAccountConfirm(true)}
              className="w-full flex items-center justify-between px-5 py-4 text-red-500 hover:bg-red-50 transition-colors text-left border-t border-slate-100"
              style={dark ? { borderColor: BORDER_DARK } : undefined}
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined">person_cancel</span>
                <span className="text-sm font-medium">
                  {locale === 'tr' ? 'Hesabı kalıcı olarak sil' : 'Permanently delete account'}
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* About & Logout */}
        <div className="mt-8 mb-12 flex flex-col items-center gap-4">
          <div className="flex gap-6 text-slate-400 text-sm font-medium">
            <button type="button" onClick={() => setShowPrivacyModal(true)} className="hover:opacity-80 transition-colors" style={{ color: 'inherit' }}>{t('settings.privacy', locale)}</button>
            <button type="button" onClick={() => setShowTermsModal(true)} className="hover:opacity-80 transition-colors" style={{ color: 'inherit' }}>{t('settings.terms', locale)}</button>
            <a href="#" className="hover:opacity-80 transition-colors">{locale === 'tr' ? 'Destek' : 'Support'}</a>
          </div>
          <button type="button" onClick={() => setShowLogoutConfirm(true)} className="text-slate-500 flex items-center gap-2 px-6 py-2 rounded-full border border-slate-200 hover:bg-slate-50 transition-colors" style={dark ? { color: TEXT_MUTED, borderColor: BORDER_DARK } : undefined}>
            <span className="material-symbols-outlined text-sm">logout</span>
            <span className="text-sm font-bold">{t('settings.logout', locale)}</span>
          </button>
          <p className="text-[10px] text-slate-300 uppercase tracking-[0.2em] mt-4" style={dark ? { color: TEXT_MUTED } : undefined}>Nudge v2.4.0</p>
        </div>
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

      {showDeleteAccountConfirm && (
        <Modal open dark={dark} onClose={() => setShowDeleteAccountConfirm(false)} maxWidth="sm">
          <div className="text-center mb-6">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4 ${dark ? 'bg-red-900/40' : 'bg-red-100'}`}>
              <svg className={`w-8 h-8 ${dark ? 'text-red-400' : 'text-red-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 11-12.728 12.728A9 9 0 0118.364 5.636zM9.88 9.88l4.24 4.24m0-4.24l-4.24 4.24" />
              </svg>
            </div>
            <h3 className={`text-base font-bold mb-2 ${dark ? 'text-white' : 'text-stone-900'}`}>
              {locale === 'tr' ? 'Hesabı kalıcı olarak sil' : 'Delete account permanently'}
            </h3>
            <p className={`text-sm ${dark ? 'text-zinc-400' : 'text-stone-600'}`}>
              {locale === 'tr'
                ? 'Hesabın ve tüm verilerin (görevler, listeler, ayarlar) kalıcı olarak silinecek. Bu işlem geri alınamaz.'
                : 'Your account and all data (tasks, lists, settings) will be permanently deleted. This action cannot be undone.'}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowDeleteAccountConfirm(false)}
              className={`flex-1 py-3 rounded-xl font-semibold transition-all ${dark ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'}`}
            >
              {locale === 'tr' ? 'Vazgeç' : 'Cancel'}
            </button>
            <button
              onClick={handleDeleteAccount}
              disabled={deletingAccount}
              className="flex-1 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-all disabled:opacity-60"
            >
              {deletingAccount
                ? locale === 'tr'
                  ? 'Siliniyor...'
                  : 'Deleting...'
                : locale === 'tr'
                  ? 'Hesabımı Sil'
                  : 'Delete Account'}
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
