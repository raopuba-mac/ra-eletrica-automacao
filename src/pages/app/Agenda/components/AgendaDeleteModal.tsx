import React from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../../../components/ui/dialog';
import { EventToDelete } from '../types/agenda.types';

interface AgendaDeleteModalProps {
  eventToDelete: EventToDelete | null;
  onClose: () => void;
  onConfirm: () => void;
}

export const AgendaDeleteModal: React.FC<AgendaDeleteModalProps> = ({
  eventToDelete,
  onClose,
  onConfirm,
}) => {
  return (
    <Dialog open={!!eventToDelete} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-extrabold flex items-center gap-2 text-rose-600 uppercase italic">
            <Trash2 className="w-5 h-5 animate-bounce" /> Confirmar Exclusão
          </DialogTitle>
          <DialogDescription className="text-slate-500 pt-2 text-sm leading-relaxed">
            Tem certeza de que deseja excluir o compromisso{' '}
            <span className="font-bold text-slate-800">
              "{eventToDelete?.title}"
            </span>
            ? Esta ação não poderá ser desfeita.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4 gap-2 flex flex-row justify-end">
          <Button
            variant="outline"
            className="rounded-xl font-bold border-slate-200"
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            className="rounded-xl font-bold bg-rose-600 hover:bg-rose-700 text-white"
            onClick={onConfirm}
          >
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
