import webpush from 'web-push';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, getDocs, query, where, doc, setDoc } from 'firebase/firestore';
import { config } from '../config/index.js';

// Initialize Firebase App for server backend services if not already initialized
const firebaseApp = getApps().length > 0 ? getApp() : initializeApp({
  projectId: config.firebase.projectId,
  appId: config.firebase.appId,
  apiKey: config.firebase.apiKey,
  authDomain: config.firebase.authDomain,
  databaseURL: config.firebase.firestoreDatabaseId ? undefined : undefined,
  storageBucket: config.firebase.storageBucket,
  messagingSenderId: config.firebase.messagingSenderId,
});

export const db = getFirestore(firebaseApp, config.firebase.firestoreDatabaseId || undefined);
export const auth = getAuth(firebaseApp);

// Configure VAPID for webpush
if (config.vapid.publicKey && config.vapid.privateKey) {
  webpush.setVapidDetails(
    config.vapid.mailto,
    config.vapid.publicKey,
    config.vapid.privateKey
  );
} else {
  console.error('[Notification Service] VAPID keys missing in configuration.');
}

let isAuthInitialized = false;

export async function ensureAuthenticated(): Promise<boolean> {
  if (isAuthInitialized && auth.currentUser) {
    return true;
  }

  const email = config.scheduler.email;
  const password = config.scheduler.password;

  if (!email || !password) {
    console.error('[Notification Service] SCHEDULER_EMAIL and/or SCHEDULER_PASSWORD environment variables missing.');
    return false;
  }

  try {
    console.log('[Notification Service] Authenticating scheduler account...');
    await signInWithEmailAndPassword(auth, email, password);
    console.log('[Notification Service] Scheduler authentication successful.');
    isAuthInitialized = true;
    return true;
  } catch (error: any) {
    if (error.code === 'auth/operation-not-allowed') {
      console.error(`[Notification Service] Email/Password auth provider is disabled in Firebase console.`);
      return false;
    }

    if (
      error.code === 'auth/user-not-found' ||
      error.code === 'auth/invalid-credential' ||
      error.code === 'auth/invalid-email'
    ) {
      console.log('[Notification Service] Scheduler user not found. Creating account...');
      try {
        await createUserWithEmailAndPassword(auth, email, password);
        console.log('[Notification Service] Scheduler account created successfully.');
        isAuthInitialized = true;
        return true;
      } catch (createError: any) {
        console.error('[Notification Service] Error creating scheduler account:', createError);
        return false;
      }
    } else {
      console.error('[Notification Service] Authentication error:', error);
      return false;
    }
  }
}

export class NotificationService {
  getVapidPublicKey(): string {
    return config.vapid.publicKey;
  }

  async registerSubscription(userId: string, subscription: any): Promise<void> {
    const authenticated = await ensureAuthenticated();
    if (!authenticated) {
      throw new Error('AUTH_METHOD_DISABLED');
    }

    if (!subscription || !subscription.endpoint) {
      throw new Error('INVALID_SUBSCRIPTION');
    }

    const subscriptionHash = Buffer.from(subscription.endpoint)
      .toString('base64')
      .replace(/[^a-zA-Z0-9]/g, '');
    const subDocRef = doc(db, 'push_subscriptions', subscriptionHash);

    await setDoc(subDocRef, {
      userId,
      subscription,
      expired: false,
      createdAt: Date.now(),
    });

    console.log(`[Notification Service] Registered new subscription for user: ${userId}`);
  }

  async sendTestPush(userId: string, title?: string, body?: string): Promise<number> {
    const authenticated = await ensureAuthenticated();
    if (!authenticated) {
      throw new Error('AUTH_METHOD_DISABLED');
    }

    const querySnapshot = await getDocs(
      query(collection(db, 'push_subscriptions'), where('userId', '==', userId))
    );

    if (querySnapshot.empty) {
      throw new Error('NO_SUBSCRIPTIONS_FOUND');
    }

    const payload = JSON.stringify({
      title: title || 'Teste RA Elétrica & Automação',
      body: body || 'Este é um teste de notificação push em tempo real!',
      icon: '/logo.jpg',
      badge: '/favicon.png',
      data: {
        url: '/app/agenda',
      },
    });

    let sentCount = 0;
    for (const d of querySnapshot.docs) {
      const subData = d.data() as any;
      if (subData.subscription && !subData.expired) {
        try {
          await webpush.sendNotification(subData.subscription, payload);
          sentCount++;
        } catch (err: any) {
          console.error(`[Notification Service] Error sending to sub ${d.id}:`, err);
          if (err.statusCode === 410 || err.statusCode === 404) {
            await setDoc(doc(db, 'push_subscriptions', d.id), { ...subData, expired: true });
          }
        }
      }
    }

    return sentCount;
  }

  async sendPushToUser(
    userId: string,
    payloadObj: { title: string; body: string; icon?: string; badge?: string; data?: { url: string } }
  ): Promise<number> {
    const authenticated = await ensureAuthenticated();
    if (!authenticated) {
      return 0;
    }

    const querySnapshot = await getDocs(
      query(collection(db, 'push_subscriptions'), where('userId', '==', userId))
    );

    if (querySnapshot.empty) {
      return 0;
    }

    const payload = JSON.stringify({
      title: payloadObj.title,
      body: payloadObj.body,
      icon: payloadObj.icon || '/logo.jpg',
      badge: payloadObj.badge || '/favicon.png',
      data: payloadObj.data || { url: '/app/agenda' },
    });

    let sentCount = 0;
    for (const d of querySnapshot.docs) {
      const subData = d.data() as any;
      if (subData.subscription && !subData.expired) {
        try {
          await webpush.sendNotification(subData.subscription, payload);
          sentCount++;
        } catch (err: any) {
          console.error(`[Notification Service] Error sending to sub ${d.id}:`, err);
          if (err.statusCode === 410 || err.statusCode === 404) {
            await setDoc(doc(db, 'push_subscriptions', d.id), { ...subData, expired: true });
          }
        }
      }
    }

    return sentCount;
  }
}

export const notificationService = new NotificationService();
