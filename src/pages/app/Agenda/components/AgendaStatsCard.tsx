import React from 'react';
import { AgendaEvent } from '../types/agenda.types';

interface AgendaStatsCardProps {
  events: AgendaEvent[];
}

export const AgendaStatsCard: React.FC<AgendaStatsCardProps> = ({ events }) => {
  const totalGeral = events.length;
  const visitasTecnicas = events.filter((e) => e.type === 'visit').length;
  const monitoramentoPush = events.filter(
    (e) => e.notifyTime && e.notifyTime !== 'none'
  ).length;

  return (
    <div className="bg-[#1E293B] rounded-[2rem] p-6 border border-slate-800 shadow-xl space-y-4">
      <div>
        <h4 className="font-black text-sm text-white uppercase tracking-widest italic">
          Análise Agenda
        </h4>
        <p className="text-xs text-slate-400">Total de compromissos salvos</p>
      </div>

      <div className="space-y-3 pt-2">
        <div className="flex justify-between items-center text-xs border-b border-slate-800 pb-2.5">
          <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
            Total Geral
          </span>
          <span className="font-black text-[#EAB308] bg-[#0B0F19] border border-slate-800 px-2.5 py-0.5 rounded-full">
            {totalGeral}
          </span>
        </div>
        <div className="flex justify-between items-center text-xs border-b border-slate-800 pb-2.5">
          <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Visitas Técnicas
          </span>
          <span className="font-black text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2.5 py-0.5 rounded-full">
            {visitasTecnicas}
          </span>
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span> Monitoramento Push
          </span>
          <span className="font-black text-indigo-400 bg-indigo-950/80 border border-indigo-800 px-2.5 py-0.5 rounded-full">
            {monitoramentoPush}
          </span>
        </div>
      </div>
    </div>
  );
};
