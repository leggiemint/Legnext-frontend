// This file configures the initialization of Sentry for edge runtimes (middleware, edge functions, and so on).
// The config you add here will be used whenever one of the edge runtimes is loaded.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

// Completely disable Sentry
if (false) {
Sentry.init({
  dsn: process.env.NODE_ENV === "development" ? undefined : process.env.SENTRY_DSN,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: process.env.NODE_ENV === "development",

  // Capture Console API calls
  integrations: [
    Sentry.captureConsoleIntegration({
      levels: ["error", "warn"],
    }),
  ],

  beforeSend(event) {
    // Filter out unwanted events in development
    if (process.env.NODE_ENV === "development" && event.exception) {
      const error = event.exception.values?.[0];
      if (error?.value?.includes("ResizeObserver loop limit exceeded")) {
        return null;
      }
    }
    return event;
  },
});
}
