import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../components/AuthProvider';
import { clientService } from '../services/clientService';
import { Client, ClientFormData, ToastState } from '../types/client.types';
import { filterClients } from '../utils/clientUtils';

const INITIAL_FORM: ClientFormData = {
  name: '',
  phone: '',
  email: '',
  address: '',
};

export function useClients() {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [form, setForm] = useState<ClientFormData>(INITIAL_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>({
    show: false,
    message: '',
    type: 'success',
  });

  // Toast auto-hide effect
  useEffect(() => {
    if (!toast.show) return;
    const timer = setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast.show]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
  };

  // Real-time Firestore subscription
  useEffect(() => {
    if (!user) return;
    const unsub = clientService.subscribeToClients(user.uid, (data) => {
      setClients(data);
    });
    return () => unsub();
  }, [user]);

  const resetForm = () => {
    setForm(INITIAL_FORM);
    setEditingId(null);
  };

  const handleOpenCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleEdit = (client: Client) => {
    setForm({
      name: client.name || '',
      phone: client.phone || '',
      email: client.email || '',
      address: client.address || '',
    });
    setEditingId(client.id);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      if (editingId) {
        await clientService.updateClient(editingId, form);
        showToast(`Cliente "${form.name}" atualizado com sucesso!`);
      } else {
        await clientService.addClient(user.uid, form);
        showToast(`Cliente "${form.name}" cadastrado com sucesso!`);
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (err: any) {
      console.error(err);
      showToast(
        err?.message || 'Erro de permissão ou dados inválidos ao salvar cliente.',
        'error'
      );
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este cliente? Esta ação não pode ser desfeita.')) return;
    try {
      await clientService.deleteClient(id);
      showToast('Cliente excluído permanentemente.');
    } catch (err: any) {
      console.error(err);
      showToast('Erro ao excluir cliente: Permissão negada.', 'error');
    }
  };

  const toggleExpandHistory = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const filteredClients = filterClients(clients, searchTerm);

  return {
    user,
    clients,
    filteredClients,
    isDialogOpen,
    setIsDialogOpen,
    form,
    setForm,
    editingId,
    searchTerm,
    setSearchTerm,
    expandedId,
    toast,
    setToast,
    showToast,
    resetForm,
    handleOpenCreateDialog,
    handleEdit,
    handleSubmit,
    handleDelete,
    toggleExpandHistory,
  };
}
