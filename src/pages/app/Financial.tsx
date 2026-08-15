import React from 'react';
import { Plus, DollarSign, Wallet } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { Button } from '../../components/ui/button';
import { PageHeader } from '../../components/PageHeader';
import { useFinancial } from './Financial/hooks/useFinancial';
import { FinancialSummaryCards } from './Financial/components/FinancialSummaryCards';
import { FinancialTransactionFilters } from './Financial/components/FinancialTransactionFilters';
import { FinancialTransactionCard } from './Financial/components/FinancialTransactionCard';
import { FinancialFormModal } from './Financial/components/FinancialFormModal';
import { FinancialPayModal } from './Financial/components/FinancialPayModal';
import { FinancialToast } from './Financial/components/FinancialToast';

export default function Financial() {
  const {
    loading,
    filteredTransactions,
    clients,
    summary,
    counts,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    isFormModalOpen,
    setIsFormModalOpen,
    editingTransaction,
    isPayModalOpen,
    setIsPayModalOpen,
    payingTransaction,
    toast,
    setToast,
    handleOpenCreateModal,
    handleOpenEditModal,
    handleOpenPayModal,
    handleFormSubmit,
    handleConfirmPay,
    handleCancelTransaction,
  } = useFinancial();

  return (
    <div className="space-y-6 pb-12">
      {/* Header with "+ Nova Receita" button */}
      <PageHeader
        title="Financeiro & Contas a Receber"
        description="Gestão de receitas, faturamento pendente, pagamentos confirmados e cobranças."
        action={
          <Button
            size="lg"
            onClick={handleOpenCreateModal}
            className="bg-[#EAB308] hover:bg-[#ca8a04] text-slate-950 font-black uppercase tracking-widest text-xs h-14 px-6 rounded-2xl shadow-xl shadow-[#EAB308]/20 italic flex items-center gap-2"
          >
            <Plus className="w-5 h-5" /> Nova Receita
          </Button>
        }
      />

      {/* Summary Cards */}
      <FinancialSummaryCards summary={summary} />

      {/* Filters (Search & Status Tabs) */}
      <FinancialTransactionFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        counts={counts}
      />

      {/* Transactions List / Cards */}
      {loading ? (
        <div className="flex items-center justify-center p-12 bg-white rounded-3xl border border-slate-200">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-[#EAB308]/20 border-t-[#EAB308] rounded-full animate-spin"></div>
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
              Carregando Lançamentos...
            </span>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredTransactions.map((t) => (
              <FinancialTransactionCard
                key={t.id}
                transaction={t}
                onPay={handleOpenPayModal}
                onEdit={handleOpenEditModal}
                onCancel={handleCancelTransaction}
              />
            ))}
          </AnimatePresence>

          {filteredTransactions.length === 0 && (
            <div className="py-12 px-4 text-center bg-white border-2 border-dashed border-slate-200 rounded-3xl text-slate-500 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-700">
                  Nenhum lançamento financeiro encontrado.
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Clique no botão "+ Nova Receita" acima para cadastrar uma conta a receber.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <FinancialFormModal
        isOpen={isFormModalOpen}
        onOpenChange={setIsFormModalOpen}
        clients={clients}
        editingTransaction={editingTransaction}
        onSubmit={handleFormSubmit}
      />

      <FinancialPayModal
        isOpen={isPayModalOpen}
        onOpenChange={setIsPayModalOpen}
        transaction={payingTransaction}
        onConfirmPay={handleConfirmPay}
      />

      {/* Toast Notification */}
      <FinancialToast
        toast={toast}
        onClose={() => setToast((prev) => ({ ...prev, show: false }))}
      />
    </div>
  );
}
