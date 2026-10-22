module.exports = {
  apps: [
    {
      name: 'growroom-backend',
      script: './growroom-backend/server/dist/index.js',
      cwd: '/home/YOUR_USER/growroom/backend',  // <-- change YOUR_USER
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '256M',
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
        // DB_HOST, DB_USER, DB_PASS, DB_NAME set in .env on the server
      },
    },
  ],
};
