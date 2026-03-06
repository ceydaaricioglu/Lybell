'use client';

// Tasarım 4: Editorial Bold — güçlü tipografi, grid, tek vurgu rengi
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

export default function HomeDesign4() {
  const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  const d = new Date();
  const day = d.getDate();
  const month = months[d.getMonth()];

  return (
    <div className="min-h-screen bg-white text-black">
      <div className="max-w-md mx-auto px-5 pt-8 pb-24">
        {/* Header — büyük tipografi, tek blok */}
        <header className="mb-10">
          <p className="text-[13px] font-semibold text-neutral-400 tracking-wide">{day} {month}</p>
          <h1 className="text-[42px] font-bold leading-[1.1] tracking-tight mt-1">BUGÜN</h1>
          <p className="text-base text-neutral-600 mt-2">{MOCK_TODAY.length} görev</p>
        </header>

        {/* Bugün — grid hissi, net ayrım */}
        <section className="mb-8">
          <ul className="divide-y-2 divide-neutral-100">
            {MOCK_TODAY.map((t, i) => (
              <li key={i} className="flex items-center gap-6 py-5 first:pt-0">
                <span className="text-sm font-bold text-black tabular-nums w-12">{t.time}</span>
                <span className="text-lg font-semibold text-neutral-900">{t.title}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Yaklaşan — ikincil blok */}
        <section className="mb-10">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-neutral-400 mb-4">Yaklaşan</h2>
          <ul className="space-y-3">
            {MOCK_UPCOMING.map((t, i) => (
              <li key={i} className="flex items-baseline gap-4">
                <span className="text-xs font-medium text-neutral-400 w-14">{t.date}</span>
                <span className="text-xs text-neutral-400 tabular-nums w-10">{t.time}</span>
                <span className="text-base font-medium text-neutral-800">{t.title}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Kategoriler — büyük tıklanabilir alanlar */}
        <section>
          <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-neutral-400 mb-4">Kategoriler</h2>
          <div className="grid grid-cols-2 gap-3">
            {MOCK_CATS.map((c) => (
              <button
                key={c.id}
                className="flex items-center justify-between p-4 rounded-xl bg-neutral-100 hover:bg-neutral-200 transition-colors text-left"
              >
                <span className="text-2xl">{c.icon}</span>
                <div className="text-right">
                  <span className="block text-sm font-bold text-neutral-900">{c.name}</span>
                  <span className="text-xs text-neutral-500">{c.count} görev</span>
                </div>
              </button>
            ))}
          </div>
        </section>

        <div className="fixed top-4 right-4 px-3 py-1.5 bg-black text-white rounded-md text-[11px] font-bold uppercase tracking-wider">
          Seçenek 4 · Editorial
        </div>
      </div>
    </div>
  );
}
