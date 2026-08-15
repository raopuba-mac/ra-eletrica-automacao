import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../../components/ui/dialog';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { Button } from '../../../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { Lead } from '../types/lead.types';

interface LeadFormProps {
  editingLead: Lead | null;
  setEditingLead: React.Dispatch<React.SetStateAction<Lead | null>>;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const LeadForm: React.FC<LeadFormProps> = ({
  editingLead,
  setEditingLead,
  isOpen,
  onOpenChange,
  onSubmit,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar Lead</DialogTitle>
        </DialogHeader>
        {editingLead && (
          <form onSubmit={onSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Nome do Cliente</Label>
              <Input
                value={editingLead.name}
                onChange={(e) => setEditingLead({ ...editingLead, name: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input
                  value={editingLead.phone || ''}
                  onChange={(e) => setEditingLead({ ...editingLead, phone: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={editingLead.status}
                  onValueChange={(val) => setEditingLead({ ...editingLead, status: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">Novo</SelectItem>
                    <SelectItem value="contacted">Lido / Contatado</SelectItem>
                    <SelectItem value="converted">Convertido (Venda)</SelectItem>
                    <SelectItem value="archived">Arquivado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input
                value={editingLead.email || ''}
                onChange={(e) => setEditingLead({ ...editingLead, email: e.target.value })}
                type="email"
              />
            </div>
            <div className="space-y-2">
              <Label>Endereço</Label>
              <Input
                value={editingLead.address || ''}
                onChange={(e) => setEditingLead({ ...editingLead, address: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Serviço Solicitado</Label>
              <Input
                value={editingLead.serviceType || ''}
                onChange={(e) => setEditingLead({ ...editingLead, serviceType: e.target.value })}
              />
            </div>
            <div className="pt-4 flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
                Salvar Alterações
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
