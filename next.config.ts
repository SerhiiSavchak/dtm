import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep Turbopack rooted on this repo (avoids parent-folder lockfile confusion)
  turbopack: {
    root: process.cwd(),
  },
  images: {
    // quality={90} is used for hero/portfolio masters
    qualities: [75, 90],
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
    ];
  },
};

export default nextConfig;
