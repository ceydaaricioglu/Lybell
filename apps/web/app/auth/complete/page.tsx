'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@cursor-deneme/shared';

type Status = 'loading' | 'success' | 'error';

export default function AuthCompletePage() {
  const [status, setStatus] = useState<Status>('loading');
  const [message, setMessage] = useState<string>('Hesabın doğrulanıyor...');

  const completeUrlBase = useMemo(() => {
    return process.env.NEXT_PUBLIC_APP_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '');
  }, []);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const errorParam = params.get('error') || params.get('message') || params.get('reason');

        const { data } = await supabase.auth.getSession();
        const hasSession = !!data?.session;

        if (cancelled) return;

        if (errorParam) {
          setStatus('error');
          setMessage('Bağlantı süresi dolmuş olabilir.');
          return;
        }

        if (hasSession) {
          setStatus('success');
          setMessage('Hesabın onaylandı. Yönlendiriliyorsun...');

          setTimeout(() => {
            if (cancelled) return;
            const target = `${completeUrlBase || ''}/`;
            window.location.replace(target);
          }, 900);
          return;
        }

        setMessage('Hesabın doğrulanıyor...');
        setStatus('loading');
      } catch {
        if (cancelled) return;
        setStatus('error');
        setMessage('Bağlantı süresi dolmuş olabilir.');
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [completeUrlBase]);

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{ background: 'linear-gradient(135deg, #f8f6f6, #ffffff)' }}
    >
      <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-white shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="material-symbols-outlined" style={{ color: '#1A2332' }}>
            verified
          </span>
          <h1 className="text-lg font-bold text-slate-900">
            {status === 'loading' ? 'Hesap doğrulanıyor' : status === 'success' ? 'Doğrulandı' : 'Hata'}
          </h1>
        </div>
        <p className="text-sm text-slate-600">{message}</p>

        <div className="mt-6">
          <button
            type="button"
            className="w-full py-3 rounded-xl font-semibold text-white"
            style={{ backgroundColor: '#1A2332' }}
            onClick={() => (window.location.href = '/')}
          >
            Ana sayfaya dön
          </button>
        </div>
      </div>
    </div>
  );
}

