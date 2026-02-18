import { Client, GatewayIntentBits, type Message } from "discord.js";
import type { AppConfig } from "./config";
import type { Logger } from "winston";
import { maskWebhookUrls, sendWebhookPayload } from "./webhook";

export function createBot(config: AppConfig, logger: Logger): Client {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.DirectMessages,
      GatewayIntentBits.MessageContent,
    ],
  });

  client.once("clientReady", async () => {
    const maskedWebhookUrls = maskWebhookUrls(config.webhookUrls);

    logger.info("Discord bot is ready", {
      event: "startup_completed",
      bot_user: client.user?.tag ?? null,
      webhook_targets: maskedWebhookUrls,
      webhook_count: config.webhookUrls.length,
    });
  });

  client.on("messageCreate", async (message: Message) => {
    if (message.author.bot) {
      return;
    }

    if (!message.content?.trim()) {
      return;
    }

    await sendWebhookPayload({
      webhookUrls: config.webhookUrls,
      payload: message.toJSON(),
      logger,
      event: "message_create_forward",
      timeoutMs: config.webhookTimeoutMs,
      maxConcurrency: config.webhookMaxConcurrency,
    });
  });

  return client;
}
