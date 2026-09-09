import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../components/AuthProvider';
import { leadService } from '../services/leadService';
import { Lead, ToastState } from '../types/lead.types';
import { STATUS_LABELS } from '../utils/leadUtils';

export function useLeads() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
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

  const showSuccessToast = (message: string) => {
    setToast({ show: true, message, type: 'success' });
  };

  useEffect(() => {
    if (!user) return;
    const unsub = leadService.subscribeToLeads(
      user.uid,
      (lds) => {
        setLeads(lds);
        setLoading(false);
      },
      () => {
        setLoading(false);
      }
    );
    return () => unsub();
  }, [user]);

  const updateStatus = async (id: string, status: string) => {
    try {
      await leadService.updateLeadStatus(id, status);
      const label = STATUS_LABELS[status] || status;
      showSuccessToast(`Status do lead atualizado para "${label}"!`);
    } catch {
      // Error handled in service
    }
  };

  const convertToClient = async (lead: Lead) => {
    if (!user) return;
    try {
      await leadService.convertLeadToClient(user.uid, lead);
      showSuccessToast(`Lead "${lead.name}" convertido em cliente com sucesso!`);
    } catch {
      // Error handled in service
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLead) return;

    try {
      const name = editingLead.name;
      await leadService.updateLead(editingLead);
      setIsEditDialogOpen(false);
      setEditingLead(null);
      showSuccessToast(`Lead "${name}" atualizado com sucesso!`);
    } catch {
      // Error handled in service
    }
  };

  const handleDelete = async () => {
    if (!leadToDelete) return;
    try {
      await leadService.deleteLead(leadToDelete);
      setIsDeleteDialogOpen(false);
      setLeadToDelete(null);
      showSuccessToast('Lead excluído permanentemente.');
    } catch {
      // Error handled in service
    }
  };

  const confirmDelete = (id: string) => {
    setLeadToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const openEdit = (lead: Lead) => {
    setEditingLead({ ...lead });
    setIsEditDialogOpen(true);
  };

  return {
    user,
    leads,
    loading,
    toast,
    setToast,
    editingLead,
    setEditingLead,
    isEditDialogOpen,
    setIsEditDialogOpen,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    updateStatus,
    convertToClient,
    handleEditSubmit,
    handleDelete,
    confirmDelete,
    openEdit,
  };
}
