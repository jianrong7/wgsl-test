/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    config.module.rules.push({
      test: /\.wgsl$/i,
      use: "raw-loader",
    });
    return config;
  },
};

module.exports = nextConfig;
