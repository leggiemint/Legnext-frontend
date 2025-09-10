import themes from "daisyui/src/theming/themes";
import { ConfigProps } from "./types/config";

const config = {
  // REQUIRED
  appName: "Legnext",
  // REQUIRED: a short description of your app for SEO tags (can be overwritten)
  appDescription:
    "The #1 way to access Midjourney via API. Integrate Midjourney into your apps — no Midjourney account required. Reliable, fast, and developer-friendly.",
  // REQUIRED (no https://, not trialing slash at the end, just the naked domain)
  domainName: "legnext.ai",
  crisp: {
    // Crisp website ID. IF YOU DON'T USE CRISP: just remove this => Then add a support email in this config file (mailgun.supportEmail) otherwise customer support won't work.
    id: "",
    // Hide Crisp by default, except on route "/". Crisp is toggled with <ButtonSupport/>. If you want to show Crisp on every routes, just remove this below
    onlyShowOnRoutes: ["/"],
  },
  stripe: {
    // Credit-based pricing system (0.1$ = 1 credit)
    plans: [
      {
        // Free plan - no priceId needed as it doesn't require payment
        name: "Free",
        description: "Get Started",
        price: 0,
        credits: 100, // 100 free API calls (keeping credits for compatibility)
        isFree: true,
        features: [
          { name: "100 free API points" },
          { name: "Image generation" },
          { name: "Standard quality output" },
          { name: "Community support" },
          { name: "Rate limited requests" },
        ],
      },
      {
        // Pro subscription plan - Stripe sandbox Price ID
        priceId: "price_1S5w2j3W9QrG6Tfe5g1OrDeq",
        isFeatured: true,
        name: "Pro",
        description: "Best Value",
        price: 30,
        credits: 30000, // 30,000 credits per month (1$ = 1000 credits)
        priceAnchor: 99,
        features: [
          { name: "30,000 API points monthly" },
          { name: "All Midjourney models (v6, v7, niji 6)" },
          { name: "Fast & Turbo generation modes" },
          { name: "support video generation" },
          { name: "support Moodboard feature" },
          { name: "Priority support" },
        ],
      },
    ],
  },
  aws: {
    // If you use AWS S3/Cloudfront, put values in here
    bucket: "bucket-name",
    bucketUrl: `https://bucket-name.s3.amazonaws.com/`,
    cdn: "https://cdn-id.cloudfront.net/",
  },
  r2: {
    // Cloudflare R2 storage configuration
    bucket: process.env.R2_BUCKET_NAME || "legnext-storage",
    publicUrl: process.env.R2_PUBLIC_URL || "https://your-bucket.your-subdomain.r2.cloudflarestorage.com",
    endpoint: process.env.R2_ENDPOINT || "https://your-account-id.r2.cloudflarestorage.com",
  },
  mailgun: {
    // subdomain to use when sending emails, if you don't have a subdomain, just remove it. Highly recommended to have one (i.e. mg.yourdomain.com or mail.yourdomain.com)
    subdomain: "mg",
    // REQUIRED — Email 'From' field to be used when sending magic login links
    fromNoReply: `Legnext <noreply@mg.legnext.ai>`,
    // REQUIRED — Email 'From' field to be used when sending other emails, like abandoned carts, updates etc..
    fromAdmin: `Legnext <admin@mg.legnext.ai>`,
    // Email shown to customer if need support. Leave empty if not needed => if empty, set up Crisp above, otherwise you won't be able to offer customer support."
    supportEmail: "support@legnext.ai",
    // When someone replies to supportEmail sent by the app, forward it to the email below (otherwise it's lost). If you set supportEmail to empty, this will be ignored.
    forwardRepliesTo: "support@legnext.ai",
  },
  colors: {
    // REQUIRED — The DaisyUI theme to use (added to the main layout.js). Leave blank for default (light & dark mode). If you any other theme than light/dark, you need to add it in config.tailwind.js in daisyui.themes.
    theme: "light",
    // REQUIRED — This color will be reflected on the whole app outside of the document (loading bar, Chrome tabs, etc..). By default it takes the primary color from your DaisyUI theme (make sure to update your the theme name after "data-theme=")
    // OR you can just do this to use a custom color: main: "#f37055". HEX only.
    main: "#4f46e5",
  },
  auth: {
    // REQUIRED — the path to log in users. It's use to protect private routes (like /app). It's used in apiClient (/libs/api.js) upon 401 errors from our API
    loginUrl: "/api/auth/signin",
    // REQUIRED — the path you want to redirect users after successfull login (i.e. /app, /private). This is normally a private page for users to manage their accounts. It's used in apiClient (/libs/api.js) upon 401 errors from our API & in ButtonSignin.js
    callbackUrl: "/app",
  },
} as ConfigProps;

// Payment configuration - Stripe only
export function getPaymentConfig() {
  return { 
    gateway: 'stripe' as const,
    plans: config.stripe.plans 
  };
}

export default config;
