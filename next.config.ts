import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  trailingSlash: false,
  // 404 voor adressen buiten een locale (app/global-not-found.tsx); nodig omdat de root-layout onder [locale] staat.
  experimental: { globalNotFound: true },
  // Beveiligingsheaders. Geen Content-Security-Policy: Next zet inline scripts en Plausible laadt extern; een CSP vraagt
  // nonces en is een aparte taak.
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
