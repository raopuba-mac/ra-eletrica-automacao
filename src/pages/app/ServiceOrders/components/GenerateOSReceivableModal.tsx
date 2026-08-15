import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../../../components/ui/dialog';
import { Button } from '../../../../components/ui/button';
import { DollarSign, AlertCircle, FileText, Calendar, User } from 'lucide-react';
import { ServiceOrder, Client } from '../types/serviceOrder.types';
import { FinancialTransaction, PaymentMethod } from '../../Financial/types/financial.types';
import { FINANCIAL_CATEGORIES, timestampToIso } from '../../Financial/utils/financialUtils';

export interface GenerateOSReceivableFormData {
  description: string;
  category: string;
  amount: string;
  dueDate: string;
  paymentMethod: PaymentMethod | '';
  notes: string;
}

interface GenerateOSReceivableModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  order: ServiceOrder | null;
  clients: Client[];
  existingTransaction?: FinancialTransaction | null;
  onSubmit: (formData: GenerateOSReceivableFormData) => Promise<void>;
}

export const GenerateOSReceivableModal: React.FC<GenerateOSReceivableModalProps> = ({
  isOpen,
  onOpenChange,
  order,
  clients,
  existingTransaction,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<GenerateOSReceivableFormData>({
    description: '',
    category: FINANCIAL_CATEGORIES[0],
    amount: '',
    dueDate: timestampToIso(Date.now()),
    paymentMethod: '',
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (order && isOpen) {
      const clientObj = clients.find((c) => c.id === order.clientId);
      const clientName = clientObj ? clientObj.name : '';
      const orderProto = order.id ? order.id.slice(0, 8).toUpperCase() : '';

      setFormData({
        description: `OS #${orderProto} - ${order.description.slice(0, 80)}`,
        category: FINANCIAL_CATEGORIES[0],
        amount: order.finalPrice ? String(order.finalPrice) : '',
        dueDate: order.scheduledDate || timestampToIso(Date.now()),
        paymentMethod: '',
        notes: `Gerado a partir da Ordem de Serviço #${orderProto}${clientName ? ` (${clientName})` : ''}`,
      });
      setErrorMsg('');
    }
  }, [order, isOpen, clients]);

  if (!order) return null;

  const clientName = clients.find((c) => c.id === order.clientId)?.name || 'Cliente não vinculado';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (existingTransaction && existingTransaction.status !== 'canceled') {
      setErrorMsg('Esta Ordem de Serviço já possui um lançamento financeiro vinculado.');
      return;
    }

    if (!formData.description.trim()) {
      setErrorMsg('Informe a descrição da receita.');
      return;
    }

    const numAmount = parseFloat(formData.amount.replace(',', '.'));
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMsg('Informe um valor válido maior que zero.');
      return;
    }

    if (!formData.dueDate) {
      setErrorMsg('Informe a data de vencimento.');
      return;
    }

    try {
      setLoading(true);
      await onSubmit(formData);
      onOpenChange(false);
    } catch (err: any) {
      console.error('Error generating receivable from OS:', err);
      setErrorMsg(err.message || 'Erro ao gerar conta a receber.');
    } finally {
      setLoading(false);
    }
  };

  const isAlreadyLinked = Boolean(existingTransaction && existingTransaction.status !== 'canceled');

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-slate-900 border-slate-800 text-white rounded-3xl p-6">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EAB308]/20 text-[#EAB308] border border-[#EAB308]/30 flex items-center justify-center shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-black italic tracking-tight uppercase text-white">
                Gerar Conta a Receber
              </DialogTitle>
              <p className="text-xs font-semibold text-slate-400">
                Vincular receita no financeiro para a OS #{order.id.slice(0, 8).toUpperCase()}
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Warning Banner if already linked */}
          {isAlreadyLinked && (
            <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold p-3.5 rounded-xl flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>Esta Ordem de Serviço já possui um lançamento financeiro vinculado.</span>
            </div>
          )}

          {errorMsg && !isAlreadyLinked && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold p-3 rounded-xl">
              {errorMsg}
            </div>
          )}

          {/* Cliente Info (Readonly) */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#EAB308]" /> Cliente Vinculado
            </label>
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white">
              {clientName}
            </div>
          </div>

          {/* Descrição */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#EAB308]" /> Descrição da Receita *
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-[#EAB308]"
              required
              disabled={isAlreadyLinked}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Categoria */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                Categoria
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, category: e.target.value }))
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-[#EAB308]"
                disabled={isAlreadyLinked}
              >
                {FINANCIAL_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Valor R$ */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                Valor (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, amount: e.target.value }))
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-[#EAB308]"
                required
                disabled={isAlreadyLinked}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Data de Vencimento */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#EAB308]" /> Vencimento *
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, dueDate: e.target.value }))
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-[#EAB308]"
                required
                disabled={isAlreadyLinked}
              />
            </div>

            {/* Forma Prevista */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                Forma Prevista
              </label>
              <select
                value={formData.paymentMethod}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    paymentMethod: e.target.value as PaymentMethod,
                  }))
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-[#EAB308]"
                disabled={isAlreadyLinked}
              >
                <option value="">A combinar</option>
                <option value="pix">PIX</option>
                <option value="cash">Dinheiro</option>
                <option value="card">Cartão</option>
                <option value="transfer">Transferência</option>
                <option value="other">Outro</option>
              </select>
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-400">
              Observações (Opcional)
            </label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, notes: e.target.value }))
              }
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-[#EAB308]"
              disabled={isAlreadyLinked}
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-slate-400 hover:text-white font-bold text-xs"
              disabled={loading}
            >
              Cancelar
            </Button>

            {!isAlreadyLinked && (
              <Button
                type="submit"
                disabled={loading}
                className="bg-[#EAB308] hover:bg-[#ca8a04] text-slate-950 font-black text-xs uppercase tracking-wider px-6 h-11 rounded-xl shadow-md"
              >
                {loading ? 'Gerando...' : 'Confirmar e Gerar Receita'}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
