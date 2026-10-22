import { Router, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { notificationService } from '../services/notification.service.js';
import { authenticateFirebaseUser, AuthenticatedRequest } from '../middleware/authMiddleware.js';

const router = Router();
const testLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: 'draft-6',
  legacyHeaders: false,
});

router.get('/notifications/vapid-public-key', (_req, res) => {
  res.json({ publicKey: notificationService.getVapidPublicKey() });
});

router.post('/notifications/subscribe', authenticateFirebaseUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const uid = req.user?.uid;
    if (!uid) return res.status(401).json({ error: 'UNAUTHORIZED' });
    await notificationService.registerSubscription(uid, req.body?.subscription);
    return res.json({ success: true });
  } catch (err: any) {
    if (err?.message === 'INVALID_SUBSCRIPTION') return res.status(400).json({ error: 'INVALID_SUBSCRIPTION' });
    console.error('[Push Subscribe]', err?.code || err?.message);
    return res.status(503).json({ error: 'PUSH_REGISTRATION_UNAVAILABLE' });
  }
});

router.post('/notifications/test-push', authenticateFirebaseUser, testLimiter, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const uid = req.user?.uid;
    if (!uid) return res.status(401).json({ error: 'UNAUTHORIZED' });
    // Jamais aceitar o userId fornecido pelo navegador como autorização.
    const title = typeof req.body?.title === 'string' ? req.body.title.slice(0, 120) : undefined;
    const body = typeof req.body?.body === 'string' ? req.body.body.slice(0, 300) : undefined;
    const sentCount = await notificationService.sendTestPush(uid, title, body);
    return res.json({ success: sentCount > 0, sentCount });
  } catch (err: any) {
    console.error('[Push Test]', err?.code || err?.message);
    return res.status(503).json({ error: 'PUSH_TEST_UNAVAILABLE' });
  }
});

export default router;
