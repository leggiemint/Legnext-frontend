module.exports = {
  apps: [
    {
      name: 'legnext-app',
      script: 'node_modules/.bin/next',
      args: 'start',
      cwd: './',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      // Restart configuration
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '1G',
      
      // Logging
      log_file: './logs/app.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Advanced PM2 features
      watch: false,
      ignore_watch: ['node_modules', 'logs', '.next/cache'],
      watch_options: {
        followSymlinks: false
      },
      
      // Health monitoring
      health_check_grace_period: 3000,
      health_check_fatal_exceptions: true,
      
      // Auto restart on file changes in development
      // watch: process.env.NODE_ENV === 'development',
    }
  ],

  // Deployment configuration (optional)
  deploy: {
    production: {
      user: process.env.VPS_USER || 'deploy',
      host: process.env.VPS_HOST || 'your-server.com',
      ref: 'origin/main',
      repo: 'git@github.com:yourusername/legnext-nextjs.git',
      path: process.env.VPS_PATH || '/var/www/legnext',
      'pre-deploy-local': '',
      'post-deploy': 'pnpm install && pnpm run build && pnpm prisma generate && pnpm prisma migrate deploy && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
      env: {
        NODE_ENV: 'production'
      }
    }
  }
};