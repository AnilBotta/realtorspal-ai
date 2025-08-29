// /home/realtorspal/realtorspal-ai/ecosystem.config.js

module.exports = {
  apps: [
    {
      name: 'realtorspal-backend',
      script: './realtorspal-backend/api/server.js',
      cwd: '/home/realtorspal/realtorspal-ai',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
        DATABASE_URL: 'postgresql://neondb_owner:npg_lewydJ4hqDk9@ep-small-flower-aflk9tdv-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require',
        JWT_SECRET: 'realtorspal_super_secure_jwt_secret_key_production_2024_32_chars_minimum',
        CORS_ORIGIN: 'http://172.234.26.134,https://172.234.26.134,http://localhost:3000',
        LOG_LEVEL: 'info'
      },
      error_file: '/home/realtorspal/logs/backend-error.log',
      out_file: '/home/realtorspal/logs/backend-out.log',
      log_file: '/home/realtorspal/logs/backend-combined.log',
      time: true
    },
    {
      name: 'realtorspal-frontend',
      // Run Next.js directly (expects a .next build folder)
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000 -H 127.0.0.1',
      cwd: '/home/realtorspal/realtorspal-ai/realtorspal-ai',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        // Frontend talks to backend via Nginx /api proxy
        NEXT_PUBLIC_API_URL: '/api',
        NEXT_PUBLIC_APP_ENV: 'production'
      },
      error_file: '/home/realtorspal/logs/frontend-error.log',
      out_file: '/home/realtorspal/logs/frontend-out.log',
      log_file: '/home/realtorspal/logs/frontend-combined.log',
      time: true,
      max_restarts: 5,
      min_uptime: '10s'
    }
  ]
}

