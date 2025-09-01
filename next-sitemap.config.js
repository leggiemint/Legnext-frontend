module.exports = {
  // REQUIRED: add your own domain name here (e.g. https://legnext.ai),
  siteUrl: process.env.SITE_URL || "https://www.legnext.ai",
  generateRobotsTxt: true,
  // use this to exclude routes from the sitemap (i.e. a user dashboard). By default, NextJS app router metadata files are excluded (https://nextjs.org/docs/app/api-reference/file-conventions/metadata)
  exclude: [
    "/twitter-image.*", 
    "/opengraph-image.*", 
    "/icon.*",
    "/api/*", // 排除API路由
    "/admin/*", // 排除管理页面
    "/app/settings*", // 只排除需要登录的设置页面
    "/app/ai-generator*", // 排除需要登录的AI生成器页面
    "/app/animations*", // 排除需要登录的动画页面
    "/app/images*", // 排除需要登录的头像页面
  ],
  // 手动添加重要的公开页面
  additionalPaths: async (config) => [
    await config.transform(config, '/'),
    await config.transform(config, '/pricing'),
    await config.transform(config, '/privacy'),
    await config.transform(config, '/tos'),
    await config.transform(config, '/app/midjourney'),
    await config.transform(config, '/blog'),
  ]
};
