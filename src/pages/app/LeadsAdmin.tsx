import React from 'react';
import { PageHeader } from '../../components/PageHeader';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle } from 'lucide-react';
import { useLeads } from './Leads/hooks/useLeads';
import { LeadCard } from './Leads/components/LeadCard';
import { LeadForm } from './Leads/components/LeadForm';
import { LeadDeleteModal } from './Leads/components/LeadDeleteModal';
import { LeadToast } from './Leads/components/LeadToast';

export default function LeadsAdmin() {
  const {
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
  } = useLeads();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leads do Site"
        description="Contatos recebidos através do formulário do seu site."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AnimatePresence>
          {loading ? (
            <div className="col-span-full py-20 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
              <p className="text-slate-400 font-medium">Carregando seus contatos...</p>
            </div>
          ) : (
            leads.map((lead, idx) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                idx={idx}
                onUpdateStatus={updateStatus}
                onConvertToClient={convertToClient}
                onEdit={openEdit}
                onDelete={confirmDelete}
              />
            ))
          )}
        </AnimatePresence>
        {leads.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="col-span-full py-20 border-2 border-dashed border-slate-200 bg-white rounded-3xl text-center"
          >
            <MessageCircle className="w-12 h-12 text-[#ca8a04] opacity-80 mx-auto mb-4" />
            <h3 className="text-slate-900 font-black text-xl italic uppercase">Sem novos leads</h3>
            <p className="text-slate-500 text-sm mt-1">Os contatos do site aparecerão aqui.</p>
          </motion.div>
        )}
      </div>

      <LeadDeleteModal
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirmDelete={handleDelete}
      />

      <LeadForm
        editingLead={editingLead}
        setEditingLead={setEditingLead}
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSubmit={handleEditSubmit}
      />

      <LeadToast
        toast={toast}
        onClose={() => setToast((prev) => ({ ...prev, show: false }))}
      />
    </div>
  );
}
