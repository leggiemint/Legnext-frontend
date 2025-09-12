import { ReactNode } from "react";
import { Viewport } from "next";
import PlausibleProvider from "next-plausible";
import { getSEOTags } from "@/libs/seo";
import ClientLayout from "@/components/LayoutClient";
import { AuthProvider } from "@/components/AuthProvider";
import { UserContextProvider } from "@/contexts/UserContext";
import PlanSyncChecker from "@/components/PlanSyncChecker";
import config from "@/config";
import "./globals.css";


export const viewport: Viewport = {
  // Will use the primary color of your theme to show a nice theme color in the URL bar of supported browsers
  themeColor: config.colors.main,
  width: "device-width",
  initialScale: 1,
};

// This adds default SEO tags to all pages in our app.
// You can override them in each page passing params to getSOTags() function.
export const metadata = getSEOTags({
  title: "Legnext - The #1 Midjourney API Integration Platform",
  description: "The #1 way to access Midjourney via API. Integrate Midjourney into your apps — no Midjourney account required. Reliable, fast, and developer-friendly.",
  keywords: ["midjourney api", "ai image generation api", "midjourney integration", "api access", "ai art generation", "midjourney bot", "midjourney api pricing", "professional midjourney api"],
  openGraph: {
    title: "Legnext - The #1 Midjourney API Integration Platform",
    description: "The #1 way to access Midjourney via API. Integrate Midjourney into your apps — no Midjourney account required. Reliable, fast, and developer-friendly.",
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
    "robots": "index, follow",
  }
});

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme={config.colors.theme} className="font-sans">
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
      <body className="bg-white text-gray-900">
        {/* ClientLayout contains all the client wrappers (Crisp chat support, toast messages, tooltips, etc.) */}
        <ClientLayout>
          <AuthProvider>
            <UserContextProvider>
              {/* Plan同步检查组件 - 全局监控用户plan状态 */}
              <PlanSyncChecker syncInterval={5 * 60 * 1000} syncOnlyWhenVisible={true} />
              {children}
            </UserContextProvider>
          </AuthProvider>
        </ClientLayout>
      </body>
    </html>
  );
}
