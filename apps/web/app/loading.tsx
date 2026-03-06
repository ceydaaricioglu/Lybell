export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f0ea]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-stone-500 text-sm">Yükleniyor…</p>
      </div>
    </div>
  );
}
