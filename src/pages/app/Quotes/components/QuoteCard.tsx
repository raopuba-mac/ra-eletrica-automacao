import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Zap, CheckCircle, XCircle, Download, Edit, Trash2 } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { QuoteStatusBadge } from './QuoteStatusBadge';
import { Quote, Client, QuoteParsedDescription } from '../types/quote.types';

interface QuoteCardProps {
  quote: Quote;
  index: number;
  clients: Client[];
  updateStatus: (id: string, status: string) => Promise<void>;
  openEdit: (quote: Quote) => void;
  handleDelete: (id: string) => Promise<void>;
  shareWhatsApp: (quote: Quote) => Promise<void>;
}

export const QuoteCard: React.FC<QuoteCardProps> = ({
  quote,
  index,
  updateStatus,
  openEdit,
  handleDelete,
  shareWhatsApp,
}) => {
  const isJson = quote.description && (quote.description.startsWith('{') || quote.description.startsWith('['));
  let parsed: QuoteParsedDescription = {
    items: [],
    remarks: '',
    photo: '',
    photos: [],
    discount: 0,
    includesMaterial: false,
    applyCashDiscount: false,
    hideDetailedPrices: false,
  };

  try {
    if (isJson) {
      parsed = JSON.parse(quote.description);
    }
  } catch (e) {}

  return (
    <motion.div
      key={quote.id}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      className="group bg-[#1E293B] rounded-[2.5rem] shadow-xl border border-slate-800 hover:border-[#EAB308]/40 transition-all flex flex-col relative"
    >
      <div className="p-6 sm:p-8 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-8">
          <div className="h-14 w-14 bg-[#0B0F19] border border-slate-800 text-[#EAB308] rounded-[1.25rem] flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div className="ml-2 text-right">
            <QuoteStatusBadge status={quote.status} />
          </div>
        </div>

        <h3 className="font-black text-white text-2xl mb-2 tracking-tighter uppercase italic leading-none group-hover:text-[#EAB308] transition-colors">
          {quote.clientName}
        </h3>
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">
          Protocolo: {quote.id.slice(0, 8).toUpperCase()}
        </div>

        {isJson ? (
          <div className="space-y-4 flex-1 mb-6">
            <div className="bg-[#0B0F19] rounded-3xl p-5 border border-slate-800 space-y-3">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Serviços Inclusos:</span>
              <div className="space-y-2">
                {parsed.items?.map((it, i) => (
                  <div key={i} className="flex justify-between items-start text-xs text-slate-200 border-b border-slate-800/80 pb-1.5 last:border-0 last:pb-0">
                    <div className="flex-1 pr-2">
                      <span className="font-bold text-white">{it.name}</span>
                      {it.quantity > 1 && <span className="text-[10px] text-slate-400 font-mono ml-2">x{it.quantity}</span>}
                    </div>
                    {!parsed.hideDetailedPrices && (
                      <span className="font-bold text-[#EAB308] shrink-0 font-mono">
                        R$ {Number(it.price * (it.quantity || 1)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    )}
                  </div>
                ))}
              </div>
              {parsed.includesMaterial && (
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-[#EAB308] mt-1 border-t border-slate-800/80 pt-2">
                  <span>Material Incluso</span>
                  <span>Sim</span>
                </div>
              )}
              {parsed.applyCashDiscount && (
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-emerald-400 mt-1 border-t border-slate-800/80 pt-2">
                  <span>Desc. 15% à Vista</span>
                  <span>Ativo</span>
                </div>
              )}
              {parsed.discount > 0 && !parsed.hideDetailedPrices && (
                <div className="flex justify-between items-center text-xs border-t border-slate-800/80 pt-2 text-rose-400 font-bold">
                  <span>Desconto Aplicado</span>
                  <span>- R$ {Number(parsed.discount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              {parsed.remarks && (
                <div className="mt-2.5 pt-2.5 border-t border-slate-800 text-[11px] text-slate-300 italic leading-relaxed">
                  <span className="font-black not-italic text-[9px] uppercase tracking-wider text-slate-400 block mb-0.5">Observações:</span>
                  {parsed.remarks}
                </div>
              )}
            </div>

            {(() => {
              const quotePhotos = parsed.photos || (parsed.photo ? [parsed.photo] : []);
              if (quotePhotos.length === 0) return null;
              return (
                <div className="space-y-2">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Fotos Relacionadas:</span>
                  <div className="grid grid-cols-2 gap-2">
                    {quotePhotos.map((pUrl, pIdx) => (
                      <div key={pIdx} className="rounded-2xl overflow-hidden border border-slate-800 shadow-sm aspect-video bg-[#0B0F19] relative group/pic">
                        <img src={pUrl} alt={`Foto ${pIdx + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        ) : (
          <div className="flex-1 bg-[#0B0F19] p-6 rounded-3xl border border-slate-800 mb-8">
            <p className="text-sm text-slate-300 font-medium italic leading-relaxed line-clamp-4">{quote.description}</p>
          </div>
        )}

        <div className="flex items-center justify-between p-6 bg-[#0B0F19] border border-slate-800 rounded-[1.5rem] text-white relative overflow-hidden group/price">
          <div>
            <div className="text-[8px] font-black uppercase tracking-[0.3em] text-[#EAB308] mb-1">Investimento Est.</div>
            <div className="text-2xl font-black italic tracking-tighter text-[#EAB308]">
              R$ {Number(quote.totalAmount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#EAB308]/10 flex items-center justify-center text-[#EAB308] border border-[#EAB308]/20">
            <Zap className="w-5 h-5 fill-current" />
          </div>
        </div>

        <div className="flex flex-wrap xl:flex-nowrap items-center gap-2 pt-6 mt-4 border-t border-slate-800">
          {quote.status === 'pending' ? (
            <div className="flex gap-2 flex-1 min-w-[180px]">
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 shrink-0 font-black text-[10px] sm:text-xs xl:text-[10px] uppercase tracking-widest h-11 bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 hover:bg-emerald-600 hover:text-white rounded-2xl transition-all"
                onClick={() => updateStatus(quote.id, 'approved')}
              >
                <CheckCircle className="w-4 h-4 mr-1 sm:mr-2"/> Aprovar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 shrink-0 font-black text-[10px] sm:text-xs xl:text-[10px] uppercase tracking-widest h-11 bg-rose-950/80 text-rose-400 border border-rose-800/80 hover:bg-rose-600 hover:text-white rounded-2xl transition-all"
                onClick={() => updateStatus(quote.id, 'rejected')}
              >
                <XCircle className="w-4 h-4 mr-1 sm:mr-2"/> Recusar
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 shrink-0 min-w-[180px] font-black text-[10px] sm:text-xs xl:text-[10px] uppercase tracking-widest h-11 text-slate-300 border-slate-800 bg-[#0B0F19] hover:bg-slate-800 rounded-2xl"
              onClick={() => updateStatus(quote.id, 'pending')}
            >
              Reabrir Proposta
            </Button>
          )}

          <div className="flex gap-1 shrink-0 ml-auto">
            <Button
              variant="ghost"
              size="icon"
              title="Baixar PDF e Enviar WhatsApp"
              onClick={() => shareWhatsApp(quote)}
              className="h-11 w-11 shrink-0 bg-[#25D366] hover:bg-[#1DA851] text-white rounded-2xl shadow-xl flex flex-col items-center justify-center"
            >
              <Download className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => openEdit(quote)}
              className="h-11 w-11 shrink-0 bg-[#0B0F19] text-slate-300 hover:text-white border border-slate-800 rounded-2xl"
            >
              <Edit className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDelete(quote.id)}
              className="h-11 w-11 shrink-0 bg-[#0B0F19] hover:bg-rose-950/80 text-slate-300 hover:text-rose-400 border border-slate-800 rounded-2xl"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
