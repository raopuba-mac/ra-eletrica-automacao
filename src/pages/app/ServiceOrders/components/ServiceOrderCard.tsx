import React from 'react';
import { motion } from 'motion/react';
import { User as UserIcon, Printer, Trash2, Edit, Send, DollarSign, CheckCircle2, ExternalLink } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { ServiceOrder, Client } from '../types/serviceOrder.types';
import { statusColors, getClientName } from '../utils/serviceOrderUtils';
import { ServiceOrderStatusBadge } from './ServiceOrderStatusBadge';
import { FinancialTransaction } from '../../Financial/types/financial.types';
import { getDerivedStatus, formatCurrency, formatDateMs, STATUS_CONFIG } from '../../Financial/utils/financialUtils';

interface ServiceOrderCardProps {
  order: ServiceOrder;
  clients: Client[];
  index: number;
  financialTransaction?: FinancialTransaction | null;
  onGeneratePdf: (order: ServiceOrder) => void;
  onConfirmDelete: (id: string) => void;
  onEdit: (order: ServiceOrder) => void;
  onShareWhatsApp: (order: ServiceOrder, financialTx?: FinancialTransaction | null) => void;
  onGenerateReceivable?: (order: ServiceOrder) => void;
  onRegisterPayment?: (transaction: FinancialTransaction) => void;
  onNavigateFinancial?: () => void;
}

