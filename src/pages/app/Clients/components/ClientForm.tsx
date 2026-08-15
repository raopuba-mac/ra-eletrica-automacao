import React from 'react';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { ClientFormData } from '../types/client.types';

interface ClientFormProps {
  form: ClientFormData;
  setForm: React.Dispatch<React.SetStateAction<ClientFormData>>;
  onSubmit: (e: React.FormEvent) => void;
  isEditing: boolean;
}

export const ClientForm: React.FC<ClientFormProps> = ({
  form,
  setForm,
  onSubmit,
  isEditing,
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-5 pt-4">
      <div className="space-y-2">
        <Label className="text-xs font-bold text-slate-300">
          Nome Completo *
        </Label>
        <Input
          className="h-12 bg-[#0B0F19] border-slate-800 text-white rounded-xl focus:ring-[#EAB308]"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Ex: João Silva"
          required
        />
      </div>
      <div className="space-y-2">
        <Label className="text-xs font-bold text-slate-300">Telefone</Label>
        <Input
          className="h-12 bg-[#0B0F19] border-slate-800 text-white rounded-xl focus:ring-[#EAB308]"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          placeholder="(00) 00000-0000"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-xs font-bold text-slate-300">E-mail</Label>
        <Input
          className="h-12 bg-[#0B0F19] border-slate-800 text-white rounded-xl focus:ring-[#EAB308]"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="joao@email.com"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-xs font-bold text-slate-300">Endereço</Label>
        <Input
          className="h-12 bg-[#0B0F19] border-slate-800 text-white rounded-xl focus:ring-[#EAB308]"
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
          placeholder="Rua, Número, Bairro, Cidade"
        />
      </div>
      <Button
        type="submit"
        size="lg"
        className="w-full mt-4 font-black uppercase italic tracking-wider h-14 bg-[#EAB308] hover:bg-[#ca8a04] text-[#0B0F19] rounded-2xl"
      >
        {isEditing ? 'Salvar Alterações' : 'Cadastrar Cliente'}
      </Button>
    </form>
  );
};
