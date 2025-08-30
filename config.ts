import themes from "daisyui/src/theming/themes";
import { ConfigProps } from "./types/config";

const config = {
  // REQUIRED
  appName: "PNGTuberMaker",
  // REQUIRED: a short description of your app for SEO tags (can be overwritten)
  appDescription:
    "The #1 AI PNGTuber Maker for Streamers. Create custom PNGTuber avatars with AI — complete with multiple expressions and simple animations. Perfect for Twitch, YouTube, and Discord.",
  // REQUIRED (no https://, not trialing slash at the end, just the naked domain)
  domainName: "pngtubermaker.com",
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
        credits: 60, // 60 credits = $6 worth
        isFree: true,
        features: [
          { name: "60 free credits (one-time, $6 worth)" },
          { name: "Avatar generation (5 credits each)" },
          { name: "Expression packs (3 credits each)" },
          { name: "Standard exports with watermark" },
          { name: "Community support" },
        ],
      },
      {
        // Pro subscription plan
        priceId: process.env.NODE_ENV === 'production' 
          ? "price_1S1k2eKyeXh3bz3dL2jbl2VM" // Production price ID
          : process.env.STRIPE_PRO_PRICE_ID || "price_1S1k2eKyeXh3bz3dL2jbl2VM", // 🔧 Use production price ID for development too
        isFeatured: true,
        name: "Pro",
        description: "Best Value",
        price: 12,
        credits: 260, // 60 (free) + 200 (pro) = 260 credits = $26 worth
        priceAnchor: 26,
        features: [
          { name: "260 credits monthly ($26 worth)" },
          { name: "No watermark exports" },
          { name: "HD exports (1 credit each)" },
          { name: "Animations (2 credits each)" },
          { name: "Commercial use license" },
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
  mailgun: {
    // subdomain to use when sending emails, if you don't have a subdomain, just remove it. Highly recommended to have one (i.e. mg.yourdomain.com or mail.yourdomain.com)
    subdomain: "mg",
    // REQUIRED — Email 'From' field to be used when sending magic login links
    fromNoReply: `PNGTuberMaker <noreply@mg.pngtubermaker.com>`,
    // REQUIRED — Email 'From' field to be used when sending other emails, like abandoned carts, updates etc..
    fromAdmin: `PNGTuberMaker <admin@mg.pngtubermaker.com>`,
    // Email shown to customer if need support. Leave empty if not needed => if empty, set up Crisp above, otherwise you won't be able to offer customer support."
    supportEmail: "support@pngtubermaker.com",
    // When someone replies to supportEmail sent by the app, forward it to the email below (otherwise it's lost). If you set supportEmail to empty, this will be ignored.
    forwardRepliesTo: "support@pngtubermaker.com",
  },
  colors: {
    // REQUIRED — The DaisyUI theme to use (added to the main layout.js). Leave blank for default (light & dark mode). If you any other theme than light/dark, you need to add it in config.tailwind.js in daisyui.themes.
    theme: "light",
    // REQUIRED — This color will be reflected on the whole app outside of the document (loading bar, Chrome tabs, etc..). By default it takes the primary color from your DaisyUI theme (make sure to update your the theme name after "data-theme=")
    // OR you can just do this to use a custom color: main: "#f37055". HEX only.
    main: "#06b6d4",
  },
  auth: {
    // REQUIRED — the path to log in users. It's use to protect private routes (like /app). It's used in apiClient (/libs/api.js) upon 401 errors from our API
    loginUrl: "/api/auth/signin",
    // REQUIRED — the path you want to redirect users after successfull login (i.e. /app, /private). This is normally a private page for users to manage their accounts. It's used in apiClient (/libs/api.js) upon 401 errors from our API & in ButtonSignin.js
    callbackUrl: "/app",
  },
} as ConfigProps;

export default config;
