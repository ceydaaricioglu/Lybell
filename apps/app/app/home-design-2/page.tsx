'use client';

// Tasarım 2: Dark Refined — koyu arka plan, yumuşak kartlar, amber vurgu
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

export default function HomeDesign2() {
  const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  const d = new Date();
  const day = d.getDate();
  const month = months[d.getMonth()];

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-zinc-100">
      <div className="max-w-md mx-auto px-5 pt-12 pb-24">
        {/* Header — koyu, ince accent */}
        <header className="mb-8">
          <div className="h-px w-12 bg-amber-400/80 mb-5" />
          <h1 className="text-2xl font-semibold text-white tracking-tight">Günaydın</h1>
          <p className="text-sm text-zinc-500 mt-1">{day} {month} · {MOCK_TODAY.length} görev bugün</p>
        </header>

        {/* Bugün — yükseltilmiş kart */}
        <section className="bg-zinc-900/60 rounded-2xl p-5 mb-4 border border-zinc-800/80">
          <h2 className="text-xs font-medium text-zinc-500 mb-4">Bugün</h2>
          <ul className="space-y-1">
            {MOCK_TODAY.map((t, i) => (
              <li key={i} className="flex items-center gap-4 py-3 border-b border-zinc-800/80 last:border-0">
                <span className="text-xs text-amber-400/90 tabular-nums w-10">{t.time}</span>
                <span className="text-[15px] text-zinc-200">{t.title}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Yaklaşan */}
        <section className="bg-zinc-900/40 rounded-2xl p-5 mb-4 border border-zinc-800/50">
          <h2 className="text-xs font-medium text-zinc-500 mb-4">Yaklaşan</h2>
          <ul className="space-y-1">
            {MOCK_UPCOMING.map((t, i) => (
              <li key={i} className="flex items-center gap-3 py-2.5">
                <span className="text-[11px] text-zinc-500 w-14">{t.date}</span>
                <span className="text-xs text-zinc-500 tabular-nums w-10">{t.time}</span>
                <span className="text-sm text-zinc-300">{t.title}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Kategoriler — pill butonlar */}
        <section>
          <h2 className="text-xs font-medium text-zinc-500 mb-3">Kategoriler</h2>
          <div className="flex flex-wrap gap-2">
            {MOCK_CATS.map((c) => (
              <button
                key={c.id}
                className="px-4 py-2.5 bg-zinc-800/80 hover:bg-zinc-700/80 rounded-full text-sm text-zinc-300 border border-zinc-700/80 transition-colors"
              >
                <span className="mr-2">{c.icon}</span>
                {c.name}
                <span className="ml-1.5 text-zinc-500">{c.count}</span>
              </button>
            ))}
          </div>
        </section>

        <div className="fixed top-4 right-4 px-3 py-1.5 bg-zinc-800/90 border border-zinc-700 rounded-full text-[11px] text-zinc-400 backdrop-blur-sm">
          Seçenek 2 · Dark Refined
        </div>
      </div>
    </div>
  );
}
