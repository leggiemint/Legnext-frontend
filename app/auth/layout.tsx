import { ReactNode } from "react";
import { Urbanist } from "next/font/google";
import { Viewport } from "next";
import PlausibleProvider from "next-plausible";
import { getSEOTags } from "@/libs/seo";
import ClientLayout from "@/components/LayoutClient";
import config from "@/config";
import "../globals.css";

const font = Urbanist({ 
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-urbanist"
});

export const viewport: Viewport = {
  themeColor: config.colors.main,
  width: "device-width",
  initialScale: 1,
};

export const metadata = getSEOTags({
  title: "Sign In - PNGTuberMaker | Create Your Streaming Avatar",
  description: "Sign in to PNGTuberMaker and start creating your custom PNGTuber avatar. Join thousands of streamers using AI to generate unique streaming characters.",
  keywords: ["pngtuber maker login", "pngtuber sign in", "streaming avatar creator", "ai pngtuber account", "vtuber maker login"],
  openGraph: {
    title: "Sign In - PNGTuberMaker | Create Your Streaming Avatar",
    description: "Sign in to PNGTuberMaker and start creating your custom PNGTuber avatar. Join thousands of streamers using AI to generate unique streaming characters.",
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
    "robots": "noindex, nofollow",
  }
});

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme={config.colors.theme} className={`${font.className} ${font.variable}`}>
      {config.domainName && (
        <head>
          <PlausibleProvider domain={config.domainName} />
          <link rel="icon" type="image/x-icon" href="/favicon/favicon.ico" />
          <link rel="icon" type="image/png" sizes="16x16" href="/favicon/favicon-16x16.png" />
          <link rel="icon" type="image/png" sizes="32x32" href="/favicon/favicon-32x32.png" />
          <link rel="apple-touch-icon" sizes="180x180" href="/favicon/apple-touch-icon.png" />
          <link rel="manifest" href="/favicon/site.webmanifest" />
        </head>
      )}
      <body className="bg-gray-50 text-gray-900">
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
