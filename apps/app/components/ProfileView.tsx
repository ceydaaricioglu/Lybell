'use client';

import { useState, useEffect } from 'react';
import { UserProfile } from '@cursor-deneme/shared';
import { getProfile, saveProfile, supabase } from '@cursor-deneme/shared';
import { useToast } from '@/components/Toast';

interface ProfileViewProps {
  userId: string;
  darkMode?: boolean;
  onBack: () => void;
}

export default function ProfileView({ userId, darkMode = false, onBack }: ProfileViewProps) {
  const dark = darkMode;
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState<UserProfile['gender']>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const p = await getProfile(userId);
      if (!cancelled) {
        // Profilden gelen değerler
        let name = p.displayName ?? '';
        const dob = p.dateOfBirth ?? '';
        const g = p.gender ?? null;

        // Eğer profile.displayName boşsa, Supabase kullanıcı meta bilgisinden ad/soyad çek
        if (!name) {
          try {
            const { data } = await supabase.auth.getUser();
            const user = data?.user;
            const meta = (user?.user_metadata ?? {}) as Record<string, any>;
            name =
              (meta.full_name as string | undefined) ||
              (meta.name as string | undefined) ||
              (meta.first_name && meta.last_name ? `${meta.first_name} ${meta.last_name}` : '') ||
              name;

            // Eğer metadata'dan anlamlı bir isim bulduysak ve profilde yoksa, profili de güncelle
            if (name && !p.displayName) {
              const updatedProfile: UserProfile = {
                displayName: name,
                dateOfBirth: dob || null,
                gender: g || null,
              };
              await saveProfile(userId, updatedProfile);
            }
          } catch {
            // sessizlik
          }
        }

        setDisplayName(name);
        setDateOfBirth(dob);
        setGender(g);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [userId]);

  const handleSave = async () => {
    setSaving(true);
    const profile: UserProfile = {
      displayName: displayName.trim() || null,
      dateOfBirth: dateOfBirth.trim() || null,
      gender: gender || null,
    };
    await saveProfile(userId, profile);
    showToast('Profil kaydedildi', 'success');
    setSaving(false);
  };

  const PRIMARY = '#1A2332';
  const pageBg = dark ? '#0f172a' : '#F8FAFC';

  if (loading) {
    return (
      <div className="flex flex-col flex-1 min-h-screen overflow-auto" style={{ backgroundColor: pageBg }}>
        <div className="relative mx-auto w-full max-w-md flex-1 flex flex-col bg-white shadow-2xl overflow-hidden">
          <header className="flex items-center justify-between p-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onBack}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-600"
                aria-label="Geri"
              >
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">Profil</h1>
            </div>
          </header>
          <div className="flex-1 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-slate-500 rounded-full animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-screen overflow-auto" style={{ backgroundColor: pageBg }}>
      <div className="relative mx-auto w-full max-w-md flex-1 flex flex-col bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-4 pt-10 pb-4 border-b border-slate-100 bg-white/95 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="p-2 rounded-full hover:bg-slate-100 text-slate-600"
              aria-label="Geri"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">Profil</h1>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.14em]">
                Kullanıcı bilgileri
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-full text-xs font-bold tracking-wide uppercase disabled:opacity-60"
            style={{ backgroundColor: PRIMARY, color: '#ffffff' }}
          >
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </header>

        {/* Content */}
        <main className="flex-1 px-5 py-6 space-y-6 overflow-y-auto">
          {/* Avatar + kısa info */}
          <section className="flex items-center gap-4 mb-2">
            <div
              className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-xl font-semibold shadow-md"
            >
              {displayName?.trim()?.[0]?.toUpperCase() ?? 'K'}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-slate-900">
                {displayName || 'İsmini ekle'}
              </span>
              <span className="text-xs text-slate-400 mt-0.5">
                Lybell hesabı
              </span>
            </div>
          </section>

          {/* Kişisel bilgiler kartı */}
          <section className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-5 space-y-4">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-[0.16em]">
              Kişisel Bilgiler
            </h2>

            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-slate-500 uppercase tracking-wide">
                  Görünen ad
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="İsim Soyisim"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5 text-slate-500 uppercase tracking-wide">
                  Doğum tarihi
                </label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                />
                <p className="mt-1 text-[11px] text-slate-400">İsteğe bağlı</p>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5 text-slate-500 uppercase tracking-wide">
                  Cinsiyet
                </label>
                <select
                  value={gender ?? ''}
                  onChange={(e) => setGender((e.target.value || null) as UserProfile['gender'])}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                >
                  <option value="">Belirtmek istemiyorum</option>
                  <option value="female">Kadın</option>
                  <option value="male">Erkek</option>
                  <option value="other">Diğer</option>
                </select>
                <p className="mt-1 text-[11px] text-slate-400">İsteğe bağlı</p>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
