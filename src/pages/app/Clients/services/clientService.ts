import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import { OperationType, handleFirestoreError } from '../../../../lib/error';
import {
  Client,
  ClientFormData,
  ClientQuoteHistory,
  ClientOrderHistory,
} from '../types/client.types';

export const clientService = {
  /**
   * Subscribes to the real-time clients collection for a given user ID.
   */
  subscribeToClients(
    userId: string,
    onSuccess: (clients: Client[]) => void,
    onError?: (error: any) => void
  ): Unsubscribe {
    const q = query(collection(db, 'clients'), where('userId', '==', userId));
    return onSnapshot(
      q,
      (snapshot) => {
        const clients = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Client[];
        onSuccess(clients);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'clients');
        if (onError) onError(error);
      }
    );
  },

  /**
   * Adds a new client to Firestore.
   */
  async addClient(userId: string, form: ClientFormData): Promise<string> {
    const docRef = await addDoc(collection(db, 'clients'), {
      userId,
      ...form,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    return docRef.id;
  },

  /**
   * Updates an existing client in Firestore.
   */
  async updateClient(clientId: string, form: ClientFormData): Promise<void> {
    const clientRef = doc(db, 'clients', clientId);
    await updateDoc(clientRef, {
      ...form,
      updatedAt: Date.now(),
    });
  },

  /**
   * Deletes a client from Firestore.
   */
  async deleteClient(clientId: string): Promise<void> {
    const clientRef = doc(db, 'clients', clientId);
    await deleteDoc(clientRef);
  },

  /**
   * Subscribes to real-time quotes history for a specific client.
   */
  subscribeToClientQuotes(
    userId: string,
    clientId: string,
    onSuccess: (quotes: ClientQuoteHistory[]) => void
  ): Unsubscribe {
    const q = query(
      collection(db, 'quotes'),
      where('userId', '==', userId),
      where('clientId', '==', clientId)
    );
    return onSnapshot(
      q,
      (snapshot) => {
        const quotes = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as ClientQuoteHistory[];
        onSuccess(quotes);
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'quotes')
    );
  },

  /**
   * Subscribes to real-time service orders history for a specific client.
   */
  subscribeToClientOrders(
    userId: string,
    clientId: string,
    onSuccess: (orders: ClientOrderHistory[]) => void
  ): Unsubscribe {
    const q = query(
      collection(db, 'serviceOrders'),
      where('userId', '==', userId),
      where('clientId', '==', clientId)
    );
    return onSnapshot(
      q,
      (snapshot) => {
        const orders = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as ClientOrderHistory[];
        onSuccess(orders);
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'serviceOrders')
    );
  },
};
