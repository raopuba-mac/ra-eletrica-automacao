import { Router, Request, Response } from 'express';
import { runAllAutomations } from '../services/scheduler.service.js';

const router = Router();

router.all('/cron/check-reminders', async (req: Request, res: Response) => {
  try {
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      return res.status(403).json({
        error: 'UNAUTHORIZED',
        message: 'Segredo do Cron (CRON_SECRET) não configurado no ambiente do servidor.',
      });
    }

    const authHeader = req.headers.authorization;

    let providedToken = '';
    if (authHeader && authHeader.startsWith('Bearer ')) {
      providedToken = authHeader.substring(7);
    }

    if (!providedToken || providedToken !== cronSecret) {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Acesso não autorizado ao endpoint do Cron. Token Bearer inválido ou ausente.',
      });
    }

    const summary = await runAllAutomations();
    return res.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary,
    });
  } catch (error: any) {
    console.error('[Cron Endpoint Error]', error);
    return res.status(500).json({
      error: 'CRON_EXECUTION_ERROR',
      message: 'Erro durante a execução do cron de lembretes.',
    });
  }
});

export default router;
