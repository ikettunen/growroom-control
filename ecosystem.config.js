module.exports = {
  apps: [
    {
      name: 'growroom-backend',
      script: './node_modules/ts-node/dist/bin.js',
      args: 'src/index.ts',
      cwd: './growroom-backend/server',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '256M',
      env: {
        NODE_ENV: 'development',
        PORT: 5000,
      },
    },
    {
      name: 'growroom-frontend',
      script: './node_modules/react-scripts/bin/react-scripts.js',
      args: 'start',
      cwd: './growroom-dashboard/frontend/growroom-dashboard',
      instances: 1,
      autorestart: false,
      watch: false,
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
        BROWSER: 'none',
      },
    },
  ],
};
