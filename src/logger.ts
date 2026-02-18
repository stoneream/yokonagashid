import { createLogger, format, transports } from "winston";

export const logger = createLogger({
  level: process.env.LOG_LEVEL ?? "info",
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json(),
  ),
  transports: [new transports.Console()],
});

export function toErrorObject(error: unknown): Record<string, string> {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack ?? "",
    };
  }

  return {
    name: "UnknownError",
    message: String(error),
    stack: "",
  };
}
