import React, { useState, useEffect } from 'react';
import { History, FileText, Zap } from 'lucide-react';
import { clientService } from '../services/clientService';
import { ClientQuoteHistory, ClientOrderHistory } from '../types/client.types';

interface ClientHistoryProps {
  clientId: string;
  userId: string;
}

export const ClientHistory: React.FC<ClientHistoryProps> = ({ clientId, userId }) => {
  const [quotes, setQuotes] = useState<ClientQuoteHistory[]>([]);
  const [orders, setOrders] = useState<ClientOrderHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId || !clientId) return;

    // Fetch quotes
    const unsubQuotes = clientService.subscribeToClientQuotes(
      userId,
      clientId,
      setQuotes
    );

    // Fetch orders
    const unsubOrders = clientService.subscribeToClientOrders(
      userId,
      clientId,
      (data) => {
        setOrders(data);
        setLoading(false);
      }
    );

    return () => {
      unsubQuotes();
      unsubOrders();
    };
  }, [clientId, userId]);

  if (loading) {
    return (
      <div className="py-8 text-center text-xs text-slate-400">
        Carregando histórico...
      </div>
    );
  }

  return (
    <div className="pt-6 space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-3">
          <History className="w-3.5 h-3.5 text-[#EAB308]" />
          <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Orçamentos
          </h4>
        </div>
        {quotes.length > 0 ? (
          <div className="space-y-2">
            {quotes.map((q) => (
              <div
                key={q.id}
                className="p-3 bg-[#0B0F19] border border-slate-800 rounded-xl"
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[11px] font-bold text-white truncate flex-1 mr-2">
                    {q.description}
                  </span>
                  <span
                    className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                      q.status === 'approved'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : q.status === 'rejected'
                        ? 'bg-rose-950 text-rose-400 border border-rose-800'
                        : 'bg-amber-950 text-amber-400 border border-amber-800'
                    }`}
                  >
                    R${' '}
                    {Number(q.totalAmount).toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="text-[9px] text-slate-400 font-medium">
                  {new Date(q.createdAt).toLocaleDateString('pt-BR')}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-xl border border-dashed border-slate-800 flex flex-col items-center justify-center bg-[#0B0F19]">
            <FileText className="w-6 h-6 text-slate-600 mb-1" />
            <p className="text-[10px] text-slate-400 font-medium">
              Nenhum orçamento.
            </p>
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-3.5 h-3.5 text-[#EAB308]" />
          <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Ordens de Serviço
          </h4>
        </div>
        {orders.length > 0 ? (
          <div className="space-y-2">
            {orders.map((o) => (
              <div
                key={o.id}
                className="p-3 bg-[#0B0F19] border border-slate-800 rounded-xl"
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[11px] font-bold text-white truncate flex-1 mr-2">
                    {o.description}
                  </span>
                  <span
                    className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                      o.status === 'completed'
                        ? 'bg-blue-950 text-blue-400 border border-blue-800'
                        : o.status === 'in_progress'
                        ? 'bg-indigo-950 text-indigo-400 border border-indigo-800'
                        : 'bg-amber-950 text-amber-400 border border-amber-800'
                    }`}
                  >
                    {o.status === 'completed'
                      ? 'Concluído'
                      : o.status === 'in_progress'
                      ? 'Em Andamento'
                      : 'Agendado'}
                  </span>
                </div>
                <div className="text-[9px] text-slate-400 font-medium">
                  {new Date(o.createdAt).toLocaleDateString('pt-BR')}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-xl border border-dashed border-slate-800 flex flex-col items-center justify-center bg-[#0B0F19]">
            <Zap className="w-6 h-6 text-slate-600 mb-1" />
            <p className="text-[10px] text-slate-400 font-medium">Nenhuma OS.</p>
          </div>
        )}
      </div>
    </div>
  );
};
