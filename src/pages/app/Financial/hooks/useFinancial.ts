import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../../../components/AuthProvider';
import { Client } from '../../Clients/types/client.types';
import { clientService } from '../../Clients/services/clientService';
import {
  FinancialTransaction,
  FinancialFormData,
  PaymentFormData,
  FinancialFilterStatus,
} from '../types/financial.types';
import { financialService } from '../services/financialService';
import {
  calculateFinancialSummary,
  getDerivedStatus,
  isoToTimestamp,
} from '../utils/financialUtils';
import { ToastState } from '../../Clients/types/client.types';

export function useFinancial() {
  const { user } = useAuth();

  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<FinancialFilterStatus>('all');

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<FinancialTransaction | null>(null);

  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payingTransaction, setPayingTransaction] = useState<FinancialTransaction | null>(null);

  const [toast, setToast] = useState<ToastState>({
    show: false,
    message: '',
    type: 'success',
  });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
  };

  // Subscribe to financial transactions & clients
  useEffect(() => {
    if (!user) return;

    setLoading(true);

    const unsubTransactions = financialService.subscribeToTransactions(
      user.uid,
      (data) => {
        setTransactions(data);
        setLoading(false);
      },
      (err) => {
        console.error('Error in financial transactions listener:', err);
        setLoading(false);
      }
    );

    const unsubClients = clientService.subscribeToClients(user.uid, (data) => {
      setClients(data);
    });

    return () => {
      unsubTransactions();
      unsubClients();
    };
  }, [user]);

  // Compute Summary Metrics
  const summary = useMemo(() => {
    return calculateFinancialSummary(transactions);
  }, [transactions]);

  // Status Counts for filter tabs
  const counts = useMemo(() => {
    let all = 0;
    let pending = 0;
    let paid = 0;
    let overdue = 0;
    let canceled = 0;

    for (const t of transactions) {
      all++;
      const derived = getDerivedStatus(t);
      if (derived === 'pending') pending++;
      else if (derived === 'paid') paid++;
      else if (derived === 'overdue') overdue++;
      else if (derived === 'canceled') canceled++;
    }

    return { all, pending, paid, overdue, canceled };
  }, [transactions]);

  // Filtered transactions list
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const derived = getDerivedStatus(t);

      // Status filter
      if (statusFilter !== 'all' && derived !== statusFilter) {
        return false;
      }

      // Search filter
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const descMatch = (t.description || '').toLowerCase().includes(term);
        const clientMatch = (t.clientName || '').toLowerCase().includes(term);
        const catMatch = (t.category || '').toLowerCase().includes(term);
        return descMatch || clientMatch || catMatch;
      }

      return true;
    });
  }, [transactions, statusFilter, searchTerm]);

  // Open modal to create new transaction
  const handleOpenCreateModal = () => {
    setEditingTransaction(null);
    setIsFormModalOpen(true);
  };

  // Open modal to edit existing transaction
  const handleOpenEditModal = (transaction: FinancialTransaction) => {
    setEditingTransaction(transaction);
    setIsFormModalOpen(true);
  };

  // Open pay modal
  const handleOpenPayModal = (transaction: FinancialTransaction) => {
    setPayingTransaction(transaction);
    setIsPayModalOpen(true);
  };

  // Handle Create / Update Form Submission
  const handleFormSubmit = async (formData: FinancialFormData) => {
    if (!user) return;

    const numAmount = parseFloat(formData.amount.replace(',', '.'));
    const dueTimestamp = isoToTimestamp(formData.dueDate);

    if (editingTransaction) {
      await financialService.updateTransaction(editingTransaction.id, {
        clientId: formData.clientId || null,
        clientName: formData.clientName || null,
        description: formData.description,
        category: formData.category,
        amount: numAmount,
        dueDate: dueTimestamp,
        paymentMethod: formData.paymentMethod || null,
        notes: formData.notes || null,
      });
      showToast('Receita atualizada com sucesso!');
    } else {
      await financialService.createTransaction(user.uid, {
        type: 'income',
        origin: 'manual',
        originId: null,
        clientId: formData.clientId || null,
        clientName: formData.clientName || null,
        description: formData.description,
        category: formData.category,
        amount: numAmount,
        dueDate: dueTimestamp,
        status: 'pending',
        paymentMethod: formData.paymentMethod || null,
        notes: formData.notes || null,
      });
      showToast('Nova receita cadastrada com sucesso!');
    }
  };

  // Handle Confirm Payment Submission
  const handleConfirmPay = async (paymentData: PaymentFormData) => {
    if (!payingTransaction) return;

    const payTimestamp = isoToTimestamp(paymentData.paymentDate);

    await financialService.markAsPaid(
      payingTransaction.id,
      payTimestamp,
      paymentData.paymentMethod
    );

    showToast('Pagamento confirmado e registrado!');
  };

  // Handle Cancel Transaction
  const handleCancelTransaction = async (transaction: FinancialTransaction) => {
    if (
      window.confirm(
        `Deseja realmente cancelar o lançamento "${transaction.description}"?`
      )
    ) {
      try {
        await financialService.cancelTransaction(transaction.id);
        showToast('Lançamento cancelado.');
      } catch (err: any) {
        console.error('Error canceling transaction:', err);
        showToast('Erro ao cancelar lançamento.', 'error');
      }
    }
  };

  return {
    user,
    loading,
    transactions,
    filteredTransactions,
    clients,
    summary,
    counts,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    isFormModalOpen,
    setIsFormModalOpen,
    editingTransaction,
    isPayModalOpen,
    setIsPayModalOpen,
    payingTransaction,
    toast,
    setToast,
    handleOpenCreateModal,
    handleOpenEditModal,
    handleOpenPayModal,
    handleFormSubmit,
    handleConfirmPay,
    handleCancelTransaction,
  };
}
