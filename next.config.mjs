/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // No browser source maps in prod → smaller, faster production builds.
  productionBrowserSourceMaps: false,
  experimental: {
    // Tree-shake barrel imports for these packages.
    optimizePackageImports: ["swr"],
  },
  // NOTE: the app uses raw <img> (no next/image), so no images.remotePatterns
  // block is needed. If a next/image migration ever lands, add remotePatterns
  // for flagcdn.com, a.espncdn.com, upload.wikimedia.org, crests.football-data.org.
};

export default nextConfig;
