export type LeadStatus = 'new' | 'contacted' | 'converted' | 'archived';

export interface Lead {
  id: string;
  userId?: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  serviceType?: string;
  status: LeadStatus | string;
  createdAt?: number;
  updatedAt?: number;
  [key: string]: any;
}

export interface ToastState {
  show: boolean;
  message: string;
  type: 'success' | 'error';
}
