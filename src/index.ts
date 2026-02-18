import type { Client } from "discord.js";
import { createBot } from "./bot";
import { ConfigValidationError, loadConfig } from "./config";
import { logger, toErrorObject } from "./logger";

let client: Client | null = null;
let shuttingDown = false;

async function bootstrap(): Promise<void> {
  try {
    const config = loadConfig();

    client = createBot(config, logger);

    await client.login(config.botToken);
  } catch (error) {
    if (error instanceof ConfigValidationError) {
      logger.error("Environment validation failed", {
        event: "env_validation_failed",
        details: error.details,
      });
    } else {
      logger.error("Bot startup failed", {
        event: "startup_failed",
        error: toErrorObject(error),
      });
    }

    process.exitCode = 1;
  }
}

async function shutdown(signal: NodeJS.Signals): Promise<void> {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  logger.info("Shutdown signal received", {
    event: "shutdown_signal_received",
    signal,
  });

  if (client) {
    client.destroy();
  }
}

process.once("SIGINT", () => {
  void shutdown("SIGINT");
});

process.once("SIGTERM", () => {
  void shutdown("SIGTERM");
});

process.on("uncaughtException", (error) => {
  logger.error("Uncaught exception", {
    event: "uncaught_exception",
    error: toErrorObject(error),
  });

  process.exitCode = 1;
});

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled promise rejection", {
    event: "unhandled_rejection",
    error: toErrorObject(reason),
  });

  process.exitCode = 1;
});

void bootstrap();
