'use client';

import { useState, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { saveProfile } from '@/lib/helpers';

const MIN_PASSWORD_LENGTH = 8;

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
    }
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
      const ad = firstName.trim();
      const soyad = lastName.trim();
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
          setError(err.message);
          setLoading(false);
          return;
        }
        const displayName = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ') || null;
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
          setError(err.message);
          setLoading(false);
          return;
        }
        if (data.user) {
          onLogin(data.user.id);
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu');
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
          setError(msg);
        }
        setLoading(false);
      }
    } catch (err: unknown) {
      const msg = String(err instanceof Error ? err.message : 'Bir hata oluştu');
      if (msg.includes('provider is not enabled') || msg.includes('Unsupported provider') || (msg.includes('validation_failed') && msg.includes('provider'))) {
        setError('Google ile giriş henüz ayarlanmadı. E-posta ve şifre ile giriş yapabilirsin.');
      } else {
        setError(msg);
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
        setError(err.message);
        setLoading(false);
        return;
      }
      setForgotSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu');
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

  return (
    <div className={`min-h-screen flex flex-col ${dark ? 'bg-[#0f0f0f] text-zinc-100' : 'bg-[#f5f0ea] text-stone-800'}`}>
      <div className="max-w-md mx-auto w-full px-4 pt-10 pb-6 flex-1 flex flex-col">
        {/* Ürün adı – minimal, Todoist tarzı */}
        <header className="text-center mb-8">
          <p className={`text-sm font-medium uppercase tracking-widest ${dark ? 'text-amber-400/90' : 'text-amber-600'}`}>
            Görev & Takvim
          </p>
          <h1 className={`mt-2 text-2xl font-semibold tracking-tight ${dark ? 'text-white' : 'text-stone-900'}`}>
            Hoş geldin
          </h1>
          <p className={`text-sm mt-1 ${dark ? 'text-zinc-500' : 'text-stone-500'}`}>
            Gününü kolayca planla
          </p>
        </header>

        {/* Form kartı – tek kart, Giriş/Kayıt sekmeli */}
        <div className={`rounded-xl p-4 mb-4 ${
          dark ? 'bg-zinc-900/60 border border-zinc-800' : 'bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)] border border-stone-100'
        }`}>
          <div className={`flex gap-1 mb-4 rounded-lg p-1 ${dark ? 'bg-zinc-800' : 'bg-stone-100'}`}>
            <button
              type="button"
              onClick={() => switchTab(false)}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${
                !isSignUp
                  ? dark ? 'bg-zinc-600 text-amber-400' : 'bg-white text-amber-600 shadow-sm'
                  : dark ? 'text-zinc-400 hover:text-zinc-200' : 'text-stone-600 hover:text-stone-700'
              }`}
            >
              Giriş Yap
            </button>
            <button
              type="button"
              onClick={() => switchTab(true)}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${
                isSignUp
                  ? dark ? 'bg-zinc-600 text-amber-400' : 'bg-white text-amber-600 shadow-sm'
                  : dark ? 'text-zinc-400 hover:text-zinc-200' : 'text-stone-600 hover:text-stone-700'
              }`}
            >
              Kayıt Ol
            </button>
          </div>

          {isSignUp && (
            <>
              <label className={`block text-sm font-medium mb-1.5 ${dark ? 'text-zinc-400' : 'text-stone-600'}`}>Ad</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleEmailSubmit()}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all mb-4 ${
                  dark
                    ? 'bg-zinc-800 border-zinc-600 text-white placeholder-zinc-500 focus:ring-amber-500'
                    : 'bg-white border-stone-200 text-stone-900 placeholder-stone-400 focus:ring-amber-500'
                }`}
                placeholder="Örn. Ceyda"
                disabled={loading}
                autoComplete="given-name"
              />
              <label className={`block text-sm font-medium mb-1.5 ${dark ? 'text-zinc-400' : 'text-stone-600'}`}>Soyad</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleEmailSubmit()}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all mb-4 ${
                  dark
                    ? 'bg-zinc-800 border-zinc-600 text-white placeholder-zinc-500 focus:ring-amber-500'
                    : 'bg-white border-stone-200 text-stone-900 placeholder-stone-400 focus:ring-amber-500'
                }`}
                placeholder="Örn. Yılmaz"
                disabled={loading}
                autoComplete="family-name"
              />
            </>
          )}

          <label className={`block text-sm font-medium mb-1.5 ${dark ? 'text-zinc-400' : 'text-stone-600'}`}>E-posta</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleEmailSubmit()}
            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all mb-4 ${
              dark
                ? 'bg-zinc-800 border-zinc-600 text-white placeholder-zinc-500 focus:ring-amber-500'
                : 'bg-white border-stone-200 text-stone-900 placeholder-stone-400 focus:ring-amber-500'
            }`}
            placeholder="ornek@email.com"
            disabled={loading}
            autoComplete="email"
          />
          <label className={`block text-sm font-medium mb-1.5 ${dark ? 'text-zinc-400' : 'text-stone-600'}`}>Şifre</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleEmailSubmit()}
              className={`w-full px-4 py-3 pr-12 border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                dark
                  ? 'bg-zinc-800 border-zinc-600 text-white placeholder-zinc-500 focus:ring-amber-500'
                  : 'bg-white border-stone-200 text-stone-900 placeholder-stone-400 focus:ring-amber-500'
              }`}
              placeholder="••••••••"
              disabled={loading}
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              aria-label="Şifre"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${dark ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700' : 'text-stone-400 hover:text-stone-600 hover:bg-stone-100'}`}
              aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
            >
              {showPassword ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              )}
            </button>
          </div>
          {isSignUp && (
            <>
              <p className={`text-xs mt-1.5 ${dark ? 'text-zinc-500' : 'text-stone-500'}`}>En az {MIN_PASSWORD_LENGTH} karakter</p>
              {password.length > 0 && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-stone-200 dark:bg-zinc-700">
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
            </>
          )}
          {!isSignUp && (
            <button
              type="button"
              onClick={() => { setShowForgotPassword(true); setError(null); }}
              className={`text-sm mt-2 block ${dark ? 'text-amber-400 hover:text-amber-300' : 'text-amber-600 hover:text-amber-700'}`}
            >
              Şifremi unuttum
            </button>
          )}
          <button
            type="button"
            onClick={handleEmailSubmit}
            disabled={loading}
            className="w-full mt-4 py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
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
              <span>{isSignUp ? 'Hesap Oluştur' : 'Giriş Yap'}</span>
            )}
          </button>

          <div className={`flex items-center my-4 ${dark ? 'border-zinc-700' : 'border-stone-200'}`}>
            <div className={`flex-1 border-t ${dark ? 'border-zinc-700' : 'border-stone-200'}`} />
            <span className={`px-3 text-xs font-medium uppercase tracking-wider ${dark ? 'text-zinc-500' : 'text-stone-400'}`}>veya</span>
            <div className={`flex-1 border-t ${dark ? 'border-zinc-700' : 'border-stone-200'}`} />
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className={`w-full rounded-xl border p-3 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 ${
              dark
                ? 'bg-zinc-800 border-zinc-600 hover:border-amber-500/40 text-white'
                : 'bg-white border-stone-200 hover:border-amber-200 text-stone-800'
            }`}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span>Google ile devam et</span>
          </button>

          {error && (
            <div role="alert" className={`mt-4 p-3 rounded-xl text-sm ${dark ? 'bg-red-900/20 border border-red-800 text-red-400' : 'bg-red-50 border border-red-200 text-red-700'}`}>
              {error}
            </div>
          )}
        </div>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={onSkip}
            className={`text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 rounded-lg px-2 py-1 ${
              dark ? 'text-zinc-400 hover:text-zinc-200' : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            Hesap olmadan devam et
          </button>
          <p className={`text-xs mt-4 ${dark ? 'text-zinc-500' : 'text-stone-400'}`}>
            Devam ederek Kullanım Şartlarını kabul etmiş olursunuz
          </p>
        </div>
      </div>
    </div>
  );
}
