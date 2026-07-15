// Configuration PM2 — lancez avec: pm2 start ecosystem.config.js
module.exports = {
  apps: [
    {
      name: "cruise-crm",
      // Next is built with output: "standalone", so run the generated server directly.
      script: ".next/standalone/server.js",
      cwd: __dirname,
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: "3000",
        HOSTNAME: "0.0.0.0",
      },
    },
  ],
};
