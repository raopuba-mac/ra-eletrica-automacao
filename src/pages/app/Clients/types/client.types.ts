export interface Client {
  id: string;
  userId: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  createdAt?: number;
  updatedAt?: number;
}

export interface ClientFormData {
  name: string;
  phone: string;
  email: string;
  address: string;
}

export interface ToastState {
  show: boolean;
  message: string;
  type: 'success' | 'error';
}

export interface ClientQuoteHistory {
  id: string;
  description: string;
  status: 'approved' | 'rejected' | 'pending' | string;
  totalAmount: number;
  createdAt: number;
}

export interface ClientOrderHistory {
  id: string;
  description: string;
  status: 'completed' | 'in_progress' | 'scheduled' | string;
  createdAt: number;
}
