const { withSentryConfig } = require("@sentry/nextjs");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      // NextJS <Image> component needs to whitelist domains for src={}
      "lh3.googleusercontent.com",
      "pbs.twimg.com",
      "images.unsplash.com",
      "logos-world.net",
    ],
  },
};

const sentryWebpackPluginOptions = {
  // Suppress logs from the Sentry webpack plugin
  silent: process.env.NODE_ENV === "production",
  org: "tritonix",
  project: "pngtubermaker-frontend",
  authToken: process.env.SENTRY_AUTH_TOKEN,
  
  // Upload source maps for better error debugging
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: process.env.NODE_ENV === "production",
  
  // Release configuration
  release: process.env.SENTRY_RELEASE || process.env.VERCEL_GIT_COMMIT_SHA,
};

module.exports = withSentryConfig(nextConfig, sentryWebpackPluginOptions);
