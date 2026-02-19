'use client';

// Tasarım 1: Zen Minimal — bol beyaz alan, ince çizgiler, sakin tipografi
const MOCK_TODAY = [
  { time: '09:00', title: 'Kahvaltı ve günü planla' },
  { time: '11:00', title: 'E-posta yanıtları' },
  { time: '14:00', title: 'Proje toplantısı' },
];
const MOCK_UPCOMING = [
  { date: 'Yarın', time: '10:00', title: 'Spor' },
  { date: '10 Şub', time: '09:00', title: 'Dentist randevusu' },
];
const MOCK_CATS = [
  { id: 'routines', name: 'Rutinler', icon: '🏃', count: 5 },
  { id: 'reading', name: 'Okuma Listesi', icon: '📚', count: 2 },
];

export default function HomeDesign1() {
  const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  const d = new Date();
  const day = d.getDate();
  const month = months[d.getMonth()];

  return (
    <div className="min-h-screen bg-[#fafaf9] text-neutral-800">
      <div className="max-w-md mx-auto px-6 pt-14 pb-24">
        {/* Header — sade metin */}
        <header className="mb-12">
          <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-400 mb-1">{day} {month}</p>
          <h1 className="text-[28px] font-light tracking-tight text-neutral-900">Günaydın</h1>
          <p className="text-sm text-neutral-500 mt-1">Bugün {MOCK_TODAY.length} görev var</p>
        </header>

        {/* Bugün — ince border, liste */}
        <section className="border-b border-neutral-200 pb-6 mb-6">
          <h2 className="text-[10px] uppercase tracking-widest text-neutral-400 mb-4">Bugün</h2>
          <ul className="space-y-0">
            {MOCK_TODAY.map((t, i) => (
              <li key={i} className="flex items-baseline gap-4 py-3 border-t border-neutral-100 first:border-t-0">
                <span className="text-xs text-neutral-400 tabular-nums w-10">{t.time}</span>
                <span className="text-[15px] text-neutral-800">{t.title}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Yaklaşan */}
        <section className="border-b border-neutral-200 pb-6 mb-6">
          <h2 className="text-[10px] uppercase tracking-widest text-neutral-400 mb-4">Yaklaşan</h2>
          <ul className="space-y-0">
            {MOCK_UPCOMING.map((t, i) => (
              <li key={i} className="flex items-baseline gap-4 py-3 border-t border-neutral-100 first:border-t-0">
                <span className="text-xs text-neutral-400 w-12">{t.date}</span>
                <span className="text-xs text-neutral-400 tabular-nums w-10">{t.time}</span>
                <span className="text-[15px] text-neutral-700">{t.title}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Kategoriler — sade linkler */}
        <section>
          <h2 className="text-[10px] uppercase tracking-widest text-neutral-400 mb-4">Kategoriler</h2>
          <div className="flex flex-wrap gap-3">
            {MOCK_CATS.map((c) => (
              <button
                key={c.id}
                className="px-4 py-2.5 border border-neutral-200 rounded-full text-sm text-neutral-600 hover:border-neutral-400 hover:text-neutral-900 transition-colors"
              >
                <span className="mr-2">{c.icon}</span>
                {c.name}
                <span className="ml-1.5 text-neutral-400">{c.count}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Seçenek etiketi */}
        <div className="fixed top-4 right-4 px-3 py-1.5 bg-white/90 border border-neutral-200 rounded-full text-[11px] text-neutral-500 backdrop-blur-sm">
          Seçenek 1 · Zen Minimal
        </div>
      </div>
    </div>
  );
}
