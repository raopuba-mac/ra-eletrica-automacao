import React from 'react';
import { Users, Phone, Wrench, MapPin, Zap, FileText, Check, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';

interface DashboardQuickIntakeProps {
  quickClientName: string;
  setQuickClientName: (v: string) => void;
  quickClientPhone: string;
  setQuickClientPhone: (v: string) => void;
  quickClientAddress: string;
  setQuickClientAddress: (v: string) => void;
  quickDescription: string;
  setQuickDescription: (v: string) => void;
  quickType: 'os' | 'quote';
  setQuickType: (v: 'os' | 'quote') => void;
  isQuickSubmitting: boolean;
  quickSuccess: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export const DashboardQuickIntake: React.FC<DashboardQuickIntakeProps> = ({
  quickClientName,
  setQuickClientName,
  quickClientPhone,
  setQuickClientPhone,
  quickClientAddress,
  setQuickClientAddress,
  quickDescription,
  setQuickDescription,
  quickType,
  setQuickType,
  isQuickSubmitting,
  quickSuccess,
  onSubmit,
}) => {
  return (
    <Card className="border border-slate-200 shadow-md rounded-[2rem] overflow-hidden bg-white">
      <div className="bg-slate-900 text-white p-6 md:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-12 h-12 bg-[#EAB308]/20 rounded-2xl flex items-center justify-center text-[#EAB308] border border-[#EAB308]/40 shrink-0">
            <Zap className="w-6 h-6 fill-current animate-pulse" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg md:text-xl font-[1000] tracking-tighter uppercase italic leading-none mb-1 text-white">Atendimento Rápido (On-site)</h2>
            <p className="text-[10px] text-slate-300 font-bold uppercase tracking-wider leading-tight">Abertura de ordens de serviço e orçamentos em 1 toque na frente do cliente</p>
          </div>
        </div>
        <div className="hidden sm:block shrink-0 self-start sm:self-auto">
          <span className="text-[11px] md:text-xs bg-slate-800 text-[#EAB308] font-black tracking-widest uppercase px-3.5 py-2 rounded-xl border border-slate-700 whitespace-nowrap">
            Smartphone Otimizado
          </span>
        </div>
      </div>

      <CardContent className="p-6 md:p-8 bg-white">
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-700 uppercase tracking-widest flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-[#ca8a04]" /> NOME DO CLIENTE *
              </label>
              <input 
                type="text" 
                value={quickClientName} 
                onChange={e => setQuickClientName(e.target.value)}
                placeholder="Ex: Carlos Eduardo (Condomínio)"
                required
                className="w-full h-12 px-4 rounded-xl border border-slate-300 bg-slate-50 focus:border-[#EAB308] focus:bg-white text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#EAB308]/30 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-700 uppercase tracking-widest flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-[#ca8a04]" /> WHATSAPP / TELEFONE
              </label>
              <input 
                type="text" 
                value={quickClientPhone} 
                onChange={e => setQuickClientPhone(e.target.value)}
                placeholder="Ex: (11) 99999-9999"
                className="w-full h-12 px-4 rounded-xl border border-slate-300 bg-slate-50 focus:border-[#EAB308] focus:bg-white text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#EAB308]/30 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-700 uppercase tracking-widest flex items-center gap-1">
                <Wrench className="w-3.5 h-3.5 text-[#ca8a04]" /> O QUE PRECISA SER FEITO? *
              </label>
              <input 
                type="text" 
                value={quickDescription} 
                onChange={e => setQuickDescription(e.target.value)}
                placeholder="Ex: Instalar 3 refletores de LED na fachada e trocar disjuntor"
                required
                className="w-full h-12 px-4 rounded-xl border border-slate-300 bg-slate-50 focus:border-[#EAB308] focus:bg-white text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#EAB308]/30 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-700 uppercase tracking-widest flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#ca8a04]" /> ENDEREÇO (OPCIONAL)
              </label>
              <input 
                type="text" 
                value={quickClientAddress} 
                onChange={e => setQuickClientAddress(e.target.value)}
                placeholder="Ex: Av. Paulista, 1000 - Bairro Centro"
                className="w-full h-12 px-4 rounded-xl border border-slate-300 bg-slate-50 focus:border-[#EAB308] focus:bg-white text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#EAB308]/30 transition-all"
              />
            </div>
          </div>

          <div className="pt-2">
            <label className="text-[11px] font-black text-slate-700 uppercase tracking-widest block mb-3">TIPO DE ATENDIMENTO</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setQuickType('os')}
                className={`p-4 rounded-2xl border text-left transition-all relative flex flex-col gap-2 ${
                  quickType === 'os' 
                    ? 'border-[#EAB308] bg-amber-50 text-slate-900 ring-2 ring-[#EAB308]/30' 
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Zap className={`w-5 h-5 ${quickType === 'os' ? 'text-[#ca8a04] fill-current' : 'text-slate-400'}`} />
                  {quickType === 'os' && <Check className="w-4 h-4 text-[#ca8a04]" />}
                </div>
                <div>
                  <span className="text-xs font-black uppercase tracking-wider block text-slate-900">Ordem de Serviço (OS)</span>
                  <span className="text-[10px] opacity-80 font-medium text-slate-600">Para serviços agendados ou imediatos</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setQuickType('quote')}
                className={`p-4 rounded-2xl border text-left transition-all relative flex flex-col gap-2 ${
                  quickType === 'quote' 
                    ? 'border-purple-500 bg-purple-50 text-slate-900 ring-2 ring-purple-500/30' 
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <FileText className={`w-5 h-5 ${quickType === 'quote' ? 'text-purple-600' : 'text-slate-400'}`} />
                  {quickType === 'quote' && <Check className="w-4 h-4 text-purple-600" />}
                </div>
                <div>
                  <span className="text-xs font-black uppercase tracking-wider block text-slate-900">Orçamento</span>
                  <span className="text-[10px] opacity-80 font-medium text-slate-600">Levantamento de materiais e preços</span>
                </div>
              </button>
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={isQuickSubmitting || quickSuccess}
            className={`w-full py-7 font-black text-xs uppercase tracking-[0.25em] rounded-2xl shadow-md transition-all h-14 ${
              quickSuccess 
                ? 'bg-emerald-600 hover:bg-emerald-600 text-white' 
                : 'bg-[#EAB308] hover:bg-[#ca8a04] text-slate-950 shadow-[#EAB308]/20'
            }`}
          >
            {isQuickSubmitting ? (
              'REGISTRANDO...'
            ) : quickSuccess ? (
              <span className="flex items-center justify-center gap-2">
                <Check className="w-5 h-5" /> ATENDIMENTO CRIADO COM SUCESSO!
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2 italic">
                Criar Atendimento e Ir <ChevronRight className="w-4 h-4" />
              </span>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
