import { cert, getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { config } from '../config/index.js';

// Uso exclusivamente no backend; nunca importar no navegador.
// Inicialização adiada para evitar travar outras APIs durante o boot.
export function getServerApp() {
  if (getApps().length > 0) return getApp();

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY_MISSING');

  let serviceAccount: any;
  try {
    serviceAccount = JSON.parse(raw);
  } catch {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY_INVALID_JSON');
  }

  if (!serviceAccount.project_id || !serviceAccount.client_email || !serviceAccount.private_key) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY_INCOMPLETE');
  }
  if (config.firebase.projectId && serviceAccount.project_id !== config.firebase.projectId) {
    throw new Error('FIREBASE_PROJECT_MISMATCH');
  }

  return initializeApp({
    credential: cert(serviceAccount),
    projectId: serviceAccount.project_id,
  });
}

export function getServerAuth() {
  return getAuth(getServerApp());
}

export function getServerDb() {
  const app = getServerApp();
  return config.firebase.firestoreDatabaseId
    ? getFirestore(app, config.firebase.firestoreDatabaseId)
    : getFirestore(app);
}
