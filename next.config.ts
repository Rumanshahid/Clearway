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
  // /doctors -> /doctor rename: permanent redirects so Google's existing
  // index and any external backlinks to the old plural URLs still resolve
  // instead of 404ing.
  //
  // /dashboard -> /doctor/dashboard: only the exact root PA-requests page
  // moved (source has no wildcard) -- every other /dashboard/* sub-page
  // (overview, patients, appeals, appointments, etc.) intentionally stays
  // where it is, so this redirect must not match those.
  async redirects() {
    return [
      { source: "/doctors", destination: "/doctor", permanent: true },
      { source: "/doctors/:slug", destination: "/doctor/:slug", permanent: true },
      { source: "/doctors/:slug/book", destination: "/doctor/:slug/book", permanent: true },
      { source: "/patient/doctors", destination: "/patient/doctor", permanent: true },
      { source: "/patient/doctors/:slug", destination: "/patient/doctor/:slug", permanent: true },
      { source: "/patient/doctors/:slug/book", destination: "/patient/doctor/:slug/book", permanent: true },
      { source: "/dashboard", destination: "/doctor/dashboard", permanent: true },
    ];
  },
};

export default nextConfig;
