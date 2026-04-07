import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Support `?raw` imports so we can ship the source of every built-in skill
  // as a string and seed it into the virtual filesystem under code/.
  webpack(config) {
    config.module.rules.push({
      resourceQuery: /raw/,
      type: 'asset/source',
    })
    return config
  },
};

export default nextConfig;
