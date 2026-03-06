import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  ...(process.env.BUILD_APP === '1' ? { output: 'export' as const } : {}),
  reactCompiler: false,
  typescript: { ignoreBuildErrors: true },
  transpilePackages: ['@cursor-deneme/shared'],
};

export default nextConfig;
