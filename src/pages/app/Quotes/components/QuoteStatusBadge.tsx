import React from 'react';

interface QuoteStatusBadgeProps {
  status: string;
}

export const QuoteStatusBadge: React.FC<QuoteStatusBadgeProps> = ({ status }) => {
  if (status === 'pending') {
    return (
      <span className="bg-amber-950/80 text-amber-400 border border-amber-800 text-[9px] px-4 py-1.5 rounded-full font-black uppercase tracking-widest italic shadow-sm inline-block">
        Pendente
      </span>
    );
  }
  if (status === 'approved') {
    return (
      <span className="bg-emerald-950/80 text-emerald-400 border border-emerald-800 text-[9px] px-4 py-1.5 rounded-full font-black uppercase tracking-widest italic shadow-sm inline-block">
        Aprovado
      </span>
    );
  }
  if (status === 'rejected') {
    return (
      <span className="bg-rose-950/80 text-rose-400 border border-rose-800 text-[9px] px-4 py-1.5 rounded-full font-black uppercase tracking-widest italic shadow-sm inline-block">
        Recusado
      </span>
    );
  }
  return null;
};
