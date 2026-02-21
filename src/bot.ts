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

    const content = message.content ?? "";
    logger.info("Discord message received", {
      event: "message_received",
      message_id: message.id,
      guild_id: message.guildId ?? null,
      channel_id: message.channelId,
      author_id: message.author.id,
      author_tag: message.author.tag,
      is_direct_message: message.guildId == null,
      content_length: content.length,
      content_preview: truncateForLog(content),
      attachment_count: message.attachments.size,
    });

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

    logger.info("Discord message forwarded to webhook targets", {
      event: "message_forwarded",
      message_id: message.id,
      webhook_count: config.webhookUrls.length,
    });
  });

  return client;
}

function truncateForLog(content: string, maxLength = 200): string {
  if (content.length <= maxLength) {
    return content;
  }

  return `${content.slice(0, maxLength)}...`;
}
