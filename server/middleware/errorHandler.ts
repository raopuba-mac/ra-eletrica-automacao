import { Request, Response, NextFunction } from 'express';
import { config } from '../config/index.js';

/**
 * Global error handler middleware.
 * Ensures no sensitive data (API keys, passwords, credentials, stack traces) is leaked to the client.
 */
export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  // Log full error on server side for debugging
  console.error('[ServerError]', err);

  if (res.headersSent) {
    return;
  }

  const statusCode = typeof err.status === 'number' ? err.status : 500;
  const isDev = config.nodeEnv !== 'production';

  // Sanitize message to avoid leaking secrets
  let safeMessage = 'Ocorreu um erro interno no servidor.';
  let errorType = err.name || 'INTERNAL_SERVER_ERROR';

  if (err.message) {
    const rawMsg = String(err.message);
    // Filter out common leak patterns
    if (
      !rawMsg.includes('AIzaSy') &&
      !rawMsg.includes('key') &&
      !rawMsg.includes('secret') &&
      !rawMsg.includes('password')
    ) {
      safeMessage = rawMsg;
    }
  }

  res.status(statusCode).json({
    error: errorType,
    message: safeMessage,
    ...(isDev && err.stack ? { debug: err.stack } : {}),
  });
}
