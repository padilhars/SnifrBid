import type { FastifyInstance } from 'fastify';
import { eq, and, desc } from 'drizzle-orm';
import { getDb, schema } from '@snifrbid/db';
import { getRedis } from '@snifrbid/shared';

export default async function notificationRoutes(app: FastifyInstance) {

  // GET /notifications/preferences
  app.get('/preferences', { onRequest: [app.authenticate] }, async (req) => {
    const prefs = await getDb().query.notificationPreferences.findFirst({
      where: eq(schema.notificationPreferences.userId, req.currentUser.id),
    });
    return prefs ?? {};
  });

  // PUT /notifications/preferences
  app.put('/preferences', {
    onRequest: [app.authenticate],
    schema: {
      body: {
        type: 'object',
        properties: {
          telegramEnabled: { type: 'boolean' },
          emailEnabled: { type: 'boolean' },
          webpushEnabled: { type: 'boolean' },
          notifyNewMatch: { type: 'boolean' },
          notifyAnalysisComplete: { type: 'boolean' },
          notifyStatusChange: { type: 'boolean' },
          notifyDeadlineAlert: { type: 'boolean' },
          deadlineAlertDays: { type: 'integer', minimum: 1, maximum: 30 },
        },
      },
    },
  }, async (req) => {
    const body = req.body as Partial<typeof schema.notificationPreferences.$inferInsert>;
    const db = getDb();

    const existing = await db.query.notificationPreferences.findFirst({
      where: eq(schema.notificationPreferences.userId, req.currentUser.id),
    });

    if (existing) {
      const [updated] = await db.update(schema.notificationPreferences)
        .set({ ...body, updatedAt: new Date() })
        .where(eq(schema.notificationPreferences.userId, req.currentUser.id))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(schema.notificationPreferences)
        .values({ userId: req.currentUser.id, ...body })
        .returning();
      return created;
    }
  });

  // POST /notifications/webpush/subscribe
  app.post('/webpush/subscribe', {
    onRequest: [app.authenticate],
    schema: {
      body: {
        type: 'object',
        required: ['subscription'],
        properties: { subscription: { type: 'object' } },
      },
    },
  }, async (req) => {
    const { subscription } = req.body as { subscription: Record<string, unknown> };
    const db = getDb();

    const existing = await db.query.notificationPreferences.findFirst({
      where: eq(schema.notificationPreferences.userId, req.currentUser.id),
    });

    if (existing) {
      await db.update(schema.notificationPreferences)
        .set({ webpushSubscription: subscription, webpushEnabled: true, updatedAt: new Date() })
        .where(eq(schema.notificationPreferences.userId, req.currentUser.id));
    } else {
      await db.insert(schema.notificationPreferences)
        .values({ userId: req.currentUser.id, webpushSubscription: subscription, webpushEnabled: true });
    }

    return { ok: true };
  });

  // POST /notifications/telegram/connect — inicia fluxo com código de 6 dígitos
  app.post('/telegram/connect', { onRequest: [app.authenticate] }, async (req) => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    // Salvar código no Redis por 10 minutos
    await getRedis().setex(`telegram:connect:${code}`, 600, req.currentUser.id);

    return {
      code,
      instructions: `Abra o bot SnifrBid no Telegram e envie: /conectar ${code}`,
      expiresInMinutes: 10,
    };
  });

  // GET /notifications/history
  app.get('/history', {
    onRequest: [app.authenticate],
    schema: {
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', default: 1 },
          limit: { type: 'integer', default: 20 },
          channel: { type: 'string' },
          type: { type: 'string' },
        },
      },
    },
  }, async (req) => {
    const query = req.query as { page?: number; limit?: number; channel?: string; type?: string };
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, query.limit ?? 20);
    const offset = (page - 1) * limit;

    const notifications = await getDb().query.notifications.findMany({
      where: and(
        eq(schema.notifications.userId, req.currentUser.id),
        ...(query.channel ? [eq(schema.notifications.channel, query.channel)] : []),
        ...(query.type ? [eq(schema.notifications.type, query.type)] : []),
      ),
      orderBy: [desc(schema.notifications.createdAt)],
      limit,
      offset,
    });

    return { data: notifications, page, limit };
  });
}
