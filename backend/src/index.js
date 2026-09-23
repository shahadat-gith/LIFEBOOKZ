import app from "./app.js";
import config from "./core/config/index.js";
import { connectDatabase } from "./core/config/database.js";
import { logger } from "./core/services/logger.js";

let server;

async function start() {
  try {
    await connectDatabase();

    server = app.listen(config.port, () => {
      logger.info(`LifeBookz API running on port ${config.port}`, {
        env: config.env,
      });
    }    );
  } catch (error) {
    logger.error("Failed to start server", {
      reason: error.message,
      stack: error.stack,
    });

    process.exit(1);
  }
}

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled promise rejection", {
    reason: reason?.message || String(reason),
    stack: reason?.stack,
  });
});

process.on("uncaughtException", (error) => {
  logger.error("Uncaught exception", {
    reason: error.message,
    stack: error.stack,
  });
});

start();
