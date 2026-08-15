import app from './app';
import { connectDB } from './config/db';
import { ENV } from './config/constants';

async function bootstrap() {
  await connectDB();

  const server = app.listen(ENV.PORT, () => {
    console.log(`
==================================================================
  🛡️  CampusCart Secure API & Escrow Engine Active
  🚀  Port: ${ENV.PORT} | Mode: ${ENV.NODE_ENV}
  🔒  Auth: Stateless JWT in HttpOnly + SameSite=Strict Cookies
  🛡️  Security: Magic Bytes Validation + Rate Limits + CSRF
  ⚡  Geospatial: MongoDB 2dsphere + Cursor Pagination
  ⚖️  Escrow: Zero-Trust State Machine with OTP Release
  🧠  ML: Behavioral Churn Telemetry Pipeline
==================================================================
    `);
  });

  const gracefulShutdown = () => {
    console.log('[Server] Gracefully shutting down CampusCart server...');
    server.close(() => {
      console.log('[Server] Process terminated.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);
}

if (require.main === module) {
  bootstrap();
}

export { app, bootstrap };
