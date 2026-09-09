import React from 'react';
import { Label } from '../../../../components/ui/label';
import { Input } from '../../../../components/ui/input';
import { Button } from '../../../../components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { QuoteItem } from '../types/quote.types';

interface QuoteItemsTableProps {
  items: QuoteItem[];
  setItems: React.Dispatch<React.SetStateAction<QuoteItem[]>>;
}

export const QuoteItemsTable: React.FC<QuoteItemsTableProps> = ({ items, setItems }) => {
  return (
    <div className="space-y-3">
      <Label className="text-[10px] font-black text-slate-300 uppercase tracking-widest pl-1 flex justify-between items-center">
        <span>Lista de Serviços / Produtos *</span>
      </Label>
      <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1">
        {items.map((it, idx) => (
          <div key={it.id} className="flex gap-2 items-center">
            <Input 
              placeholder="Ex: Instalação de painel" 
              className="flex-1 h-11 border-slate-800 bg-[#0B0F19] !text-white rounded-xl text-xs font-semibold placeholder:text-slate-500 focus:ring-[#EAB308] focus:border-[#EAB308]"
              value={it.name}
              onChange={(e) => {
                const newItems = [...items];
                newItems[idx].name = e.target.value;
                setItems(newItems);
              }}
              required
            />
            <Input 
              placeholder="Qtd" 
              type="number"
              className="w-16 h-11 border-slate-800 bg-[#0B0F19] !text-white rounded-xl text-center text-xs font-black placeholder:text-slate-500 focus:ring-[#EAB308] focus:border-[#EAB308]"
              value={it.quantity || ''}
              onChange={(e) => {
                const newItems = [...items];
                newItems[idx].quantity = Number(e.target.value) || 1;
                setItems(newItems);
              }}
              required
            />
            <Input 
              placeholder="Preço R$" 
              type="number"
              className="w-24 h-11 border-slate-800 bg-[#0B0F19] !text-[#EAB308] rounded-xl text-center text-xs font-black placeholder:text-slate-500 focus:ring-[#EAB308] focus:border-[#EAB308] font-mono"
              value={it.price || ''}
              onChange={(e) => {
                const newItems = [...items];
                newItems[idx].price = Number(e.target.value) || 0;
                setItems(newItems);
              }}
              required
            />
            {items.length > 1 && (
              <Button 
                type="button" 
                variant="ghost" 
                size="icon" 
                onClick={() => setItems(items.filter(item => item.id !== it.id))}
                className="h-11 w-11 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        ))}
      </div>
      <Button 
        type="button" 
        variant="outline" 
        onClick={() => setItems([...items, { id: String(Date.now()), name: '', quantity: 1, price: 0 }])}
        className="w-full text-xs font-bold border-dashed border-slate-700 bg-[#0B0F19]/60 text-slate-300 hover:text-white hover:border-[#EAB308]/60 hover:bg-[#0B0F19] h-11 rounded-xl flex items-center justify-center gap-1.5 transition-all"
      >
        <Plus className="w-4 h-4 text-[#EAB308]" /> Adicionar Serviço ao Orçamento
      </Button>
    </div>
  );
};
