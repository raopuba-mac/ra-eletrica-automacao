import { Router, Request, Response } from 'express';
import { notificationService } from '../services/notification.service.js';
import { config } from '../config/index.js';

const router = Router();

router.get('/notifications/vapid-public-key', (_req: Request, res: Response) => {
  res.json({ publicKey: notificationService.getVapidPublicKey() });
});

router.post('/notifications/subscribe', async (req: Request, res: Response) => {
  try {
    const { subscription, userId } = req.body;
    if (!subscription || !userId) {
      return res.status(400).json({ error: 'subscription e userId são obrigatórios' });
    }

    await notificationService.registerSubscription(userId, subscription);
    res.json({ success: true });
  } catch (error: any) {
    if (error.message === 'AUTH_METHOD_DISABLED') {
      return res.status(403).json({
        error: 'AUTH_METHOD_DISABLED',
        message: `O provedor de autenticação "E-mail/Senha" está desativado no Firebase. Ative-o em https://console.firebase.google.com/project/${config.firebase.projectId}/authentication/providers para registrar inscrições push.`,
      });
    }
    if (error.message === 'INVALID_SUBSCRIPTION') {
      return res.status(400).json({ error: 'Endpoint da inscrição inválido' });
    }

    console.error('[Notification Route] Erro ao registrar inscrição:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/notifications/test-push', async (req: Request, res: Response) => {
  try {
    const { userId, title, body } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'userId é obrigatório' });
    }

    const sentCount = await notificationService.sendTestPush(userId, title, body);
    res.json({ success: true, sentCount });
  } catch (error: any) {
    if (error.message === 'AUTH_METHOD_DISABLED') {
      return res.status(403).json({
        error: 'AUTH_METHOD_DISABLED',
        message: `O provedor de autenticação "E-mail/Senha" está desativado no Firebase. Ative-o em https://console.firebase.google.com/project/${config.firebase.projectId}/authentication/providers para enviar notificações push.`,
      });
    }
    if (error.message === 'NO_SUBSCRIPTIONS_FOUND') {
      return res.status(404).json({ error: 'Nenhuma inscrição ativa encontrada para este usuário' });
    }

    console.error('[Notification Route] Erro ao enviar teste:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
