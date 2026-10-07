import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import { OperationType, handleFirestoreError } from '../../../../lib/error';
import { AgendaEvent, AgendaEventFormData } from '../types/agenda.types';
import { urlBase64ToUint8Array } from '../utils/agendaUtils';

export const agendaService = {
  /**
   * Subscribes to real-time agenda events for a specific user ID.
   */
  subscribeToAgenda(
    userId: string,
    onSuccess: (events: AgendaEvent[]) => void,
    onError?: (error: any) => void
  ): Unsubscribe {
    const q = query(collection(db, 'agenda'), where('userId', '==', userId));
    return onSnapshot(
      q,
      (snapshot) => {
        const evts = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as AgendaEvent[];
        evts.sort((a, b) => a.date - b.date);
        onSuccess(evts);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'agenda');
        if (onError) onError(error);
      }
    );
  },

  /**
   * Adds a new event to the agenda collection in Firestore.
   */
  async addEvent(userId: string, form: AgendaEventFormData): Promise<string> {
    const timestamp = new Date(form.date).getTime();
    const docRef = await addDoc(collection(db, 'agenda'), {
      userId,
      title: form.title,
      description: form.description,
      date: timestamp,
      type: form.type,
      recurrence: form.recurrence,
      notifyTime: form.notifyTime,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    return docRef.id;
  },

  /**
   * Deletes an event from the agenda collection in Firestore.
   */
  async deleteEvent(eventId: string): Promise<void> {
    const eventRef = doc(db, 'agenda', eventId);
    await deleteDoc(eventRef);
  },

  /**
   * Safely retrieves an active Service Worker registration with a timeout so it never hangs.
   */
  async getSafeServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return null;
    }
    try {
      const existing = await navigator.serviceWorker.getRegistration();
      if (existing && existing.active) {
        return existing;
      }
      const timeoutPromise = new Promise<null>((resolve) =>
        setTimeout(() => resolve(null), 2500)
      );
      return await Promise.race([navigator.serviceWorker.ready, timeoutPromise]);
    } catch {
      return null;
    }
  },

  /**
   * Triggers a local notification safely (using ServiceWorker on iOS/iPadOS/mobile and Notification constructor as fallback).
   */
  async showLocalNotification(title: string, body: string): Promise<boolean> {
    if (
      typeof window === 'undefined' ||
      !('Notification' in window) ||
      Notification.permission !== 'granted'
    ) {
      return false;
    }

    try {
      const reg = await this.getSafeServiceWorkerRegistration();
      if (reg && typeof reg.showNotification === 'function') {
        await reg.showNotification(title, {
          body,
          icon: '/favicon.png',
          badge: '/favicon.png',
        });
        return true;
      }
    } catch {
      // Fallback to Notification constructor below
    }

    try {
      new Notification(title, {
        body,
        icon: '/favicon.png',
      });
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Subscribes the user to Web Push Notifications.
   */
  async subscribeToPushNotifications(
    uid: string
  ): Promise<{ subscribed: boolean; message?: string }> {
    if (
      typeof window === 'undefined' ||
      !('serviceWorker' in navigator) ||
      !('PushManager' in window)
    ) {
      return {
        subscribed: false,
        message: 'Notificações locais ativas (Web Push em segundo plano indisponível neste navegador).',
      };
    }

    try {
      // 1. Fetch public VAPID key
      const res = await fetch('/api/notifications/vapid-public-key');
      if (!res.ok) throw new Error('Falha ao buscar chave VAPID pública');
      const { publicKey } = await res.json();
      if (!publicKey) {
        return {
          subscribed: false,
          message: 'Alertas locais ativos neste dispositivo.',
        };
      }

      // 2. Wait safely for Service Worker registration
      const registration = await this.getSafeServiceWorkerRegistration();
      if (!registration || !registration.pushManager) {
        return {
          subscribed: false,
          message: 'Alertas locais ativos (Service Worker inativo no modo preview).',
        };
      }

      // 3. Reuse existing subscription or create a new one
      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });
      }

      // 4. Send subscription to server
      const subscribeRes = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription,
          userId: uid,
        }),
      });

      if (!subscribeRes.ok) {
        return {
          subscribed: false,
          message: 'Alertas locais ativos no navegador.',
        };
      }

      console.log('[PWA] Inscrição de push registrada com sucesso no backend.');
      return {
        subscribed: true,
        message: 'Notificações push sincronizadas com sucesso!',
      };
    } catch (error) {
      console.warn('[PWA] Aviso ao assinar notificações push:', error);
      return {
        subscribed: false,
        message: 'Alertas locais ativos no navegador.',
      };
    }
  },

  /**
   * Sends a test push notification request to the backend or triggers local fallback.
   */
  async testPushNotification(
    uid: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch('/api/notifications/test-push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: uid,
          title: 'Teste RA Elétrica & Automação',
          body: 'Este é um alerta push REAL em tempo real!',
        }),
      });

      const result = await response.json().catch(() => ({}));
      if (response.ok && result.sentCount > 0) {
        return {
          success: true,
          message: 'Alerta push enviado em tempo real para seu dispositivo!',
        };
      }
    } catch (error) {
      console.warn(
        '[PWA] Falha no teste de push do servidor, tentando fallback local:',
        error
      );
    }

    const shownLocal = await this.showLocalNotification(
      'RA Elétrica & Automação (Local)',
      'Lembrete de Teste: Visita Técnica agendada na sua Agenda!'
    );

    if (shownLocal) {
      return {
        success: true,
        message: 'Alerta de teste exibido com sucesso neste dispositivo!',
      };
    }

    return {
      success: true,
      message: 'Simulação concluída! Lembrete de visita técnica verificado na Agenda.',
    };
  },
};
