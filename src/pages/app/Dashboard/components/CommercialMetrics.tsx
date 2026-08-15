import React from 'react';
import {
  MessageSquare,
  PhoneCall,
  Clock,
  TrendingUp,
  CheckCircle2,
  Percent,
} from 'lucide-react';
import { CommercialMetricsData } from '../types/dashboard.types';
import { formatCurrency } from '../utils/commercialUtils';

interface CommercialMetricsProps {
  metrics: CommercialMetricsData;
}

export const CommercialMetrics: React.FC<CommercialMetricsProps> = ({ metrics }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {/* 1. Leads Novos */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-xs hover:border-amber-500/50 transition-all">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            Leads Novos
          </span>
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
            <MessageSquare className="w-4 h-4" />
          </div>
        </div>
        <div>
          <span className="text-2xl font-black text-white tracking-tight">
            {metrics.leadsNew}
          </span>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5 truncate">
            Aguardando contato
          </p>
        </div>
      </div>

      {/* 2. Em Atendimento */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-xs hover:border-blue-500/50 transition-all">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            Em Atendimento
          </span>
          <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
            <PhoneCall className="w-4 h-4" />
          </div>
        </div>
        <div>
          <span className="text-2xl font-black text-white tracking-tight">
            {metrics.leadsContacted}
          </span>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5 truncate">
            Em conversação
          </p>
        </div>
      </div>

      {/* 3. Propostas Pendentes */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-xs hover:border-purple-500/50 transition-all">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            Orç. Pendentes
          </span>
          <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div>
          <span className="text-2xl font-black text-white tracking-tight">
            {metrics.quotesPending}
          </span>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5 truncate">
            Em negociação
          </p>
        </div>
      </div>

      {/* 4. Valor em Negociação */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-xs hover:border-emerald-500/50 transition-all col-span-2 sm:col-span-1">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            Em Negociação
          </span>
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div>
          <span className="text-lg sm:text-xl font-black text-emerald-400 tracking-tight block truncate">
            {formatCurrency(metrics.inNegotiationValue)}
          </span>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5 truncate">
            Soma pendentes
          </p>
        </div>
      </div>

      {/* 5. Aprovados */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-xs hover:border-emerald-500/50 transition-all">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            Aprovados
          </span>
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div>
          <span className="text-2xl font-black text-white tracking-tight">
            {metrics.quotesApproved}
          </span>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5 truncate">
            Contratos fechados
          </p>
        </div>
      </div>

      {/* 6. Taxa de Conversão */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-xs hover:border-[#EAB308]/50 transition-all">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            Taxa Conversão
          </span>
          <div className="p-1.5 rounded-lg bg-[#EAB308]/10 text-[#EAB308]">
            <Percent className="w-4 h-4" />
          </div>
        </div>
        <div>
          <span className="text-2xl font-black text-[#EAB308] tracking-tight">
            {metrics.conversionRate}%
          </span>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5 truncate">
            Aprov. / Decididos
          </p>
        </div>
      </div>
    </div>
  );
};
