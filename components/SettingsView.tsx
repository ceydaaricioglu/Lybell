'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { isMockUser, getTodayPomodoroCount, getWeekPomodoroCount, getMonthPomodoroCount, getPomodoroStreak, getTotalFocusTime, getWeeklyPomodoroDistribution, getPomodoroRecords, getMockCategories } from '@/lib/helpers';
import { useToast } from '@/components/Toast';

interface SettingsViewProps {
  userId: string;
  onLogout: () => void;
}

export default function SettingsView({ userId, onLogout }: SettingsViewProps) {
  const { showToast } = useToast();
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isMock = isMockUser(userId);
  const userEmail = isMock ? 'Hesap olmadan kullanılıyor' : 'Kayıtlı kullanıcı';
  const userInitial = isMock ? '?' : 'U';

  const Toggle = ({ enabled, onChange }: { enabled: boolean; onChange: () => void }) => (
    <button
      onClick={onChange}
      className={`relative w-12 h-7 rounded-full transition-all duration-300 ${
        enabled ? 'bg-emerald-500' : 'bg-gray-300'
      }`}
    >
      <div
        className="absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300"
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

  const handleExportData = () => {
    const tasks = localStorage.getItem(`mock_tasks_${userId}`);
    const categories = localStorage.getItem(`mock_categories_${userId}`);
    
    const exportData = {
      exportDate: new Date().toISOString(),
      tasks: tasks ? JSON.parse(tasks) : [],
      categories: categories ? JSON.parse(categories) : [],
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `taskflow-verileri-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Veriler başarıyla dışa aktarıldı', 'success');
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-5">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold text-gray-900">Ayarlar</h1>
          <p className="text-sm text-gray-500 mt-1">Uygulama tercihlerini yönet</p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Profil Kartı */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
              {userInitial}
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-gray-900">
                {isMock ? 'Misafir Kullanıcı' : 'Kullanıcı'}
              </h2>
              <p className="text-sm text-gray-500">{userEmail}</p>
              <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                isMock 
                  ? 'bg-gray-100 text-gray-600' 
                  : 'bg-emerald-100 text-emerald-700'
              }`}>
                {isMock ? 'Misafir' : 'Kayıtlı Hesap'}
              </span>
            </div>
          </div>
        </div>

        {/* Genel Ayarlar */}
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1 mb-3">Genel</h3>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-100">
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                </div>
                <span className="font-medium text-gray-900">Karanlık Mod</span>
              </div>
              <Toggle enabled={darkMode} onChange={() => setDarkMode(!darkMode)} />
            </div>

            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-red-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <span className="font-medium text-gray-900">Bildirimler</span>
              </div>
              <Toggle enabled={notifications} onChange={() => setNotifications(!notifications)} />
            </div>

            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                  </svg>
                </div>
                <span className="font-medium text-gray-900">Dil</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Türkçe</span>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Pomodoro İstatistikleri */}
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1 mb-3">Üretkenlik</h3>
          
          {/* Genel İstatistikler Kartı */}
          <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl p-5 shadow-sm border border-red-100 mb-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-bold text-gray-900">🍅 Pomodoro</h4>
              <span className="text-xs text-gray-500">Toplam Odaklanma</span>
            </div>
            
            <div className="grid grid-cols-4 gap-3 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600 mb-1">{getTodayPomodoroCount(userId)}</div>
                <div className="text-[10px] text-gray-600">Bugün</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600 mb-1">{getWeekPomodoroCount(userId)}</div>
                <div className="text-[10px] text-gray-600">Bu Hafta</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-600 mb-1">{getMonthPomodoroCount(userId)}</div>
                <div className="text-[10px] text-gray-600">Bu Ay</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600 mb-1">{getPomodoroStreak(userId)}</div>
                <div className="text-[10px] text-gray-600">Streak 🔥</div>
              </div>
            </div>

            {/* Toplam Süre */}
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 border border-red-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700 font-medium">Toplam Odaklanma Süresi</span>
                <span className="text-sm font-bold text-red-600">
                  {Math.floor(getTotalFocusTime(userId) / 60)}s {getTotalFocusTime(userId) % 60}dk
                </span>
              </div>
            </div>
          </div>

          {/* Haftalık Trend Grafiği */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Son 7 Gün</h4>
            <div className="flex items-end justify-between h-32 gap-2">
              {getWeeklyPomodoroDistribution(userId).map((day, idx) => {
                const maxCount = Math.max(...getWeeklyPomodoroDistribution(userId).map(d => d.count), 1);
                const height = (day.count / maxCount) * 100;
                const dayName = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'][new Date(day.date).getDay() === 0 ? 6 : new Date(day.date).getDay() - 1];
                
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                    <div className="relative w-full flex items-end justify-center" style={{ height: '100px' }}>
                      <div
                        className={`w-full rounded-t-lg transition-all ${
                          day.count > 0 ? 'bg-gradient-to-t from-red-500 to-orange-400' : 'bg-gray-200'
                        }`}
                        style={{ height: `${height}%` }}
                      >
                        {day.count > 0 && (
                          <div className="text-xs font-bold text-white text-center pt-1">
                            {day.count}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-[10px] text-gray-500 font-medium">{dayName}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Kategori Bazlı Dağılım */}
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
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <h4 className="text-sm font-semibold text-gray-900 mb-4">Kategori Dağılımı</h4>
                <div className="space-y-3">
                  {categoryBreakdown.map(cat => (
                    <div key={cat.id}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-700 flex items-center gap-2">
                          <span className="text-lg">{cat.icon}</span>
                          {cat.name}
                        </span>
                        <span className="text-sm font-bold text-gray-900">
                          {cat.count} 🍅
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-red-500 to-orange-400 h-2 rounded-full transition-all"
                          style={{ width: `${(cat.count / totalCategoryPomodoros) * 100}%` }}
                        />
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
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1 mb-3">Veri Yönetimi</h3>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-100">
            <button
              onClick={handleExportData}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </div>
                <span className="font-medium text-gray-900">Verileri Dışa Aktar</span>
              </div>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button
              onClick={handleArchiveCompleted}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-orange-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                </div>
                <span className="font-medium text-gray-900">Tamamlananları Arşivle</span>
              </div>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-red-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-red-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <span className="font-medium text-red-600">Tüm Verileri Sil</span>
              </div>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Hakkında */}
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1 mb-3">Hakkında</h3>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-100">
            <div className="flex items-center justify-between px-5 py-4">
              <span className="font-medium text-gray-900">Uygulama Versiyonu</span>
              <span className="text-sm text-gray-500">v1.0.0</span>
            </div>
            <button className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
              <span className="font-medium text-gray-900">Gizlilik Politikası</span>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </button>
            <button className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
              <span className="font-medium text-gray-900">Kullanım Şartları</span>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </button>
          </div>
        </div>

        {/* Çıkış Yap */}
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="w-full py-4 bg-white border-2 border-red-200 text-red-600 font-semibold rounded-2xl hover:bg-red-50 hover:border-red-300 transition-all flex items-center justify-center gap-2 shadow-sm"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Çıkış Yap
        </button>

        <p className="text-center text-xs text-gray-400 pb-8">
          TaskFlow v1.0.0
        </p>
      </div>

      {/* Çıkış Onay Dialogu */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Çıkış Yap</h3>
                <p className="text-gray-600 text-sm">Hesabından çıkış yapmak istediğine emin misin?</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all"
              >
                İptal
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-all"
              >
                Çıkış Yap
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Veri Silme Onay Dialogu */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Tüm Verileri Sil</h3>
                <p className="text-gray-600 text-sm">Tüm görevlerin ve kategorilerin silinecek. Bu işlem geri alınamaz.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all"
              >
                İptal
              </button>
              <button
                onClick={handleDeleteAllData}
                className="flex-1 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-all"
              >
                Tümünü Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
