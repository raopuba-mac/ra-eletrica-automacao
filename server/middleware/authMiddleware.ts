import { Request, Response, NextFunction } from 'express';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { config } from '../config/index';

// Initialize firebase-admin app once safely
function initFirebaseAdminApp() {
  if (getApps().length > 0) {
    return;
  }

  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (serviceAccountKey) {
    try {
      const serviceAccount = JSON.parse(serviceAccountKey);
      initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id || config.firebase.projectId,
      });
      return;
    } catch (err: any) {
      console.error(
        '[Auth Middleware] Erro ao fazer parse de FIREBASE_SERVICE_ACCOUNT_KEY:',
        err?.message || 'JSON inválido'
      );
    }
  }

  initializeApp({
    projectId: config.firebase.projectId || 'gen-lang-client-0334927020',
  });
}

initFirebaseAdminApp();

const adminAuth = getAuth();

export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email?: string;
  };
}

export async function authenticateFirebaseUser(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Acesso negado. Token de autenticação não fornecido.',
    });
  }

  const idToken = authHeader.split('Bearer ')[1]?.trim();
  if (!idToken) {
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Acesso negado. Token de autenticação em formato inválido.',
    });
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
    };
    return next();
  } catch (error: any) {
    console.warn('[Auth Middleware] Falha na verificação do token Firebase:', error.message || error);
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Sessão inválida ou expirada. Por favor, faça login novamente.',
    });
  }
}
