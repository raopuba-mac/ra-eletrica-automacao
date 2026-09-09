import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Calendar,
  User,
  CheckCircle2,
  Pencil,
  Ban,
  Clock,
  CreditCard,
  FileText,
  Tag,
  ExternalLink,
} from 'lucide-react';
import { FinancialTransaction } from '../types/financial.types';
import {
  getDerivedStatus,
  formatCurrency,
  formatDateMs,
  STATUS_CONFIG,
} from '../utils/financialUtils';

interface FinancialTransactionCardProps {
  transaction: FinancialTransaction;
  onPay: (transaction: FinancialTransaction) => void;
  onEdit: (transaction: FinancialTransaction) => void;
  onCancel: (transaction: FinancialTransaction) => void;
}

export const FinancialTransactionCard: React.FC<FinancialTransactionCardProps> = ({
  transaction,
  onPay,
  onEdit,
  onCancel,
}) => {
  const navigate = useNavigate();
  const derivedStatus = getDerivedStatus(transaction);
  const statusCfg = STATUS_CONFIG[derivedStatus];

  const paymentMethodLabels: Record<string, string> = {
    pix: 'PIX',
    cash: 'Dinheiro',
    card: 'Cartão',
    transfer: 'Transferência',
    other: 'Outro',
  };

  const originLabels: Record<string, string> = {
    manual: 'Manual',
    service_order: 'Ordem de Serviço',
    quote: 'Orçamento',
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`bg-white rounded-2xl p-4 md:p-5 border border-slate-200 shadow-xs hover:shadow-md transition-all border-l-4 ${statusCfg.borderClass}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        {/* Top left: Client & Description */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${statusCfg.badgeClass}`}
            >
              {statusCfg.label}
            </span>

            {transaction.category && (
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold flex items-center gap-1">
                <Tag className="w-3 h-3 text-slate-400" />
                {transaction.category}
              </span>
            )}

            {transaction.origin && transaction.origin !== 'manual' && (
              <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold flex items-center gap-1">
                <FileText className="w-3 h-3 text-amber-600" />
                {originLabels[transaction.origin] || transaction.origin}
              </span>
            )}
          </div>

          <h3 className="text-base font-black text-slate-900 tracking-tight leading-snug">
            {transaction.description}
          </h3>

          {transaction.clientName && (
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>{transaction.clientName}</span>
            </div>
          )}
        </div>

        {/* Top right: Amount */}
        <div className="text-left sm:text-right shrink-0">
          <div className="text-xs font-black uppercase tracking-widest text-slate-400">
            VALOR
          </div>
          <div className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
            {formatCurrency(transaction.amount)}
          </div>
        </div>
      </div>

      {/* Middle info bar */}
      <div className="py-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs font-semibold text-slate-600">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-400" />
          <span>Vencimento:</span>
          <strong className="text-slate-900 font-bold">
            {formatDateMs(transaction.dueDate)}
          </strong>
        </div>

        {transaction.status === 'paid' && transaction.paymentDate && (
          <div className="flex items-center gap-2 text-emerald-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Recebido em:</span>
            <strong className="font-bold">
              {formatDateMs(transaction.paymentDate)}
            </strong>
          </div>
        )}

        {transaction.paymentMethod && (
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-slate-400" />
            <span>Forma:</span>
            <strong className="text-slate-900 font-bold uppercase">
              {paymentMethodLabels[transaction.paymentMethod] || transaction.paymentMethod}
            </strong>
          </div>
        )}
      </div>

      {/* Notes if present */}
      {transaction.notes && (
        <div className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl mb-3 border border-slate-100">
          <span className="font-bold text-slate-700">Obs:</span> {transaction.notes}
        </div>
      )}

      {/* Footer Actions */}
      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {/* Action: Registrar Pagamento */}
          {(derivedStatus === 'pending' || derivedStatus === 'overdue') && (
            <button
              onClick={() => onPay(transaction)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider h-9 px-4 rounded-xl shadow-sm transition-all flex items-center gap-1.5 active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4 text-white" />
              <span>REGISTRAR PAGAMENTO</span>
            </button>
          )}

          {transaction.status === 'paid' && (
            <div className="text-xs font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Pagamento Confirmado
            </div>
          )}

          {transaction.status === 'canceled' && (
            <div className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
              <Ban className="w-4 h-4" /> Lançamento Cancelado
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Link to OS */}
          {transaction.origin === 'service_order' && transaction.originId && (
            <button
              onClick={() => navigate('/app/orders')}
              className="p-2 rounded-xl text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-xs font-bold transition-all flex items-center gap-1"
              title="Ver Ordem de Serviço relacionada"
            >
              <ExternalLink className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden sm:inline">Ver OS</span>
            </button>
          )}

          {/* Edit */}
          {transaction.status !== 'canceled' && (
            <button
              onClick={() => onEdit(transaction)}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 text-xs font-bold transition-all flex items-center gap-1"
              title="Editar"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Editar</span>
            </button>
          )}

          {/* Cancel */}
          {transaction.status !== 'canceled' && (
            <button
              onClick={() => onCancel(transaction)}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-xs font-bold transition-all flex items-center gap-1"
              title="Cancelar Lançamento"
            >
              <Ban className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cancelar</span>
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};
