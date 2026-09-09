import { Router, Response, NextFunction } from 'express';
import { geminiService } from '../services/gemini.service.js';
import { aiRateLimiter } from '../middleware/rateLimiter.js';
import { authenticateFirebaseUser, AuthenticatedRequest } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/voice-budget-extractor', authenticateFirebaseUser, aiRateLimiter, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { text } = req.body;
    if (!text || text.trim() === '') {
      return res.status(400).json({
        error: 'TEXT_MISSING',
        message: 'Nenhum texto de transcrição foi enviado.',
      });
    }

    const parsedData = await geminiService.extractVoiceBudget(text);
    res.json(parsedData);
  } catch (e: any) {
    if (e.message === 'API_KEY_MISSING') {
      return res.status(500).json({
        error: 'API_KEY_MISSING',
        message: 'A chave API do Gemini não foi encontrada no servidor.',
      });
    }

    console.error('Voice Budget Extractor Error:', e);
    next(e);
  }
});

export default router;
