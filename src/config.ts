export type AppConfig = {
  botToken: string;
  webhookUrls: string[];
  webhookTimeoutMs: number;
  webhookMaxConcurrency: number;
};

export class ConfigValidationError extends Error {
  public readonly details: string[];

  public constructor(details: string[]) {
    super("Environment validation failed");
    this.name = "ConfigValidationError";
    this.details = details;
  }
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const details: string[] = [];

  const botToken = env.bot_token?.trim();
  if (!botToken) {
    details.push("Environment variable 'bot_token' is required.");
  }

  const rawWebhookUrls = env.webhook_urls?.split(",") ?? [];
  const webhookUrls = rawWebhookUrls
    .map((url) => url.trim())
    .filter((url) => url.length > 0);

  if (webhookUrls.length === 0) {
    details.push("Environment variable 'webhook_urls' must include at least one URL.");
  }

  for (const url of webhookUrls) {
    if (!isValidHttpUrl(url)) {
      details.push(`Invalid webhook URL: ${url}`);
    }
  }

  const webhookTimeoutMs = readPositiveIntegerFromEnv(
    env,
    "WEBHOOK_TIMEOUT_MS",
    10_000,
    details,
  );
  const webhookMaxConcurrency = readPositiveIntegerFromEnv(
    env,
    "WEBHOOK_MAX_CONCURRENCY",
    4,
    details,
  );

  if (details.length > 0 || !botToken) {
    throw new ConfigValidationError(details);
  }

  return {
    botToken,
    webhookUrls,
    webhookTimeoutMs,
    webhookMaxConcurrency,
  };
}

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function readPositiveIntegerFromEnv(
  env: NodeJS.ProcessEnv,
  key: string,
  defaultValue: number,
  details: string[],
): number {
  const raw = env[key];
  if (!raw) {
    return defaultValue;
  }

  const value = Number.parseInt(raw, 10);
  if (!Number.isFinite(value) || value <= 0) {
    details.push(`Environment variable '${key}' must be a positive integer.`);
    return defaultValue;
  }

  return value;
}
