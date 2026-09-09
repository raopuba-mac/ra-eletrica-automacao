import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../../../components/ui/dialog';
import { Button } from '../../../../components/ui/button';
import { Client } from '../../Clients/types/client.types';
import {
  FinancialFormData,
  FinancialTransaction,
} from '../types/financial.types';
import {
  FINANCIAL_CATEGORIES,
  timestampToIso,
} from '../utils/financialUtils';

interface FinancialFormModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  clients: Client[];
  editingTransaction: FinancialTransaction | null;
  onSubmit: (formData: FinancialFormData) => Promise<void>;
}

export const FinancialFormModal: React.FC<FinancialFormModalProps> = ({
  isOpen,
  onOpenChange,
  clients,
  editingTransaction,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<FinancialFormData>({
    clientId: '',
    clientName: '',
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
    if (editingTransaction) {
      setFormData({
        clientId: editingTransaction.clientId || '',
        clientName: editingTransaction.clientName || '',
        description: editingTransaction.description || '',
        category: editingTransaction.category || FINANCIAL_CATEGORIES[0],
        amount: editingTransaction.amount ? String(editingTransaction.amount) : '',
        dueDate: timestampToIso(editingTransaction.dueDate),
        paymentMethod: editingTransaction.paymentMethod || '',
        notes: editingTransaction.notes || '',
      });
    } else {
      setFormData({
        clientId: '',
        clientName: '',
        description: '',
        category: FINANCIAL_CATEGORIES[0],
        amount: '',
        dueDate: timestampToIso(Date.now()),
        paymentMethod: '',
        notes: '',
      });
    }
    setErrorMsg('');
  }, [editingTransaction, isOpen]);

  const handleClientChange = (clientId: string) => {
    if (!clientId) {
      setFormData((prev) => ({ ...prev, clientId: '', clientName: '' }));
      return;
    }
    const found = clients.find((c) => c.id === clientId);
    setFormData((prev) => ({
      ...prev,
      clientId,
      clientName: found ? found.name : '',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

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
      console.error('Error submitting transaction:', err);
      setErrorMsg(err.message || 'Erro ao salvar lançamento financeiro.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-slate-900 border-slate-800 text-white rounded-3xl p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-black italic tracking-tight uppercase text-white">
            {editingTransaction ? 'Editar Receita' : 'Nova Receita a Receber'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {errorMsg && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold p-3 rounded-xl">
              {errorMsg}
            </div>
          )}

          {/* Cliente (Opcional) */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-400">
              Cliente (Opcional)
            </label>
            <select
              value={formData.clientId}
              onChange={(e) => handleClientChange(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-[#EAB308]"
            >
              <option value="">-- Sem vínculo com cliente --</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.phone ? `(${c.phone})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Descrição (Obrigatório) */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-400">
              Descrição da Receita *
            </label>
            <input
              type="text"
              placeholder="Ex: Instalação de Padrão Bifásico"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-[#EAB308]"
              required
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
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-[#EAB308]"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Vencimento */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                Data de Vencimento *
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, dueDate: e.target.value }))
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-[#EAB308]"
                required
              />
            </div>

            {/* Forma de Pagamento Prevista (Opcional) */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                Forma Prevista
              </label>
              <select
                value={formData.paymentMethod}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    paymentMethod: e.target.value as any,
                  }))
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-[#EAB308]"
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
              placeholder="Ex: Pagamento após vistoria da concessionária"
              value={formData.notes}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, notes: e.target.value }))
              }
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-[#EAB308]"
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
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#EAB308] hover:bg-[#ca8a04] text-slate-950 font-black text-xs uppercase tracking-wider px-6 h-11 rounded-xl shadow-md"
            >
              {loading
                ? 'Salvando...'
                : editingTransaction
                ? 'Salvar Alterações'
                : 'Cadastrar Receita'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
