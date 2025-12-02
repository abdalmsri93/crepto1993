export default {
  apps: [
    {
      name: 'binance-watch-live',
      script: 'npm',
      args: 'run preview',
      instances: 1,
      env: {
        NODE_ENV: 'production'
      },
      watch: false,
      ignore_watch: ['node_modules', 'dist'],
      max_memory_restart: '500M',
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
};
