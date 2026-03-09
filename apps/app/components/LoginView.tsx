'use client';

import { useState, useMemo } from 'react';
import { supabase } from '@cursor-deneme/shared';
import { saveProfile } from '@cursor-deneme/shared';

const MIN_PASSWORD_LENGTH = 8;

/** Supabase/API key hatalarını kullanıcı dostu mesaja çevir */
function normalizeAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('invalid api key') || lower.includes('api key') || lower.includes('invalid key')) {
    return 'Supabase API anahtarı eksik veya yanlış. Giriş yapabilmek için projede apps/app/.env.local dosyasına NEXT_PUBLIC_SUPABASE_ANON_KEY eklemeniz gerekiyor. Supabase Dashboard → Project Settings → API → anon public key.';
  }
  return message;
}

/** Şifre gücü: uzunluk ve çeşitlilik (büyük/küçük/rakam/sembol) */
function getPasswordStrength(p: string): 'weak' | 'medium' | 'strong' {
  if (!p.length) return 'weak';
  const hasLower = /[a-z]/.test(p);
  const hasUpper = /[A-Z]/.test(p);
  const hasNumber = /\d/.test(p);
  const hasSymbol = /[^A-Za-z0-9]/.test(p);
  const variety = [hasLower, hasUpper, hasNumber, hasSymbol].filter(Boolean).length;
  if (p.length >= 12 && variety >= 3) return 'strong';
  if (p.length >= 8 && variety >= 2) return 'medium';
  return 'weak';
}

/** Have I Been Pwned API: şifre sızıntıda mı? (sadece hash prefix gider, şifre dışarı çıkmaz) */
async function isPasswordPwned(password: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();
    const prefix = hashHex.slice(0, 5);
    const suffix = hashHex.slice(5);
    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, { cache: 'no-store' });
    if (!res.ok) return false;
    const text = await res.text();
    const lines = text.split(/\r?\n/);
    return lines.some((line) => line.startsWith(suffix));
  } catch {
    return false;
  }
}

interface LoginViewProps {
  onLogin: (userId: string) => void;
  onSkip: () => void;
  darkMode?: boolean;
}

