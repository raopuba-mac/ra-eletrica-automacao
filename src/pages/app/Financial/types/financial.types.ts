export type TransactionType = 'income' | 'expense';
export type TransactionOrigin = 'manual' | 'service_order' | 'quote';
export type TransactionStatus = 'pending' | 'paid' | 'canceled';
export type DerivedStatus = 'pending' | 'paid' | 'overdue' | 'canceled';
export type PaymentMethod = 'pix' | 'cash' | 'card' | 'transfer' | 'other';

export interface FinancialTransaction {
  id: string;
  userId: string;
  type: TransactionType;
  origin: TransactionOrigin;
  originId?: string | null;
  clientId?: string | null;
  clientName?: string | null;
  description: string;
  category: string;
  amount: number;
  dueDate: number; // Timestamp in milliseconds
  paymentDate?: number | null; // Timestamp in milliseconds
  status: TransactionStatus;
  paymentMethod?: PaymentMethod | null;
  notes?: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface FinancialFormData {
  clientId: string;
  clientName: string;
  description: string;
  category: string;
  amount: string;
  dueDate: string; // YYYY-MM-DD string format for input
  paymentMethod: PaymentMethod | '';
  notes: string;
}

export interface PaymentFormData {
  paymentDate: string; // YYYY-MM-DD
  paymentMethod: PaymentMethod;
}

export interface FinancialSummary {
  toReceive: number;
  receivedMonth: number;
  overdue: number;
  totalExpected: number;
}

export type FinancialFilterStatus = 'all' | 'pending' | 'paid' | 'overdue' | 'canceled';
