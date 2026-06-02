import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["172.21.0.1"],
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost/api/:path*",
      },
    ];
  },
};

export default nextConfig;
