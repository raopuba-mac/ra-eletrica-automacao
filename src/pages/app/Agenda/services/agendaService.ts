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
   * Subscribes the user to Web Push Notifications.
   */
  async subscribeToPushNotifications(uid: string): Promise<void> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Navegador não suporta Service Worker ou Push Manager.');
      return;
    }

    try {
      // 1. Fetch public VAPID key
      const res = await fetch('/api/notifications/vapid-public-key');
      if (!res.ok) throw new Error('Falha ao buscar chave VAPID pública');
      const { publicKey } = await res.json();
      if (!publicKey) {
        throw new Error('Não foi possível carregar a chave VAPID pública.');
      }

      // 2. Wait for Service Worker registration to be ready
      const registration = await navigator.serviceWorker.ready;

      // 3. Subscribe user to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

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
        throw new Error('Falha ao registrar inscrição de push no servidor.');
      }

      console.log('[PWA] Inscrição de push registrada com sucesso no backend.');
    } catch (error) {
      console.error('[PWA] Erro ao assinar notificações push:', error);
    }
  },

  /**
   * Sends a test push notification request to the backend or triggers local fallback.
   */
  async testPushNotification(uid: string): Promise<void> {
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

      const result = await response.json();
      if (response.ok && result.sentCount > 0) {
        console.log(
          `[PWA] Teste de push enviado com sucesso para ${result.sentCount} dispositivo(s).`
        );
        return;
      }
    } catch (error) {
      console.warn(
        '[PWA] Falha no teste de push do servidor, tentando fallback local:',
        error
      );
    }

    if (
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'granted'
    ) {
      new Notification('RA Elétrica & Automação (Local)', {
        body: 'Lembrete de Teste (Local): Visita Técnica agendada para Renan Augusto!',
        icon: '/favicon.png',
      });
    } else {
      alert(
        'Notificações de navegador desativadas ou bloqueadas pelo iframe. Lembrete Simulado com Sucesso: Visita Técnica Importante na agenda de Renan!'
      );
    }
  },
};
