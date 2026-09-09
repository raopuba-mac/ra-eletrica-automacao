import React from 'react';
import { Search, Filter } from 'lucide-react';
import { FinancialFilterStatus } from '../types/financial.types';

interface FinancialTransactionFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: FinancialFilterStatus;
  setStatusFilter: (filter: FinancialFilterStatus) => void;
  counts: {
    all: number;
    pending: number;
    paid: number;
    overdue: number;
    canceled: number;
  };
}

export const FinancialTransactionFilters: React.FC<FinancialTransactionFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  counts,
}) => {
  const filterButtons: { id: FinancialFilterStatus; label: string; count: number }[] = [
    { id: 'all', label: 'Todos', count: counts.all },
    { id: 'pending', label: 'Pendentes', count: counts.pending },
    { id: 'overdue', label: 'Vencidos', count: counts.overdue },
    { id: 'paid', label: 'Pagos', count: counts.paid },
    { id: 'canceled', label: 'Cancelados', count: counts.canceled },
  ];

  return (
    <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por cliente, descrição ou categoria..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-2.5 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#EAB308] focus:bg-white transition-all"
          />
        </div>

        {/* Filter Label Icon on Desktop */}
        <div className="hidden sm:flex items-center gap-2 text-slate-400 text-xs font-bold shrink-0">
          <Filter className="w-4 h-4 text-slate-400" />
          <span>Filtros:</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {filterButtons.map((btn) => {
          const isActive = statusFilter === btn.id;
          return (
            <button
              key={btn.id}
              onClick={() => setStatusFilter(btn.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                isActive
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>{btn.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                  isActive ? 'bg-[#EAB308] text-slate-950' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {btn.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
