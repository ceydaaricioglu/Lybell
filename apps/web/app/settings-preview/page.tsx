'use client';

import { useState } from 'react';

// =============================================
// TASARIM 1: Minimal & Clean (Apple Settings tarzı)
// =============================================
function SettingsDesign1() {
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [language, setLanguage] = useState('tr');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const Toggle = ({ enabled, onChange }: { enabled: boolean; onChange: () => void }) => (
    <button
      onClick={onChange}
      className={`relative w-12 h-7 rounded-full transition-all duration-300 ${
        enabled ? 'bg-emerald-500' : 'bg-gray-300'
      }`}
    >
      <div
        className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300 ${
          enabled ? 'left-5.5 translate-x-0' : 'left-0.5'
        }`}
        style={{ left: enabled ? '22px' : '2px' }}
      />
    </button>
  );

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
              C
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-gray-900">Ceyda</h2>
              <p className="text-sm text-gray-500">ceyda@email.com</p>
              <span className="inline-block mt-1 text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                Ücretsiz Plan
              </span>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
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

        {/* Veri Yönetimi */}
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1 mb-3">Veri Yönetimi</h3>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-100">
            <button className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
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

            <button className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
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

            <button className="w-full flex items-center justify-between px-5 py-4 hover:bg-red-50 transition-colors">
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
          TaskFlow ile gününü planla ✨
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
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-all"
              >
                Çıkış Yap
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================
// TASARIM 2: Gradient & Card-based (Modern/Renkli)
// =============================================
function SettingsDesign2() {
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 pt-8 pb-20 text-white relative">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold">Ayarlar</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 -mt-14 space-y-5 pb-8">
        {/* Profil Kartı - Floating */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-18 h-18 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-lg" style={{ width: '72px', height: '72px' }}>
                C
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">Ceyda</h2>
              <p className="text-sm text-gray-500">ceyda@email.com</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 px-3 py-1 rounded-full font-semibold">
                  ✨ Pro Üye
                </span>
              </div>
            </div>
          </div>

          {/* Küçük İstatistik */}
          <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-gray-100">
            <div className="text-center">
              <div className="text-xl font-bold text-emerald-600">24</div>
              <div className="text-xs text-gray-500">Görev</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-teal-600">18</div>
              <div className="text-xs text-gray-500">Tamamlanan</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-orange-500">5🔥</div>
              <div className="text-xs text-gray-500">Gün Streak</div>
            </div>
          </div>
        </div>

        {/* Tercihler */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-600">Tercihler</h3>
          </div>
          
          <div className="divide-y divide-gray-100">
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="text-xl">🌙</span>
                <div>
                  <div className="font-medium text-gray-900 text-sm">Karanlık Mod</div>
                  <div className="text-xs text-gray-400">Göz yorgunluğunu azalt</div>
                </div>
              </div>
              <Toggle enabled={darkMode} onChange={() => setDarkMode(!darkMode)} />
            </div>

            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="text-xl">🔔</span>
                <div>
                  <div className="font-medium text-gray-900 text-sm">Bildirimler</div>
                  <div className="text-xs text-gray-400">Görev hatırlatmaları</div>
                </div>
              </div>
              <Toggle enabled={notifications} onChange={() => setNotifications(!notifications)} />
            </div>

            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="text-xl">🔊</span>
                <div>
                  <div className="font-medium text-gray-900 text-sm">Ses Efektleri</div>
                  <div className="text-xs text-gray-400">Tamamlama sesleri</div>
                </div>
              </div>
              <Toggle enabled={soundEnabled} onChange={() => setSoundEnabled(!soundEnabled)} />
            </div>

            <button className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <span className="text-xl">🌐</span>
                <div>
                  <div className="font-medium text-gray-900 text-sm">Dil</div>
                  <div className="text-xs text-gray-400">Uygulama dili</div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-sm text-gray-500">Türkçe 🇹🇷</span>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          </div>
        </div>

        {/* Hızlı İşlemler */}
        <div className="grid grid-cols-2 gap-3">
          <button className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-2">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </div>
            <div className="text-sm font-semibold text-gray-900">Dışa Aktar</div>
            <div className="text-xs text-gray-400 mt-0.5">CSV / PDF</div>
          </button>

          <button className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all text-center">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-2">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            </div>
            <div className="text-sm font-semibold text-gray-900">Arşiv</div>
            <div className="text-xs text-gray-400 mt-0.5">Eski görevler</div>
          </button>

          <button className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-2">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-sm font-semibold text-gray-900">Yardım</div>
            <div className="text-xs text-gray-400 mt-0.5">SSS & Destek</div>
          </button>

          <button className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all text-center">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-2">
              <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <div className="text-sm font-semibold text-gray-900">Değerlendir</div>
            <div className="text-xs text-gray-400 mt-0.5">App Store</div>
          </button>
        </div>

        {/* Alt Bilgi & Çıkış */}
        <div className="space-y-3">
          <div className="text-center text-xs text-gray-400">
            Versiyon 1.0.0 • TaskFlow
          </div>
          <button className="w-full py-4 bg-red-50 border border-red-200 text-red-600 font-semibold rounded-2xl hover:bg-red-100 transition-all flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Çıkış Yap
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================
// TASARIM 3: Dashboard-style (Kompakt & Bilgi yoğun)
// =============================================
function SettingsDesign3() {
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [activeTab, setActiveTab] = useState<'genel' | 'hesap' | 'veri'>('genel');

  const Toggle = ({ enabled, onChange }: { enabled: boolean; onChange: () => void }) => (
    <button
      onClick={onChange}
      className={`relative w-11 h-6 rounded-full transition-all duration-300 ${
        enabled ? 'bg-emerald-500' : 'bg-gray-300'
      }`}
    >
      <div
        className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-300"
        style={{ left: enabled ? '20px' : '2px' }}
      />
    </button>
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-emerald-700 px-6 pt-6 pb-4">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold text-white mb-4">Ayarlar</h1>

          {/* Profil Compact */}
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-white text-lg font-bold">
              C
            </div>
            <div className="flex-1">
              <div className="text-white font-semibold">Ceyda</div>
              <div className="text-emerald-200 text-sm">ceyda@email.com</div>
            </div>
            <button className="px-3 py-1.5 bg-white/20 text-white text-xs font-semibold rounded-lg hover:bg-white/30 transition-all">
              Düzenle
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-md mx-auto px-4 pt-4">
        <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
          {(['genel', 'hesap', 'veri'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'genel' ? 'Genel' : tab === 'hesap' ? 'Hesap' : 'Veri'}
            </button>
          ))}
        </div>

        {/* Tab İçeriği */}
        {activeTab === 'genel' && (
          <div className="space-y-4">
            <div className="rounded-xl border border-gray-200 divide-y divide-gray-100">
              <div className="flex items-center justify-between px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <span className="text-lg">🌙</span>
                  <span className="font-medium text-gray-900 text-sm">Karanlık Mod</span>
                </div>
                <Toggle enabled={darkMode} onChange={() => setDarkMode(!darkMode)} />
              </div>
              <div className="flex items-center justify-between px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <span className="text-lg">🔔</span>
                  <span className="font-medium text-gray-900 text-sm">Bildirimler</span>
                </div>
                <Toggle enabled={notifications} onChange={() => setNotifications(!notifications)} />
              </div>
              <div className="flex items-center justify-between px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <span className="text-lg">🌐</span>
                  <span className="font-medium text-gray-900 text-sm">Dil</span>
                </div>
                <span className="text-sm text-gray-500">Türkçe</span>
              </div>
              <div className="flex items-center justify-between px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <span className="text-lg">📅</span>
                  <span className="font-medium text-gray-900 text-sm">Hafta Başlangıcı</span>
                </div>
                <span className="text-sm text-gray-500">Pazartesi</span>
              </div>
              <div className="flex items-center justify-between px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <span className="text-lg">⏰</span>
                  <span className="font-medium text-gray-900 text-sm">Varsayılan Hatırlatma</span>
                </div>
                <span className="text-sm text-gray-500">15 dk önce</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'hesap' && (
          <div className="space-y-4">
            <div className="rounded-xl border border-gray-200 divide-y divide-gray-100">
              <button className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-lg">👤</span>
                  <span className="font-medium text-gray-900 text-sm">Profil Bilgileri</span>
                </div>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <button className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-lg">🔒</span>
                  <span className="font-medium text-gray-900 text-sm">Şifre Değiştir</span>
                </div>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <button className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-lg">🔗</span>
                  <span className="font-medium text-gray-900 text-sm">Bağlı Hesaplar</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Google</span>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            </div>

            <button className="w-full py-3.5 bg-red-50 border border-red-200 text-red-600 font-semibold rounded-xl hover:bg-red-100 transition-all text-sm">
              Çıkış Yap
            </button>

            <button className="w-full py-3.5 text-red-400 font-medium text-xs hover:text-red-600 transition-colors">
              Hesabı Kalıcı Olarak Sil
            </button>
          </div>
        )}

        {activeTab === 'veri' && (
          <div className="space-y-4">
            {/* Kullanım İstatistikleri */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-100">
              <h4 className="text-sm font-bold text-gray-900 mb-3">Depolama Kullanımı</h4>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-3 rounded-full" style={{ width: '35%' }}></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>3.5 MB kullanılıyor</span>
                <span>10 MB limit</span>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 divide-y divide-gray-100">
              <button className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-lg">📤</span>
                  <div className="text-left">
                    <div className="font-medium text-gray-900 text-sm">Verileri Dışa Aktar</div>
                    <div className="text-xs text-gray-400">JSON / CSV formatında</div>
                  </div>
                </div>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <button className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-lg">📥</span>
                  <div className="text-left">
                    <div className="font-medium text-gray-900 text-sm">Verileri İçe Aktar</div>
                    <div className="text-xs text-gray-400">Yedekten geri yükle</div>
                  </div>
                </div>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <button className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-lg">🗄️</span>
                  <div className="text-left">
                    <div className="font-medium text-gray-900 text-sm">Arşivlenmiş Görevler</div>
                    <div className="text-xs text-gray-400">12 görev arşivde</div>
                  </div>
                </div>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <button className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-red-50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-lg">🗑️</span>
                  <div className="text-left">
                    <div className="font-medium text-red-600 text-sm">Tüm Verileri Temizle</div>
                    <div className="text-xs text-gray-400">Bu işlem geri alınamaz</div>
                  </div>
                </div>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <div className="text-center text-xs text-gray-400 pt-2">
              Versiyon 1.0.0 • Son yedekleme: Bugün 14:30
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================
// ANA SAYFA - 3 TASARIMI YAN YANA GÖSTER
// =============================================
export default function SettingsPreview() {
  const [activeDesign, setActiveDesign] = useState(1);

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Tasarım Seçici */}
      <div className="sticky top-0 z-50 bg-gray-800 border-b border-gray-700 px-4 py-3">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-white text-lg font-bold mb-3 text-center">Ayarlar Sayfası - Tasarım Önizleme</h1>
          <div className="flex gap-2 justify-center">
            {[1, 2, 3].map(num => (
              <button
                key={num}
                onClick={() => setActiveDesign(num)}
                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeDesign === num
                    ? 'bg-emerald-500 text-white shadow-lg'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Tasarım {num}
                {num === 1 && ' (Minimal)'}
                {num === 2 && ' (Modern)'}
                {num === 3 && ' (Dashboard)'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Telefon Frame */}
      <div className="flex justify-center py-8 px-4">
        <div className="w-full max-w-[390px] bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border-4 border-gray-700" style={{ minHeight: '780px' }}>
          <div className="overflow-y-auto" style={{ maxHeight: '780px' }}>
            {activeDesign === 1 && <SettingsDesign1 />}
            {activeDesign === 2 && <SettingsDesign2 />}
            {activeDesign === 3 && <SettingsDesign3 />}
          </div>
        </div>
      </div>
    </div>
  );
}
