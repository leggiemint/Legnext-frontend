// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

// Completely disable Sentry
if (false) {
Sentry.init({
  dsn: process.env.NODE_ENV === "development" ? undefined : process.env.SENTRY_DSN,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.05 : 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: process.env.NODE_ENV === "development",

  // Configure environment
  environment: process.env.NODE_ENV,

  // Server-specific integrations
  integrations: [
    Sentry.captureConsoleIntegration({
      levels: ["error"],
    }),
  ],

  beforeSend(event) {
    // Filter out unwanted server events
    if (event.exception) {
      const error = event.exception.values?.[0];
      const errorMessage = error?.value || "";
      
      // Filter out common server noise
      const ignoredErrors = [
        "ECONNRESET",
        "ENOTFOUND", 
        "ETIMEDOUT",
        "socket hang up"
      ];
      
      if (ignoredErrors.some(ignored => errorMessage.includes(ignored))) {
        return null;
      }
    }

    return event;
  },

  // Uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: process.env.NODE_ENV === 'development',
});
}
