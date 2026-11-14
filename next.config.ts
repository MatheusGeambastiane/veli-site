import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  skipTrailingSlashRedirect: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "ijj-teste-bucket-novo-vel.s3.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "veli-production-data-media-635867291691-us-east-1.s3.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "veli-production-data-media-635867291691-us-east-1.s3.us-east-1.amazonaws.com",
      },
    ],
  },
};

export default nextConfig;
