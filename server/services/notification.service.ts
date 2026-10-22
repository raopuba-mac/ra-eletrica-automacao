import webpush from 'web-push';
import { createHash } from 'node:crypto';
import { config } from '../config/index.js';
import { getServerApp, getServerDb } from './adminFirebase.js';

const vapidReady = Boolean(config.vapid.publicKey && config.vapid.privateKey);
if (vapidReady) {
  webpush.setVapidDetails(config.vapid.mailto, config.vapid.publicKey, config.vapid.privateKey);
} else {
  console.error('[Push] VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY ausentes.');
}

// Não usa Firebase Web Auth no servidor; usa conta de serviço via Firebase Admin.
export async function ensureAuthenticated(): Promise<boolean> {
  try {
    getServerApp();
    getServerDb();
    return true;
  } catch (err: any) {
    console.error('[Push] Erro Firebase Admin:', err?.code || err?.message || 'CONFIG_ERROR');
    return false;
  }
}

type PushPayload = { title: string; body: string; icon?: string; badge?: string; data?: { url: string } };

export class NotificationService {
  getVapidPublicKey() {
    return config.vapid.publicKey;
  }

  async registerSubscription(userId: string, subscription: any): Promise<void> {
    if (!userId || typeof userId !== 'string' || userId.length > 128 ||
      !subscription || typeof subscription.endpoint !== 'string' ||
      !subscription.endpoint.startsWith('https://') || subscription.endpoint.length > 2048 ||
      !subscription.keys || typeof subscription.keys.p256dh !== 'string' ||
      typeof subscription.keys.auth !== 'string') {
      throw new Error('INVALID_SUBSCRIPTION');
    }
    const endpointHash = createHash('sha256').update(subscription.endpoint).digest('hex');
    await getServerDb().collection('push_subscriptions').doc(endpointHash).set({
      userId,
      subscription: {
        endpoint: subscription.endpoint,
        expirationTime: subscription.expirationTime ?? null,
        keys: { p256dh: subscription.keys.p256dh, auth: subscription.keys.auth },
      },
      expired: false,
      createdAt: Date.now(),
    });
  }

  async sendTestPush(userId: string, title?: string, body?: string): Promise<number> {
    return this.sendPushToUser(userId, {
      title: title || 'Teste RA Elétrica & Automação',
      body: body || 'Teste de Web Push enviado pelo servidor.',
      data: { url: '/app/agenda' },
    });
  }

  async sendPushToUser(userId: string, payloadObj: PushPayload): Promise<number> {
    if (!vapidReady) throw new Error('VAPID_NOT_CONFIGURED');
    const snapshot = await getServerDb().collection('push_subscriptions')
      .where('userId', '==', userId).get();
    if (snapshot.empty) return 0;

    const payload = JSON.stringify({
      title: payloadObj.title,
      body: payloadObj.body,
      icon: payloadObj.icon || '/logo.jpg',
      badge: payloadObj.badge || '/favicon.png',
      data: payloadObj.data || { url: '/app/agenda' },
    });
    let sent = 0;
    const seenEndpoints = new Set<string>();
    for (const entry of snapshot.docs) {
      const item = entry.data();
      const sub = item.subscription;
      if (item.expired || !sub?.endpoint || seenEndpoints.has(sub.endpoint)) continue;
      seenEndpoints.add(sub.endpoint);
      try {
        await webpush.sendNotification(sub, payload);
        sent++;
      } catch (err: any) {
        console.warn('[Push] Falha no endpoint:', err?.statusCode || 'NETWORK_ERROR');
        if (err?.statusCode === 410 || err?.statusCode === 404) {
          await entry.ref.update({ expired: true });
        }
      }
    }
    return sent;
  }
}

export const notificationService = new NotificationService();
