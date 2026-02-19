'use client';

const OPTIONS = [
  { path: '/home-design-1', name: 'Seçenek 1', style: 'Zen Minimal', desc: 'Bol beyaz alan, ince çizgiler, sakin tipografi' },
  { path: '/home-design-2', name: 'Seçenek 2', style: 'Dark Refined', desc: 'Koyu arka plan, yumuşak kartlar, amber vurgu' },
  { path: '/home-design-3', name: 'Seçenek 3', style: 'Warm & Rounded', desc: 'Krem/bej tonlar, yumuşak gölgeler, çok yuvarlatılmış' },
  { path: '/home-design-4', name: 'Seçenek 4', style: 'Editorial Bold', desc: 'Güçlü tipografi, grid, yüksek kontrast' },
];

export default function HomeDesignsHub() {
  return (
    <div className="min-h-screen bg-neutral-100 py-12 px-4">
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-neutral-900 mb-2">Ana Sayfa Tasarım Seçenekleri</h1>
        <p className="text-neutral-600 mb-8">Aşağıdaki linklerden her tasarımı ayrı sayfada inceleyebilirsin.</p>
        <ul className="space-y-4">
          {OPTIONS.map((o) => (
            <li key={o.path}>
              <a
                href={o.path}
                className="block p-5 bg-white rounded-xl border border-neutral-200 hover:border-neutral-300 hover:shadow-md transition-all"
              >
                <span className="font-semibold text-neutral-900">{o.name} · {o.style}</span>
                <p className="text-sm text-neutral-500 mt-1">{o.desc}</p>
                <span className="inline-block mt-2 text-sm text-emerald-600 font-medium">{o.path} →</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
