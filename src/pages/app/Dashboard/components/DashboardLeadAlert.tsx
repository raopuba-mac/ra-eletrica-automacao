import React from 'react';
import { motion } from 'motion/react';
import { Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../../../../components/ui/button';

interface DashboardLeadAlertProps {
  leadsCount: number;
}

export const DashboardLeadAlert: React.FC<DashboardLeadAlertProps> = ({ leadsCount }) => {
  if (leadsCount <= 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-blue-600 rounded-[2.5rem] p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-xl"
    >
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
      <div className="flex items-center gap-6 relative z-10">
        <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20">
          <Users className="w-8 h-8 text-white" />
        </div>
        <div className="text-center md:text-left">
          <h2 className="text-3xl font-[1000] tracking-tighter uppercase italic leading-none mb-2">Novos Leads Recebidos</h2>
          <p className="text-blue-100 font-bold uppercase text-[10px] tracking-widest flex items-center justify-center md:justify-start gap-2">
            <span className="w-2 h-2 bg-white rounded-full animate-ping"></span>
            Você tem {leadsCount} {leadsCount === 1 ? 'novo contato' : 'novos contatos'} interessados nos seus serviços
          </p>
        </div>
      </div>
      <Link to="/app/leads" className="relative z-10 w-full md:w-auto">
        <Button size="lg" className="w-full md:w-auto bg-white text-blue-600 hover:bg-blue-50 font-black uppercase text-xs tracking-[0.2em] px-8 rounded-2xl h-14 shadow-md border-none">
          Atender Leads
        </Button>
      </Link>
    </motion.div>
  );
};
