export interface AgendaEvent {
  id: string;
  userId: string;
  title: string;
  description?: string;
  date: number;
  type: 'service' | 'visit' | 'reminder' | string;
  recurrence: 'none' | 'daily' | 'weekly' | 'monthly' | string;
  notifyTime: 'none' | 'at_event' | '15_min' | '1_hour' | '24_hours' | string;
  createdAt?: number;
  updatedAt?: number;
}

export interface AgendaEventFormData {
  title: string;
  description: string;
  date: string;
  type: string;
  recurrence: string;
  notifyTime: string;
}

export interface EventToDelete {
  id: string;
  title: string;
}
