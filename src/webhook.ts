import type { Logger } from "winston";

type SendWebhookPayloadParams = {
  webhookUrls: string[];
  payload: unknown;
  logger: Logger;
  event: string;
  timeoutMs: number;
  maxConcurrency: number;
};

export async function sendWebhookPayload({
  webhookUrls,
  payload,
  logger,
  event,
  timeoutMs,
  maxConcurrency,
}: SendWebhookPayloadParams): Promise<void> {
  for (let i = 0; i < webhookUrls.length; i += maxConcurrency) {
    const chunk = webhookUrls.slice(i, i + maxConcurrency);
    await Promise.allSettled(
      chunk.map((webhookUrl) =>
        postToWebhook({ webhookUrl, payload, logger, event, timeoutMs }),
      ),
    );
  }
}

async function postToWebhook({
  webhookUrl,
  payload,
  logger,
  event,
  timeoutMs,
}: {
  webhookUrl: string;
  payload: unknown;
  logger: Logger;
  event: string;
  timeoutMs: number;
}): Promise<void> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const maskedWebhookUrl = maskWebhookUrl(webhookUrl);

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      logger.error("Webhook notification failed", {
        event: "webhook_notify_failed",
        source_event: event,
        webhook_url: maskedWebhookUrl,
        status: response.status,
        status_text: response.statusText,
      });
    }
  } catch (error) {
    logger.error("Webhook notification failed", {
      event: "webhook_notify_failed",
      source_event: event,
      webhook_url: maskedWebhookUrl,
      timeout_ms: timeoutMs,
      timed_out: isAbortError(error),
      error: toErrorObject(error),
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

function toErrorObject(error: unknown): Record<string, string> {
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

export function maskWebhookUrls(webhookUrls: string[]): string[] {
  return webhookUrls.map((url) => maskWebhookUrl(url));
}

function maskWebhookUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const suffix = parsed.pathname.slice(-6);
    const suffixLabel = suffix.length > 0 ? suffix : "******";
    return `${parsed.protocol}//${parsed.host}/...${suffixLabel}`;
  } catch {
    return "[invalid_webhook_url]";
  }
}
