import { ReactNode } from "react";
import { Viewport } from "next";
import { getSEOTags } from "@/libs/seo";
import ClientLayout from "@/components/layout/LayoutClient";
import config from "@/config";
import "../../globals.css";


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
    <div className="bg-gray-50 text-gray-900 min-h-screen">
      <ClientLayout>
        {children}
      </ClientLayout>
    </div>
  );
}
