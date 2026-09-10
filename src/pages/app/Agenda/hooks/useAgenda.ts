import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../components/AuthProvider';
import { handleFirestoreError, OperationType } from '../../../../lib/firestoreOps';
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

  // Check notification permission on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  // Auto-subscribe to push notifications when permission is granted
  useEffect(() => {
    if (user && notificationPermission === 'granted') {
      agendaService.subscribeToPushNotifications(user.uid);
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
      alert('Seu navegador não oferece suporte a notificações push de navegador.');
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === 'granted' && user) {
        await agendaService.subscribeToPushNotifications(user.uid);
        new Notification('RA Elétrica & Automação', {
          body: 'Ótimo! Notificações push ativadas para sua agenda de visitas técnicas.',
          icon: '/favicon.png',
        });
      }
    } catch (error) {
      console.error('Error requesting notifications permission:', error);
    }
  };

  const testPushNotification = async () => {
    if (!user) return;
    await agendaService.testPushNotification(user.uid);
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
    requestNotificationPermission,
    testPushNotification,
    resetForm,
    handleSubmit,
    confirmDelete,
  };
}
