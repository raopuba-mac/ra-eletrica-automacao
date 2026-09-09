import React from 'react';
import { Plus } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { Button } from '../../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../components/ui/dialog';
import { PageHeader } from '../../components/PageHeader';
import { useClients } from './Clients/hooks/useClients';
import { ClientCard } from './Clients/components/ClientCard';
import { ClientForm } from './Clients/components/ClientForm';
import { ClientFilters } from './Clients/components/ClientFilters';
import { ClientToast } from './Clients/components/ClientToast';

export default function Clients() {
  const {
    user,
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
    resetForm,
    handleOpenCreateDialog,
    handleEdit,
    handleSubmit,
    handleDelete,
    toggleExpandHistory,
  } = useClients();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clientes"
        description="Gerencie seus contatos e informações dos clientes."
        action={
          <Dialog
            open={isDialogOpen}
            onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}
          >
            <DialogTrigger
              render={
                <Button
                  size="lg"
                  onClick={handleOpenCreateDialog}
                  className="bg-[#EAB308] hover:bg-[#ca8a04] text-[#0B0F19] font-black uppercase tracking-widest text-xs h-14 px-6 rounded-2xl shadow-xl shadow-[#EAB308]/20 italic"
                >
                  <Plus className="w-5 h-5 mr-2" /> Novo Cliente
                </Button>
              }
            />
            <DialogContent className="sm:max-w-[425px] bg-[#1E293B] border-slate-800 text-white rounded-[2rem]">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black italic tracking-tighter uppercase text-white">
                  {editingId ? 'Editar Cliente' : 'Cadastrar Cliente'}
                </DialogTitle>
              </DialogHeader>
              <ClientForm
                form={form}
                setForm={setForm}
                onSubmit={handleSubmit}
                isEditing={!!editingId}
              />
            </DialogContent>
          </Dialog>
        }
      />

      <ClientFilters searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <AnimatePresence>
          {filteredClients.map((c, idx) => (
            <ClientCard
              key={c.id}
              client={c}
              index={idx}
              userId={user?.uid || ''}
              isExpanded={expandedId === c.id}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleExpand={toggleExpandHistory}
            />
          ))}
        </AnimatePresence>
        {filteredClients.length === 0 && (
          <div className="col-span-full py-12 text-center bg-[#1E293B] border-2 border-dashed border-slate-800 rounded-3xl text-slate-400">
            Nenhum cliente encontrado.
          </div>
        )}
      </div>

      <ClientToast
        toast={toast}
        onClose={() => setToast((prev) => ({ ...prev, show: false }))}
      />
    </div>
  );
}
