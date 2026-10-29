import type { NextConfig } from "next";
import { TARIFF_PATH_SLUG } from "./lib/copy/tariffSlugs";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  trailingSlash: false,
  // 404 voor adressen buiten een locale (app/global-not-found.tsx); nodig omdat de root-layout onder [locale] staat.
  experimental: { globalNotFound: true },
  // Beveiligingsheaders. Geen Content-Security-Policy: Next zet inline scripts en Plausible laadt extern; een CSP vraagt
  // nonces en is een aparte taak.
  // Franse laadkostenadressen droegen tot 29 oktober 2026 de Nederlandse tariefslug (lib/copy/index.ts, tariffPathSlug).
  async redirects() {
    return Object.entries(TARIFF_PATH_SLUG["fr-BE"] ?? {}).map(([from, to]) => ({ source: `/fr-be/cout-recharge/:slug/${from}`, destination: `/fr-be/cout-recharge/:slug/${to}`, permanent: true }));
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
