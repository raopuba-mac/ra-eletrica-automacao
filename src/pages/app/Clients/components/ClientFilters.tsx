import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '../../../../components/ui/input';

interface ClientFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

export const ClientFilters: React.FC<ClientFiltersProps> = ({
  searchTerm,
  setSearchTerm,
}) => {
  return (
    <div className="mb-6 relative">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
      <Input
        className="pl-11 h-14 bg-[#1E293B] border-slate-800 text-white rounded-2xl placeholder:text-slate-500 focus:ring-[#EAB308]"
        placeholder="Pesquisar por nome, telefone ou e-mail..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
    </div>
  );
};
