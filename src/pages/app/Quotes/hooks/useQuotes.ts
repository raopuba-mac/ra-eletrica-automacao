import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import { useAuth } from '../../../../components/AuthProvider';
import { OperationType, handleFirestoreError } from '../../../../lib/firestoreOps';
import { Quote, Client, ToastState, QuoteItem } from '../types/quote.types';

export function useQuotes() {
  const { user } = useAuth();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<ToastState>({ show: false, message: '', type: 'success' });

  useEffect(() => {
    if (!toast.show) return;
    const timer = setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast.show]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
  };

  useEffect(() => {
    if (!user) return;
    const unsubQ = onSnapshot(query(collection(db, 'quotes'), where('userId', '==', user.uid)), 
      snap => {
        setQuotes(snap.docs.map(d => ({ id: d.id, ...d.data() } as Quote)));
        setLoading(false);
      },
      err => {
        handleFirestoreError(err, OperationType.GET, 'quotes');
        setLoading(false);
      }
    );
    const unsubC = onSnapshot(query(collection(db, 'clients'), where('userId', '==', user.uid)), 
      snap => setClients(snap.docs.map(d => ({ id: d.id, ...d.data() } as Client))),
      err => handleFirestoreError(err, OperationType.GET, 'clients')
    );
    return () => { unsubQ(); unsubC(); };
  }, [user]);

  const updateStatus = async (id: string, status: string) => {
    try { 
      await updateDoc(doc(db, 'quotes', id), { status, updatedAt: Date.now() }); 
      showToast(`Status atualizado para ${status === 'approved' ? 'Aprovado' : status === 'rejected' ? 'Recusado' : 'Pendente'}`, "success");
    } catch(err: any) { 
      console.error(err);
      showToast("Erro ao atualizar status.", "error"); 
    }
  };

  const deleteQuote = async (id: string) => {
    if (!window.confirm("Deseja realmente excluir este orçamento?")) return;
    try { 
      await deleteDoc(doc(db, 'quotes', id)); 
      showToast("Orçamento excluído permanentemente", "success");
    } catch(err: any) { 
      console.error(err);
      showToast("Erro ao excluir orçamento.", "error"); 
    }
  };

  const saveQuote = async (
    editingQuoteId: string | null,
    clientId: string,
    items: QuoteItem[],
    remarks: string,
    photos: string[],
    discount: number,
    includesMaterial: boolean,
    applyCashDiscount: boolean,
    hideDetailedPrices: boolean,
    status: string
  ): Promise<boolean> => {
    if (!user) return false;
    if (!clientId) {
      showToast("Selecione um cliente para emitir o orçamento.", "error");
      return false;
    }

    try {
      const clientName = clients.find(c => c.id === clientId)?.name || '';
      const calculatedTotal = items.reduce((acc, it) => acc + (Number(it.price) * Number(it.quantity) || 0), 0);
      
      const serializedDescription = JSON.stringify({
        items: items.filter(it => it.name.trim() !== ''),
        remarks,
        photo: photos[0] || '',
        photos,
        discount,
        includesMaterial,
        applyCashDiscount,
        hideDetailedPrices
      });

      const quoteData = {
        userId: user.uid,
        clientId,
        clientName,
        description: serializedDescription,
        totalAmount: calculatedTotal,
        status,
        updatedAt: Date.now()
      };

      if (editingQuoteId) {
        await updateDoc(doc(db, 'quotes', editingQuoteId), quoteData);
        showToast("Orçamento atualizado com sucesso!", "success");
      } else {
        await addDoc(collection(db, 'quotes'), { ...quoteData, createdAt: Date.now() });
        showToast("Orçamento gerado com sucesso!", "success");
      }
      return true;
    } catch(err: any) {
      console.error(err);
      showToast(err?.message || "Erro ao salvar orçamento. A foto pode ser muito grande ou você não tem permissão.", "error");
      return false;
    }
  };

  return {
    user,
    quotes,
    clients,
    loading,
    toast,
    setToast,
    showToast,
    updateStatus,
    deleteQuote,
    saveQuote
  };
}
