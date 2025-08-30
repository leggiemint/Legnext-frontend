import { getSEOTags } from "@/libs/seo";

export const metadata = getSEOTags({
  title: "Contact PNGTuberMaker | Get Support for Avatar Creation",
  description: "Get in touch with PNGTuberMaker team for support with PNGTuber avatar creation. Email, Discord, and documentation available. We're here to help with your streaming avatar needs.",
  keywords: "contact pngtubermaker, pngtuber support, avatar creation help, streaming avatar support, pngtuber customer service, vtuber maker contact",
  canonicalUrlRelative: "/contact",
});

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}