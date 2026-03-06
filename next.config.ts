import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // BUILD_APP=1 ile build edince statik export (out/); yoksa normal dev/build
  ...(process.env.BUILD_APP === '1' ? { output: 'export' as const } : {}),
  reactCompiler: false, // true iken ilk yükleme takılabiliyordu
  // Supabase Edge Functions (Deno) build dışı; APK için TS hatalarını atla
  typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
