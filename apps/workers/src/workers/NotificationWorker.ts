import { Worker, type Job } from 'bullmq';
import { getDb, schema } from '@snifrbid/db';
import { getRedis } from '@snifrbid/shared';
import { eq } from 'drizzle-orm';
import nodemailer from 'nodemailer';
import TelegramBot from 'node-telegram-bot-api';
import webpush from 'web-push';

interface NotificationJobData {
  type: 'analysis_complete' | 'status_change' | 'new_match' | 'deadline_alert';
  matchId?: string;
  licitacaoId?: string;
  tenantId: string;
  changes?: Record<string, unknown>;
}

// VAPID keys para Web Push (configuradas via env)
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_EMAIL ?? 'noreply@snifrbid.com.br'}`,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  );
}

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT ?? '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

async function sendEmail(to: string, subject: string, html: string) {
  const transporter = createTransporter();
  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? '"SnifrBid" <noreply@snifrbid.com.br>',
    to,
    subject,
    html,
  });
}

async function sendTelegram(chatId: string, text: string) {
  if (!process.env.TELEGRAM_BOT_TOKEN) return;
  const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });
  await bot.sendMessage(chatId, text, { parse_mode: 'HTML' });
}

async function sendWebPush(subscription: object, payload: string) {
  try {
    await webpush.sendNotification(subscription as Parameters<typeof webpush.sendNotification>[0], payload);
  } catch {
    // subscription may be expired — ignore
  }
}

async function buildNotificationContent(data: NotificationJobData): Promise<{ title: string; body: string }> {
  if (data.type === 'analysis_complete' && data.matchId) {
    const match = await getDb().query.matches.findFirst({
      where: eq(schema.matches.id, data.matchId),
      with: { licitacao: true, interest: true },
    });
    if (!match) return { title: 'Análise concluída', body: 'Uma nova análise foi concluída.' };

    return {
      title: `Análise concluída: ${match.interest.name}`,
      body: `A licitação "${match.licitacao.objeto.slice(0, 150)}..." foi analisada com sucesso.`,
    };
  }

  if (data.type === 'status_change' && data.licitacaoId) {
    const lic = await getDb().query.licitacoes.findFirst({
      where: eq(schema.licitacoes.id, data.licitacaoId),
    });
    return {
      title: 'Mudança detectada em licitação',
      body: `A licitação "${lic?.objeto.slice(0, 100) ?? data.licitacaoId}" teve alterações detectadas.`,
    };
  }

  return { title: 'Notificação SnifrBid', body: 'Você tem uma atualização.' };
}

async function processNotificationJob(job: Job<NotificationJobData>) {
  const data = job.data;

  const users = await getDb().query.users.findMany({
    where: eq(schema.users.tenantId, data.tenantId),
  });

  const { title, body } = await buildNotificationContent(data);

  for (const user of users) {
    const prefs = await getDb().query.notificationPreferences.findFirst({
      where: eq(schema.notificationPreferences.userId, user.id),
    });
    if (!prefs) continue;

    const shouldNotify =
      (data.type === 'analysis_complete' && prefs.notifyAnalysisComplete) ||
      (data.type === 'status_change' && prefs.notifyStatusChange) ||
      (data.type === 'new_match' && prefs.notifyNewMatch) ||
      (data.type === 'deadline_alert' && prefs.notifyDeadlineAlert);

    if (!shouldNotify) continue;

    // Email
    if (prefs.emailEnabled) {
      try {
        await sendEmail(user.email, title, `<p>${body}</p>`);
        await getDb().insert(schema.notifications).values({
          tenantId: data.tenantId,
          userId: user.id,
          matchId: data.matchId ?? null,
          type: data.type,
          channel: 'email',
          title,
          body,
          status: 'sent',
          sentAt: new Date(),
        });
      } catch (err) {
        await getDb().insert(schema.notifications).values({
          tenantId: data.tenantId,
          userId: user.id,
          matchId: data.matchId ?? null,
          type: data.type,
          channel: 'email',
          title,
          body,
          status: 'failed',
          errorMessage: err instanceof Error ? err.message : String(err),
        });
      }
    }

    // Telegram
    if (prefs.telegramEnabled && prefs.telegramChatId) {
      try {
        await sendTelegram(prefs.telegramChatId, `<b>${title}</b>\n${body}`);
        await getDb().insert(schema.notifications).values({
          tenantId: data.tenantId,
          userId: user.id,
          matchId: data.matchId ?? null,
          type: data.type,
          channel: 'telegram',
          title,
          body,
          status: 'sent',
          sentAt: new Date(),
        });
      } catch (err) {
        await getDb().insert(schema.notifications).values({
          tenantId: data.tenantId,
          userId: user.id,
          matchId: data.matchId ?? null,
          type: data.type,
          channel: 'telegram',
          title,
          body,
          status: 'failed',
          errorMessage: err instanceof Error ? err.message : String(err),
        });
      }
    }

    // Web Push
    if (prefs.webpushEnabled && prefs.webpushSubscription) {
      const payload = JSON.stringify({ title, body });
      await sendWebPush(prefs.webpushSubscription as object, payload);
    }
  }
}

export function createNotificationWorker() {
  return new Worker('notification', processNotificationJob, {
    connection: getRedis(),
    concurrency: 10,
  });
}
