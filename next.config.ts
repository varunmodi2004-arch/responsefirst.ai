import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // v1-era "Revenue" tab route. ROI now lives inline in the
      // dashboard header (Phase 2C) rather than as its own tab.
      {
        source: "/dashboard/revenue",
        destination: "/dashboard",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
