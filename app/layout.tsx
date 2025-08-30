import { ReactNode } from "react";
import { Urbanist } from "next/font/google";
import { Viewport } from "next";
import PlausibleProvider from "next-plausible";
import { getSEOTags } from "@/libs/seo";
import ClientLayout from "@/components/LayoutClient";
import config from "@/config";
import "./globals.css";

const font = Urbanist({ 
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-urbanist"
});

export const viewport: Viewport = {
  // Will use the primary color of your theme to show a nice theme color in the URL bar of supported browsers
  themeColor: config.colors.main,
  width: "device-width",
  initialScale: 1,
};

// This adds default SEO tags to all pages in our app.
// You can override them in each page passing params to getSOTags() function.
export const metadata = getSEOTags({
  title: "The #1 AI PNGTuber Maker for Streamers",
  description: "The #1 AI PNGTuber Maker for Streamers. Create custom PNGTuber avatars with AI — complete with multiple expressions and simple animations. Perfect for Twitch, YouTube, and Discord.",
  keywords: ["pngtuber maker", "ai pngtuber", "vtuber avatar generator", "pngtuber for twitch", "anime avatar for streaming"],
  openGraph: {
    title: "The #1 AI PNGTuber Maker for Streamers",
    description: "The #1 AI PNGTuber Maker for Streamers. Create custom PNGTuber avatars with AI — complete with multiple expressions and simple animations. Perfect for Twitch, YouTube, and Discord.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 660,
      },
    ],
  },
  extraTags: {
    "theme-color": "#06b6d4",
    "author": "PNGTuberMaker",
    "robots": "index, follow",
  }
});

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme={config.colors.theme} className={`${font.className} ${font.variable}`}>
      {config.domainName && (
        <head>
          <PlausibleProvider domain={config.domainName} />
          {/* Favicon */}
          <link rel="icon" type="image/x-icon" href="/favicon/favicon.ico" />
          <link rel="icon" type="image/png" sizes="16x16" href="/favicon/favicon-16x16.png" />
          <link rel="icon" type="image/png" sizes="32x32" href="/favicon/favicon-32x32.png" />
          <link rel="apple-touch-icon" sizes="180x180" href="/favicon/apple-touch-icon.png" />
          <link rel="manifest" href="/favicon/site.webmanifest" />
        </head>
      )}
      <body className="bg-gray-50 text-gray-900">
        {/* ClientLayout contains all the client wrappers (Crisp chat support, toast messages, tooltips, etc.) */}
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
