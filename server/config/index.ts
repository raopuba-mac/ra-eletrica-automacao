import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to safely read json configuration files from various static paths
function loadJsonFile(filename: string) {
  try {
    const candidates = [
      path.join(process.cwd(), filename),
      path.join(__dirname, filename),
      path.join(__dirname, '..', filename),
      path.join(__dirname, '..', '..', filename),
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) {
        return JSON.parse(fs.readFileSync(p, 'utf8'));
      }
    }
  } catch (err: any) {
    console.warn(`[Config Loader] Warning: Could not load ${filename} from disk:`, err.message);
  }
  return {};
}

const fileFirebaseConfig = loadJsonFile('firebase-applet-config.json');
const fileVapidKeys = loadJsonFile('vapid-keys.json');

export const config = {
  port: 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  isVercel: Boolean(process.env.VERCEL),

  geminiApiKey: process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '',
  viteGeminiApiKey: process.env.VITE_GEMINI_API_KEY || '',

  appUrl: process.env.APP_URL || '',

  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || fileFirebaseConfig.projectId || '',
    appId: process.env.FIREBASE_APP_ID || fileFirebaseConfig.appId || '',
    apiKey: process.env.FIREBASE_API_KEY || fileFirebaseConfig.apiKey || '',
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || fileFirebaseConfig.authDomain || '',
    firestoreDatabaseId: process.env.FIREBASE_FIRESTORE_DATABASE_ID || fileFirebaseConfig.firestoreDatabaseId || '',
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || fileFirebaseConfig.storageBucket || '',
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || fileFirebaseConfig.messagingSenderId || '',
  },

  vapid: {
    publicKey: process.env.VAPID_PUBLIC_KEY || fileVapidKeys.publicKey || '',
    privateKey: process.env.VAPID_PRIVATE_KEY || fileVapidKeys.privateKey || '',
    mailto: process.env.VAPID_MAILTO || 'mailto:raop.uba@gmail.com',
  },

  scheduler: {
    email: process.env.SCHEDULER_EMAIL || 'scheduler@ra-eletrica.com',
    password: process.env.SCHEDULER_PASSWORD || '',
  },
};

export type Config = typeof config;
