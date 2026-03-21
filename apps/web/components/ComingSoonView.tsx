'use client';

export default function ComingSoonView() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc] px-6">
      <img
        src="/lybell-mark.svg"
        alt="Lybell"
        width={96}
        height={96}
        className="mb-6"
      />
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Lybell</h1>
      <p className="text-slate-500 text-center max-w-sm">
        Yapım aşamasında
      </p>
      <p className="text-slate-400 text-sm mt-1">Coming soon</p>
    </div>
  );
}
