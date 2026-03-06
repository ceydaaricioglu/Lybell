import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: false,
  typescript: { ignoreBuildErrors: true },
  transpilePackages: ['@cursor-deneme/shared'],
};

export default nextConfig;
