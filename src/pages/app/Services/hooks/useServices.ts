import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../components/AuthProvider';
import { serviceService } from '../services/serviceService';
import { Service, ServiceFormData, ToastState } from '../types/service.types';

export function useServices() {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ServiceFormData>({ name: '', description: '', price: '' });
  const [serviceToDelete, setServiceToDelete] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [toast, setToast] = useState<ToastState>({
    show: false,
    message: '',
    type: 'success',
  });

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

  useEffect(() => {
    if (!user) return;
    const unsub = serviceService.subscribeToServices(user.uid, (data) => {
      setServices(data);
    });
    return () => unsub();
  }, [user]);

  const handleOpenNewDialog = () => {
    setEditingId(null);
    setForm({ name: '', description: '', price: '' });
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (service: Service) => {
    setEditingId(service.id);
    setForm({
      name: service.name,
      description: service.description || '',
      price: service.price?.toString() || '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsDialogOpen(false);

    try {
      if (editingId) {
        await serviceService.updateService(editingId, form);
        showToast('Serviço atualizado com sucesso!');
      } else {
        await serviceService.createService(user.uid, form);
        showToast('Serviço cadastrado com sucesso!');
      }
      setEditingId(null);
      setForm({ name: '', description: '', price: '' });
    } catch {
      // Error handled in serviceService
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir?')) {
      try {
        await serviceService.deleteService(id);
        showToast('Serviço excluído com sucesso.');
      } catch {
        // Error handled in serviceService
      }
    }
  };

  const confirmDeleteModal = async () => {
    if (!serviceToDelete) return;
    try {
      await serviceService.deleteService(serviceToDelete);
      setIsDeleteDialogOpen(false);
      setServiceToDelete(null);
      showToast('Serviço excluído com sucesso.');
    } catch {
      // Error handled in serviceService
    }
  };

  return {
    user,
    services,
    isDialogOpen,
    setIsDialogOpen,
    editingId,
    form,
    setForm,
    handleOpenNewDialog,
    handleOpenEditDialog,
    handleSubmit,
    handleDelete,
    serviceToDelete,
    setServiceToDelete,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    confirmDeleteModal,
    toast,
    setToast,
  };
}
