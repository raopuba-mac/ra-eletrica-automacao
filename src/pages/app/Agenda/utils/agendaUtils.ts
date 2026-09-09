import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function formatEventMonth(timestamp: number): string {
  return format(timestamp, 'MMM', { locale: ptBR });
}

export function formatEventDay(timestamp: number): string {
  return format(timestamp, 'dd', { locale: ptBR });
}

export function formatEventTime(timestamp: number): string {
  return format(timestamp, 'HH:mm');
}

export function getEventTypeLabel(type: string): string {
  switch (type) {
    case 'service':
      return 'Serviço';
    case 'visit':
      return 'Visita';
    case 'reminder':
      return 'Lembrete';
    default:
      return 'Serviço';
  }
}

export function getEventTypeBadgeClass(type: string): string {
  switch (type) {
    case 'service':
      return 'bg-amber-950/80 text-amber-400 border-amber-800';
    case 'visit':
      return 'bg-emerald-950/80 text-emerald-400 border-emerald-800';
    case 'reminder':
    default:
      return 'bg-purple-950/80 text-purple-400 border-purple-800';
  }
}

export function getRecurrenceLabel(recurrence: string): string {
  switch (recurrence) {
    case 'daily':
      return 'Diário';
    case 'weekly':
      return 'Semanal';
    case 'monthly':
      return 'Mensal';
    default:
      return '';
  }
}

export function getNotifyTimeLabel(notifyTime: string): string {
  switch (notifyTime) {
    case 'at_event':
      return 'No Horário';
    case '15_min':
      return '15 Min Antes';
    case '1_hour':
      return '1 Hora Antes';
    case '24_hours':
      return '1 Dia Antes';
    default:
      return '';
  }
}
