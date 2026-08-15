import React from 'react';
import {
  MessageSquare,
  PhoneCall,
  FileText,
  CheckCircle2,
  Zap,
  ChevronRight,
} from 'lucide-react';
import { CommercialMetricsData } from '../types/dashboard.types';
import { formatCurrency } from '../utils/commercialUtils';

interface CommercialFunnelProps {
  metrics: CommercialMetricsData;
  activeOrdersCount: number;
}

export const CommercialFunnel: React.FC<CommercialFunnelProps> = ({
  metrics,
  activeOrdersCount,
}) => {
  const steps = [
    {
      id: 'leads',
      title: '1. Leads',
      subtitle: 'Contatos do Site/App',
      count: metrics.leadsTotal,
      badgeText: `${metrics.leadsNew} novos`,
      icon: MessageSquare,
      color: 'border-amber-500/30 bg-amber-500/5 text-amber-400',
    },
    {
      id: 'atendimento',
      title: '2. Em Atendimento',
      subtitle: 'Contato em andamento',
      count: metrics.leadsContacted,
      badgeText: `${metrics.leadsContacted} em conversa`,
      icon: PhoneCall,
      color: 'border-blue-500/30 bg-blue-500/5 text-blue-400',
    },
    {
      id: 'propostas',
      title: '3. Propostas',
      subtitle: 'Orçamentos Pendentes',
      count: metrics.quotesPending,
      badgeText: formatCurrency(metrics.inNegotiationValue),
      icon: FileText,
      color: 'border-purple-500/30 bg-purple-500/5 text-purple-400',
      highlight: metrics.inNegotiationValue > 0,
    },
    {
      id: 'aprovados',
      title: '4. Aprovados',
      subtitle: 'Orçamentos Fechados',
      count: metrics.quotesApproved,
      badgeText: `${metrics.conversionRate}% conversão`,
      icon: CheckCircle2,
      color: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400',
    },
    {
      id: 'execucao',
      title: '5. Execução (OS)',
      subtitle: 'Serviços em campo',
      count: activeOrdersCount,
      badgeText: `${activeOrdersCount} ativas`,
      icon: Zap,
      color: 'border-yellow-500/30 bg-yellow-500/5 text-yellow-400',
    },
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="text-base font-black text-white italic tracking-tight flex items-center gap-2">
            Funil de Conversão Comercial
          </h3>
          <p className="text-xs text-slate-400">
            Jornada visual do Lead até a Execução da Ordem de Serviço
          </p>
        </div>
        {metrics.inNegotiationValue > 0 && (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold self-start sm:self-auto">
            💰 Em Negociação: {formatCurrency(metrics.inNegotiationValue)}
          </div>
        )}
      </div>

      {/* Grid of Steps */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 relative">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div
              key={step.id}
              className={`p-4 rounded-xl border ${step.color} transition-all relative flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    {step.title}
                  </span>
                  <Icon className="w-4 h-4 opacity-80" />
                </div>
                <span className="text-2xl font-black text-white tracking-tight block">
                  {step.count}
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">{step.subtitle}</p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-800 text-slate-200">
                  {step.badgeText}
                </span>
                {idx < steps.length - 1 && (
                  <ChevronRight className="w-4 h-4 text-slate-600 hidden lg:block" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
