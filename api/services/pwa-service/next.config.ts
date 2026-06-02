import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: ["172.21.0.1"],
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.API_GATEWAY_URL || "http://localhost"}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
