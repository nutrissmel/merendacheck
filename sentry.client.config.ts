import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Tracing
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Session Replay — apenas em produção para não inflacionar quota
  replaysSessionSampleRate: 0.05,
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Filtra erros de rede/extensão que não são do app
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'Non-Error exception captured',
    /^Network Error$/,
    /^Failed to fetch$/,
    /chrome-extension/,
  ],

  environment: process.env.NODE_ENV,
  enabled: process.env.NODE_ENV === 'production',
})