export const ServiceOrderCard: React.FC<ServiceOrderCardProps> = ({
  order,
  clients,
  index,
  financialTransaction,
  onGeneratePdf,
  onConfirmDelete,
  onEdit,
  onShareWhatsApp,
  onGenerateReceivable,
  onRegisterPayment,
  onNavigateFinancial,
}) => {
  const topColorClass = statusColors[order.status]?.split(' ')[0] || 'bg-yellow-100';

  const derivedStatus = financialTransaction ? getDerivedStatus(financialTransaction) : null;
  const statusCfg = derivedStatus ? STATUS_CONFIG[derivedStatus] : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      className="group bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden hover:shadow-2xl hover:shadow-slate-200/50 hover:border-slate-200 transition-all flex flex-col relative"
    >
      <div className={`h-2 w-full ${topColorClass}`} />

      <div className="p-8 md:p-10 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-8">
          <div className="space-y-3">
            <div className="flex items-center gap-4">
               <div className="h-12 w-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all duration-500">
                  <UserIcon className="w-6 h-6" />
               </div>
               <div className="flex flex-col">
                  <span className="font-black text-slate-900 tracking-tighter uppercase italic text-xl leading-none">
                    {getClientName(clients, order.clientId)}
                  </span>
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1">
                    ID Protocolo: {order.id.slice(0, 8).toUpperCase()}
                  </span>
               </div>
            </div>
          </div>
          <ServiceOrderStatusBadge status={order.status} />
        </div>

        <div className="mb-8">
           <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-3">Memorial Técnico</div>
           <p className="text-sm text-slate-600 font-medium italic leading-relaxed bg-slate-50/50 p-6 rounded-3xl border border-slate-50 line-clamp-4">
             {order.description}
           </p>
        </div>

        {/* Visual Documentation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Photos Preview */}
            <div className="space-y-4">
               <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Antes</span>
               </div>
               <div className="grid grid-cols-2 gap-2">
                  {(order.photos || []).slice(0, 2).map((file: string, i: number) => (
                     <div key={i} className="aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 group/img">
                        <img src={file} className="w-full h-full object-cover transition-transform group-hover/img:scale-110" alt={`Antes ${i}`} />
                     </div>
                  ))}
                  {(!order.photos || order.photos.length === 0) && (
                     <div className="col-span-2 py-4 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200 uppercase text-[8px] font-black tracking-widest">Sem fotos</div>
                  )}
               </div>
            </div>

            <div className="space-y-4">
               <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Depois</span>
               </div>
               <div className="grid grid-cols-2 gap-2">
                  {(order.photosAfter || []).slice(0, 2).map((file: string, i: number) => (
                     <div key={i} className="aspect-square rounded-2xl overflow-hidden bg-emerald-50 border border-emerald-100 group/img">
                        <img src={file} className="w-full h-full object-cover transition-transform group-hover/img:scale-110" alt={`Depois ${i}`} />
                     </div>
                  ))}
                  {(!order.photosAfter || order.photosAfter.length === 0) && (
                     <div className="col-span-2 py-4 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200 uppercase text-[8px] font-black tracking-widest">Sem fotos</div>
                  )}
               </div>
            </div>
        </div>

        {/* Financial Integration Status Section */}
        <div className="mb-8 p-5 rounded-3xl bg-slate-900 border border-slate-800 text-white space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#EAB308]/20 text-[#EAB308] border border-[#EAB308]/30">
                <DollarSign className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Financeiro da OS
                </span>
                {financialTransaction ? (
                  <span className="text-xs font-bold text-white line-clamp-1">
                    {financialTransaction.description}
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-slate-400">
                    Nenhuma conta a receber vinculada
                  </span>
                )}
              </div>
            </div>

            {financialTransaction && statusCfg && (
              <span
                className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${statusCfg.badgeClass}`}
              >
                {statusCfg.label}
              </span>
            )}
          </div>

          {financialTransaction ? (
            <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-3 text-slate-300 font-medium flex-wrap">
                  <span>
                    Valor:{' '}
                    <strong className="text-white font-black">
                      {formatCurrency(financialTransaction.amount)}
                    </strong>
                  </span>
                  <span>
                    Vencimento:{' '}
                    <strong className="text-slate-200 font-bold">
                      {formatDateMs(financialTransaction.dueDate)}
                    </strong>
                  </span>
                </div>
                {financialTransaction.status === 'paid' && financialTransaction.paymentDate && (
                  <div className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>
                      Recebido em {formatDateMs(financialTransaction.paymentDate)}
                      {financialTransaction.paymentMethod
                        ? ` via ${financialTransaction.paymentMethod.toUpperCase()}`
                        : ''}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {(derivedStatus === 'pending' || derivedStatus === 'overdue') && onRegisterPayment && (
                  <Button
                    size="sm"
                    onClick={() => onRegisterPayment(financialTransaction)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] uppercase tracking-wider h-9 px-3 rounded-xl shadow-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Registrar Pagamento
                  </Button>
                )}
                {onNavigateFinancial && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onNavigateFinancial}
                    className="border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-white font-bold text-[10px] uppercase tracking-wider h-9 px-3 rounded-xl"
                  >
                    <ExternalLink className="w-3.5 h-3.5 mr-1" /> Financeiro
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                Gere uma conta a receber para controlar o status de cobrança deste serviço.
              </p>
              {onGenerateReceivable && (
                <Button
                  size="sm"
                  onClick={() => onGenerateReceivable(order)}
                  className="bg-[#EAB308] hover:bg-[#ca8a04] text-slate-950 font-black text-[10px] uppercase tracking-wider h-9 px-4 rounded-xl shrink-0"
                >
                  <DollarSign className="w-4 h-4 mr-1" /> Gerar Conta a Receber
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="mt-auto pt-8 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
           <div className="flex flex-col">
              <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1">Custo Final</span>
              <span className="text-2xl font-black text-slate-900 italic tracking-tighter">
                 R$ {order.finalPrice ? Number(order.finalPrice).toLocaleString('pt-BR', {minimumFractionDigits: 2}) : '0,00'}
              </span>
           </div>

           <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl hover:bg-slate-100 hover:text-primary text-slate-300 transition-colors mr-2" onClick={() => onGeneratePdf(order)} title="Gerar PDF da OS">
                  <Printer className="w-5 h-5" />
               </Button>
               <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl hover:bg-rose-50 hover:text-rose-600 text-slate-300 transition-colors" onClick={() => onConfirmDelete(order.id)}>
                  <Trash2 className="w-5 h-5" />
               </Button>
               <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl hover:bg-slate-100 hover:text-slate-900 text-slate-300 transition-colors" onClick={() => onEdit(order)}>
                  <Edit className="w-5 h-5" />
               </Button>
               {(order.status === 'completed' || (financialTransaction && financialTransaction.status !== 'paid')) && (
                 <Button
                   onClick={() => onShareWhatsApp(order, financialTransaction)}
                   className="h-12 px-6 bg-[#25D366] hover:bg-[#1DA851] text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-xl shadow-green-500/20 italic translate-y-[-2px] active:translate-y-[0]"
                 >
                   <Send className="w-4 h-4 mr-2" /> Cobrar OS
                 </Button>
               )}
           </div>
        </div>
      </div>
    </motion.div>
  );
};
