import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  reactCompiler: true,
  // Supabase Edge Functions (Deno) build dışı; APK için TS hatalarını atla
  typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
