import { Router, Response, NextFunction } from 'express';
import { geminiService } from '../services/gemini.service.js';
import { aiRateLimiter } from '../middleware/rateLimiter.js';
import { authenticateFirebaseUser, AuthenticatedRequest } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/chat/commercial-copilot', authenticateFirebaseUser, aiRateLimiter, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { leads, quotes, activeOrders, metrics, customPrompt } = req.body || {};
    const result = await geminiService.analyzeCommercialCopilot({
      leads,
      quotes,
      activeOrders,
      metrics,
      customPrompt,
    });

    return res.json(result);
  } catch (e: any) {
    if (e.message === 'API_KEY_MISSING') {
      return res.status(500).json({
        error: 'API_KEY_MISSING',
        message: 'A chave API do Gemini não foi encontrada no servidor.',
      });
    }

    console.error('Commercial Copilot Error:', e);
    const errStr = String(e).toLowerCase();
    const isQuotaError =
      errStr.includes('429') ||
      errStr.includes('quota') ||
      errStr.includes('limit') ||
      errStr.includes('exhausted') ||
      errStr.includes('rate') ||
      errStr.includes('demand') ||
      errStr.includes('unavailable') ||
      errStr.includes('503');

    if (isQuotaError) {
      return res.status(429).json({
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'O limite de requisições do Copiloto foi atingido temporariamente. Tente novamente em instantes.',
      });
    }

    return res.status(500).json({
      error: 'COPILOT_ERROR',
      message: 'Não foi possível gerar a análise comercial com IA no momento.',
    });
  }
});

export default router;
