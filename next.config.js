/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // output: 'standalone', // Disabled - using PM2 instead of Docker
  images: {
    domains: [
      // NextJS <Image> component needs to whitelist domains for src={}
      "lh3.googleusercontent.com",
      "pbs.twimg.com",
      "images.unsplash.com",
      "logos-world.net",
      "avatars.githubusercontent.com", // GitHub avatars
      "cdn.legnext.ai", // LegNext CDN for generated images
      "image.legnext.ai",
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
              "style-src 'self' 'unsafe-inline' https:",
              "img-src 'self' data: https: blob:",
              "font-src 'self' https:",
              "connect-src 'self' https:",
              "frame-src 'self' https:",
              "worker-src 'self' blob: https:",
              "child-src 'self' blob: https:",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
