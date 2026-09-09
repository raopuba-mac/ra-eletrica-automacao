import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Zap } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { PageHeader } from '../../../../components/PageHeader';

export const DashboardWelcome: React.FC = () => {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <PageHeader 
        title="Painel de Controle" 
        description="Central de comando da RA | Elétrica & Automação."
      />
      <div className="flex gap-2">
        <Link to="/app/leads" className="hidden sm:block">
          <Button size="sm" variant="outline" className="border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-bold rounded-xl h-10 px-6 shadow-xs">
            <Users className="w-4 h-4 mr-2 text-[#ca8a04]" /> Leads
          </Button>
        </Link>
        <Link to="/app/orders">
          <Button size="sm" className="bg-[#EAB308] hover:bg-[#ca8a04] text-slate-950 font-black rounded-xl shadow-md h-10 px-6">
            <Zap className="w-4 h-4 mr-2 fill-current" /> Nova OS
          </Button>
        </Link>
      </div>
    </div>
  );
};
