import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Users, Zap, Clock, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { DashboardStatsData } from '../types/dashboard.types';

interface DashboardStatsProps {
  stats: DashboardStatsData;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ stats }) => {
  const cards = [
    { title: 'Clientes', value: stats.clients, icon: Users, color: 'text-primary', bg: 'bg-primary/5', path: '/app/clients' },
    { title: 'Ordens de Serviço', value: stats.orders, icon: Zap, color: 'text-amber-500', bg: 'bg-amber-500/5', path: '/app/orders' },
    { title: 'Novos Leads', value: stats.leads, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-600/5', path: '/app/leads' },
    { title: 'Orçamentos', value: stats.quotes, icon: FileText, color: 'text-purple-500', bg: 'bg-purple-500/5', path: '/app/quotes' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {cards.map((card, idx) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
        >
          <Link to={card.path}>
            <Card className="shadow-xs border border-slate-200 bg-white hover:border-[#EAB308] hover:shadow-md transition-all relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <CardTitle className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">{card.title}</CardTitle>
                <div className={`${card.bg} p-2 rounded-xl border border-slate-100`}>
                  <card.icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent className="relative z-10 pt-4">
                <div className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tighter leading-none">{card.value}</div>
              </CardContent>
            </Card>
          </Link>
        </motion.div>
      ))}
    </div>
  );
};
