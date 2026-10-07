import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../components/AuthProvider';
import { handleFirestoreError, OperationType } from '../../../../lib/error';
import { agendaService } from '../services/agendaService';
import { AgendaEvent, AgendaEventFormData, EventToDelete } from '../types/agenda.types';

const INITIAL_FORM: AgendaEventFormData = {
  title: '',
  description: '',
  date: '',
  type: 'service',
  recurrence: 'none',
  notifyTime: 'none',
};

export function useAgenda() {
  const { user } = useAuth();
  const [events, setEvents] = useState<AgendaEvent[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<EventToDelete | null>(null);
  const [form, setForm] = useState<AgendaEventFormData>(INITIAL_FORM);
  const [notificationPermission, setNotificationPermission] = useState<string>('default');
  const [isIosNonPwa, setIsIosNonPwa] = useState<boolean>(false);
  const [pushStatusMessage, setPushStatusMessage] = useState<{
    type: 'success' | 'info' | 'warning' | 'error';
    text: string;
  } | null>(null);

  // Check notification support and permission on mount (without requesting automatically)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const ua = window.navigator.userAgent || '';
    const isIosDevice =
      /iPad|iPhone|iPod/i.test(ua) ||
      (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);
    const isStandalone =
      window.matchMedia?.('(display-mode: standalone)').matches ||
      Boolean((window.navigator as any).standalone);

    if (isIosDevice && !isStandalone) {
      setIsIosNonPwa(true);
    }

    if (!('Notification' in window)) {
      setNotificationPermission('unsupported');
      return;
    }

    setNotificationPermission(Notification.permission);
  }, []);

  // Auto-subscribe to push notifications only when permission is already granted
  useEffect(() => {
    if (user && notificationPermission === 'granted') {
      agendaService.subscribeToPushNotifications(user.uid).catch(() => {});
    }
  }, [user, notificationPermission]);

  // Subscribe to real-time Firestore agenda events
  useEffect(() => {
    if (!user) return;
    const unsub = agendaService.subscribeToAgenda(user.uid, (data) => {
      setEvents(data);
    });
    return () => unsub();
  }, [user]);

  const requestNotificationPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setNotificationPermission('unsupported');
      setPushStatusMessage({
        type: 'warning',
        text: isIosNonPwa
          ? 'No iPad/iPhone (Safari), adicione o app à Tela de Início (PWA) para ativar notificações push.'
          : 'Este navegador não oferece suporte a notificações push.',
      });
      return;
    }

    if (Notification.permission === 'denied') {
      setNotificationPermission('denied');
      setPushStatusMessage({
        type: 'warning',
        text: 'As notificações estão bloqueadas nas configurações do navegador. Libere a permissão nas configurações do site.',
      });
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);

      if (permission === 'granted') {
        if (user) {
          const subResult = await agendaService.subscribeToPushNotifications(user.uid);
          setPushStatusMessage({
            type: 'success',
            text:
              subResult.message ||
              'Notificações ativadas com sucesso para sua agenda!',
          });
        }
        await agendaService.showLocalNotification(
          'RA Elétrica & Automação',
          'Ótimo! Notificações ativadas para sua agenda de visitas técnicas.'
        );
      } else if (permission === 'denied') {
        setPushStatusMessage({
          type: 'warning',
          text: 'Permissão negada. Para ativar, libere as notificações nas configurações do seu navegador.',
        });
      } else {
        setPushStatusMessage({
          type: 'info',
          text: 'Solicitação fechada sem confirmação. Clique novamente quando desejar ativar.',
        });
      }
    } catch (error) {
      console.error('Error requesting notifications permission:', error);
      setPushStatusMessage({
        type: 'error',
        text: 'Não foi possível solicitar permissão de notificação neste ambiente.',
      });
    }
  };

  const testPushNotification = async () => {
    if (!user) return;
    const res = await agendaService.testPushNotification(user.uid);
    setPushStatusMessage({
      type: res.success ? 'success' : 'warning',
      text: res.message,
    });
  };

  const resetForm = () => {
    setForm(INITIAL_FORM);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsDialogOpen(false);
    try {
      await agendaService.addEvent(user.uid, form);
      resetForm();
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'agenda');
    }
  };

  const confirmDelete = async () => {
    if (!eventToDelete) return;
    try {
      await agendaService.deleteEvent(eventToDelete.id);
      setEventToDelete(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'agenda');
    }
  };

  return {
    user,
    events,
    isDialogOpen,
    setIsDialogOpen,
    eventToDelete,
    setEventToDelete,
    form,
    setForm,
    notificationPermission,
    isIosNonPwa,
    pushStatusMessage,
    requestNotificationPermission,
    testPushNotification,
    resetForm,
    handleSubmit,
    confirmDelete,
  };
}
