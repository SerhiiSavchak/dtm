import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep Turbopack rooted on this repo (avoids parent-folder lockfile confusion)
  turbopack: {
    root: process.cwd(),
  },
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  images: {
    formats: ["image/avif", "image/webp"],
    // 75 thumbs; 85 editorial; 90 hero / lead covers / modal stage.
    // Values not in this list collapse to the nearest (78 → 75).
    qualities: [75, 85, 90],
    // 960/1280 match Telegram stills and the one landscape kitchen still.
    // Keep 3840 so 2× hero (100vw) can request it; optimizer will not enlarge.
    deviceSizes: [640, 750, 828, 960, 1080, 1200, 1280, 1920, 2048, 3840],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
        pathname: "/images/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
      {
        source: "/videos/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
      {
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
