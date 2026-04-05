import TelegramBot from 'node-telegram-bot-api';
import { getDb, schema } from '@snifrbid/db';
import { getRedis } from '@snifrbid/shared';
import { eq, or } from 'drizzle-orm';

let botInstance: TelegramBot | null = null;

export function startTelegramBot(): TelegramBot | null {
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.warn('TELEGRAM_BOT_TOKEN não configurado — bot Telegram desativado');
    return null;
  }

  if (botInstance) return botInstance;

  const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
  botInstance = bot;

  // /start — mensagem de boas-vindas
  bot.onText(/^\/start/, async (msg) => {
    await bot.sendMessage(
      msg.chat.id,
      '👋 <b>Bem-vindo ao SnifrBid!</b>\n\nPara conectar sua conta, envie:\n<code>/conectar CODIGO</code>\n\nO código é gerado nas configurações do app.',
      { parse_mode: 'HTML' },
    );
  });

  // /conectar CODIGO — vincula chat_id ao usuário
  bot.onText(/^\/conectar (.+)/, async (msg, match) => {
    const chatId = msg.chat.id.toString();
    const code = match?.[1]?.trim();

    if (!code) {
      await bot.sendMessage(chatId, '❌ Código inválido. Use: <code>/conectar CODIGO</code>', { parse_mode: 'HTML' });
      return;
    }

    const redisKey = `telegram:connect:${code}`;
    const userId = await getRedis().get(redisKey);

    if (!userId) {
      await bot.sendMessage(chatId, '❌ Código expirado ou inválido. Gere um novo código nas configurações do app.', { parse_mode: 'HTML' });
      return;
    }

    // Salvar chat_id nas preferências do usuário
    const existing = await getDb().query.notificationPreferences.findFirst({
      where: eq(schema.notificationPreferences.userId, userId),
    });

    if (existing) {
      await getDb().update(schema.notificationPreferences)
        .set({ telegramChatId: chatId, telegramEnabled: true, updatedAt: new Date() })
        .where(eq(schema.notificationPreferences.userId, userId));
    } else {
      await getDb().insert(schema.notificationPreferences)
        .values({ userId, telegramChatId: chatId, telegramEnabled: true });
    }

    // Remove código do Redis (one-time use)
    await getRedis().del(redisKey);

    await bot.sendMessage(chatId, '✅ <b>Telegram conectado com sucesso!</b>\nVocê receberá notificações de licitações aqui.', { parse_mode: 'HTML' });
  });

  bot.on('polling_error', (err) => {
    console.error('[TelegramBot] Polling error:', err.message);
  });

  console.log('Telegram bot started (polling mode)');
  return bot;
}

export function stopTelegramBot() {
  if (botInstance) {
    botInstance.stopPolling();
    botInstance = null;
  }
}
