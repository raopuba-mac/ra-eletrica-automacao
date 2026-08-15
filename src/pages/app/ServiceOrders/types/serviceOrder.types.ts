export type ServiceOrderStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export interface ServiceOrder {
  id: string;
  userId: string;
  clientId: string;
  description: string;
  status: ServiceOrderStatus;
  scheduledDate?: string;
  scheduledTime?: string;
  finalPrice?: string;
  photos?: string[];
  photosAfter?: string[];
  createdAt?: number;
  updatedAt?: number;
  signature?: string;
  shareToken?: string;
}

export interface Client {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  [key: string]: any;
}

export interface ServiceOrderFormData {
  clientId: string;
  description: string;
  status: ServiceOrderStatus;
  scheduledDate: string;
  scheduledTime: string;
  finalPrice: string;
}

export interface ServiceOrderFilterState {
  searchTerm: string;
  statusFilter: string;
}
