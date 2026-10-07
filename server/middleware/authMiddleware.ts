import { Request, Response, NextFunction } from 'express';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { config } from '../config/index.js';

// Initialize firebase-admin app once safely
function getFirebaseAdminAuth() {
  if (getApps().length > 0) {
    return getAuth();
  }

  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (serviceAccountKey) {
    try {
      const serviceAccount = JSON.parse(serviceAccountKey);
      const projectId = serviceAccount.project_id || config.firebase.projectId;
      if (!projectId || !String(projectId).trim()) {
        throw new Error('FIREBASE_PROJECT_ID_MISSING');
      }
      initializeApp({
        credential: cert(serviceAccount),
        projectId,
      });
      return getAuth();
    } catch (err: any) {
      if (err?.message === 'FIREBASE_PROJECT_ID_MISSING') {
        throw err;
      }
      console.error(
        '[Auth Middleware] Erro ao fazer parse de FIREBASE_SERVICE_ACCOUNT_KEY:',
        err?.message || 'JSON inválido'
      );
    }
  }

  if (!config.firebase.projectId || !config.firebase.projectId.trim()) {
    throw new Error('FIREBASE_PROJECT_ID_MISSING');
  }

  initializeApp({
    projectId: config.firebase.projectId,
  });

  return getAuth();
}

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

  let adminAuth;
  try {
    adminAuth = getFirebaseAdminAuth();
  } catch (configErr: any) {
    console.error(
      '[Auth Middleware] Erro de configuração do Firebase Admin (projectId ausente):',
      configErr?.message || configErr
    );
    return res.status(500).json({
      error: 'FIREBASE_CONFIG_MISSING',
      message: 'Configuração do projeto Firebase (projectId) ausente no servidor.',
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