export default function LoginView({ onLogin, onSkip, darkMode = false }: LoginViewProps) {
  const dark = darkMode;
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);

  const switchTab = (signUp: boolean) => {
    setIsSignUp(signUp);
    setError(null);
    setPassword('');
    setShowPassword(false);
    if (!signUp) {
      setFirstName('');
      setLastName('');
      setFullName('');
    }
  };

  const getDisplayNameFromSignUp = (): { firstName: string; lastName: string } => {
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return { firstName: '', lastName: '' };
    return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
  };

  const handleEmailSubmit = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Lütfen e-posta adresinizi girin');
      return;
    }
    if (!password.trim()) {
      setError('Lütfen şifrenizi girin');
      return;
    }
    if (isSignUp) {
      const { firstName: ad, lastName: soyad } = fullName.trim() ? getDisplayNameFromSignUp() : { firstName: firstName.trim(), lastName: lastName.trim() };
      if (!ad) {
        setError('Lütfen adınızı girin.');
        return;
      }
      if (password.trim().length < MIN_PASSWORD_LENGTH) {
        setError(`Şifre en az ${MIN_PASSWORD_LENGTH} karakter olmalıdır.`);
        return;
      }
      const pwned = await isPasswordPwned(password);
      if (pwned) {
        setError('Bu şifre daha önce veri sızıntılarında görüldü. Daha güvenli bir şifre seçin.');
        return;
      }
    }
    setLoading(true);
    setError(null);
    try {
      if (isSignUp) {
        const { data, error: err } = await supabase.auth.signUp({
          email: trimmedEmail,
          password: password.trim(),
        });
        if (err) {
          setError(normalizeAuthError(err.message));
          setLoading(false);
          return;
        }
        const { firstName: fn, lastName: ln } = fullName.trim() ? getDisplayNameFromSignUp() : { firstName: firstName.trim(), lastName: lastName.trim() };
        const displayName = [fn, ln].filter(Boolean).join(' ') || null;
        if (data.user && data.session) {
          if (displayName) await saveProfile(data.user.id, { displayName });
          onLogin(data.user.id);
        } else if (data.user && !data.session) {
          setError('Hesabınız oluşturuldu. E-postanıza gelen onay bağlantısına tıklayın (gelen kutusu ve spam klasörünü kontrol edin), sonra buradan giriş yapın.');
        }
      } else {
        const { data, error: err } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password: password.trim(),
        });
        if (err) {
          setError(normalizeAuthError(err.message));
          setLoading(false);
          return;
        }
        if (data.user) {
          onLogin(data.user.id);
        }
      }
    } catch (err: unknown) {
      setError(normalizeAuthError(err instanceof Error ? err.message : 'Bir hata oluştu'));
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/` : undefined,
        },
      });
      if (error) {
        const msg = String(error.message || '');
        if (msg.includes('provider is not enabled') || msg.includes('Unsupported provider') || (msg.includes('validation_failed') && msg.includes('provider'))) {
          setError('Google ile giriş henüz ayarlanmadı. E-posta ve şifre ile giriş yapabilirsin.');
        } else {
          setError(normalizeAuthError(msg));
        }
        setLoading(false);
      }
    } catch (err: unknown) {
      const msg = String(err instanceof Error ? err.message : 'Bir hata oluştu');
      if (msg.includes('provider is not enabled') || msg.includes('Unsupported provider') || (msg.includes('validation_failed') && msg.includes('provider'))) {
        setError('Google ile giriş henüz ayarlanmadı. E-posta ve şifre ile giriş yapabilirsin.');
      } else {
        setError(normalizeAuthError(msg));
      }
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const trimmed = forgotEmail.trim();
    if (!trimmed) {
      setError('Lütfen e-posta adresinizi girin');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { error: err } = await supabase.auth.resetPasswordForEmail(trimmed, {
        redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/` : undefined,
      });
      if (err) {
        setError(normalizeAuthError(err.message));
        setLoading(false);
        return;
      }
      setForgotSent(true);
    } catch (err: unknown) {
      setError(normalizeAuthError(err instanceof Error ? err.message : 'Bir hata oluştu'));
    }
    setLoading(false);
  };

  if (showForgotPassword) {
    return (
      <div className={`min-h-screen ${dark ? 'bg-[#0f0f0f] text-zinc-100' : 'bg-[#f5f0ea] text-stone-800'}`}>
        <div className="max-w-md mx-auto px-5 pt-6 pb-4">
          <header className="mb-6">
            <h1 className={dark ? 'text-xl font-semibold text-white' : 'text-xl font-semibold text-stone-800'}>Şifremi unuttum</h1>
            <p className={dark ? 'text-sm text-zinc-500 mt-1' : 'text-stone-500 mt-1'}>
              E-posta adresinizi girin, size şifre sıfırlama bağlantısı gönderelim.
            </p>
          </header>
          <div className={`rounded-xl p-5 mb-4 ${dark ? 'bg-zinc-900/60 border border-zinc-800' : 'bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)] border border-stone-100'}`}>
            {forgotSent ? (
              <p className={dark ? 'text-zinc-300' : 'text-stone-700'}>
                E-posta gönderildi. Gelen kutunuzu ve <strong>spam</strong> klasörünü kontrol edin; bağlantıya tıklayarak şifrenizi sıfırlayabilirsiniz.
              </p>
            ) : (
              <>
                <label className={`block text-sm font-medium mb-1.5 ${dark ? 'text-zinc-400' : 'text-stone-600'}`}>E-posta</label>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent mb-4 ${dark ? 'bg-zinc-800 border-zinc-600 text-white placeholder-zinc-500 focus:ring-amber-500' : 'bg-white border-stone-200 text-stone-900 placeholder-stone-400 focus:ring-amber-500'}`}
                  placeholder="ornek@email.com"
                  disabled={loading}
                  autoComplete="email"
                />
                {error && (
                  <div role="alert" className={`mb-4 p-3 rounded-xl text-sm ${dark ? 'bg-red-900/20 border border-red-800 text-red-400' : 'bg-red-50 border border-red-200 text-red-700'}`}>
                    {error}
                  </div>
                )}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={loading}
                    className="flex-1 py-3.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl transition-all disabled:opacity-50"
                  >
                    {loading ? 'Gönderiliyor...' : 'Gönder'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowForgotPassword(false); setError(null); setForgotSent(false); }}
                    className={`py-3.5 px-4 rounded-xl font-semibold ${dark ? 'text-zinc-400 hover:bg-zinc-800' : 'text-stone-600 hover:bg-stone-100'}`}
                  >
                    Geri
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* Kayıt Ol – ayrı ekran (Nudge tasarımı) */
  if (isSignUp) {
    const signUpInputClass = `w-full h-14 px-4 rounded-xl border bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-base font-normal ${
      dark ? 'border-slate-800' : 'border-slate-200'
    }`;
    const signUpLabelClass = 'text-slate-700 dark:text-slate-300 text-sm font-semibold leading-normal pb-2 px-1';

    return (
      <div className={`min-h-screen w-full flex flex-col items-center overflow-x-hidden transition-colors duration-300 ${dark ? 'bg-background-dark' : 'bg-background-light'}`} style={{ backgroundColor: dark ? '#221610' : '#f6f6f8' }}>
        <div className="w-full max-w-[480px] px-6 pt-12 md:pt-20">
          <div className="flex items-center justify-between mb-8">
            <button
              type="button"
              onClick={() => switchTab(false)}
              className="flex size-12 shrink-0 items-center justify-start cursor-pointer text-slate-900 dark:text-slate-100 focus:outline-none"
              aria-label="Geri"
            >
              <span className="material-symbols-outlined text-2xl">arrow_back</span>
            </button>
            <h2 className="text-xl font-bold leading-tight tracking-tight flex-1 text-center pr-12 uppercase tracking-widest" style={{ color: dark ? '#f5f0ea' : '#1a1a1a' }}>Nudge</h2>
          </div>

          <div className="mb-10 text-center">
            <h1 className="text-slate-900 dark:text-slate-100 tracking-tight text-3xl font-bold leading-tight pb-2">Yeni bir başlangıç yap</h1>
            <p className="text-slate-500 dark:text-slate-400 text-base">Hemen aramıza katıl ve deneyime başla.</p>
          </div>

          <form
            className="space-y-6"
            onSubmit={(e) => { e.preventDefault(); handleEmailSubmit(); }}
          >
            <div className="flex flex-col w-full">
              <label className={signUpLabelClass}>Ad Soyad</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={signUpInputClass}
                placeholder="Adınızı ve soyadınızı girin"
                disabled={loading}
                autoComplete="name"
              />
            </div>
            <div className="flex flex-col w-full">
              <label className={signUpLabelClass}>E-posta</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={signUpInputClass}
                placeholder="e-posta@örnek.com"
                disabled={loading}
                autoComplete="email"
              />
            </div>
            <div className="flex flex-col w-full">
              <label className={signUpLabelClass}>Şifre</label>
              <div className={`flex w-full items-stretch rounded-xl border bg-white dark:bg-slate-900 transition-all focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary ${dark ? 'border-slate-800' : 'border-slate-200'}`}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="flex w-full border-none bg-transparent h-14 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 px-4 text-base font-normal focus:ring-0 outline-none"
                  placeholder="••••••••"
                  disabled={loading}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="text-slate-400 flex items-center justify-center pr-4 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                >
                  <span className="material-symbols-outlined">visibility</span>
                </button>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 ml-1">En az {MIN_PASSWORD_LENGTH} karakter</p>
            </div>
            {error && (
              <div role="alert" className={`p-3 rounded-lg text-sm ${dark ? 'bg-red-900/20 border border-red-800 text-red-400' : 'bg-red-50 border border-red-200 text-red-700'}`}>
                {error}
              </div>
            )}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full h-14 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                style={{ backgroundColor: '#f97316', boxShadow: '0 10px 40px -10px rgba(249,115,22,0.35)' }}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Yükleniyor...</span>
                  </>
                ) : (
                  'Kayıt Ol'
                )}
              </button>
            </div>
          </form>

          <div className="mt-8 text-center">
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              Zaten hesabın var mı?{' '}
              <button type="button" onClick={() => switchTab(false)} className="font-bold hover:underline ml-1 focus:outline-none" style={{ color: '#f97316' }}>
                Giriş Yap
              </button>
            </p>
          </div>

          <div className="mt-12 flex flex-col items-center">
            <div className="w-full flex items-center gap-4 mb-6">
              <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
              <span className="text-slate-400 text-xs uppercase tracking-widest font-medium">veya</span>
              <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
            </div>
            <div className="flex gap-4 w-full">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="flex-1 flex items-center justify-center h-12 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              </button>
              <button
                type="button"
                className="flex-1 flex items-center justify-center h-12 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                aria-label="Apple ile giriş (yakında)"
              >
                <svg className="w-5 h-5 dark:invert" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13 1.86 1.19 2.74-.95 4.05-.78-.08 1.4.55 2.27 1.12 2.27-.57 1.07-3.97 3.05-6.17 3.05zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                </svg>
              </button>
            </div>
          </div>

          <p className="mt-12 mb-8 text-center text-[10px] text-slate-400 dark:text-slate-500 px-8 uppercase tracking-tighter leading-relaxed">
            Kayıt olarak Kullanım Koşulları ve Gizlilik Politikası&apos;nı kabul etmiş sayılırsınız.
          </p>
        </div>
      </div>
    );
  }

  const inputClass = `w-full h-14 px-4 rounded-lg border focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-slate-400 ${
    dark ? 'border-slate-700 bg-slate-800 text-white' : 'border-slate-200 bg-white text-slate-900'
  }`;
  const labelClass = `text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1`;

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center px-6 py-12 md:py-24 antialiased ${dark ? 'bg-background-dark text-slate-100' : 'bg-background-light text-slate-900'}`} style={{ backgroundColor: dark ? '#221610' : '#fdfcfb' }}>
      <div className="w-full max-w-[480px] mx-auto flex flex-col items-center">
        {/* Header – Nudge */}
        <header className="w-full flex flex-col items-center mb-10 pt-12">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 shadow-lg" style={{ backgroundColor: '#f97316', boxShadow: '0 10px 40px -10px rgba(249,115,22,0.35)' }}>
            <span className="material-symbols-outlined text-white text-5xl">notifications_active</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2" style={{ color: dark ? '#f5f0ea' : '#1a1a1a' }}>Nudge</h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg font-normal">Gününü kolayca planla</p>
        </header>

        {/* Toggle Giriş Yap / Kayıt Ol */}
        <div className="w-full mb-8">
          <div className="flex h-12 w-full items-center rounded-lg bg-slate-100 dark:bg-slate-800 p-1">
            <button
              type="button"
              onClick={() => switchTab(false)}
              className={`flex h-full grow items-center justify-center rounded-lg px-2 text-sm font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                !isSignUp
                  ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              Giriş Yap
            </button>
            <button
              type="button"
              onClick={() => switchTab(true)}
              className={`flex h-full grow items-center justify-center rounded-lg px-2 text-sm font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                isSignUp
                  ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              Kayıt Ol
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="w-full space-y-5">
          {isSignUp && (
            <>
              <div className="flex flex-col gap-2">
                <label className={labelClass}>Ad</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleEmailSubmit()}
                  className={inputClass}
                  placeholder="Örn. Ceyda"
                  disabled={loading}
                  autoComplete="given-name"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className={labelClass}>Soyad</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleEmailSubmit()}
                  className={inputClass}
                  placeholder="Örn. Yılmaz"
                  disabled={loading}
                  autoComplete="family-name"
                />
              </div>
            </>
          )}

          <div className="flex flex-col gap-2">
            <label className={labelClass}>E-posta</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleEmailSubmit()}
              className={inputClass}
              placeholder="e-posta@adresiniz.com"
              disabled={loading}
              autoComplete="email"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className={labelClass}>Şifre</label>
            <div className="relative group">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleEmailSubmit()}
                className={`${inputClass} pr-12`}
                placeholder="••••••••"
                disabled={loading}
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                aria-label="Şifre"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none"
                aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
              >
                <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
            {isSignUp && (
              <p className="text-xs text-slate-500 dark:text-slate-400 ml-1">En az {MIN_PASSWORD_LENGTH} karakter</p>
            )}
            {isSignUp && password.length > 0 && (
              <div className="flex items-center gap-2 ml-1">
                <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 max-w-[120px]">
                  <div
                    className={`h-full rounded-full transition-all ${
                      passwordStrength === 'weak' ? 'w-1/3 bg-red-500' : passwordStrength === 'medium' ? 'w-2/3 bg-amber-500' : 'w-full bg-emerald-500'
                    }`}
                  />
                </div>
                <span className={`text-xs font-medium ${passwordStrength === 'weak' ? 'text-red-500' : passwordStrength === 'medium' ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {passwordStrength === 'weak' ? 'Zayıf' : passwordStrength === 'medium' ? 'Orta' : 'Güçlü'}
                </span>
              </div>
            )}
            {!isSignUp && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => { setShowForgotPassword(true); setError(null); }}
                  className="text-xs font-medium hover:underline focus:outline-none"
                  style={{ color: '#f97316' }}
                >
                  Şifremi unuttum
                </button>
              </div>
            )}
          </div>

          {/* Ana buton */}
          <button
            type="button"
            onClick={handleEmailSubmit}
            disabled={loading}
            className="w-full h-14 text-white font-bold rounded-lg shadow-lg transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 hover:bg-orange-600"
            style={{ backgroundColor: '#f97316', boxShadow: '0 10px 40px -10px rgba(249,115,22,0.4)' }}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Yükleniyor...</span>
              </>
            ) : (
              <span>{isSignUp ? 'Kayıt Ol' : 'Giriş Yap'}</span>
            )}
          </button>
        </div>

        {/* Veya */}
        <div className="w-full flex items-center my-8">
          <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
          <span className="px-4 text-xs font-medium text-slate-400 uppercase tracking-widest">veya</span>
          <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
        </div>

        {/* Google ile devam et */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full h-14 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          <span>Google ile devam et</span>
        </button>

        {error && (
          <div role="alert" className={`w-full mt-4 p-3 rounded-lg text-sm ${dark ? 'bg-red-900/20 border border-red-800 text-red-400' : 'bg-red-50 border border-red-200 text-red-700'}`}>
            {error}
          </div>
        )}

        {/* Hesap olmadan devam et */}
        <div className="mt-10">
          <button
            type="button"
            onClick={onSkip}
            className="text-sm font-medium text-slate-500 hover:text-orange-500 dark:hover:text-orange-400 transition-colors flex items-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 rounded-lg px-1 py-0.5"
          >
            Hesap olmadan devam et
            <span className="material-symbols-outlined text-base">chevron_right</span>
          </button>
          <p className="text-xs mt-3 text-slate-400 dark:text-slate-500">
            Devam ederek Kullanım Şartlarını kabul etmiş olursunuz
          </p>
        </div>
      </div>
    </div>
  );
}
