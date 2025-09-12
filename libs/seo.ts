import { Metadata } from "next";
import config from "@/config";

export interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  canonical?: string;
  openGraph?: {
    title?: string;
    description?: string;
    url?: string;
    siteName?: string;
    images?: {
      url: string;
      width?: number;
      height?: number;
      alt?: string;
    }[];
    locale?: string;
    type?: 'website' | 'article';
  };
  twitter?: {
    card?: 'summary' | 'summary_large_image';
    title?: string;
    description?: string;
    creator?: string;
    images?: string[];
  };
  extraTags?: Record<string, string>;
}

export function getSEOTags({
  title,
  description,
  keywords,
  canonical,
  openGraph,
  twitter,
  extraTags,
}: SEOProps = {}): Metadata {
  // Default SEO values
  const defaultTitle = config.appName;
  const defaultDescription = config.appDescription;
  const domain = `https://${config.domainName}`;
  
  // Prepare final values
  const finalTitle = title ? `${title} | ${defaultTitle}` : defaultTitle;
  const finalDescription = description || defaultDescription;
  
  // Base metadata
  const metadata: Metadata = {
    title: finalTitle,
    description: finalDescription,
    applicationName: config.appName,
    generator: 'Next.js',
    referrer: 'origin-when-cross-origin',
    keywords: keywords || ['midjourney api', 'ai image generation', 'api integration'],
    authors: [{ name: config.appName }],
    creator: config.appName,
    publisher: config.appName,
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
  };

  // Add canonical URL if provided or use domain
  if (canonical || domain) {
    metadata.alternates = {
      canonical: canonical || domain,
    };
  }

  // Open Graph metadata
  if (openGraph || !openGraph) {
    metadata.openGraph = {
      title: openGraph?.title || finalTitle,
      description: openGraph?.description || finalDescription,
      url: openGraph?.url || domain,
      siteName: openGraph?.siteName || config.appName,
      locale: openGraph?.locale || 'en_US',
      type: openGraph?.type || 'website',
      images: openGraph?.images || [
        {
          url: `${domain}/og-image.png`,
          width: 1200,
          height: 630,
          alt: config.appName,
        },
      ],
    };
  }

  // Twitter metadata
  if (twitter || !twitter) {
    metadata.twitter = {
      card: twitter?.card || 'summary_large_image',
      title: twitter?.title || finalTitle,
      description: twitter?.description || finalDescription,
      creator: twitter?.creator || `@${config.appName}`,
      images: twitter?.images || [`${domain}/og-image.png`],
    };
  }

  // Robots
  metadata.robots = {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  };

  // Icons
  metadata.icons = {
    icon: [
      { url: '/favicon/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/favicon/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      {
        rel: 'mask-icon',
        url: '/favicon/safari-pinned-tab.svg',
        color: config.colors.main,
      },
    ],
  };

  // Manifest
  metadata.manifest = '/favicon/site.webmanifest';

  // Additional metadata from extraTags
  if (extraTags) {
    metadata.other = extraTags;
  }

  return metadata;
}

// Helper function for page-specific SEO
export function getPageSEO(pageTitle: string, pageDescription?: string, options?: SEOProps): Metadata {
  return getSEOTags({
    title: pageTitle,
    description: pageDescription,
    ...options,
  });
}

// Helper function for blog/article SEO
export function getArticleSEO(
  title: string,
  description: string,
  publishedTime?: string,
  modifiedTime?: string,
  tags?: string[],
  options?: SEOProps
): Metadata {
  return getSEOTags({
    title,
    description,
    keywords: tags,
    openGraph: {
      type: 'article',
      title,
      description,
      ...options?.openGraph,
    },
    ...options,
  });
}