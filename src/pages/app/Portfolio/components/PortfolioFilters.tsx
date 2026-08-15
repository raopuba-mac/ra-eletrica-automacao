import React from 'react';
import { cn } from '../../../../lib/utils';

interface PortfolioFiltersProps {
  activeTab: 'projects' | 'categories';
  setActiveTab: (tab: 'projects' | 'categories') => void;
}

export const PortfolioFilters: React.FC<PortfolioFiltersProps> = ({
  activeTab,
  setActiveTab,
}) => {
  return (
    <div className="flex p-1.5 bg-white border border-slate-200 w-max rounded-2xl mb-6 shadow-xs">
      <button
        type="button"
        onClick={() => setActiveTab('projects')}
        className={cn(
          'px-6 py-2.5 rounded-xl text-sm font-black transition-all cursor-pointer',
          activeTab === 'projects'
            ? 'bg-[#EAB308] text-slate-950 shadow-xs'
            : 'text-slate-600 hover:text-slate-900'
        )}
      >
        MEUS PROJETOS
      </button>
      <button
        type="button"
        onClick={() => setActiveTab('categories')}
        className={cn(
          'px-6 py-2.5 rounded-xl text-sm font-black transition-all cursor-pointer',
          activeTab === 'categories'
            ? 'bg-[#EAB308] text-slate-950 shadow-xs'
            : 'text-slate-600 hover:text-slate-900'
        )}
      >
        CAPAS DOS SERVIÇOS
      </button>
    </div>
  );
};
