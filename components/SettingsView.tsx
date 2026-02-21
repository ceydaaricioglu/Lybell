'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { isMockUser, getTodayPomodoroCount, getWeekPomodoroCount, getMonthPomodoroCount, getPomodoroStreak, getTotalFocusTime, getWeeklyPomodoroDistribution, getPomodoroRecords, getMockCategories, getProfile, fetchTasksFromSupabase, fetchTemplates, deleteTemplateFromSupabase } from '@/lib/helpers';
import type { TimelineTask } from '@/lib/types';
import type { TaskTemplate } from '@/lib/types';
import { useToast } from '@/components/Toast';
import { useLocale } from '@/components/LocaleContext';
import { t, SUPPORTED_LOCALES, getLocaleLabel } from '@/lib/i18n';
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
} from '@/lib/notifications';
import { DEFAULT_NAV_TABS, getVisibleNavTabs, setVisibleNavTabs } from '@/lib/navTabs';
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
}

export default function SettingsView({ userId, onLogout, onSessionLost, darkMode = false, onDarkModeChange, onOpenProfile, onOpenPro, isPro = false, onNavTabsChange }: SettingsViewProps) {
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
  const userEmail = isMock ? 'Hesap olmadan kullanılıyor' : 'Kayıtlı kullanıcı';
  const userDisplayTitle = displayName?.trim() || (isMock ? 'Misafir Kullanıcı' : 'Kullanıcı');
  const userInitial = displayName?.trim()?.[0]?.toUpperCase() || (isMock ? '?' : 'U');

  const Toggle = ({ enabled, onChange }: { enabled: boolean; onChange: () => void }) => (
    <button
      onClick={onChange}
      className={`relative w-12 h-7 rounded-full transition-all duration-300 ${
        enabled ? 'bg-amber-500' : dark ? 'bg-zinc-600' : 'bg-stone-300'
      }`}
    >
      <div
        className={`absolute top-0.5 w-6 h-6 rounded-full shadow-md transition-all duration-300 ${dark ? 'bg-zinc-200' : 'bg-white'}`}
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
    <div className={`min-h-screen pb-24 ${dark ? 'bg-[#0f0f0f]' : 'bg-[#f5f0ea]'}`}>
      {/* Header */}
      <div className={`border-b px-6 py-5 ${dark ? 'bg-[#0f0f0f] border-zinc-800' : 'bg-[#f5f0ea] border-stone-200'}`}>
        <div className="max-w-md mx-auto">
          <h1 className={`text-xl font-semibold ${dark ? 'text-white' : 'text-stone-900'}`}>{t('settings.title', locale)}</h1>
          <p className={`text-sm mt-1 ${dark ? 'text-zinc-500' : 'text-stone-500'}`}>{t('settings.subtitle', locale)}</p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Profil Kartı – tıklanınca Profil ekranına gider */}
        <button
          type="button"
          onClick={onOpenProfile}
          className={`w-full rounded-2xl p-5 text-left transition-all ${dark ? 'bg-zinc-900/60 border border-zinc-800 hover:bg-zinc-800/60' : 'bg-white shadow-[0_4px_24px_-4px_rgba(0,0,0,0.06)] border border-stone-100 hover:shadow-md'}`}
        >
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold ${
              dark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700'
            }`}>
              {userInitial}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className={`text-lg font-bold ${dark ? 'text-white' : 'text-stone-900'}`}>
                {userDisplayTitle}
              </h2>
              <p className={`text-sm truncate ${dark ? 'text-zinc-500' : 'text-stone-500'}`}>{userEmail}</p>
              <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                isMock ? (dark ? 'bg-zinc-800 text-zinc-400' : 'bg-stone-100 text-stone-600') : (dark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700')
              }`}>
                {isMock ? 'Misafir' : 'Kayıtlı Hesap'}
              </span>
            </div>
            <svg className={`w-5 h-5 flex-shrink-0 ${dark ? 'text-zinc-500' : 'text-stone-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </button>

        {/* Pro: üyeyse bilgi, değilse yükselt butonu */}
        {isPro ? (
          <div className={`w-full rounded-2xl p-5 text-left ${dark ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40' : 'bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200'}`}>
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${dark ? 'bg-amber-500/30' : 'bg-amber-100'}`}>
                <span className="text-2xl">👑</span>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className={`text-lg font-bold ${dark ? 'text-amber-200' : 'text-amber-800'}`}>
                  {locale === 'tr' ? 'Pro üyesisiniz' : 'You are Pro'}
                </h2>
                <p className={`text-sm mt-0.5 ${dark ? 'text-zinc-400' : 'text-stone-600'}`}>
                  {locale === 'tr' ? 'Tüm Pro özellikleri açık' : 'All Pro features are enabled'}
                </p>
              </div>
            </div>
          </div>
        ) : onOpenPro ? (
          <button
            type="button"
            onClick={onOpenPro}
            className={`w-full rounded-2xl p-5 text-left transition-all ${dark ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 hover:from-amber-500/30 hover:to-orange-500/30' : 'bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 hover:shadow-md'}`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${dark ? 'bg-amber-500/30' : 'bg-amber-100'}`}>
                <span className="text-2xl">👑</span>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className={`text-lg font-bold ${dark ? 'text-amber-200' : 'text-amber-800'}`}>
                  {t('settings.upgradePro', locale)}
                </h2>
                <p className={`text-sm mt-0.5 ${dark ? 'text-zinc-400' : 'text-stone-600'}`}>
                  {locale === 'tr' ? 'Tüm özelliklerin kilidini aç' : 'Unlock all features'}
                </p>
              </div>
              <svg className={`w-5 h-5 flex-shrink-0 ${dark ? 'text-amber-400' : 'text-amber-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        ) : null}

        {/* Genel Ayarlar */}
        <div>
          <h3 className={`text-xs font-semibold uppercase tracking-wider px-1 mb-3 ${dark ? 'text-zinc-500' : 'text-stone-500'}`}>Genel</h3>
          <div className={`rounded-2xl overflow-hidden divide-y ${dark ? 'bg-zinc-900/60 border border-zinc-800 divide-zinc-800' : 'bg-white border border-stone-100 divide-stone-100 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.06)]'}`}>
            <div className={`flex items-center justify-between px-5 py-4 ${dark ? 'hover:bg-zinc-800/50' : ''}`}>
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${dark ? 'bg-amber-500/20' : 'bg-amber-100'}`}>
                  <svg className={`w-5 h-5 ${dark ? 'text-amber-400' : 'text-amber-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                </div>
                <span className={`font-medium ${dark ? 'text-zinc-100' : 'text-stone-900'}`}>{t('settings.darkMode', locale)}</span>
              </div>
              <Toggle enabled={darkMode} onChange={() => onDarkModeChange?.(!darkMode)} />
            </div>

            <div className={`flex items-center justify-between px-5 py-4 ${dark ? 'hover:bg-zinc-800/50' : ''}`}>
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${dark ? 'bg-zinc-800' : 'bg-red-100'}`}>
                  <svg className={`w-5 h-5 ${dark ? 'text-red-400' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <span className={`font-medium ${dark ? 'text-zinc-100' : 'text-stone-900'}`}>{t('settings.notifications', locale)}</span>
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
                <div className={`flex items-center justify-between px-5 py-3 ${dark ? 'hover:bg-zinc-800/50' : ''}`}>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm ${dark ? 'text-zinc-300' : 'text-stone-700'}`}>{locale === 'tr' ? 'Günlük özet' : 'Daily digest'}</span>
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
                      className={`text-sm rounded-lg border px-2 py-1.5 ${dark ? 'bg-zinc-800 border-zinc-600 text-white' : 'bg-white border-stone-200 text-stone-900'}`}
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
                <div className={`flex items-center justify-between px-5 py-3 ${dark ? 'hover:bg-zinc-800/50' : ''}`}>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm ${dark ? 'text-zinc-300' : 'text-stone-700'}`}>{locale === 'tr' ? 'Gecikmiş görev uyarısı' : 'Overdue reminder'}</span>
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
                      className={`text-sm rounded-lg border px-2 py-1.5 ${dark ? 'bg-zinc-800 border-zinc-600 text-white' : 'bg-white border-stone-200 text-stone-900'}`}
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
                <div className={`flex items-center justify-between px-5 py-3 ${dark ? 'hover:bg-zinc-800/50' : ''}`}>
                  <span className={`text-sm ${dark ? 'text-zinc-300' : 'text-stone-700'}`}>{locale === 'tr' ? 'Bildirim sesi' : 'Notification sound'}</span>
                  <select
                    value={notificationSound}
                    onChange={(e) => {
                      const v = e.target.value as NotificationSound;
                      setNotificationSoundState(v);
                      setNotificationSound(v);
                    }}
                    className={`text-sm rounded-lg border px-2 py-1.5 ${dark ? 'bg-zinc-800 border-zinc-600 text-white' : 'bg-white border-stone-200 text-stone-900'}`}
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
              <div className={`px-5 py-3 ${dark ? 'border-b border-zinc-800' : 'border-b border-stone-100'}`}>
                <div className={`text-sm font-medium mb-2 ${dark ? 'text-zinc-300' : 'text-stone-700'}`}>
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
                        className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm cursor-pointer ${
                          dark ? 'bg-zinc-800' : 'bg-stone-100'
                        } ${isOn ? (dark ? 'text-amber-400' : 'text-amber-700') : (dark ? 'text-zinc-500' : 'text-stone-500')}`}
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
              className={`w-full flex items-center justify-between px-5 py-4 transition-colors ${dark ? 'hover:bg-zinc-800/50' : 'hover:bg-stone-50'}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${dark ? 'bg-zinc-800' : 'bg-stone-100'}`}>
                  <svg className={`w-5 h-5 ${dark ? 'text-zinc-400' : 'text-stone-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                  </svg>
                </div>
                <span className={`font-medium ${dark ? 'text-zinc-100' : 'text-stone-900'}`}>{t('settings.language', locale)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm ${dark ? 'text-zinc-500' : 'text-stone-500'}`}>{getLocaleLabel(locale)}</span>
                <svg className={`w-4 h-4 ${dark ? 'text-zinc-500' : 'text-stone-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          </div>
        </div>

        {/* Ana ekrana ekle / Widget kısayolu (Free) */}
        <div>
          <h3 className={`text-xs font-semibold uppercase tracking-wider px-1 mb-3 ${dark ? 'text-zinc-500' : 'text-stone-500'}`}>{locale === 'tr' ? 'Kısayol' : 'Shortcut'}</h3>
          <div className={`rounded-2xl p-5 ${dark ? 'bg-zinc-900/60 border border-zinc-800' : 'bg-white shadow-[0_4px_24px_-4px_rgba(0,0,0,0.06)] border border-stone-100'}`}>
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${dark ? 'bg-amber-500/20' : 'bg-amber-100'}`}>
                <span className="text-xl">📱</span>
              </div>
              <div>
                <h4 className={`font-semibold ${dark ? 'text-white' : 'text-stone-900'}`}>{locale === 'tr' ? 'Ana ekrana ekle' : 'Add to Home Screen'}</h4>
                <p className={`text-sm ${dark ? 'text-zinc-500' : 'text-stone-500'}`}>
                  {locale === 'tr' ? 'Tarayıcı menüsünden "Ana ekrana ekle" veya "Uygulama olarak yükle" ile hızlı erişim.' : 'Use browser menu "Add to Home Screen" for quick access.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Şablonlarım (Free) */}
        <div>
          <h3 className={`text-xs font-semibold uppercase tracking-wider px-1 mb-3 ${dark ? 'text-zinc-500' : 'text-stone-500'}`}>{locale === 'tr' ? 'Şablonlarım' : 'My templates'}</h3>
          <div className={`rounded-2xl overflow-hidden ${dark ? 'bg-zinc-900/60 border border-zinc-800' : 'bg-white border border-stone-100 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.06)]'}`}>
            {templates.length === 0 ? (
              <div className={`px-5 py-6 text-center text-sm ${dark ? 'text-zinc-500' : 'text-stone-500'}`}>
                {locale === 'tr' ? 'Henüz şablon yok. Görev düzenlerken "Şablon olarak kaydet" ile ekleyebilirsin.' : 'No templates yet. Save a task as template from the task edit screen.'}
              </div>
            ) : (
              <ul className={`divide-y ${dark ? 'divide-zinc-800' : 'divide-stone-100'}`}>
                {templates.map((t) => (
                  <li key={t.id} className={`flex items-center justify-between px-5 py-4 ${dark ? 'hover:bg-zinc-800/50' : 'hover:bg-stone-50'}`}>
                    <div className="min-w-0 flex-1">
                      <div className={`font-medium truncate ${dark ? 'text-zinc-100' : 'text-stone-900'}`}>{t.name}</div>
                      <div className={`text-sm truncate ${dark ? 'text-zinc-500' : 'text-stone-500'}`}>{t.title}</div>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        await deleteTemplateFromSupabase(userId, t.id);
                        setTemplates((prev) => prev.filter((x) => x.id !== t.id));
                        showToast(locale === 'tr' ? 'Şablon silindi' : 'Template deleted', 'info');
                      }}
                      className={`ml-2 p-2 rounded-xl shrink-0 ${dark ? 'text-zinc-400 hover:bg-zinc-800 hover:text-red-400' : 'text-stone-400 hover:bg-red-50 hover:text-red-600'}`}
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
          <h3 className={`text-xs font-semibold uppercase tracking-wider px-1 mb-3 ${dark ? 'text-zinc-500' : 'text-stone-500'}`}>Üretkenlik</h3>
          <div className={`rounded-2xl p-5 mb-4 ${dark ? 'bg-zinc-900/60 border border-zinc-800' : 'bg-white shadow-[0_4px_24px_-4px_rgba(0,0,0,0.06)] border border-stone-100'}`}>
            <div className="flex items-center justify-between mb-4">
              <h4 className={`text-lg font-bold ${dark ? 'text-white' : 'text-stone-900'}`}>🍅 Pomodoro</h4>
              <span className={`text-xs ${dark ? 'text-zinc-500' : 'text-stone-500'}`}>Toplam Odaklanma</span>
            </div>
            <div className="grid grid-cols-4 gap-3 mb-4">
              <div className="text-center">
                <div className={`text-2xl font-bold mb-1 ${dark ? 'text-amber-400' : 'text-amber-600'}`}>{getTodayPomodoroCount(userId)}</div>
                <div className={`text-[10px] ${dark ? 'text-zinc-500' : 'text-stone-600'}`}>Bugün</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold mb-1 ${dark ? 'text-amber-400' : 'text-amber-600'}`}>{getWeekPomodoroCount(userId)}</div>
                <div className={`text-[10px] ${dark ? 'text-zinc-500' : 'text-stone-600'}`}>Bu Hafta</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold mb-1 ${dark ? 'text-amber-400' : 'text-amber-600'}`}>{getMonthPomodoroCount(userId)}</div>
                <div className={`text-[10px] ${dark ? 'text-zinc-500' : 'text-stone-600'}`}>Bu Ay</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold mb-1 ${dark ? 'text-amber-400' : 'text-amber-600'}`}>{getPomodoroStreak(userId)}</div>
                <div className={`text-[10px] ${dark ? 'text-zinc-500' : 'text-stone-600'}`}>Streak 🔥</div>
              </div>
            </div>
            <div className={`rounded-xl p-3 ${dark ? 'bg-zinc-800/80 border border-zinc-700' : 'bg-amber-50/80 border border-amber-200'}`}>
              <div className="flex items-center justify-between">
                <span className={`text-sm font-medium ${dark ? 'text-zinc-300' : 'text-stone-700'}`}>Toplam Odaklanma Süresi</span>
                <span className={`text-sm font-bold ${dark ? 'text-amber-400' : 'text-amber-600'}`}>
                  {Math.floor(getTotalFocusTime(userId) / 60)}s {getTotalFocusTime(userId) % 60}dk
                </span>
              </div>
            </div>
          </div>

          <div className={`rounded-2xl p-5 mb-4 ${dark ? 'bg-zinc-900/60 border border-zinc-800' : 'bg-white shadow-[0_4px_24px_-4px_rgba(0,0,0,0.06)] border border-stone-100'}`}>
            <h4 className={`text-sm font-semibold mb-4 ${dark ? 'text-white' : 'text-stone-900'}`}>Son 7 Gün</h4>
            <div className="flex items-end justify-between h-32 gap-2">
              {getWeeklyPomodoroDistribution(userId).map((day, idx) => {
                const maxCount = Math.max(...getWeeklyPomodoroDistribution(userId).map(d => d.count), 1);
                const height = (day.count / maxCount) * 100;
                const dayName = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'][new Date(day.date).getDay() === 0 ? 6 : new Date(day.date).getDay() - 1];
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                    <div className="relative w-full flex items-end justify-center" style={{ height: '100px' }}>
                      <div
                        className={`w-full rounded-t-lg transition-all ${day.count > 0 ? (dark ? 'bg-amber-500/80' : 'bg-amber-400') : (dark ? 'bg-zinc-700' : 'bg-stone-200')}`}
                        style={{ height: `${height}%` }}
                      >
                        {day.count > 0 && <div className="text-xs font-bold text-white text-center pt-1">{day.count}</div>}
                      </div>
                    </div>
                    <div className={`text-[10px] font-medium ${dark ? 'text-zinc-500' : 'text-stone-500'}`}>{dayName}</div>
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
              <div className={`rounded-2xl p-5 ${dark ? 'bg-zinc-900/60 border border-zinc-800' : 'bg-white shadow-[0_4px_24px_-4px_rgba(0,0,0,0.06)] border border-stone-100'}`}>
                <h4 className={`text-sm font-semibold mb-4 ${dark ? 'text-white' : 'text-stone-900'}`}>Kategori Dağılımı</h4>
                <div className="space-y-3">
                  {categoryBreakdown.map(cat => (
                    <div key={cat.id}>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-sm flex items-center gap-2 ${dark ? 'text-zinc-300' : 'text-stone-700'}`}>
                          <span className="text-lg">{cat.icon}</span>
                          {cat.name}
                        </span>
                        <span className={`text-sm font-bold ${dark ? 'text-amber-400/90' : 'text-stone-900'}`}>{cat.count} 🍅</span>
                      </div>
                      <div className={`w-full rounded-full h-2 ${dark ? 'bg-zinc-800' : 'bg-stone-200'}`}>
                        <div className={`h-2 rounded-full transition-all ${dark ? 'bg-amber-400/80' : 'bg-amber-400'}`} style={{ width: `${(cat.count / totalCategoryPomodoros) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>

        {/* Veri Yönetimi */}
        <div>
          <h3 className={`text-xs font-semibold uppercase tracking-wider px-1 mb-3 ${dark ? 'text-zinc-500' : 'text-stone-500'}`}>Veri Yönetimi</h3>
          <div className={`rounded-2xl overflow-hidden divide-y ${dark ? 'bg-zinc-900/60 border border-zinc-800 divide-zinc-800' : 'bg-white border border-stone-100 divide-stone-100 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.06)]'}`}>
            <button onClick={handleExportData} disabled={exporting} className={`w-full flex items-center justify-between px-5 py-4 transition-colors ${dark ? 'hover:bg-zinc-800/50' : 'hover:bg-stone-50'} disabled:opacity-50 disabled:cursor-not-allowed`}>
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${dark ? 'bg-zinc-800' : 'bg-stone-100'}`}>
                  <svg className={`w-5 h-5 ${dark ? 'text-zinc-400' : 'text-stone-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </div>
                <span className={`font-medium ${dark ? 'text-zinc-100' : 'text-stone-900'}`}>{t('settings.export', locale)}</span>
              </div>
              {exporting ? (
                <span className={`text-xs ${dark ? 'text-zinc-500' : 'text-stone-500'}`}>{locale === 'tr' ? 'Hazırlanıyor...' : 'Preparing...'}</span>
              ) : (
                <svg className={`w-4 h-4 ${dark ? 'text-zinc-500' : 'text-stone-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
            </button>
            <button onClick={handleExportCsv} disabled={exporting} className={`w-full flex items-center justify-between px-5 py-4 transition-colors ${dark ? 'hover:bg-zinc-800/50' : 'hover:bg-stone-50'} disabled:opacity-50 disabled:cursor-not-allowed`}>
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${dark ? 'bg-zinc-800' : 'bg-stone-100'}`}>
                  <svg className={`w-5 h-5 ${dark ? 'text-zinc-400' : 'text-stone-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span className={`font-medium ${dark ? 'text-zinc-100' : 'text-stone-900'}`}>{locale === 'tr' ? 'Görevleri CSV olarak indir' : 'Export tasks as CSV'}</span>
              </div>
              {exporting ? (
                <span className={`text-xs ${dark ? 'text-zinc-500' : 'text-stone-500'}`}>{locale === 'tr' ? 'Hazırlanıyor...' : 'Preparing...'}</span>
              ) : (
                <svg className={`w-4 h-4 ${dark ? 'text-zinc-500' : 'text-stone-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
            </button>
            <button onClick={handleArchiveCompleted} className={`w-full flex items-center justify-between px-5 py-4 transition-colors ${dark ? 'hover:bg-zinc-800/50' : 'hover:bg-stone-50'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${dark ? 'bg-zinc-800' : 'bg-amber-50'}`}>
                  <svg className={`w-5 h-5 ${dark ? 'text-amber-400' : 'text-amber-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                </div>
                <span className={`font-medium ${dark ? 'text-zinc-100' : 'text-stone-900'}`}>{t('settings.archive', locale)}</span>
              </div>
              <svg className={`w-4 h-4 ${dark ? 'text-zinc-500' : 'text-stone-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button onClick={() => setShowDeleteConfirm(true)} className={`w-full flex items-center justify-between px-5 py-4 transition-colors ${dark ? 'hover:bg-red-900/20' : 'hover:bg-red-50'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${dark ? 'bg-red-900/40' : 'bg-red-100'}`}>
                  <svg className={`w-5 h-5 ${dark ? 'text-red-400' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <span className={`font-medium ${dark ? 'text-red-400' : 'text-red-600'}`}>{t('settings.deleteAll', locale)}</span>
              </div>
              <svg className={`w-4 h-4 ${dark ? 'text-zinc-500' : 'text-stone-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Hakkında */}
        <div>
          <h3 className={`text-xs font-semibold uppercase tracking-wider px-1 mb-3 ${dark ? 'text-zinc-500' : 'text-stone-500'}`}>Hakkında</h3>
          <div className={`rounded-2xl overflow-hidden divide-y ${dark ? 'bg-zinc-900/60 border border-zinc-800 divide-zinc-800' : 'bg-white border border-stone-100 divide-stone-100 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.06)]'}`}>
            <div className={`flex items-center justify-between px-5 py-4 ${dark ? '' : ''}`}>
              <span className={`font-medium ${dark ? 'text-zinc-100' : 'text-stone-900'}`}>{t('settings.version', locale)}</span>
              <span className={`text-sm ${dark ? 'text-zinc-500' : 'text-stone-500'}`}>v1.0.0</span>
            </div>
            <button type="button" onClick={() => setShowPrivacyModal(true)} className={`w-full flex items-center justify-between px-5 py-4 transition-colors ${dark ? 'hover:bg-zinc-800/50' : 'hover:bg-stone-50'}`}>
              <span className={`font-medium ${dark ? 'text-zinc-100' : 'text-stone-900'}`}>{t('settings.privacy', locale)}</span>
              <svg className={`w-4 h-4 ${dark ? 'text-zinc-500' : 'text-stone-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button type="button" onClick={() => setShowTermsModal(true)} className={`w-full flex items-center justify-between px-5 py-4 transition-colors ${dark ? 'hover:bg-zinc-800/50' : 'hover:bg-stone-50'}`}>
              <span className={`font-medium ${dark ? 'text-zinc-100' : 'text-stone-900'}`}>{t('settings.terms', locale)}</span>
              <svg className={`w-4 h-4 ${dark ? 'text-zinc-500' : 'text-stone-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        <button
          onClick={() => setShowLogoutConfirm(true)}
          className={`w-full py-4 font-semibold rounded-2xl transition-all flex items-center justify-center gap-2 ${
            dark ? 'bg-red-900/30 border border-red-800 text-red-400 hover:bg-red-900/50' : 'bg-white border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 shadow-sm'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {t('settings.logout', locale)}
        </button>

        <p className={`text-center text-xs pb-8 ${dark ? 'text-zinc-500' : 'text-stone-400'}`}>TaskFlow v1.0.0</p>
      </div>

      {showLogoutConfirm && (
        <Modal open dark={dark} onClose={() => setShowLogoutConfirm(false)} maxWidth="sm">
          <div className="text-center mb-6">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${dark ? 'bg-red-900/40' : 'bg-red-100'}`}>
              <svg className={`w-8 h-8 ${dark ? 'text-red-400' : 'text-red-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
            <h3 className={`text-lg font-bold mb-2 ${dark ? 'text-white' : 'text-stone-900'}`}>Çıkış Yap</h3>
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
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${dark ? 'bg-red-900/40' : 'bg-red-100'}`}>
              <svg className={`w-8 h-8 ${dark ? 'text-red-400' : 'text-red-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className={`text-lg font-bold mb-2 ${dark ? 'text-white' : 'text-stone-900'}`}>{t('settings.deleteAll', locale)}</h3>
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
          <h3 className={`text-lg font-bold mb-4 ${dark ? 'text-white' : 'text-stone-900'}`}>{t('settings.language', locale)}</h3>
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
          <h3 className={`text-lg font-bold mb-3 ${dark ? 'text-white' : 'text-stone-900'}`}>{t('settings.privacy', locale)}</h3>
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
          <h3 className={`text-lg font-bold mb-3 ${dark ? 'text-white' : 'text-stone-900'}`}>{t('settings.terms', locale)}</h3>
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
