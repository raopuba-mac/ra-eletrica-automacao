export interface QuoteItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

export interface QuoteParsedDescription {
  items: QuoteItem[];
  remarks: string;
  photo?: string;
  photos: string[];
  discount: number;
  includesMaterial: boolean;
  applyCashDiscount: boolean;
  hideDetailedPrices: boolean;
}

export interface Quote {
  id: string;
  userId: string;
  clientId: string;
  clientName: string;
  description: string;
  totalAmount: number;
  status: 'pending' | 'approved' | 'rejected' | string;
  createdAt?: number;
  updatedAt?: number;
}

export interface Client {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  [key: string]: any;
}

export interface CalculatorPoint {
  qty: number;
  price: number;
  label: string;
  category: string;
}

export type CalculatorPointsMap = {
  [key: string]: CalculatorPoint;
};

export type PresetType = 'economic' | 'standard' | 'premium';

export interface ToastState {
  show: boolean;
  message: string;
  type: 'success' | 'error';
}
