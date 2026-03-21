'use client';

import { useState, useMemo, useRef } from 'react';
import { supabase } from '@cursor-deneme/shared';
import { saveProfile } from '@cursor-deneme/shared';

const MIN_PASSWORD_LENGTH = 8;
const AUTH_REQUEST_TIMEOUT_MS = 30000;
const SIGN_IN_REQUEST_TIMEOUT_MS = 35000;

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Aynı cihazda art arda tıklanınca Supabase rate limit’e düşmeyi azaltmak için (ms). */
const FORGOT_PASSWORD_MIN_INTERVAL_MS = 75_000;
/** Sunucu rate-limit döndüğünde istemci tarafında uygulanacak bekleme. */
const FORGOT_PASSWORD_RATE_LIMIT_COOLDOWN_MS = 10 * 60 * 1000;
const FORGOT_PASSWORD_RATE_LIMIT_KEY = 'forgot_password_rate_limit_until';

/** L0: Lybell marka logosu (lacivert kare + beyaz L, şeffaf arka plan) */
function LybellAuthLogoBlock() {
  return (
    <img src="/lybell-mark.svg" alt="" width={72} height={72} className="block mb-4" />
  );
}

/** Supabase/API key hatalarını kullanıcı dostu mesaja çevir */
function normalizeAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('invalid api key') || lower.includes('api key') || lower.includes('invalid key')) {
    return 'Supabase API anahtarı eksik veya yanlış. Giriş yapabilmek için projede apps/app/.env.local dosyasına NEXT_PUBLIC_SUPABASE_ANON_KEY eklemeniz gerekiyor. Supabase Dashboard → Project Settings → API → anon public key.';
  }
  if (lower.includes('email rate limit exceeded') || lower.includes('too many requests')) {
    return 'Bu sefer istek reddedildi (sunucu hız sınırı). Aynı e-posta/IP için daha önceki denemeler de sayılır; 5–10 dk sonra tekrar dene. Hiç mail gelmediyse Supabase’te özel SMTP / şablon ayarlarını kontrol et; gelen kutusu ve spam’e de bak.';
  }
  return message;
}

function isRateLimitError(message: string): boolean {
  const lower = message.toLowerCase();
  return lower.includes('email rate limit exceeded') || lower.includes('too many requests');
}

