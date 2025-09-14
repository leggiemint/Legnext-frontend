#!/usr/bin/env node

// 设置环境变量确保 Next.js 绑定到所有网络接口
process.env.HOSTNAME = '0.0.0.0';
process.env.PORT = process.env.PORT || '3000';

console.log(`Starting Next.js server on ${process.env.HOSTNAME}:${process.env.PORT}`);

// 启动 Next.js standalone 服务器
require('./.next/standalone/server.js');