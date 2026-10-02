import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  trailingSlash: false,
  // 404 voor adressen buiten een locale (app/global-not-found.tsx); nodig omdat de root-layout onder [locale] staat.
  experimental: { globalNotFound: true },
};

export default nextConfig;
