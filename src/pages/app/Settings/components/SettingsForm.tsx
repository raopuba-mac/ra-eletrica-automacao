import React from 'react';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { SettingsFormData } from '../types/settings.types';

interface SettingsFormProps {
  form: SettingsFormData;
  setForm: React.Dispatch<React.SetStateAction<SettingsFormData>>;
  onSubmit: (e: React.FormEvent) => void;
}

export const SettingsForm: React.FC<SettingsFormProps> = ({
  form,
  setForm,
  onSubmit,
}) => {
  return (
    <form
      onSubmit={onSubmit}
      className="space-y-6 bg-[#1E293B] p-6 rounded-2xl border border-slate-800 shadow-xl text-white"
    >
      <div className="space-y-4">
        <h2 className="text-lg font-black border-b border-slate-800 pb-2 text-[#EAB308] uppercase italic">
          Informações Pessoais / Empresa
        </h2>
        <div>
          <Label className="text-xs font-bold text-slate-300">Seu Nome</Label>
          <Input
            className="h-12 bg-[#0B0F19] border-slate-800 text-white rounded-xl focus:ring-[#EAB308]"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div>
          <Label className="text-xs font-bold text-slate-300">
            Nome da Empresa (Opcional)
          </Label>
          <Input
            className="h-12 bg-[#0B0F19] border-slate-800 text-white rounded-xl focus:ring-[#EAB308]"
            value={form.companyName}
            onChange={(e) => setForm({ ...form, companyName: e.target.value })}
          />
        </div>
        <div>
          <Label className="text-xs font-bold text-slate-300">
            Telefone (Contato Normal)
          </Label>
          <Input
            className="h-12 bg-[#0B0F19] border-slate-800 text-white rounded-xl focus:ring-[#EAB308]"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t border-slate-800">
        <h2 className="text-lg font-black border-b border-slate-800 pb-2 text-[#EAB308] uppercase italic">
          Apresentação Pública (Site)
        </h2>
        <div>
          <Label className="text-xs font-bold text-slate-300">Sobre Mim / Bio</Label>
          <textarea
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            className="flex min-h-[120px] w-full rounded-xl border border-slate-800 bg-[#0B0F19] p-3 text-sm text-white placeholder:text-slate-500 focus:ring-2 focus:ring-[#EAB308] focus:outline-none"
            placeholder="Escreva um pouco sobre a sua experiência..."
          />
          <p className="text-xs text-slate-400 mt-1">
            Este texto aparecerá na seção "Sobre Mim" da página inicial.
          </p>
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t border-slate-800">
        <h2 className="text-lg font-black border-b border-slate-800 pb-2 text-[#EAB308] uppercase italic">
          Integração com WhatsApp
        </h2>
        <div>
          <Label className="text-xs font-bold text-slate-300">
            Número do WhatsApp no formato internacional (ex: 5534992609206)
          </Label>
          <Input
            className="h-12 bg-[#0B0F19] border-slate-800 text-white rounded-xl focus:ring-[#EAB308]"
            value={form.whatsappInfo}
            onChange={(e) => setForm({ ...form, whatsappInfo: e.target.value })}
            required
          />
          <p className="text-xs text-slate-400 mt-1">
            Este número receberá as mensagens do site público.
          </p>
        </div>
      </div>

      <div className="space-y-4 mt-6">
        <Button
          type="submit"
          size="lg"
          className="w-full bg-[#EAB308] hover:bg-[#ca8a04] text-[#0B0F19] font-black uppercase italic tracking-wider h-14 rounded-2xl shadow-xl"
        >
          Salvar Configurações
        </Button>
      </div>
    </form>
  );
};
