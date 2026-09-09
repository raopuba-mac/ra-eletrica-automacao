import rateLimit from 'express-rate-limit';

/**
 * Rate limiter middleware for public AI routes.
 * Limits each IP to 30 requests per 15 minutes to prevent abuse while allowing normal usage.
 */
export const aiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 30, // 30 requests per window
  standardHeaders: 'draft-6',
  legacyHeaders: false,
  message: {
    error: 'RATE_LIMIT_EXCEEDED',
    message: 'O limite de requisições do assistente foi atingido temporariamente. Por favor, aguarde alguns minutos e tente novamente.',
  },
});
