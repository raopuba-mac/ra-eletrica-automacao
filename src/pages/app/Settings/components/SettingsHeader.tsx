import React from 'react';
import { Button } from '../../../../components/ui/button';
import { RefreshCcw } from 'lucide-react';

interface SettingsHeaderProps {
  onSyncData: () => void;
}

export const SettingsHeader: React.FC<SettingsHeaderProps> = ({ onSyncData }) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-black text-white italic tracking-tight uppercase">
          Configurações do Perfil e Site
        </h1>
        <p className="text-slate-400 text-sm">
          Personalize os dados que aparecem na sua página pública.
        </p>
      </div>
      <Button
        onClick={onSyncData}
        variant="outline"
        className="shrink-0 font-bold uppercase tracking-widest text-[#EAB308] italic bg-[#0B0F19] hover:bg-slate-800 border-slate-800"
      >
        <RefreshCcw className="w-4 h-4 mr-2 text-[#EAB308]" />
        Sincronizar Dados
      </Button>
    </div>
  );
};
