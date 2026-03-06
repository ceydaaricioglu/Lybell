'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * /app → /?app=1 yönlendirmesi.
 * Böylece localhost:3000/app ile uygulama görünümü (sidebar yok, mobil tam ekran) açılır.
 */
export default function AppRoute() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/?app=1');
  }, [router]);
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f0ea]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-stone-500 text-sm">Uygulama açılıyor…</p>
      </div>
    </div>
  );
}
