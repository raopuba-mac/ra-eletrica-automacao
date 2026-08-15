import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Wrench, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { DashboardFinishedOrder, DashboardClient } from '../types/dashboard.types';

interface DashboardFinishedOrdersProps {
  finishedOrders: DashboardFinishedOrder[];
  clients: DashboardClient[];
  onShareWhatsApp: (order: DashboardFinishedOrder) => void;
}

export const DashboardFinishedOrders: React.FC<DashboardFinishedOrdersProps> = ({
  finishedOrders,
  clients,
  onShareWhatsApp,
}) => {
  return (
    <Card className="border border-slate-200 bg-white shadow-xs rounded-[2.5rem] overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 bg-slate-50/50 p-6 md:p-8">
        <CardTitle className="text-lg font-black tracking-tighter flex items-center gap-2 uppercase text-slate-900">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 border border-emerald-200 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          SERVIÇOS CONCLUÍDOS
        </CardTitle>
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Recém Finalizados</div>
      </CardHeader>
      <CardContent className="p-0 bg-white">
        {finishedOrders.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm font-medium italic">
            Nenhum serviço concluído recentemente.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {finishedOrders.map((order) => {
              const client = clients.find((c) => c.id === order.clientId);
              return (
                <div key={order.id} className="p-6 md:p-8 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-6 group">
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-2xl bg-slate-100 overflow-hidden border border-slate-200">
                        {order.photosAfter && order.photosAfter[0] ? (
                          <img src={order.photosAfter[0]} className="w-full h-full object-cover transition-all" alt="Foto do Serviço" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <Wrench className="w-6 h-6 outline-none" />
                          </div>
                        )}
                      </div>
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-md">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 tracking-tight text-lg leading-none mb-2 uppercase italic">
                        {client?.name || 'Cliente'}
                      </h4>
                      <p className="text-xs text-slate-500 font-medium line-clamp-1 max-w-[200px] italic">{order.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 justify-between md:justify-end">
                    <div className="text-right">
                      <div className="text-[8px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">Finalizado em</div>
                      <div className="text-[10px] font-black text-slate-700">
                        {order.updatedAt ? format(order.updatedAt, 'dd/MM/yyyy') : '--/--/--'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[8px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">Total</div>
                      <div className="text-sm font-black text-emerald-700 italic">R$ {order.finalPrice || '0,00'}</div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => onShareWhatsApp(order)}
                      className="bg-[#25D366] hover:bg-[#1DA851] text-white font-black text-[10px] uppercase tracking-widest rounded-2xl h-10 px-6 shadow-md"
                    >
                      Cobrar
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div className="p-6 bg-slate-50 border-t border-slate-100 text-center">
          <Link to="/app/orders" className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-[#ca8a04] transition-colors flex items-center justify-center gap-2">
            Ver todas as ordens de serviço <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};
