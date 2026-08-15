export interface Service {
  id: string;
  userId?: string;
  name: string;
  description?: string;
  price?: number;
  createdAt?: number;
  updatedAt?: number;
  [key: string]: any;
}

export interface ServiceFormData {
  name: string;
  description: string;
  price: string;
}

export interface ToastState {
  show: boolean;
  message: string;
  type: 'success' | 'error';
}
