import { Router, Request, Response } from 'express';
import { timingSafeEqual } from 'node:crypto';
import { getServerDb } from '../services/adminFirebase.js';
import { runAllAutomations } from '../services/scheduler.service.js';

const router = Router();

function authorized(req: Request): boolean {
  const secret = process.env.VERCEL_ENV === 'preview'
    ? process.env.PREVIEW_CRON_SECRET
    : process.env.CRON_SECRET;
  const provided = req.headers.authorization;
  if (!secret || typeof provided !== 'string' || !provided.startsWith('Bearer ')) return false;
  const a = Buffer.from(provided.slice(7));
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

// Rota diagnóstica sem alteração de dados, autorizada e exclusiva do Preview.
router.get('/cron/health', async (req: Request, res: Response) => {
  if (process.env.VERCEL_ENV !== 'preview') return res.sendStatus(404);
  if (!authorized(req)) return res.sendStatus(401);
  try {
    await getServerDb().collection('push_subscriptions').limit(1).get();
    return res.json({ success: true, backend: 'firebase-admin', firestore: 'connected' });
  } catch (error: any) {
    console.error('[Cron Health]', error?.code || error?.message);
    return res.status(503).json({ success: false, error: 'FIRESTORE_UNAVAILABLE' });
  }
});

router.all('/cron/check-reminders', async (req: Request, res: Response) => {
  if (!authorized(req)) return res.sendStatus(401);
  try {
    const summary = await runAllAutomations();
    return res.json({ success: true, timestamp: new Date().toISOString(), summary });
  } catch (error: any) {
    console.error('[Cron Execution]', error?.code || error?.message);
    return res.status(503).json({ success: false, error: 'CRON_UNAVAILABLE' });
  }
});

export default router;
