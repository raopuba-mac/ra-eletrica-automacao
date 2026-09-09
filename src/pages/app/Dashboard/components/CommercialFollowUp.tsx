import React from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  PhoneCall,
  ExternalLink,
  ArrowUpRight,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { DashboardQuoteItem, DashboardClient } from '../types/dashboard.types';
import {
  getQuoteAgeStatus,
  getQuoteWhatsAppUrl,
  formatCurrency,
} from '../utils/commercialUtils';

interface CommercialFollowUpProps {
  quotes: DashboardQuoteItem[];
  clients: DashboardClient[];
}

export const CommercialFollowUp: React.FC<CommercialFollowUpProps> = ({
  quotes,
  clients,
}) => {
  if (quotes.length === 0) {
    return (
      <div className="py-12 border-2 border-dashed border-slate-200 rounded-3xl text-center bg-slate-50">
        <FileText className="w-10 h-10 text-slate-400 mx-auto mb-2" />
        <p className="font-black text-slate-800 uppercase italic">
          Nenhum Orçamento Pendente
        </p>
        <p className="text-xs text-slate-500 mt-1">
          Não há orçamentos em aberto aguardando resposta do cliente no momento.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-600" /> Follow-up de Orçamentos
          </h3>
          <p className="text-xs text-slate-500">
            Classificados por tempo em aberto. Priorize propostas paradas há mais de 3 dias.
          </p>
        </div>
        <Link
          to="/app/quotes"
          className="text-xs font-bold text-purple-600 hover:underline flex items-center gap-1"
        >
          Ir para Orçamentos <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {quotes.map((quote) => {
          const client = clients.find((c) => c.id === quote.clientId);
          const clientName = client?.name || quote.clientName || 'Cliente';
          const ageInfo = getQuoteAgeStatus(quote.createdAt);
          const waUrl = getQuoteWhatsAppUrl(quote, client?.phone);

          return (
            <div
              key={quote.id}
              className={`bg-slate-50 border rounded-2xl p-5 transition-all flex flex-col justify-between gap-4 ${
                ageInfo.priority === 'high'
                  ? 'border-rose-300 hover:border-rose-400 bg-rose-50/20'
                  : 'border-slate-200 hover:border-purple-300'
              }`}
            >
              <div>
                <div className="flex justify-between items-start mb-2 gap-2">
                  <div>
                    <span className="font-black text-slate-900 text-lg leading-tight block">
                      {clientName}
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${ageInfo.badgeClass}`}
                      >
                        {ageInfo.label}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        {ageInfo.daysAgo === 0
                          ? 'Hoje'
                          : ageInfo.daysAgo === 1
                          ? 'Há 1 dia'
                          : `Há ${ageInfo.daysAgo} dias`}
                      </span>
                    </div>
                  </div>

                  <span className="font-black text-slate-900 text-base shrink-0">
                    {formatCurrency(quote.totalAmount)}
                  </span>
                </div>

                {ageInfo.priority === 'high' && (
                  <div className="mt-2 p-2 rounded-xl bg-rose-100/80 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Atenção: Proposta parada há mais de 3 dias. Faça o contato!</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-slate-200">
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-xs"
                >
                  <PhoneCall className="w-3.5 h-3.5" /> Cobrar via WhatsApp
                </a>
                <Link
                  to="/app/quotes"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Ver Detalhes
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