function formatWait(ms: number): string {
  const totalSec = Math.max(1, Math.ceil(ms / 1000));
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  if (min === 0) return `${sec} saniye`;
  if (sec === 0) return `${min} dakika`;
  return `${min} dk ${sec} sn`;
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
  const lastForgotPasswordRequestAt = useRef<number>(0);

  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);

  const getAuthCompleteUrl = (query?: string) => {
    const base =
      process.env.NEXT_PUBLIC_APP_BASE_URL ||
      (typeof window !== 'undefined' ? window.location.origin : '');
    return `${base}/auth/complete${query ? `?${query}` : ''}`;
  };

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
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setError('Lütfen geçerli bir e-posta adresi girin');
      return;
    }
    if (!password.trim()) {
      setError('Lütfen şifrenizi girin');
      return;
    }
      if (isSignUp) {
        const { firstName: ad, lastName: soyad } = fullName.trim()
          ? getDisplayNameFromSignUp()
          : { firstName: firstName.trim(), lastName: lastName.trim() };
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
        const { firstName: fn, lastName: ln } = fullName.trim()
          ? getDisplayNameFromSignUp()
          : { firstName: firstName.trim(), lastName: lastName.trim() };
        const displayName = [fn, ln].filter(Boolean).join(' ') || null;

        const { data, error: err } = await withTimeout(
          supabase.auth.signUp({
            email: trimmedEmail,
            password: password.trim(),
            options: {
              data: {
                full_name: displayName,
                first_name: fn || null,
                last_name: ln || null,
              },
              emailRedirectTo: getAuthCompleteUrl('type=signup'),
            },
          }),
          AUTH_REQUEST_TIMEOUT_MS,
          'İstek zaman aşımına uğradı. Lütfen tekrar deneyin.',
        );
        if (err) {
          setError(normalizeAuthError(err.message));
          return;
        }
        if (data.user && data.session) {
          if (displayName) await saveProfile(data.user.id, { displayName });
          if (typeof window !== 'undefined') {
            localStorage.setItem(`force_onboarding_${data.user.id}`, '1');
          }
          onLogin(data.user.id);
        } else if (data.user && !data.session) {
          setError('Hesabınız oluşturuldu. E-postanıza gelen onay bağlantısına tıklayın (gelen kutusu ve spam klasörünü kontrol edin), sonra buradan giriş yapın.');
        }
      } else {
        const { data, error: err } = await withTimeout(
          supabase.auth.signInWithPassword({
            email: trimmedEmail,
            password: password.trim(),
          }),
          SIGN_IN_REQUEST_TIMEOUT_MS,
          'Giriş isteği zaman aşımına uğradı. Lütfen internet bağlantını kontrol edip tekrar dene.',
        );
        if (err) {
          setError(normalizeAuthError(err.message));
          return;
        }
        if (data.user) {
          onLogin(data.user.id);
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Bir hata oluştu';
      if (message.toLowerCase().includes('zaman aşımı')) {
        try {
          const { data } = await supabase.auth.getSession();
          const existingUserId = data?.session?.user?.id;
          if (existingUserId) {
            onLogin(existingUserId);
            return;
          }
        } catch {
          // noop
        }
        setError('Giriş beklenenden uzun sürüyor. Lütfen birkaç saniye bekleyip tekrar dene.');
        return;
      }
      setError(normalizeAuthError(message));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: getAuthCompleteUrl('type=oauth&provider=google'),
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
    const now = Date.now();

    if (typeof window !== 'undefined') {
      const rateLimitUntil = Number(localStorage.getItem(FORGOT_PASSWORD_RATE_LIMIT_KEY) || '0');
      if (rateLimitUntil > now) {
        setError(`Sunucu şu an yeni isteği kabul etmiyor. Lütfen ${formatWait(rateLimitUntil - now)} bekleyip tekrar dene.`);
        return;
      }
    }

    if (!trimmed) {
      setError('Lütfen e-posta adresinizi girin');
      return;
    }
    if (!EMAIL_REGEX.test(trimmed)) {
      setError('Lütfen geçerli bir e-posta adresi girin');
      return;
    }
    const elapsed = now - lastForgotPasswordRequestAt.current;
    if (lastForgotPasswordRequestAt.current > 0 && elapsed < FORGOT_PASSWORD_MIN_INTERVAL_MS) {
      const waitSec = Math.ceil((FORGOT_PASSWORD_MIN_INTERVAL_MS - elapsed) / 1000);
      setError(
        `Çok hızlı tekrar deniyorsun. Sunucu güvenliği için ${waitSec} saniye bekleyip tekrar dene. Mail gelmediyse spam klasörüne ve Supabase e-posta ayarlarına da bak.`,
      );
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { error: err } = await withTimeout(
        supabase.auth.resetPasswordForEmail(trimmed, {
          redirectTo: getAuthCompleteUrl('type=recovery'),
        }),
        AUTH_REQUEST_TIMEOUT_MS,
        'Şifre sıfırlama isteği zaman aşımına uğradı. Lütfen tekrar deneyin.',
      );
      if (err) {
        lastForgotPasswordRequestAt.current = Date.now();
        if (isRateLimitError(err.message) && typeof window !== 'undefined') {
          localStorage.setItem(
            FORGOT_PASSWORD_RATE_LIMIT_KEY,
            String(Date.now() + FORGOT_PASSWORD_RATE_LIMIT_COOLDOWN_MS),
          );
        }
        setError(normalizeAuthError(err.message));
        return;
      }
      lastForgotPasswordRequestAt.current = Date.now();
      if (typeof window !== 'undefined') {
        localStorage.removeItem(FORGOT_PASSWORD_RATE_LIMIT_KEY);
      }
      setForgotSent(true);
    } catch (err: unknown) {
      lastForgotPasswordRequestAt.current = Date.now();
      const message = err instanceof Error ? err.message : 'Bir hata oluştu';
      if (isRateLimitError(message) && typeof window !== 'undefined') {
        localStorage.setItem(
          FORGOT_PASSWORD_RATE_LIMIT_KEY,
          String(Date.now() + FORGOT_PASSWORD_RATE_LIMIT_COOLDOWN_MS),
        );
      }
      setError(normalizeAuthError(message));
    } finally {
      setLoading(false);
    }
  };

  if (showForgotPassword) {
    return (
      <div
        className="relative flex min-h-screen w-full flex-col bg-background-light font-display antialiased text-slate-900"
        style={{ backgroundColor: '#f8f6f6' }}
      >
        <div className="flex flex-col items-center pt-10 pb-6 px-6">
          <LybellAuthLogoBlock />
          <h1 className="text-slate-900 text-3xl font-bold tracking-tight mb-1">Şifremi unuttum</h1>
          <p className="text-slate-500 text-sm font-medium text-center">
            E-posta adresinizi girin, size sıfırlama bağlantısı gönderelim.
          </p>
        </div>

        <div className="px-6">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
            {forgotSent ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 p-3 text-sm space-y-2">
                <p>
                  İstek kabul edildi. Birkaç dakika içinde gelen kutunu ve <strong>spam / gereksiz</strong> klasörünü kontrol et.
                </p>
                <p className="text-emerald-900/90 text-xs leading-relaxed">
                  Bu adresle kayıtlı hesap yoksa güvenlik için mail gönderilmez (ekranda yine başarı görünebilir). Hâlâ yoksa
                  Supabase → Authentication → URL Configuration: <strong>Redirect URLs</strong> listesine{' '}
                  <strong className="break-all">{getAuthCompleteUrl()}</strong> ekle; yerelde deniyorsan o ortamın{' '}
                  <span className="whitespace-nowrap">/auth/complete</span> adresini de ekle. Gerekirse özel SMTP kullan.
                </p>
              </div>
            ) : (
              <>
                <label className="block text-sm font-semibold text-slate-700 mb-2 ml-1">E-posta</label>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  placeholder="ornek@email.com"
                  disabled={loading}
                  autoComplete="email"
                />
                {error && (
                  <div role="alert" className="mt-4 p-3 rounded-xl text-sm bg-red-50 border border-red-200 text-red-700">
                    {error}
                  </div>
                )}
                <div className="mt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={loading}
                    className="flex-1 h-12 bg-primary text-white rounded-xl font-bold text-base shadow-md hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Gönderiliyor...' : 'Gönder'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setError(null);
                      setForgotSent(false);
                    }}
                    className="h-12 px-6 rounded-xl font-bold text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
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

  /* Kayıt Ol – Lybell tasarımı (aynı header, tab bar, form yapısı) */
  if (isSignUp) {
    const signUpInputClass =
      'w-full h-12 px-4 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all';
    const signUpLabelClass =
      'text-slate-700 text-sm font-semibold leading-normal ml-1';

    return (
      <div
        className="relative flex min-h-screen w-full flex-col bg-background-light font-display antialiased text-slate-900"
        style={{ backgroundColor: '#f8f6f6' }}
      >
        {/* Header / Logo */}
        <div className="flex flex-col items-center pt-12 pb-8 px-6">
          <LybellAuthLogoBlock />
          <h1 className="text-slate-900 text-3xl font-bold tracking-tight mb-1">
            Lybell
          </h1>
          <p className="text-slate-500 text-sm font-medium">
            Gününü kolayca planla
          </p>
        </div>

        {/* Tab bar – Kayıt Ol aktif */}
        <div className="px-6 mb-8">
          <div className="flex border-b border-slate-200">
            <button
              type="button"
              onClick={() => switchTab(false)}
              className="flex-1 flex flex-col items-center justify-center border-b-2 border-transparent py-4"
            >
              <span className="text-slate-400 text-sm font-bold">
                Giriş Yap
              </span>
            </button>
            <button
              type="button"
              onClick={() => switchTab(true)}
              className="flex-1 flex flex-col items-center justify-center border-b-2 border-primary py-4"
            >
              <span className="text-primary text-sm font-bold">
                Kayıt Ol
              </span>
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="px-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
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
          <div className="flex flex-col gap-1.5">
            <label className={signUpLabelClass}>E-posta</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={signUpInputClass}
              placeholder="ornek@eposta.com"
              disabled={loading}
              autoComplete="email"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={signUpLabelClass}>Şifre</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${signUpInputClass} pr-12`}
                placeholder="••••••••"
                disabled={loading}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
              >
                <span className="material-symbols-outlined">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
            <p className="text-xs text-slate-500 ml-1">
              En az {MIN_PASSWORD_LENGTH} karakter
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="p-3 rounded-lg text-sm bg-red-50 border border-red-200 text-red-700"
            >
              {error}
            </div>
          )}

          {/* Kayıt Ol butonu */}
          <button
            type="button"
            onClick={handleEmailSubmit}
            disabled={loading}
            className="w-full h-12 bg-primary text-white rounded-xl font-bold text-base shadow-md hover:opacity-90 transition-opacity mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Yükleniyor...' : 'Kayıt Ol'}
          </button>
        </div>

        {/* Divider */}
        <div className="px-6 py-8 flex items-center gap-4">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-slate-400 text-xs font-bold tracking-widest">VEYA</span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        {/* Google ile kayıt */}
        <div className="px-6 flex flex-col gap-4">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full h-12 flex items-center justify-center gap-3 border border-slate-200 bg-white rounded-xl hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
          >
            <svg
              height="20"
              width="20"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            <span className="text-slate-700 font-bold text-sm">
              Google ile Kayıt Ol
            </span>
          </button>
        </div>

        {/* Footer link */}
        <div className="mt-auto pb-10 flex justify-center px-6">
          <button
            type="button"
            onClick={() => switchTab(false)}
            className="text-slate-500 text-sm font-medium hover:text-primary transition-colors"
          >
            Zaten hesabın var mı? Giriş yap
          </button>
        </div>

        {/* Dekoratif arka plan */}
        <div className="absolute top-0 right-0 -z-10 opacity-5 pointer-events-none">
          <span
            className="material-symbols-outlined !text-[240px]"
            style={{ fontVariationSettings: "'wght' 100" }}
          >
            calendar_today
          </span>
        </div>
      </div>
    );
  }

  const loginInputClass =
    'w-full h-12 px-4 rounded-xl border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-slate-400';

  return (
    <div
      className="relative flex min-h-screen w-full flex-col bg-background-light overflow-x-hidden font-display antialiased"
      style={{ backgroundColor: '#f8f6f6' }}
    >
      {/* Header / Logo */}
      <div className="flex flex-col items-center pt-8 pb-6 px-6">
        <LybellAuthLogoBlock />
        <h1 className="text-slate-900 text-3xl font-bold tracking-tight mb-1">
          Lybell
        </h1>
        <p className="text-slate-500 text-sm font-medium">
          Gününü kolayca planla
        </p>
      </div>

      {/* Tab Switcher – Giriş Yap aktif */}
      <div className="px-6 mb-8">
        <div className="flex border-b border-slate-200">
          <button
            type="button"
            onClick={() => switchTab(false)}
            className="flex-1 flex flex-col items-center justify-center border-b-2 border-primary py-4"
          >
            <span className="text-primary text-sm font-bold">
              Giriş Yap
            </span>
          </button>
          <button
            type="button"
            onClick={() => switchTab(true)}
            className="flex-1 flex flex-col items-center justify-center border-b-2 border-transparent py-4"
          >
            <span className="text-slate-400 text-sm font-bold">
              Kayıt Ol
            </span>
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="px-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-slate-700 text-sm font-semibold ml-1">
            E-posta
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleEmailSubmit()}
            className={loginInputClass}
            placeholder="ornek@eposta.com"
            disabled={loading}
            autoComplete="email"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center px-1">
            <label className="text-slate-700 text-sm font-semibold">
              Şifre
            </label>
            <button
              type="button"
              onClick={() => {
                setShowForgotPassword(true);
                setError(null);
              }}
              className="text-primary text-xs font-semibold hover:underline"
            >
              Şifremi unuttum
            </button>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleEmailSubmit()}
            className={loginInputClass}
            placeholder="••••••••"
            disabled={loading}
            autoComplete="current-password"
          />
        </div>

        {error && (
          <div
            role="alert"
            className="p-3 rounded-lg text-sm bg-red-50 border border-red-200 text-red-700"
          >
            {error}
          </div>
        )}

        {/* Login Button */}
        <button
          type="button"
          onClick={handleEmailSubmit}
          disabled={loading}
            className="w-full h-12 bg-primary text-white rounded-xl font-bold text-base shadow-md hover:opacity-90 transition-opacity mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Yükleniyor...' : 'Giriş Yap'}
        </button>
      </div>

      {/* Divider */}
      <div className="px-6 py-6 flex items-center gap-4">
          <div className="h-px flex-1 bg-slate-200" />
        <span className="text-slate-400 text-xs font-bold tracking-widest">VEYA</span>
          <div className="h-px flex-1 bg-slate-200" />
      </div>

      {/* Social Login */}
      <div className="px-6 flex flex-col gap-4">
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
            className="w-full h-12 flex items-center justify-center gap-3 border border-slate-200 bg-white rounded-xl hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
        >
          <svg height="20" viewBox="0 0 24 24" width="20" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
            <span className="text-slate-700 font-bold text-sm">
            Google ile Giriş Yap
          </span>
        </button>
      </div>

      {/* Footer Link */}
      <div className="mt-auto pb-6 flex justify-center px-6">
        <button
          type="button"
          onClick={onSkip}
            className="text-slate-500 text-sm font-medium hover:text-primary transition-colors"
        >
          Hesap olmadan devam et
        </button>
      </div>

      {/* Decorative Background Element */}
        <div className="absolute top-0 right-0 -z-10 opacity-5 pointer-events-none">
        <span
          className="material-symbols-outlined !text-[240px]"
          style={{ fontVariationSettings: "'wght' 100" }}
        >
          calendar_today
        </span>
      </div>
    </div>
  );
}
