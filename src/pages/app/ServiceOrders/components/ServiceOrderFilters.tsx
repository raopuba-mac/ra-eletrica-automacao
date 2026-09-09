import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '../../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { ServiceOrderStatus } from '../types/serviceOrder.types';

interface ServiceOrderFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
}

export const ServiceOrderFilters: React.FC<ServiceOrderFiltersProps> = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
      <div className="relative flex-1 w-full">
        <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input
          type="text"
          placeholder="Buscar por cliente ou memorial..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-12 pl-12 bg-white border-slate-200 rounded-2xl text-slate-900 font-medium placeholder:text-slate-400"
        />
      </div>

      <div className="w-full sm:w-56">
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="h-12 bg-white border-slate-200 rounded-2xl text-slate-900 font-semibold">
            <SelectValue placeholder="Todos os Status" />
          </SelectTrigger>
          <SelectContent className="rounded-2xl border-slate-200 bg-white text-slate-900 p-1">
            <SelectItem value="all" className="rounded-xl py-2.5">Todos os Status</SelectItem>
            <SelectItem value="scheduled" className="rounded-xl py-2.5">Agendados</SelectItem>
            <SelectItem value="in_progress" className="rounded-xl py-2.5">Em Andamento</SelectItem>
            <SelectItem value="completed" className="rounded-xl py-2.5">Concluídos</SelectItem>
            <SelectItem value="cancelled" className="rounded-xl py-2.5">Cancelados</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
