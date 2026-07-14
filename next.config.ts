import type { NextConfig } from "next";

const documentRoutes = ["/", "/blog", "/en", "/lab", "/projects", "/timeline"];

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  async headers() {
    return documentRoutes.map((source) => ({
      source,
      headers: [
        {
          key: "Cache-Control",
          value: "no-store, max-age=0, must-revalidate",
        },
      ],
    }));
  },
};

export default nextConfig;
