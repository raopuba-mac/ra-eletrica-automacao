import React from 'react';
import { ArrowUpRight, CheckCircle2, AlertTriangle, Calculator } from 'lucide-react';
import { FinancialSummary } from '../types/financial.types';
import { formatCurrency } from '../utils/financialUtils';

interface FinancialSummaryCardsProps {
  summary: FinancialSummary;
}

export const FinancialSummaryCards: React.FC<FinancialSummaryCardsProps> = ({ summary }) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      {/* Card 1: A RECEBER */}
      <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-amber-300 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
            A RECEBER
          </span>
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center shrink-0">
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-lg md:text-2xl font-black text-slate-900 tracking-tight">
            {formatCurrency(summary.toReceive)}
          </div>
          <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
            Pendentes sem atraso
          </p>
        </div>
      </div>

      {/* Card 2: RECEBIDO NO MÊS */}
      <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-emerald-300 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
            RECEBIDO NO MÊS
          </span>
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-lg md:text-2xl font-black text-emerald-600 tracking-tight">
            {formatCurrency(summary.receivedMonth)}
          </div>
          <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
            Confirmados este mês
          </p>
        </div>
      </div>

      {/* Card 3: VENCIDO */}
      <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-rose-300 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
            VENCIDO
          </span>
          <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className={`text-lg md:text-2xl font-black tracking-tight ${summary.overdue > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
            {formatCurrency(summary.overdue)}
          </div>
          <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
            Aguardando cobrança
          </p>
        </div>
      </div>

      {/* Card 4: TOTAL PREVISTO */}
      <div className="bg-slate-900 text-white p-4 md:p-5 rounded-2xl border border-slate-800 shadow-md relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
            TOTAL PREVISTO
          </span>
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
            <Calculator className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-lg md:text-2xl font-black text-white tracking-tight">
            {formatCurrency(summary.totalExpected)}
          </div>
          <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
            Pendentes + Vencidos
          </p>
        </div>
      </div>
    </div>
  );
};
