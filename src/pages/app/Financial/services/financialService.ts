import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import {
  FinancialTransaction,
  PaymentMethod,
  TransactionOrigin,
} from '../types/financial.types';

const COLLECTION_NAME = 'financial_transactions';

export const financialService = {
  /**
   * Listen to real-time updates for financial transactions belonging to user.
   */
  subscribeToTransactions(
    userId: string,
    onSuccess: (transactions: FinancialTransaction[]) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    if (!userId) {
      onSuccess([]);
      return () => {};
    }

    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId)
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const list: FinancialTransaction[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            userId: data.userId,
            type: data.type || 'income',
            origin: data.origin || 'manual',
            originId: data.originId || null,
            clientId: data.clientId || null,
            clientName: data.clientName || null,
            description: data.description || '',
            category: data.category || 'Geral',
            amount: Number(data.amount) || 0,
            dueDate: Number(data.dueDate) || Date.now(),
            paymentDate: data.paymentDate ? Number(data.paymentDate) : null,
            status: data.status || 'pending',
            paymentMethod: data.paymentMethod || null,
            notes: data.notes || null,
            createdAt: Number(data.createdAt) || Date.now(),
            updatedAt: Number(data.updatedAt) || Date.now(),
          };
        });

        // Client-side sort by dueDate ascending for upcoming payments, then createdAt descending
        list.sort((a, b) => {
          if (a.status === 'pending' && b.status !== 'pending') return -1;
          if (a.status !== 'pending' && b.status === 'pending') return 1;
          return b.dueDate - a.dueDate;
        });

        onSuccess(list);
      },
      (error) => {
        console.error('Error listening to financial transactions:', error);
        if (onError) onError(error);
      }
    );
  },

  /**
   * Create a new manual financial transaction.
   */
  async createTransaction(
    userId: string,
    data: Omit<FinancialTransaction, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    const now = Date.now();
    const payload = {
      userId,
      type: data.type || 'income',
      origin: data.origin || 'manual',
      originId: data.originId || null,
      clientId: data.clientId || null,
      clientName: data.clientName || null,
      description: data.description,
      category: data.category || 'Outros Serviços',
      amount: Number(data.amount),
      dueDate: Number(data.dueDate),
      paymentDate: data.paymentDate ? Number(data.paymentDate) : null,
      status: data.status || 'pending',
      paymentMethod: data.paymentMethod || null,
      notes: data.notes || null,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await addDoc(collection(db, COLLECTION_NAME), payload);
    return docRef.id;
  },

  /**
   * Update an existing transaction.
   */
  async updateTransaction(
    id: string,
    data: Partial<Omit<FinancialTransaction, 'id' | 'userId' | 'createdAt'>>
  ): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    const payload: any = {
      updatedAt: Date.now(),
    };

    if (data.description !== undefined) payload.description = data.description;
    if (data.category !== undefined) payload.category = data.category;
    if (data.amount !== undefined) payload.amount = Number(data.amount);
    if (data.dueDate !== undefined) payload.dueDate = Number(data.dueDate);
    if (data.clientId !== undefined) payload.clientId = data.clientId;
    if (data.clientName !== undefined) payload.clientName = data.clientName;
    if (data.paymentMethod !== undefined) payload.paymentMethod = data.paymentMethod;
    if (data.notes !== undefined) payload.notes = data.notes;
    if (data.status !== undefined) payload.status = data.status;
    if (data.paymentDate !== undefined)
      payload.paymentDate = data.paymentDate ? Number(data.paymentDate) : null;

    await updateDoc(docRef, payload);
  },

  /**
   * Register explicit payment confirmation for a transaction.
   */
  async markAsPaid(
    id: string,
    paymentDateMs: number,
    paymentMethod: PaymentMethod
  ): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      status: 'paid',
      paymentDate: paymentDateMs,
      paymentMethod,
      updatedAt: Date.now(),
    });
  },

  /**
   * Mark a transaction as canceled.
   */
  async cancelTransaction(id: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      status: 'canceled',
      updatedAt: Date.now(),
    });
  },

  /**
   * Permanently delete a transaction.
   */
  async deleteTransaction(id: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  },

  /**
   * Query an existing transaction by origin and originId for antiduplicity check.
   */
  async findTransactionByOrigin(
    userId: string,
    origin: TransactionOrigin,
    originId: string
  ): Promise<FinancialTransaction | null> {
    if (!userId || !originId) return null;

    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId),
      where('origin', '==', origin),
      where('originId', '==', originId)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;

    const docs = snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        userId: data.userId,
        type: data.type || 'income',
        origin: data.origin || 'manual',
        originId: data.originId || null,
        clientId: data.clientId || null,
        clientName: data.clientName || null,
        description: data.description || '',
        category: data.category || 'Geral',
        amount: Number(data.amount) || 0,
        dueDate: Number(data.dueDate) || Date.now(),
        paymentDate: data.paymentDate ? Number(data.paymentDate) : null,
        status: data.status || 'pending',
        paymentMethod: data.paymentMethod || null,
        notes: data.notes || null,
        createdAt: Number(data.createdAt) || Date.now(),
        updatedAt: Number(data.updatedAt) || Date.now(),
      } as FinancialTransaction;
    });

    const active = docs.find((d) => d.status !== 'canceled');
    return active || docs[0] || null;
  },
};
