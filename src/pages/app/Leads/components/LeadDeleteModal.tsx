import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../../components/ui/dialog';
import { Button } from '../../../../components/ui/button';

interface LeadDeleteModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmDelete: () => void;
}

export const LeadDeleteModal: React.FC<LeadDeleteModalProps> = ({
  isOpen,
  onOpenChange,
  onConfirmDelete,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md text-slate-900">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Confirmar Exclusão</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-slate-500 font-medium tracking-tight">
            Tem certeza que deseja excluir permanentemente este lead? Esta ação não pode ser desfeita.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1 font-bold" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" className="flex-1 font-bold" onClick={onConfirmDelete}>
            Excluir Agora
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
