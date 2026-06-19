import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    formats: ["image/avif", "image/webp"],
    // Stored images live on the R2 public domain (pub-<hash>.r2.dev). Do NOT add
    // a "**" wildcard — non-r2 hosts are served unoptimized by <RemoteImage>.
    remotePatterns: [{ protocol: "https", hostname: "*.r2.dev" }],
    minimumCacheTTL: 86400,
    dangerouslyAllowSVG: false,
  },
  async headers() {
    return [
      {
        source: "/logos/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
