'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSharedList, type SharedListResult } from '@cursor-deneme/shared';

function ShareContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('t');
  const [data, setData] = useState<SharedListResult | { error: string } | null>(null);
  const [loading, setLoading] = useState(!!token);

  useEffect(() => {
    if (!token) {
      setData({ error: 'not_found' });
      setLoading(false);
      return;
    }
    getSharedList(token).then((result) => {
      setData(result);
      setLoading(false);
    });
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-stone-500">Liste yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!data || 'error' in data) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-stone-200 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">🔗</div>
          <h1 className="text-xl font-bold text-stone-900 mb-2">Link geçersiz veya süresi dolmuş</h1>
          <p className="text-stone-500 text-sm mb-6">Paylaşım linki bulunamadı veya artık geçerli değil.</p>
          <Link href="/" className="inline-block px-5 py-3 rounded-xl font-semibold bg-amber-500 text-white hover:bg-amber-600">
            Ana sayfaya dön
          </Link>
        </div>
      </div>
    );
  }

  const { name, tasks } = data;

  return (
    <div className="min-h-screen bg-stone-50 pb-8">
      <div className="max-w-md mx-auto px-4 pt-8">
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
          <div className="bg-gradient-to-r from-amber-400 to-amber-500 px-5 py-6 text-white">
            <p className="text-white/80 text-sm">Paylaşılan liste</p>
            <h1 className="text-2xl font-bold mt-1">{name}</h1>
            <p className="text-white/90 text-sm mt-1">{tasks.length} görev</p>
          </div>
          <ul className="divide-y divide-stone-100">
            {tasks.length === 0 ? (
              <li className="px-5 py-8 text-center text-stone-500 text-sm">Henüz görev yok.</li>
            ) : (
              tasks.map((task) => (
                <li key={task.id} className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${task.completed ? 'bg-amber-500 border-amber-500 text-white' : 'border-stone-300'}`}>
                      {task.completed && <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium truncate ${task.completed ? 'text-stone-400 line-through' : 'text-stone-900'}`}>{task.title}</p>
                      <p className="text-xs text-stone-500 mt-0.5">{task.date} · {task.time}</p>
                    </div>
                    {task.priority && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        task.priority === 'high' ? 'bg-red-50 text-red-600' :
                        task.priority === 'medium' ? 'bg-yellow-50 text-yellow-600' : 'bg-green-50 text-green-600'
                      }`}>
                        {task.priority === 'high' ? 'Yüksek' : task.priority === 'medium' ? 'Orta' : 'Düşük'}
                      </span>
                    )}
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
        <p className="text-center text-stone-400 text-sm mt-6">Bu liste salt okunurdur.</p>
        <div className="text-center mt-4">
          <Link href="/" className="text-amber-600 font-medium text-sm hover:underline">Uygulamayı aç</Link>
        </div>
      </div>
    </div>
  );
}

function ShareFallback() {
  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-stone-500">Yükleniyor...</p>
      </div>
    </div>
  );
}

export default function SharePage() {
  return (
    <Suspense fallback={<ShareFallback />}>
      <ShareContent />
    </Suspense>
  );
}
