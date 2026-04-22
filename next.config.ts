import type { NextConfig } from "next";
import withPWAInit from "next-pwa";
import { withSentryConfig } from "@sentry/nextjs";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  fallbacks: {
    document: "/offline",
  } as any,
  runtimeCaching: [
    // API routes — network first with 5s timeout, fallback to cache
    {
      urlPattern: /^https?:\/\/.*\/api\//,
      handler: "NetworkFirst",
      options: {
        cacheName: "api-cache",
        networkTimeoutSeconds: 5,
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 24 * 60 * 60, // 24h
        },
        cacheableResponse: { statuses: [0, 200] },
      },
    },
    // Next.js data routes (RSC / _next/data)
    {
      urlPattern: /^\/_next\/data\/.+\.json$/,
      handler: "NetworkFirst",
      options: {
        cacheName: "next-data",
        networkTimeoutSeconds: 5,
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 60 * 60, // 1h
        },
        cacheableResponse: { statuses: [0, 200] },
      },
    },
    // Static assets — cache first
    {
      urlPattern: /^\/_next\/static\/.*/,
      handler: "CacheFirst",
      options: {
        cacheName: "next-static",
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
        cacheableResponse: { statuses: [0, 200] },
      },
    },
    // Supabase Storage images — stale while revalidate
    {
      urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/.*/,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "supabase-images",
        expiration: {
          maxEntries: 128,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
        },
        cacheableResponse: { statuses: [0, 200] },
      },
    },
    // Google Fonts
    {
      urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/,
      handler: "CacheFirst",
      options: {
        cacheName: "google-fonts",
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 365 * 24 * 60 * 60,
        },
        cacheableResponse: { statuses: [0, 200] },
      },
    },
    // App pages — network first
    {
      urlPattern: /^https?:\/\/.*\/(?!api\/|_next\/).*$/,
      handler: "NetworkFirst",
      options: {
        cacheName: "pages-cache",
        networkTimeoutSeconds: 3,
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60,
        },
        cacheableResponse: { statuses: [0, 200] },
      },
    },
  ],
});

const nextConfig: NextConfig = {
  turbopack: {},
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
  async headers() {
    const securityHeaders = [
      {
        key: "X-DNS-Prefetch-Control",
        value: "on",
      },
      {
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      },
      {
        key: "X-Frame-Options",
        value: "SAMEORIGIN",
      },
      {
        key: "X-Content-Type-Options",
        value: "nosniff",
      },
      {
        key: "Referrer-Policy",
        value: "origin-when-cross-origin",
      },
      {
        key: "Permissions-Policy",
        value: "camera=(self), microphone=(), geolocation=(self)",
      },
      {
        key: "Content-Security-Policy",
        value: [
          "default-src 'self'",
          "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          "font-src 'self' https://fonts.gstatic.com",
          "img-src 'self' blob: data: https://*.supabase.co",
          "connect-src 'self' https://*.supabase.co https://api.stripe.com wss://*.supabase.co",
          "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
          "worker-src 'self' blob:",
        ].join("; "),
      },
    ];

    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

const configWithPWA = withPWA(nextConfig);

export default withSentryConfig(configWithPWA as any, {
  // Sentry project settings — set SENTRY_ORG and SENTRY_PROJECT in env
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Silences build-time output
  silent: !process.env.CI,

  // Upload source maps apenas em CI/CD
  widenClientFileUpload: true,
  sourcemaps: { disable: false },

  // Otimizações de bundle
  webpack: {
    treeshake: { removeDebugLogging: true },
    automaticVercelMonitors: true,
  },
});
