import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  limit,
  addDoc,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import { OperationType, handleFirestoreError } from '../../../../lib/error';
import {
  DashboardClient,
  DashboardUpcomingEvent,
  DashboardFinishedOrder,
  QuickIntakeFormData,
} from '../types/dashboard.types';
import { format } from 'date-fns';

export const dashboardService = {
  subscribeToClients(
    userId: string,
    onSuccess: (clients: DashboardClient[], count: number) => void
  ): Unsubscribe {
    const q = query(collection(db, 'clients'), where('userId', '==', userId));
    return onSnapshot(
      q,
      (snap) => {
        const clientData = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as DashboardClient[];
        onSuccess(clientData, snap.size);
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'clients')
    );
  },

  subscribeToOrdersCount(
    userId: string,
    onSuccess: (count: number) => void
  ): Unsubscribe {
    const q = query(collection(db, 'serviceOrders'), where('userId', '==', userId));
    return onSnapshot(
      q,
      (snap) => onSuccess(snap.size),
      (err) => handleFirestoreError(err, OperationType.GET, 'serviceOrders')
    );
  },

  subscribeToFinishedOrders(
    userId: string,
    onSuccess: (orders: DashboardFinishedOrder[]) => void
  ): Unsubscribe {
    const q = query(
      collection(db, 'serviceOrders'),
      where('userId', '==', userId),
      where('status', '==', 'completed'),
      orderBy('updatedAt', 'desc'),
      limit(4)
    );
    return onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as DashboardFinishedOrder[];
        onSuccess(data);
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'serviceOrders')
    );
  },

  subscribeToAllLeads(
    userId: string,
    onSuccess: (leads: any[]) => void
  ): Unsubscribe {
    const q = query(collection(db, 'leads'), where('userId', '==', userId));
    return onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        onSuccess(data);
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'leads')
    );
  },

  subscribeToAllQuotes(
    userId: string,
    onSuccess: (quotes: any[]) => void
  ): Unsubscribe {
    const q = query(collection(db, 'quotes'), where('userId', '==', userId));
    return onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        onSuccess(data);
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'quotes')
    );
  },

  subscribeToPendingQuotesCount(
    userId: string,
    onSuccess: (count: number) => void
  ): Unsubscribe {
    const q = query(
      collection(db, 'quotes'),
      where('userId', '==', userId),
      where('status', '==', 'pending')
    );
    return onSnapshot(
      q,
      (snap) => onSuccess(snap.size),
      (err) => handleFirestoreError(err, OperationType.GET, 'quotes')
    );
  },

  subscribeToPendingLeads(
    userId: string,
    onSuccess: (leads: any[]) => void
  ): Unsubscribe {
    const q = query(collection(db, 'leads'), where('userId', '==', userId));
    return onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        data.sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));
        onSuccess(data.slice(0, 5));
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'leads')
    );
  },

  subscribeToPendingQuotesList(
    userId: string,
    onSuccess: (quotes: any[]) => void
  ): Unsubscribe {
    const q = query(
      collection(db, 'quotes'),
      where('userId', '==', userId),
      where('status', '==', 'pending')
    );
    return onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        data.sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));
        onSuccess(data.slice(0, 5));
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'quotes')
    );
  },

  subscribeToActiveOrdersList(
    userId: string,
    onSuccess: (orders: any[]) => void
  ): Unsubscribe {
    const q = query(collection(db, 'serviceOrders'), where('userId', '==', userId));
    return onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        data.sort((a: any, b: any) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));
        onSuccess(data.slice(0, 5));
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'serviceOrders')
    );
  },

  subscribeToUpcomingEvents(
    userId: string,
    onSuccess: (events: DashboardUpcomingEvent[]) => void
  ): Unsubscribe {
    const q = query(
      collection(db, 'agenda'),
      where('userId', '==', userId),
      orderBy('date', 'asc'),
      limit(5)
    );
    return onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as DashboardUpcomingEvent[];
        onSuccess(data);
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'agenda')
    );
  },

  async createQuickIntake(
    userId: string,
    formData: QuickIntakeFormData
  ): Promise<{ type: 'os' | 'quote' }> {
    // 1. Create client
    const clientRef = await addDoc(collection(db, 'clients'), {
      userId,
      name: formData.quickClientName,
      phone: formData.quickClientPhone || '',
      email: '',
      address: formData.quickClientAddress || '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    const clientId = clientRef.id;

    if (formData.quickType === 'os') {
      // 2a. Create Service Order (OS)
      await addDoc(collection(db, 'serviceOrders'), {
        userId,
        clientId,
        description: formData.quickDescription,
        status: 'scheduled',
        scheduledDate: format(new Date(), 'yyyy-MM-dd'),
        scheduledTime: format(new Date(), 'HH:mm'),
        finalPrice: '',
        photos: [],
        photosAfter: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      return { type: 'os' };
    } else {
      // 2b. Create Quote / Budget
      const serializedDescription = JSON.stringify({
        items: [{ id: '1', name: formData.quickDescription, quantity: 1, price: 0 }],
        remarks: 'Gerado via Atendimento Rápido no Smartphone',
        photo: '',
        photos: [],
        discount: 0,
        includesMaterial: false,
        applyCashDiscount: false,
      });

      await addDoc(collection(db, 'quotes'), {
        userId,
        clientId,
        clientName: formData.quickClientName,
        description: serializedDescription,
        totalAmount: 0,
        status: 'pending',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      return { type: 'quote' };
    }
  },
};
