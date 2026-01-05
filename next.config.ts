import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
   return [
      {
        source: '/',
        destination: '/warehouses',
        permanent: true,
      },
    ]
  },
};

export default nextConfig;
