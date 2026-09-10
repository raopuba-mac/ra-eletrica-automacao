import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import { OperationType, handleFirestoreError } from '../../../../lib/firestoreOps';
import { Service, ServiceFormData } from '../types/service.types';

export const serviceService = {
  subscribeToServices(
    userId: string,
    onSuccess: (services: Service[]) => void
  ): Unsubscribe {
    const q = query(collection(db, 'services'), where('userId', '==', userId));
    return onSnapshot(
      q,
      (snap) => {
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Service[];
        onSuccess(items);
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'services')
    );
  },

  async createService(userId: string, form: ServiceFormData): Promise<void> {
    try {
      await addDoc(collection(db, 'services'), {
        userId,
        name: form.name,
        description: form.description,
        price: Number(form.price) || 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    } catch (err: any) {
      handleFirestoreError(err, OperationType.CREATE, 'services');
      throw err;
    }
  },

  async updateService(id: string, form: ServiceFormData): Promise<void> {
    try {
      await updateDoc(doc(db, 'services', id), {
        name: form.name,
        description: form.description,
        price: Number(form.price) || 0,
        updatedAt: Date.now(),
      });
    } catch (err: any) {
      handleFirestoreError(err, OperationType.UPDATE, 'services');
      throw err;
    }
  },

  async deleteService(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'services', id));
    } catch (err: any) {
      handleFirestoreError(err, OperationType.DELETE, 'services');
      throw err;
    }
  },
};
