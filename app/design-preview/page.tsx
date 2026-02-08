'use client';

export default function DesignPreview() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <h1 className="text-4xl font-bold text-center mb-12 text-gray-800">To-Do App Tasarım Önerileri</h1>
        
        {/* Tasarım 1: Modern Minimal */}
        <div className="mb-16 bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">1. Modern Minimal Tasarım</h2>
          <p className="text-gray-600 mb-6">Temiz, bol beyaz alan, yumuşak gölgeler</p>
          
          <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6 max-w-sm mx-auto">
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Ocak 2026</h3>
              <div className="flex gap-2 overflow-x-auto pb-2">
                <button className="flex-shrink-0 w-12 h-12 rounded-full bg-gray-900 text-white font-semibold text-sm">13</button>
                <button className="flex-shrink-0 w-12 h-12 rounded-full bg-gray-100 text-gray-600 font-semibold text-sm hover:bg-gray-200">14</button>
                <button className="flex-shrink-0 w-12 h-12 rounded-full bg-gray-100 text-gray-600 font-semibold text-sm hover:bg-gray-200">15</button>
                <button className="flex-shrink-0 w-12 h-12 rounded-full bg-gray-100 text-gray-600 font-semibold text-sm hover:bg-gray-200">16</button>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center">
                  <svg className="w-4 h-4 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="text-gray-900 font-medium">Sabah rutini</div>
                  <div className="text-sm text-gray-500">08:00</div>
                </div>
              </div>
              
              <div className="flex items-center gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="w-6 h-6 rounded-full border-2 border-gray-300"></div>
                <div className="flex-1">
                  <div className="text-gray-900 font-medium">Kitap oku</div>
                  <div className="text-sm text-gray-500">10:00</div>
                </div>
              </div>
            </div>
            
            <button className="mt-6 w-full py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors">
              + Görev Ekle
            </button>
          </div>
        </div>

        {/* Tasarım 2: Gradient & Glassmorphism */}
        <div className="mb-16 bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">2. Gradient & Glassmorphism</h2>
          <p className="text-gray-600 mb-6">Renkli gradient'ler, cam efekti kartlar</p>
          
          <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl p-6 max-w-sm mx-auto">
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-white mb-4">Ocak 2026</h3>
              <div className="flex gap-2 overflow-x-auto pb-2">
                <button className="flex-shrink-0 w-12 h-12 rounded-full bg-white text-purple-600 font-semibold text-sm shadow-lg">13</button>
                <button className="flex-shrink-0 w-12 h-12 rounded-full bg-white/20 text-white font-semibold text-sm hover:bg-white/30">14</button>
                <button className="flex-shrink-0 w-12 h-12 rounded-full bg-white/20 text-white font-semibold text-sm hover:bg-white/30">15</button>
                <button className="flex-shrink-0 w-12 h-12 rounded-full bg-white/20 text-white font-semibold text-sm hover:bg-white/30">16</button>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="bg-white/70 backdrop-blur-md rounded-xl p-4 flex items-center gap-4 border border-white/30 hover:bg-white/80 transition-all shadow-lg">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="text-gray-900 font-medium">Sabah rutini</div>
                  <div className="text-sm text-gray-600">08:00</div>
                </div>
              </div>
              
              <div className="bg-white/70 backdrop-blur-md rounded-xl p-4 flex items-center gap-4 border border-white/30 hover:bg-white/80 transition-all shadow-lg">
                <div className="w-6 h-6 rounded-full border-2 border-purple-300"></div>
                <div className="flex-1">
                  <div className="text-gray-900 font-medium">Kitap oku</div>
                  <div className="text-sm text-gray-600">10:00</div>
                </div>
              </div>
            </div>
            
            <button className="mt-6 w-full py-3 bg-white/90 backdrop-blur-sm text-purple-600 rounded-xl font-semibold hover:bg-white transition-all shadow-lg">
              + Görev Ekle
            </button>
          </div>
        </div>

        {/* Tasarım 3: İyileştirilmiş Mevcut */}
        <div className="mb-16 bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">3. İyileştirilmiş Mevcut Tasarım</h2>
          <p className="text-gray-600 mb-6">Mevcut emerald teması, geliştirilmiş detaylar</p>
          
          <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl p-6 max-w-sm mx-auto shadow-2xl">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">Ocak 2026</h3>
                <button className="w-10 h-10 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2">
                <button className="flex-shrink-0 flex flex-col items-center gap-1">
                  <span className="text-xs text-white/80 font-medium">Pzt</span>
                  <div className="w-12 h-12 rounded-full bg-white text-emerald-700 font-semibold text-sm flex items-center justify-center shadow-lg">13</div>
                </button>
                <button className="flex-shrink-0 flex flex-col items-center gap-1">
                  <span className="text-xs text-white/70 font-medium">Sal</span>
                  <div className="w-12 h-12 rounded-full bg-white/20 text-white font-semibold text-sm flex items-center justify-center hover:bg-white/30">14</div>
                </button>
                <button className="flex-shrink-0 flex flex-col items-center gap-1">
                  <span className="text-xs text-white/70 font-medium">Çar</span>
                  <div className="w-12 h-12 rounded-full bg-white/20 text-white font-semibold text-sm flex items-center justify-center hover:bg-white/30">15</div>
                </button>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-emerald-50 transition-colors">
                <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="text-gray-900 font-medium">Sabah rutini</div>
                  <div className="text-sm text-gray-500">08:00</div>
                </div>
              </div>
              
              <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-emerald-50 transition-colors">
                <div className="w-6 h-6 rounded-full border-2 border-emerald-500"></div>
                <div className="flex-1">
                  <div className="text-gray-900 font-medium">Kitap oku</div>
                  <div className="text-sm text-gray-500">10:00</div>
                </div>
              </div>
            </div>
            
            <button className="mt-6 w-14 h-14 bg-white rounded-full shadow-xl flex items-center justify-center mx-auto hover:scale-110 transition-transform">
              <span className="text-3xl font-light text-emerald-600">+</span>
            </button>
          </div>
        </div>

        {/* Tasarım 4: Soft Pastel */}
        <div className="mb-16 bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">4. Soft Pastel Tasarım</h2>
          <p className="text-gray-600 mb-6">Yumuşak pastel renkler, organik şekiller</p>
          
          <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-3xl p-6 max-w-sm mx-auto border border-pink-100">
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Ocak 2026</h3>
              <div className="flex gap-2 overflow-x-auto pb-2">
                <button className="flex-shrink-0 w-12 h-12 rounded-2xl bg-pink-400 text-white font-semibold text-sm shadow-md">13</button>
                <button className="flex-shrink-0 w-12 h-12 rounded-2xl bg-purple-200 text-purple-700 font-semibold text-sm hover:bg-purple-300">14</button>
                <button className="flex-shrink-0 w-12 h-12 rounded-2xl bg-purple-200 text-purple-700 font-semibold text-sm hover:bg-purple-300">15</button>
                <button className="flex-shrink-0 w-12 h-12 rounded-2xl bg-purple-200 text-purple-700 font-semibold text-sm hover:bg-purple-300">16</button>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-all">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-pink-400 to-rose-400 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="text-gray-800 font-medium">Sabah rutini</div>
                  <div className="text-sm text-gray-500">08:00</div>
                </div>
              </div>
              
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-all">
                <div className="w-8 h-8 rounded-xl border-2 border-pink-300"></div>
                <div className="flex-1">
                  <div className="text-gray-800 font-medium">Kitap oku</div>
                  <div className="text-sm text-gray-500">10:00</div>
                </div>
              </div>
            </div>
            
            <button className="mt-6 w-full py-3 bg-gradient-to-r from-pink-400 to-purple-400 text-white rounded-2xl font-semibold hover:from-pink-500 hover:to-purple-500 transition-all shadow-lg">
              + Görev Ekle
            </button>
          </div>
        </div>

        {/* Seçim Bölümü */}
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Hangi Tasarımı Seçiyorsunuz?</h2>
          <p className="text-gray-600 mb-6">Beğendiğiniz tasarımı seçin, uygulamaya entegre edelim!</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <button className="px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors">
              1. Modern Minimal
            </button>
            <button className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors">
              2. Gradient & Glass
            </button>
            <button className="px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors">
              3. İyileştirilmiş Mevcut
            </button>
            <button className="px-6 py-3 bg-pink-500 text-white rounded-lg font-medium hover:bg-pink-600 transition-colors">
              4. Soft Pastel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
