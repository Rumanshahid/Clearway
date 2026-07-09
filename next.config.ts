import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Default is 1MB, well under the 5MB avatar-upload limit the profile
    // form already validates client- and server-side -- larger photos were
    // hitting Next.js's own body-size cap before ever reaching our code,
    // failing with an opaque "server error" and no useful message.
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
