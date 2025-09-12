import { ReactNode } from "react";
import { Viewport } from "next";
import PlausibleProvider from "next-plausible";
import { getSEOTags } from "@/libs/seo";
import ClientLayout from "@/components/LayoutClient";
import config from "@/config";
import "../globals.css";


export const viewport: Viewport = {
  themeColor: config.colors.main,
  width: "device-width",
  initialScale: 1,
};

export const metadata = getSEOTags({
  title: "Sign In - Legnext | Midjourney API Integration Platform",
  description: "Sign in to Legnext and start accessing Midjourney's powerful image generation API. Join thousands of developers integrating AI image generation.",
  keywords: ["midjourney api login", "legnext sign in", "ai image generation api", "midjourney integration", "api access platform"],
  openGraph: {
    title: "Sign In - Legnext | Midjourney API Integration Platform",
    description: "Sign in to Legnext and start accessing Midjourney's powerful image generation API. Join thousands of developers integrating AI image generation.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 660,
      },
    ],
  },
  extraTags: {
    "theme-color": "#4f46e5",
    "author": "Legnext",
    "robots": "noindex, nofollow",
  }
});

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme={config.colors.theme} className="font-sans">
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
