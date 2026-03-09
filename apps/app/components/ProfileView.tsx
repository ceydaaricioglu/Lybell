'use client';

import { useState, useEffect } from 'react';
import { UserProfile } from '@cursor-deneme/shared';
import { getProfile, saveProfile } from '@cursor-deneme/shared';
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
        setDisplayName(p.displayName ?? '');
        setDateOfBirth(p.dateOfBirth ?? '');
        setGender(p.gender ?? null);
      }
      setLoading(false);
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

  const pageBg = dark ? '#221610' : '#f5f0ea';
  const cardBg = dark ? '#2a1f1a' : undefined;
  const cardBorder = dark ? '#3d2a1f' : undefined;
  const inputBg = dark ? '#2a1f1a' : undefined;
  const inputBorder = dark ? '#3d2a1f' : undefined;

  if (loading) {
    return (
      <div className="flex flex-col flex-1 min-h-0 overflow-auto" style={{ backgroundColor: pageBg }}>
        <div className="border-b px-5 py-5 border-stone-200" style={dark ? { borderColor: '#3d2a1f' } : undefined}>
          <div className="w-full max-w-md md:max-w-none mx-auto md:mx-0 flex items-center gap-3">
            <button type="button" onClick={onBack} className="p-2 -ml-2 rounded-xl hover:bg-white/10">
              <svg className="w-5 h-5 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={dark ? { color: '#c4b8b0' } : undefined}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-xl font-semibold text-stone-900" style={dark ? { color: '#f5f0ea' } : undefined}>Profil</h1>
          </div>
        </div>
        <div className="w-full max-w-md md:max-w-none mx-auto md:mx-0 px-5 py-8">
          <div className="h-24 rounded-2xl animate-pulse bg-stone-200" style={dark ? { backgroundColor: '#2a1f1a' } : undefined} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-auto pb-24" style={{ backgroundColor: pageBg }}>
      <div className="border-b px-5 py-5 border-stone-200" style={dark ? { borderColor: '#3d2a1f' } : undefined}>
        <div className="w-full max-w-md md:max-w-none mx-auto md:mx-0 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="p-2 -ml-2 rounded-xl hover:bg-stone-200/80"
            style={dark ? { color: '#c4b8b0' } : undefined}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={dark ? { color: '#c4b8b0' } : undefined}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-semibold text-stone-900" style={dark ? { color: '#f5f0ea' } : undefined}>Profil</h1>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="text-amber-500 font-semibold disabled:opacity-50"
          >
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </div>

      <div className="w-full max-w-md md:max-w-none mx-auto md:mx-0 px-5 py-6 space-y-6">
        <div
          className="rounded-2xl overflow-hidden bg-white shadow-[0_4px_24px_-4px_rgba(0,0,0,0.06)] border border-stone-100"
          style={dark ? { backgroundColor: cardBg, borderColor: cardBorder } : undefined}
        >
          <div className="px-5 py-4 border-b border-stone-100" style={dark ? { borderColor: cardBorder } : undefined}>
            <h2 className="text-sm font-medium text-stone-500" style={dark ? { color: '#b8a99e' } : undefined}>Kişisel bilgiler</h2>
          </div>
          <div className="p-5 space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-stone-600" style={dark ? { color: '#b8a99e' } : undefined}>Görünen ad</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Adın veya takma adın"
                className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white border-stone-200 text-stone-900 placeholder-stone-400"
                style={dark ? { backgroundColor: inputBg, borderColor: inputBorder, color: '#f5f0ea' } : undefined}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-stone-600" style={dark ? { color: '#b8a99e' } : undefined}>Doğum tarihi</label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white border-stone-200 text-stone-900"
                style={dark ? { backgroundColor: inputBg, borderColor: inputBorder, color: '#f5f0ea' } : undefined}
              />
              <p className="mt-1 text-xs text-stone-400" style={dark ? { color: '#8a7d72' } : undefined}>İsteğe bağlı</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-stone-600" style={dark ? { color: '#b8a99e' } : undefined}>Cinsiyet</label>
              <select
                value={gender ?? ''}
                onChange={(e) => setGender((e.target.value || null) as UserProfile['gender'])}
                className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white border-stone-200 text-stone-900"
                style={dark ? { backgroundColor: inputBg, borderColor: inputBorder, color: '#f5f0ea' } : undefined}
              >
                <option value="">Belirtmek istemiyorum</option>
                <option value="female">Kadın</option>
                <option value="male">Erkek</option>
                <option value="other">Diğer</option>
              </select>
              <p className="mt-1 text-xs text-stone-400" style={dark ? { color: '#8a7d72' } : undefined}>İsteğe bağlı</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
