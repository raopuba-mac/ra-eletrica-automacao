import { Request, Response, NextFunction } from 'express';
import { getServerAuth } from '../services/adminFirebase.js';

export interface AuthenticatedRequest extends Request {
  user?: { uid: string; email?: string };
}

export async function authenticateFirebaseUser(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Token Firebase não fornecido.' });
  }
  const idToken = authHeader.slice('Bearer '.length).trim();
  if (!idToken) return res.status(401).json({ error: 'UNAUTHORIZED' });

  try {
    const decoded = await getServerAuth().verifyIdToken(idToken);
    req.user = { uid: decoded.uid, email: decoded.email };
    return next();
  } catch (error: any) {
    if (/FIREBASE_SERVICE_ACCOUNT|FIREBASE_PROJECT/.test(error?.message || '')) {
      console.error('[Auth] Firebase Admin não configurado:', error?.message);
      return res.status(503).json({ error: 'FIREBASE_ADMIN_UNAVAILABLE' });
    }
    return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Sessão inválida ou expirada.' });
  }
}
