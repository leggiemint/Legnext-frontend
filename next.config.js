/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone', // 启用standalone输出，Docker部署需要
  images: {
    domains: [
      // NextJS <Image> component needs to whitelist domains for src={}
      "lh3.googleusercontent.com",
      "pbs.twimg.com",
      "images.unsplash.com",
      "logos-world.net",
      "avatars.githubusercontent.com", // GitHub avatars
      "cdn.legnext.ai", // LegNext CDN for generated images
      "staging-a93116.legnext.ai", // 测试环境域名
    ],
  },
  // 禁用静态优化，避免构建时 useSession 问题
  experimental: {
    forceSwcTransforms: true,
  },
  // 跳过构建时静态生成
  trailingSlash: false,
  generateBuildId: () => 'build',
};

module.exports = nextConfig;
