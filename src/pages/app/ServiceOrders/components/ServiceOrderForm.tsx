import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { Textarea } from '../../../../components/ui/textarea';
import { Dialog, DialogContent, DialogTrigger } from '../../../../components/ui/dialog';
import { ServiceOrder, Client, ServiceOrderFormData, ServiceOrderStatus } from '../types/serviceOrder.types';
import { PhotoUploadSection } from './PhotoUploadSection';

interface ServiceOrderFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingOrder: ServiceOrder | null;
  clients: Client[];
  onSubmit: (
    formData: ServiceOrderFormData,
    photos: string[],
    photosAfter: string[]
  ) => Promise<void>;
  onOpenCreate: () => void;
}

export const ServiceOrderForm: React.FC<ServiceOrderFormProps> = ({
  isOpen,
  onOpenChange,
  editingOrder,
  clients,
  onSubmit,
  onOpenCreate
}) => {
  const [form, setForm] = useState<ServiceOrderFormData>({
    clientId: '',
    description: '',
    status: 'scheduled',
    scheduledDate: '',
    scheduledTime: '',
    finalPrice: ''
  });
  const [attachments, setAttachments] = useState<string[]>([]);
  const [attachmentsAfter, setAttachmentsAfter] = useState<string[]>([]);

  useEffect(() => {
    if (editingOrder) {
      setForm({
        clientId: editingOrder.clientId || '',
        description: editingOrder.description || '',
        status: editingOrder.status || 'scheduled',
        scheduledDate: editingOrder.scheduledDate || '',
        scheduledTime: editingOrder.scheduledTime || '',
        finalPrice: editingOrder.finalPrice || ''
      });
      setAttachments(editingOrder.photos || []);
      setAttachmentsAfter(editingOrder.photosAfter || []);
    } else {
      setForm({
        clientId: '',
        description: '',
        status: 'scheduled',
        scheduledDate: '',
        scheduledTime: '',
        finalPrice: ''
      });
      setAttachments([]);
      setAttachmentsAfter([]);
    }
  }, [editingOrder, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(form, attachments, attachmentsAfter);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      onOpenChange(open);
    }}>
      <DialogTrigger
        render={
          <Button onClick={onOpenCreate} className="h-14 px-8 font-black uppercase tracking-widest bg-[#EAB308] hover:bg-[#ca8a04] text-[#0B0F19] rounded-2xl shadow-2xl shadow-[#EAB308]/20 italic">
            <Plus className="w-5 h-5 mr-3" /> Abrir Chamado
          </Button>
        }
      />
      <DialogContent className="max-h-[85vh] p-0 overflow-hidden rounded-[2.5rem] border-slate-800 bg-[#1E293B] text-white sm:max-w-xl">
         <div className="bg-[#0B0F19] p-8 text-white relative border-b border-slate-800">
            <div className="absolute inset-0 bg-dot-pattern opacity-10"></div>
            <div className="relative z-10 space-y-2">
               <div className="text-[10px] font-black text-[#EAB308] tracking-[0.4em] uppercase">Documentação Técnica</div>
               <h2 className="text-3xl font-black italic tracking-tighter uppercase text-white">{editingOrder ? 'Ajustar OS' : 'Protocolar OS'}</h2>
            </div>
         </div>

         <form onSubmit={handleSubmit} className="p-8 space-y-8 overflow-y-auto max-h-[calc(85vh-120px)] custom-scrollbar bg-[#1E293B]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-slate-300 uppercase tracking-widest pl-1">Cliente Solicitante *</Label>
                <Select onValueChange={(val) => setForm({...form, clientId: val})} value={form.clientId} required>
                  <SelectTrigger className="h-14 border-slate-800 bg-[#0B0F19] text-white rounded-2xl focus:ring-[#EAB308]">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-slate-800 bg-[#1E293B] text-white p-2">
                    {clients.map(c => (
                      <SelectItem key={c.id} value={c.id} className="rounded-xl focus:bg-[#EAB308] focus:text-[#0B0F19] py-3">{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black text-slate-300 uppercase tracking-widest pl-1">Status Operacional</Label>
                <Select onValueChange={(val: ServiceOrderStatus) => setForm({...form, status: val})} value={form.status}>
                  <SelectTrigger className="h-14 border-slate-800 bg-[#0B0F19] text-white rounded-2xl focus:ring-[#EAB308]"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-2xl border-slate-800 bg-[#1E293B] text-white p-2">
                    <SelectItem value="scheduled" className="rounded-xl focus:bg-amber-500 focus:text-white py-3">Agendado</SelectItem>
                    <SelectItem value="in_progress" className="rounded-xl focus:bg-blue-500 focus:text-white py-3">Em Andamento</SelectItem>
                    <SelectItem value="completed" className="rounded-xl focus:bg-emerald-500 focus:text-white py-3">Concluído</SelectItem>
                    <SelectItem value="cancelled" className="rounded-xl focus:bg-rose-500 focus:text-white py-3">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-slate-300 uppercase tracking-widest pl-1">Data Agendada</Label>
                <Input
                  className="h-14 border-slate-800 bg-[#0B0F19] text-white rounded-2xl"
                  type="date"
                  value={form.scheduledDate}
                  onChange={e => setForm({...form, scheduledDate: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-slate-300 uppercase tracking-widest pl-1">Janela de Horário</Label>
                <Input
                  className="h-14 border-slate-800 bg-[#0B0F19] text-white rounded-2xl"
                  type="time"
                  value={form.scheduledTime}
                  onChange={e => setForm({...form, scheduledTime: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black text-slate-300 uppercase tracking-widest pl-1">Memorial Descritivo / Defeito *</Label>
              <Textarea
                className="min-h-[120px] border-slate-800 bg-[#0B0F19] text-white rounded-2xl p-4 focus:ring-[#EAB308] resize-none italic font-medium placeholder:text-slate-500"
                value={form.description}
                onChange={e => setForm({...form, description: e.target.value})}
                placeholder="Descreva o serviço a ser realizado ou o problema relatado..."
                required
              />
            </div>

            <PhotoUploadSection
              label="Evidências (Antes)"
              attachments={attachments}
              onChangeAttachments={setAttachments}
              accentColor="yellow"
              type="before"
              orderId={editingOrder?.id}
            />

            {form.status === 'completed' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8 pt-8 border-t border-slate-800"
              >
                <div className="space-y-2">
                   <Label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest pl-1 italic">Valor da Entrega (Investimento Final)</Label>
                   <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-emerald-400 italic">R$</div>
                      <Input
                         className="h-14 pl-12 border-emerald-900/50 bg-[#0B0F19] rounded-2xl focus:ring-emerald-500 font-black text-xl text-emerald-400"
                         type="number"
                         step="0.01"
                         value={form.finalPrice}
                         onChange={e => setForm({...form, finalPrice: e.target.value})}
                      />
                   </div>
                </div>

                <PhotoUploadSection
                  label="Evidências Finais (Depois)"
                  attachments={attachmentsAfter}
                  onChangeAttachments={setAttachmentsAfter}
                  accentColor="emerald"
                  type="after"
                  orderId={editingOrder?.id}
                />
              </motion.div>
            )}

            <Button type="submit" size="lg" className="w-full font-black italic uppercase h-16 rounded-3xl shadow-2xl shadow-[#EAB308]/20 tracking-tighter text-lg bg-[#EAB308] hover:bg-[#ca8a04] text-[#0B0F19] transition-all hover:scale-[1.01]">
              {editingOrder ? 'Salvar Certificação' : 'Protocolar Chamado'}
            </Button>
         </form>
      </DialogContent>
    </Dialog>
  );
};
