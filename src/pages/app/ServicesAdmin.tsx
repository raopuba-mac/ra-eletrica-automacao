import React from 'react';
import { useServices } from './Services/hooks/useServices';
import { ServiceCard } from './Services/components/ServiceCard';
import { ServiceForm } from './Services/components/ServiceForm';
import { ServiceDeleteModal } from './Services/components/ServiceDeleteModal';
import { ServiceToast } from './Services/components/ServiceToast';

export default function ServicesAdmin() {
  const {
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
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    confirmDeleteModal,
    toast,
    setToast,
  } = useServices();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 italic tracking-tight uppercase">
            Serviços Catálogo
          </h1>
          <p className="text-slate-500 text-sm">
            O que você faz? Isso aparecerá no seu site público.
          </p>
        </div>
        <ServiceForm
          isDialogOpen={isDialogOpen}
          setIsDialogOpen={setIsDialogOpen}
          editingId={editingId}
          form={form}
          setForm={setForm}
          onOpenNewDialog={handleOpenNewDialog}
          onSubmit={handleSubmit}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((s) => (
          <ServiceCard
            key={s.id}
            service={s}
            onEdit={handleOpenEditDialog}
            onDelete={handleDelete}
          />
        ))}
        {services.length === 0 && (
          <div className="col-span-full py-16 border-2 border-dashed border-slate-200 bg-white rounded-3xl text-center text-slate-400 font-bold uppercase tracking-wider text-xs">
            Nenhum serviço cadastrado.
          </div>
        )}
      </div>

      <ServiceDeleteModal
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirmDelete={confirmDeleteModal}
      />

      <ServiceToast
        toast={toast}
        onClose={() => setToast((prev) => ({ ...prev, show: false }))}
      />
    </div>
  );
}
