import React from 'react';
import { CheckCheck } from 'lucide-react';
import { LeadStatus } from '../types/lead.types';

interface LeadStatusBadgeProps {
  status: LeadStatus | string;
}

export const LeadStatusBadge: React.FC<LeadStatusBadgeProps> = ({ status }) => {
  if (status === 'new') {
    return (
      <span className="bg-[#EAB308] text-slate-950 text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest animate-pulse">
        Novo
      </span>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <span className="bg-slate-100 border border-slate-200 text-slate-700 text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest flex items-center gap-1">
        <CheckCheck className="w-3 h-3 text-emerald-600" />{' '}
        {status === 'contacted'
          ? 'Lido'
          : status === 'converted'
          ? 'Convertido'
          : 'Arquivado'}
      </span>
    </div>
  );
};
