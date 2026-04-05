module.exports = {
  apps: [
    {
      name: 'api',
      script: './apps/api/dist/main.js',
      cwd: '/home/snifr/app',
      env_file: '/home/snifr/app/.env',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
    },
    {
      name: 'workers',
      script: './apps/workers/dist/main.js',
      cwd: '/home/snifr/app',
      env_file: '/home/snifr/app/.env',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
    },
    {
      name: 'web',
      script: './apps/web/.next/standalone/apps/web/server.js',
      cwd: '/home/snifr/app',
      env_file: '/home/snifr/app/.env',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        PORT: 3000,
        HOSTNAME: '0.0.0.0',
      },
    },
  ],
};
