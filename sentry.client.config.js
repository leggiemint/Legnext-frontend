// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

// Completely disable Sentry
if (false) {
Sentry.init({
  dsn: process.env.NODE_ENV === "development" ? undefined : process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.05 : 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: process.env.NODE_ENV === "development",

  // Capture 100% of the users who experience an error event
  replaysOnErrorSampleRate: process.env.NODE_ENV === "production" ? 1.0 : 1.0,

  // This sets the sample rate for replays. Lower for production to reduce data usage
  replaysSessionSampleRate: process.env.NODE_ENV === "production" ? 0.01 : 0.1,

  // Configure environment
  environment: process.env.NODE_ENV,

  // You can remove this option if you're not planning to use the Reasons feature:
  integrations: [
    Sentry.replayIntegration({
      // Additional Replay configuration goes in here, for example:
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  beforeSend(event) {
    // Filter out unwanted events
    if (event.exception) {
      const error = event.exception.values?.[0];
      const errorMessage = error?.value || "";
      
      // Filter out common browser/React noise
      const ignoredErrors = [
        "ResizeObserver loop limit exceeded",
        "Script error.",
        "Network request failed",
        "Loading CSS chunk",
        "Loading chunk",
        "ChunkLoadError",
        "Non-Error promise rejection captured"
      ];
      
      if (ignoredErrors.some(ignored => errorMessage.includes(ignored))) {
        return null;
      }
    }

    // Filter out events from development extensions
    if (event.request?.url?.includes("chrome-extension://")) {
      return null;
    }

    return event;
  },
});
}
