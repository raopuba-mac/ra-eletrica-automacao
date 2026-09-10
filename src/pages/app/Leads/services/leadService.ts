import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  setDoc,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import { OperationType, handleFirestoreError } from '../../../../lib/firestoreOps';
import { Lead } from '../types/lead.types';

export const leadService = {
  subscribeToLeads(
    userId: string,
    onSuccess: (leads: Lead[]) => void,
    onError: () => void
  ): Unsubscribe {
    const q = query(collection(db, 'leads'), where('userId', '==', userId));
    return onSnapshot(
      q,
      (snap) => {
        const lds = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Lead[];
        lds.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        onSuccess(lds);
      },
      (err) => {
        handleFirestoreError(err, OperationType.GET, 'leads');
        onError();
      }
    );
  },

  async updateLeadStatus(id: string, status: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'leads', id), { status, updatedAt: Date.now() });
    } catch (err: any) {
      handleFirestoreError(err, OperationType.UPDATE, 'leads');
      throw err;
    }
  },

  async convertLeadToClient(userId: string, lead: Lead): Promise<void> {
    try {
      const clientId = doc(collection(db, 'clients')).id;
      const clientData = {
        userId,
        name: lead.name,
        phone: lead.phone || '',
        email: lead.email || '',
        address: lead.address || '',
        notes: `Convertido de lead do site. Serviço solicitado: ${lead.serviceType || 'Nenhum'}`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await setDoc(doc(db, 'clients', clientId), clientData);
      await updateDoc(doc(db, 'leads', lead.id), {
        status: 'converted',
        updatedAt: Date.now(),
      });
    } catch (err: any) {
      handleFirestoreError(err, OperationType.WRITE, 'clients');
      throw err;
    }
  },

  async updateLead(editingLead: Lead): Promise<void> {
    try {
      const { id, ...data } = editingLead;
      await updateDoc(doc(db, 'leads', id), {
        ...data,
        updatedAt: Date.now(),
      });
    } catch (err: any) {
      handleFirestoreError(err, OperationType.UPDATE, 'leads');
      throw err;
    }
  },

  async deleteLead(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'leads', id));
    } catch (err: any) {
      handleFirestoreError(err, OperationType.DELETE, 'leads');
      throw err;
    }
  },
};
