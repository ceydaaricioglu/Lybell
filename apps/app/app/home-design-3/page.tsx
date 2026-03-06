'use client';

// Tasarım 3: Warm & Rounded — krem/bej, yumuşak gölgeler, çok yuvarlatılmış
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

export default function HomeDesign3() {
  const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  const d = new Date();
  const day = d.getDate();
  const month = months[d.getMonth()];

  return (
    <div className="min-h-screen bg-[#f5f0ea] text-stone-800">
      <div className="max-w-md mx-auto px-5 pt-10 pb-24">
        {/* Header — sıcak, samimi */}
        <header className="mb-8">
          <h1 className="text-3xl font-semibold text-stone-800">Hoş geldin 👋</h1>
          <p className="text-stone-500 mt-1">{day} {month} · Gününü planla</p>
        </header>

        {/* Bugün — yumuşak kart */}
        <section className="bg-white rounded-[24px] p-5 mb-4 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.06)] border border-stone-100">
          <h2 className="text-sm font-semibold text-stone-600 mb-4">Bugün</h2>
          <ul className="space-y-2">
            {MOCK_TODAY.map((t, i) => (
              <li
                key={i}
                className="flex items-center gap-4 p-4 rounded-2xl bg-stone-50/80 hover:bg-amber-50/60 transition-colors"
              >
                <span className="text-sm font-medium text-amber-700/90 tabular-nums w-11">{t.time}</span>
                <span className="text-[15px] text-stone-800">{t.title}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Yaklaşan */}
        <section className="bg-white rounded-[24px] p-5 mb-4 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.06)] border border-stone-100">
          <h2 className="text-sm font-semibold text-stone-600 mb-4">Yaklaşan</h2>
          <ul className="space-y-2">
            {MOCK_UPCOMING.map((t, i) => (
              <li key={i} className="flex items-center gap-3 py-3 px-4 rounded-2xl bg-stone-50/60">
                <span className="text-xs text-stone-500 w-14">{t.date}</span>
                <span className="text-xs text-stone-400 tabular-nums w-10">{t.time}</span>
                <span className="text-sm text-stone-700">{t.title}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Kategoriler — renkli pill */}
        <section>
          <h2 className="text-sm font-semibold text-stone-600 mb-3">Kategoriler</h2>
          <div className="flex flex-wrap gap-3">
            {MOCK_CATS.map((c) => (
              <button
                key={c.id}
                className="px-5 py-3 rounded-2xl bg-white shadow-[0_2px_12px_-2px_rgba(0,0,0,0.08)] border border-stone-100 hover:shadow-md hover:border-amber-200/60 transition-all text-sm text-stone-700 font-medium"
              >
                <span className="mr-2">{c.icon}</span>
                {c.name}
                <span className="ml-1.5 text-stone-400 font-normal">{c.count}</span>
              </button>
            ))}
          </div>
        </section>

        <div className="fixed top-4 right-4 px-4 py-2 bg-white/95 rounded-2xl shadow-md border border-stone-100 text-xs text-stone-500 backdrop-blur-sm">
          Seçenek 3 · Warm & Rounded
        </div>
      </div>
    </div>
  );
}
