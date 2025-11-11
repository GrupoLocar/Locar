export default {
  apps: [
    {
      name: "locar-backend",
      cwd: "C:/Locar/backend",
      script: "npm",
      args: "run start",
      interpreter: "none",
      watch: false,
      autorestart: true,
      max_restarts: 10,
      exp_backoff_restart_delay: 100,
      env: {
        NODE_ENV: "development",
        PORT: "5000",
        MONGO_URI: "mongodb://localhost:27017/locar",
        JWT_SECRET: "change-me-dev"
      },
      env_production: {
        NODE_ENV: "production",
        PORT: "5000",
        MONGO_URI: "mongodb://localhost:27017/locar",
        JWT_SECRET: "change-me-prod"
      },
      error_file: "C:/Locar/logs/pm2/locar-backend-error.log",
      out_file: "C:/Locar/logs/pm2/locar-backend-out.log",
      time: true
    },
    {
      name: "locar-frontend",
      cwd: "C:/Locar/frontend",
      script: "serve",
      args: "-s build -l 3000",
      interpreter: "none",
      watch: false,
      autorestart: true,
      max_restarts: 10,
      exp_backoff_restart_delay: 100,
      env: {
        NODE_ENV: "development"
      },
      env_production: {
        NODE_ENV: "production"
      },
      error_file: "C:/Locar/logs/pm2/locar-frontend-error.log",
      out_file: "C:/Locar/logs/pm2/locar-frontend-out.log",
      time: true
    }
  ]
};
