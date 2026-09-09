import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import { AlertTriangle, Zap } from 'lucide-react';
import { PageHeader } from '../../components/PageHeader';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';

import { useServiceOrders } from './ServiceOrders/hooks/useServiceOrders';
import { generateServiceOrderPDF } from './ServiceOrders/services/serviceOrderPdfService';
import { shareWhatsApp } from './ServiceOrders/utils/serviceOrderUtils';
import { ServiceOrderCard } from './ServiceOrders/components/ServiceOrderCard';
import { ServiceOrderForm } from './ServiceOrders/components/ServiceOrderForm';
import { ServiceOrderPDF } from './ServiceOrders/components/ServiceOrderPDF';
import { ServiceOrder, ServiceOrderFormData } from './ServiceOrders/types/serviceOrder.types';
import { GenerateOSReceivableModal, GenerateOSReceivableFormData } from './ServiceOrders/components/GenerateOSReceivableModal';
import { FinancialPayModal } from './Financial/components/FinancialPayModal';
import { FinancialToast } from './Financial/components/FinancialToast';
import { FinancialTransaction, PaymentFormData } from './Financial/types/financial.types';

export default function ServiceOrders() {
  const navigate = useNavigate();
  const {
    user,
    orders,
    clients,
    saveServiceOrder,
    deleteServiceOrder,
    getLinkedFinancialTransaction,
    createOSReceivable,
    registerPaymentForOS,
  } = useServiceOrders();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isPdfSelectOpen, setIsPdfSelectOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  const [editingOrder, setEditingOrder] = useState<ServiceOrder | null>(null);

  // Financial Integration Modals State
  const [orderForReceivable, setOrderForReceivable] = useState<ServiceOrder | null>(null);
  const [isReceivableModalOpen, setIsReceivableModalOpen] = useState(false);

  const [transactionToPay, setTransactionToPay] = useState<FinancialTransaction | null>(null);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);

  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success',
  });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
  };

  const handleFormSubmit = async (
    formData: ServiceOrderFormData,
    photos: string[],
    photosAfter: string[]
  ) => {
    await saveServiceOrder(editingOrder, formData, photos, photosAfter);
    setEditingOrder(null);
  };

  const confirmDelete = (id: string) => {
    setOrderToDelete(id);
    setIsConfirmDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!orderToDelete) return;
    await deleteServiceOrder(orderToDelete);
    setIsConfirmDeleteOpen(false);
    setOrderToDelete(null);
  };

  const openEdit = (order: ServiceOrder) => {
    setEditingOrder(order);
    setIsDialogOpen(true);
  };

  const openCreate = () => {
    setEditingOrder(null);
    setIsDialogOpen(true);
  };

  const handleGeneratePdf = (order: ServiceOrder) => {
    generateServiceOrderPDF(order, clients, user);
  };

  const handleShareWhatsApp = (order: ServiceOrder, financialTx?: FinancialTransaction | null) => {
    shareWhatsApp(order, clients, financialTx);
  };

  // Financial handlers
  const handleOpenGenerateReceivable = (order: ServiceOrder) => {
    setOrderForReceivable(order);
    setIsReceivableModalOpen(true);
  };

  const handleSubmitOSReceivable = async (formData: GenerateOSReceivableFormData) => {
    if (!orderForReceivable) return;
    await createOSReceivable(orderForReceivable, formData);
    showToast('Conta a Receber gerada com sucesso no Financeiro!', 'success');
  };

  const handleOpenRegisterPayment = (tx: FinancialTransaction) => {
    setTransactionToPay(tx);
    setIsPayModalOpen(true);
  };

  const handleConfirmPay = async (paymentData: PaymentFormData) => {
    if (!transactionToPay) return;
    await registerPaymentForOS(transactionToPay.id, paymentData);
    showToast('Pagamento confirmado e atualizado no Financeiro!', 'success');
  };

  const handleNavigateFinancial = () => {
    navigate('/app/financial');
  };

  return (
    <div className="space-y-10">
      <PageHeader 
        title="Gestão de Serviços" 
        description="Controle operacional de ordens de serviço, manutenção e instalações com integração financeira."
        action={
          <div className="flex flex-wrap items-center gap-4">
            <ServiceOrderPDF
              orders={orders}
              clients={clients}
              onGeneratePdf={handleGeneratePdf}
              isOpen={isPdfSelectOpen}
              onOpenChange={setIsPdfSelectOpen}
            />

            <ServiceOrderForm
              isOpen={isDialogOpen}
              onOpenChange={setIsDialogOpen}
              editingOrder={editingOrder}
              clients={clients}
              onSubmit={handleFormSubmit}
              onOpenCreate={openCreate}
            />
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <AnimatePresence>
          {orders.map((order, idx) => {
            const linkedTx = getLinkedFinancialTransaction(order.id);
            return (
              <ServiceOrderCard
                key={order.id}
                order={order}
                clients={clients}
                index={idx}
                financialTransaction={linkedTx}
                onGeneratePdf={handleGeneratePdf}
                onConfirmDelete={confirmDelete}
                onEdit={openEdit}
                onShareWhatsApp={handleShareWhatsApp}
                onGenerateReceivable={handleOpenGenerateReceivable}
                onRegisterPayment={handleOpenRegisterPayment}
                onNavigateFinancial={handleNavigateFinancial}
              />
            );
          })}
        </AnimatePresence>
        
        {orders.length === 0 && (
          <div className="col-span-full py-40 text-center bg-slate-50 border-4 border-dashed rounded-[3rem] border-slate-100 space-y-4">
             <div className="p-6 bg-white rounded-3xl shadow-xl shadow-slate-200 inline-block mb-4">
                <Zap className="w-12 h-12 text-slate-200 opacity-50" />
             </div>
             <h3 className="text-slate-900 font-black text-2xl tracking-tighter uppercase italic">Operação em Standby</h3>
             <p className="text-slate-400 text-sm font-medium italic max-w-xs mx-auto leading-relaxed">Você ainda não registrou Ordens de Serviço. Use o botão superior para começar agora.</p>
          </div>
        )}
      </div>

      {/* Generate Receivable Modal */}
      <GenerateOSReceivableModal
        isOpen={isReceivableModalOpen}
        onOpenChange={setIsReceivableModalOpen}
        order={orderForReceivable}
        clients={clients}
        existingTransaction={
          orderForReceivable ? getLinkedFinancialTransaction(orderForReceivable.id) : null
        }
        onSubmit={handleSubmitOSReceivable}
      />

      {/* Pay Modal */}
      <FinancialPayModal
        isOpen={isPayModalOpen}
        onOpenChange={setIsPayModalOpen}
        transaction={transactionToPay}
        onConfirmPay={handleConfirmPay}
      />

      {/* Delete Confirmation Modal */}
      <Dialog open={isConfirmDeleteOpen} onOpenChange={setIsConfirmDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="w-5 h-5" /> Confirmar Exclusão
            </DialogTitle>
            <DialogDescription className="pt-2 font-medium">
              Tem certeza que deseja excluir esta Ordem de Serviço? Todos os dados vinculados, incluindo fotos anexadas, serão removidos permanentemente. (Lançamentos no financeiro permanecem arquivados caso existam).
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-3 sm:gap-0">
            <Button variant="outline" className="flex-1 font-bold" onClick={() => setIsConfirmDeleteOpen(false)}>Cancelar</Button>
            <Button variant="destructive" className="flex-1 font-bold" onClick={handleDelete}>Excluir OS</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Toast Notification */}
      <FinancialToast toast={toast} onClose={() => setToast((prev) => ({ ...prev, show: false }))} />
    </div>
  );
}
