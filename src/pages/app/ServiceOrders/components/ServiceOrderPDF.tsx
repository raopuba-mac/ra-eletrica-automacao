import React, { useState } from 'react';
import { Printer } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Label } from '../../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../../../components/ui/dialog';
import { ServiceOrder, Client } from '../types/serviceOrder.types';
import { getClientName } from '../utils/serviceOrderUtils';

interface ServiceOrderPDFProps {
  orders: ServiceOrder[];
  clients: Client[];
  onGeneratePdf: (order: ServiceOrder) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ServiceOrderPDF: React.FC<ServiceOrderPDFProps> = ({
  orders,
  clients,
  onGeneratePdf,
  isOpen,
  onOpenChange
}) => {
  const [selectedOrderForPdf, setSelectedOrderForPdf] = useState<string>('');

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger
        render={
          <Button variant="outline" className="h-14 px-6 font-bold uppercase tracking-widest text-slate-200 bg-[#1E293B] border border-slate-800 hover:bg-[#283548] rounded-2xl shadow-sm italic transition-all">
            <Printer className="w-5 h-5 mr-3 text-[#EAB308]" /> Gerar PDF da OS
          </Button>
        }
      />
      <DialogContent className="p-8 rounded-[2.5rem] bg-[#1E293B] sm:max-w-md border-slate-800 shadow-2xl text-white">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-2xl font-black italic tracking-tighter uppercase text-white flex items-center gap-3">
            <Printer className="w-6 h-6 text-[#EAB308]" /> Relatório PDF de OS
          </DialogTitle>
          <DialogDescription className="text-slate-400 font-medium">
            Selecione uma ordem de serviço registrada para gerar um documento PDF técnico de alta fidelidade com fotos de antes e depois.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          <div className="space-y-2">
            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Selecione a Ordem de Serviço</Label>
            <Select
              onValueChange={setSelectedOrderForPdf}
              value={selectedOrderForPdf}
            >
              <SelectTrigger className="h-14 border-slate-800 bg-[#0B0F19] rounded-2xl focus:ring-[#EAB308] w-full text-left font-semibold text-white">
                <SelectValue placeholder="Escolha uma OS..." />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-slate-800 bg-[#1E293B] text-white p-2 max-h-[250px] overflow-y-auto">
                {orders.map(order => (
                  <SelectItem key={order.id} value={order.id} className="rounded-xl focus:bg-[#EAB308] focus:text-[#0B0F19] py-3">
                    {getClientName(clients, order.clientId)} - {order.scheduledDate ? new Date(order.scheduledDate + 'T00:00:00').toLocaleDateString('pt-BR') : 'Sem data'} ({order.id.slice(0, 5).toUpperCase()})
                  </SelectItem>
                ))}
                {orders.length === 0 && (
                  <div className="py-4 text-center text-slate-400 text-xs italic">Nenhuma OS encontrada</div>
                )}
              </SelectContent>
            </Select>
          </div>

          <Button
            disabled={!selectedOrderForPdf}
            onClick={() => {
              const order = orders.find(o => o.id === selectedOrderForPdf);
              if (order) onGeneratePdf(order);
              onOpenChange(false);
            }}
            className="w-full h-14 bg-[#EAB308] hover:bg-[#ca8a04] text-[#0B0F19] font-black uppercase text-xs tracking-[0.2em] rounded-2xl shadow-xl shadow-[#EAB308]/20 italic"
          >
            Gerar e Imprimir PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
