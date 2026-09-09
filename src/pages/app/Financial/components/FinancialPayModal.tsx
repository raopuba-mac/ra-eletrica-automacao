import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../../../components/ui/dialog';
import { Button } from '../../../../components/ui/button';
import { CheckCircle2, CreditCard, Calendar, User } from 'lucide-react';
import {
  FinancialTransaction,
  PaymentMethod,
  PaymentFormData,
} from '../types/financial.types';
import { formatCurrency, timestampToIso } from '../utils/financialUtils';

interface FinancialPayModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: FinancialTransaction | null;
  onConfirmPay: (paymentData: PaymentFormData) => Promise<void>;
}

export const FinancialPayModal: React.FC<FinancialPayModalProps> = ({
  isOpen,
  onOpenChange,
  transaction,
  onConfirmPay,
}) => {
  const [formData, setFormData] = useState<PaymentFormData>({
    paymentDate: timestampToIso(Date.now()),
    paymentMethod: 'pix',
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setFormData({
        paymentDate: timestampToIso(Date.now()),
        paymentMethod: transaction?.paymentMethod || 'pix',
      });
      setErrorMsg('');
    }
  }, [isOpen, transaction]);

  if (!transaction) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.paymentDate) {
      setErrorMsg('Informe a data em que o valor foi recebido.');
      return;
    }

    try {
      setLoading(true);
      await onConfirmPay(formData);
      onOpenChange(false);
    } catch (err: any) {
      console.error('Error recording payment:', err);
      setErrorMsg(err.message || 'Erro ao registrar pagamento.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] bg-slate-900 border-slate-800 text-white rounded-3xl p-6">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-black italic tracking-tight uppercase text-white">
                Registrar Pagamento
              </DialogTitle>
              <p className="text-xs font-semibold text-slate-400">
                Confirme o recebimento deste lançamento.
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Transaction Summary Card */}
        <div className="bg-slate-800/80 border border-slate-700/80 p-4 rounded-2xl my-3 space-y-1.5">
          <div className="text-xs font-extrabold text-white">
            {transaction.description}
          </div>

          {transaction.clientName && (
            <div className="flex items-center gap-1.5 text-xs text-slate-300 font-semibold">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>{transaction.clientName}</span>
            </div>
          )}

          <div className="text-xl font-black text-emerald-400 tracking-tight pt-1">
            {formatCurrency(transaction.amount)}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold p-3 rounded-xl">
              {errorMsg}
            </div>
          )}

          {/* Data do Pagamento */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              Data do Recebimento *
            </label>
            <input
              type="date"
              value={formData.paymentDate}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, paymentDate: e.target.value }))
              }
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500"
              required
            />
          </div>

          {/* Forma de Pagamento */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
              Forma de Pagamento Recebida *
            </label>
            <select
              value={formData.paymentMethod}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  paymentMethod: e.target.value as PaymentMethod,
                }))
              }
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500"
              required
            >
              <option value="pix">PIX</option>
              <option value="cash">Dinheiro em Espécie</option>
              <option value="card">Cartão (Débito / Crédito)</option>
              <option value="transfer">Transferência / TED</option>
              <option value="other">Outro Método</option>
            </select>
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
            <Button
              type="submit"
              disabled={loading}
              className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs uppercase tracking-wider px-6 h-11 rounded-xl shadow-md"
            >
              {loading ? 'Confirmando...' : 'Confirmar Recebimento'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
