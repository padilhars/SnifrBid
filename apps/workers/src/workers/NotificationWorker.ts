import { Worker, type Job } from 'bullmq';
import { getDb, schema } from '@snifrbid/db';
import { getRedis } from '@snifrbid/shared';
import { eq, and, inArray } from 'drizzle-orm';
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

async function sendWebPushNotification(subscription: object, payload: string) {
  try {
    await webpush.sendNotification(subscription as Parameters<typeof webpush.sendNotification>[0], payload);
  } catch {
    // subscription expirada — ignora silenciosamente
  }
}

async function buildNotificationContent(data: NotificationJobData): Promise<{ title: string; body: string; html: string }> {
  if (data.type === 'analysis_complete' && data.matchId) {
    const match = await getDb().query.matches.findFirst({
      where: eq(schema.matches.id, data.matchId),
      with: { licitacao: true, interest: true },
    });
    if (!match) return buildDefaultContent();

    const title = `Análise concluída: ${match.interest.name}`;
    const body = `A licitação "${match.licitacao.objeto.slice(0, 150)}..." foi analisada.`;
    const html = `
      <h2>Análise de Licitação Concluída</h2>
      <p><strong>Interesse:</strong> ${match.interest.name}</p>
      <p><strong>Objeto:</strong> ${match.licitacao.objeto}</p>
      <p>Acesse o app para ver a análise completa.</p>
    `;
    return { title, body, html };
  }

  if (data.type === 'new_match' && data.matchId) {
    const match = await getDb().query.matches.findFirst({
      where: eq(schema.matches.id, data.matchId),
      with: { licitacao: true, interest: true },
    });
    if (!match) return buildDefaultContent();

    const title = `Nova licitação encontrada: ${match.interest.name}`;
    const body = `${match.licitacao.objeto.slice(0, 150)}...`;
    const html = `
      <h2>Nova Licitação Encontrada</h2>
      <p><strong>Interesse:</strong> ${match.interest.name}</p>
      <p><strong>Objeto:</strong> ${match.licitacao.objeto}</p>
      <p><strong>Score:</strong> ${((match.scoreFinal ?? 0) * 100).toFixed(0)}%</p>
    `;
    return { title, body, html };
  }

  if (data.type === 'status_change' && data.licitacaoId) {
    const lic = await getDb().query.licitacoes.findFirst({
      where: eq(schema.licitacoes.id, data.licitacaoId),
    });
    const title = 'Mudança detectada em licitação';
    const body = `A licitação "${lic?.objeto.slice(0, 100) ?? data.licitacaoId}" teve alterações.`;
    const html = `<h2>Mudança em Licitação</h2><p>${body}</p>`;
    return { title, body, html };
  }

  return buildDefaultContent();
}

function buildDefaultContent() {
  return {
    title: 'Notificação SnifrBid',
    body: 'Você tem uma atualização.',
    html: '<p>Você tem uma atualização no SnifrBid.</p>',
  };
}

function shouldNotifyUser(
  prefs: typeof schema.notificationPreferences.$inferSelect,
  type: NotificationJobData['type'],
): boolean {
  switch (type) {
    case 'analysis_complete': return prefs.notifyAnalysisComplete;
    case 'status_change': return prefs.notifyStatusChange;
    case 'new_match': return prefs.notifyNewMatch;
    case 'deadline_alert': return prefs.notifyDeadlineAlert;
    default: return false;
  }
}

async function processNotificationJob(job: Job<NotificationJobData>) {
  const { type, matchId, tenantId, licitacaoId } = job.data;

  // Buscar usuários ativos do tenant
  const usersDoTenant = await getDb()
    .select({ userId: schema.users.id, email: schema.users.email })
    .from(schema.users)
    .where(and(
      eq(schema.users.tenantId, tenantId),
      eq(schema.users.isActive, true),
    ));

  const userIds = usersDoTenant.map((u) => u.userId);
  if (userIds.length === 0) return;

  // Buscar preferências de todos os usuários de uma vez
  const prefs = await getDb().query.notificationPreferences.findMany({
    where: inArray(schema.notificationPreferences.userId, userIds),
  });

  const emailByUserId = new Map(usersDoTenant.map((u) => [u.userId, u.email]));

  const { title, body, html } = await buildNotificationContent(job.data);

  for (const pref of prefs) {
    if (!shouldNotifyUser(pref, type)) continue;

    const userEmail = emailByUserId.get(pref.userId)!;

    // Telegram
    if (pref.telegramEnabled && pref.telegramChatId) {
      try {
        await sendTelegram(pref.telegramChatId, `<b>${title}</b>\n${body}`);
        await getDb().insert(schema.notifications).values({
          tenantId,
          userId: pref.userId,
          matchId: matchId ?? null,
          type,
          channel: 'telegram',
          title,
          body,
          status: 'sent',
          sentAt: new Date(),
        });
      } catch (err) {
        await getDb().insert(schema.notifications).values({
          tenantId,
          userId: pref.userId,
          matchId: matchId ?? null,
          type,
          channel: 'telegram',
          title,
          body,
          status: 'failed',
          errorMessage: err instanceof Error ? err.message : String(err),
        });
      }
    }

    // Email (falha independente do Telegram)
    if (pref.emailEnabled) {
      try {
        await sendEmail(userEmail, title, html);
        await getDb().insert(schema.notifications).values({
          tenantId,
          userId: pref.userId,
          matchId: matchId ?? null,
          type,
          channel: 'email',
          title,
          body,
          status: 'sent',
          sentAt: new Date(),
        });
      } catch (err) {
        await getDb().insert(schema.notifications).values({
          tenantId,
          userId: pref.userId,
          matchId: matchId ?? null,
          type,
          channel: 'email',
          title,
          body,
          status: 'failed',
          errorMessage: err instanceof Error ? err.message : String(err),
        });
      }
    }

    // Web Push (falha independente dos outros)
    if (pref.webpushEnabled && pref.webpushSubscription) {
      const payload = JSON.stringify({ title, body });
      await sendWebPushNotification(pref.webpushSubscription as object, payload);
    }
  }
}

export function createNotificationWorker() {
  return new Worker('notification', processNotificationJob, {
    connection: getRedis(),
    concurrency: 10,
  });
}
