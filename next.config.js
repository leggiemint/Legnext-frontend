/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone', // Enable standalone mode for Docker
  images: {
    domains: [
      // NextJS <Image> component needs to whitelist domains for src={}
      "lh3.googleusercontent.com",
      "pbs.twimg.com",
      "images.unsplash.com",
      "logos-world.net",
      "avatars.githubusercontent.com", // GitHub avatars
      "cdn.legnext.ai", // LegNext CDN for generated images
    ],
  },
};

module.exports = nextConfig;
