import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import { useAuth } from '../../../../components/AuthProvider';
import { OperationType, handleFirestoreError } from '../../../../lib/error';
import { ServiceOrder, Client, ServiceOrderFormData } from '../types/serviceOrder.types';
import { FinancialTransaction, PaymentFormData } from '../../Financial/types/financial.types';
import { financialService } from '../../Financial/services/financialService';
import { isoToTimestamp } from '../../Financial/utils/financialUtils';
import { GenerateOSReceivableFormData } from '../components/GenerateOSReceivableModal';

export function useServiceOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [financialTransactions, setFinancialTransactions] = useState<FinancialTransaction[]>([]);

  useEffect(() => {
    if (!user) return;
    const unsubOrders = onSnapshot(
      query(collection(db, 'serviceOrders'), where('userId', '==', user.uid)),
      (snap) => {
        const sorted = snap.docs
          .map(d => ({ id: d.id, ...d.data() } as ServiceOrder))
          .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setOrders(sorted);
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'serviceOrders')
    );

    const unsubClients = onSnapshot(
      query(collection(db, 'clients'), where('userId', '==', user.uid)),
      (snap) => {
        setClients(snap.docs.map(d => ({ id: d.id, ...d.data() } as Client)));
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'clients')
    );

    const unsubFinancial = financialService.subscribeToTransactions(
      user.uid,
      (txs) => {
        setFinancialTransactions(txs);
      }
    );

    return () => {
      unsubOrders();
      unsubClients();
      unsubFinancial();
    };
  }, [user]);

  const saveServiceOrder = async (
    editingOrder: ServiceOrder | null,
    formData: ServiceOrderFormData,
    photos: string[],
    photosAfter: string[]
  ) => {
    if (!user) return;
    try {
      const shareToken = editingOrder?.shareToken || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36));
      const data = {
        userId: user.uid,
        clientId: formData.clientId,
        description: formData.description,
        status: formData.status,
        scheduledDate: formData.scheduledDate,
        scheduledTime: formData.scheduledTime,
        finalPrice: formData.finalPrice || '',
        photos,
        photosAfter,
        shareToken,
        updatedAt: Date.now()
      };

      if (editingOrder) {
        await updateDoc(doc(db, 'serviceOrders', editingOrder.id), data);
      } else {
        await addDoc(collection(db, 'serviceOrders'), { ...data, createdAt: Date.now() });
      }
    } catch(err) {
      handleFirestoreError(err, editingOrder ? OperationType.UPDATE : OperationType.CREATE, 'serviceOrders');
      throw err;
    }
  };

  const deleteServiceOrder = async (orderId: string) => {
    try {
      await deleteDoc(doc(db, 'serviceOrders', orderId));
    } catch(err) {
      handleFirestoreError(err, OperationType.DELETE, `serviceOrders/${orderId}`);
      throw err;
    }
  };

  /**
   * Helper to find linked financial transaction for an OS.
   * Prefers active (non-canceled) transaction.
   */
  const getLinkedFinancialTransaction = (osId: string): FinancialTransaction | undefined => {
    const list = financialTransactions.filter(
      (t) => t.origin === 'service_order' && t.originId === osId
    );
    const active = list.find((t) => t.status !== 'canceled');
    return active || list[0];
  };

  /**
   * Create account receivable linked to OS with antiduplicity protection.
   */
  const createOSReceivable = async (
    order: ServiceOrder,
    formData: GenerateOSReceivableFormData
  ) => {
    if (!user) throw new Error('Usuário não autenticado.');

    // 1. Client-side check
    const existingInState = getLinkedFinancialTransaction(order.id);
    if (existingInState && existingInState.status !== 'canceled') {
      throw new Error('Esta Ordem de Serviço já possui um lançamento financeiro vinculado.');
    }

    // 2. Firestore query check
    const existingInDb = await financialService.findTransactionByOrigin(
      user.uid,
      'service_order',
      order.id
    );
    if (existingInDb && existingInDb.status !== 'canceled') {
      throw new Error('Esta Ordem de Serviço já possui um lançamento financeiro vinculado.');
    }

    const clientObj = clients.find((c) => c.id === order.clientId);
    const clientName = clientObj ? clientObj.name : null;
    const amountNum = parseFloat(formData.amount.replace(',', '.'));
    const dueDateMs = isoToTimestamp(formData.dueDate);

    await financialService.createTransaction(user.uid, {
      type: 'income',
      origin: 'service_order',
      originId: order.id,
      clientId: order.clientId || null,
      clientName: clientName,
      description: formData.description.trim(),
      category: formData.category || 'Instalação Elétrica',
      amount: amountNum,
      dueDate: dueDateMs,
      paymentDate: null,
      status: 'pending',
      paymentMethod: formData.paymentMethod || null,
      notes: formData.notes ? formData.notes.trim() : null,
    });
  };

  /**
   * Register payment for financial transaction linked to OS.
   */
  const registerPaymentForOS = async (
    transactionId: string,
    paymentData: PaymentFormData
  ) => {
    const dateMs = isoToTimestamp(paymentData.paymentDate);
    await financialService.markAsPaid(transactionId, dateMs, paymentData.paymentMethod);
  };

  return {
    user,
    orders,
    clients,
    financialTransactions,
    saveServiceOrder,
    deleteServiceOrder,
    getLinkedFinancialTransaction,
    createOSReceivable,
    registerPaymentForOS,
  };
}
