import React from 'react';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { Textarea } from '../../../../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../../../components/ui/dialog';
import { Plus } from 'lucide-react';
import { ServiceFormData } from '../types/service.types';

interface ServiceFormProps {
  isDialogOpen: boolean;
  setIsDialogOpen: (open: boolean) => void;
  editingId: string | null;
  form: ServiceFormData;
  setForm: React.Dispatch<React.SetStateAction<ServiceFormData>>;
  onOpenNewDialog: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const ServiceForm: React.FC<ServiceFormProps> = ({
  isDialogOpen,
  setIsDialogOpen,
  editingId,
  form,
  setForm,
  onOpenNewDialog,
  onSubmit,
}) => {
  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger
        render={
          <Button
            onClick={onOpenNewDialog}
            className="bg-[#EAB308] hover:bg-[#ca8a04] text-slate-950 font-black uppercase italic tracking-wider h-12 px-6 rounded-2xl shadow-md"
          >
            <Plus className="w-4 h-4 mr-2" /> Cadastrar Serviço
          </Button>
        }
      />
      <DialogContent className="bg-white border-slate-200 text-slate-900 rounded-3xl p-6 shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-[#ca8a04] uppercase italic">
            {editingId ? 'Editar Serviço' : 'Novo Serviço'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4 mt-4">
          <div>
            <Label className="text-xs font-bold text-slate-700">Nome do Serviço *</Label>
            <Input
              className="h-12 bg-slate-50 border-slate-200 text-slate-900 rounded-xl focus:ring-[#EAB308]"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div>
            <Label className="text-xs font-bold text-slate-700">Descrição</Label>
            <Textarea
              className="bg-slate-50 border-slate-200 text-slate-900 rounded-xl focus:ring-[#EAB308] min-h-[100px]"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div>
            <Label className="text-xs font-bold text-slate-700">Preço Base (Opcional)</Label>
            <Input
              className="h-12 bg-slate-50 border-slate-200 text-slate-900 rounded-xl focus:ring-[#EAB308]"
              type="number"
              step="0.01"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-[#EAB308] hover:bg-[#ca8a04] text-slate-950 font-black uppercase italic h-12 rounded-xl shadow-md mt-2"
          >
            {editingId ? 'Salvar Alterações' : 'Cadastrar'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
