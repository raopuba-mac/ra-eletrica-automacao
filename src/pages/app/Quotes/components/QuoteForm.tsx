import React, { useState } from 'react';
import { Button } from '../../../../components/ui/button';
import { Label } from '../../../../components/ui/label';
import { Input } from '../../../../components/ui/input';
import { Textarea } from '../../../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { Camera, ImageIcon, Trash2, Zap, Loader2 } from 'lucide-react';
import { QuoteItemsTable } from './QuoteItemsTable';
import { VoiceBudgetModal } from './VoiceBudgetModal';
import { PointsCalculator } from './PointsCalculator';
import { resizeImage } from '../../../../lib/imageHandler';
import { storageService } from '../../../../services/storage/storageService';
import { useAuth } from '../../../../components/AuthProvider';
import { Client, Quote, QuoteItem, CalculatorPointsMap, PresetType } from '../types/quote.types';

interface QuoteFormProps {
  editingQuote: Quote | null;
  form: { clientId: string; totalAmount: number };
  setForm: React.Dispatch<React.SetStateAction<{ clientId: string; totalAmount: number }>>;
  clients: Client[];
  items: QuoteItem[];
  setItems: React.Dispatch<React.SetStateAction<QuoteItem[]>>;
  remarks: string;
  setRemarks: React.Dispatch<React.SetStateAction<string>>;
  photos: string[];
  setPhotos: React.Dispatch<React.SetStateAction<string[]>>;
  discount: number;
  setDiscount: React.Dispatch<React.SetStateAction<number>>;
  includesMaterial: boolean;
  setIncludesMaterial: React.Dispatch<React.SetStateAction<boolean>>;
  applyCashDiscount: boolean;
  setApplyCashDiscount: React.Dispatch<React.SetStateAction<boolean>>;
  hideDetailedPrices: boolean;
  setHideDetailedPrices: React.Dispatch<React.SetStateAction<boolean>>;
  isCalculatorActive: boolean;
  setIsCalculatorActive: (active: boolean) => void;
  calculatorPoints: CalculatorPointsMap;
  setCalculatorPoints: React.Dispatch<React.SetStateAction<CalculatorPointsMap>>;
  calculatorPreset: PresetType;
  handlePresetChange: (preset: PresetType) => void;
  handleApplyCalculator: () => void;
  // Voice AI Props
  isListening: boolean;
  toggleListening: () => void;
  isManualInputOpen: boolean;
  setIsManualInputOpen: (open: boolean) => void;
  transcriptionText: string;
  setTranscriptionText: React.Dispatch<React.SetStateAction<string>>;
  voiceLoading: boolean;
  processVoiceData: () => Promise<void>;
  // Form submission
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export const QuoteForm: React.FC<QuoteFormProps> = ({
  editingQuote,
  form,
  setForm,
  clients,
  items,
  setItems,
  remarks,
  setRemarks,
  photos,
  setPhotos,
  discount,
  setDiscount,
  includesMaterial,
  setIncludesMaterial,
  applyCashDiscount,
  setApplyCashDiscount,
  hideDetailedPrices,
  setHideDetailedPrices,
  isCalculatorActive,
  setIsCalculatorActive,
  calculatorPoints,
  setCalculatorPoints,
  calculatorPreset,
  handlePresetChange,
  handleApplyCalculator,
  isListening,
  toggleListening,
  isManualInputOpen,
  setIsManualInputOpen,
  transcriptionText,
  setTranscriptionText,
  voiceLoading,
  processVoiceData,
  handleSubmit,
  showToast,
}) => {
  const { user } = useAuth();
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="bg-[#0B0F19] p-6 text-white relative flex-shrink-0 flex items-center justify-between border-b border-slate-800">
        <div className="relative z-10 space-y-1">
          <div className="text-[10px] font-black text-[#EAB308] tracking-[0.4em] uppercase">Documento Comercial</div>
          <h2 className="text-2xl font-black italic tracking-tighter uppercase">{editingQuote ? 'Ajustar Proposta' : 'Emitir Orçamento'}</h2>
        </div>
        <div className="relative z-10">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => setIsCalculatorActive(!isCalculatorActive)}
            className={`font-black text-[10px] uppercase tracking-widest h-10 px-4 rounded-xl transition-all border-dashed ${
              isCalculatorActive 
                ? 'bg-[#EAB308]/20 border-[#EAB308] text-[#EAB308] hover:bg-[#EAB308]/30' 
                : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
            }`}
          >
            <Zap className="w-3.5 h-3.5 mr-2 animate-pulse fill-current text-[#EAB308]" />
            {isCalculatorActive ? 'Fechar Calculadora' : 'Calculadora de Pontos'}
          </Button>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0 bg-[#1E293B]">
        {/* Left Side: Standard Form */}
        <div className={`flex-1 overflow-y-auto p-6 space-y-6 flex flex-col ${isCalculatorActive ? 'md:border-r border-slate-800 md:max-w-[50%]' : ''}`}>
          <div className="space-y-6 flex-1">
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-slate-300 uppercase tracking-widest pl-1">Cliente Solicitante *</Label>
              <Select onValueChange={(val) => setForm({...form, clientId: val})} value={form.clientId} required>
                <SelectTrigger className="h-14 border-slate-800 bg-[#0B0F19] text-white rounded-2xl focus:ring-[#EAB308] w-full">
                  <div className="flex-1 text-left font-semibold">
                    {clients.find(c => c.id === form.clientId)?.name || <SelectValue placeholder="Selecione..." />}
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-slate-800 bg-[#0B0F19] text-white p-2">
                  {clients.map(c => (
                    <SelectItem key={c.id} value={c.id} className="rounded-xl focus:bg-[#EAB308] focus:text-[#0B0F19] py-3">{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Assistente de Voz IA */}
            <VoiceBudgetModal
              isListening={isListening}
              toggleListening={toggleListening}
              isManualInputOpen={isManualInputOpen}
              setIsManualInputOpen={setIsManualInputOpen}
              transcriptionText={transcriptionText}
              setTranscriptionText={setTranscriptionText}
              voiceLoading={voiceLoading}
              processVoiceData={processVoiceData}
            />
            
            {/* Structured Service Items list */}
            <QuoteItemsTable items={items} setItems={setItems} />

            {/* Optional description notes/remarks */}
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-slate-300 uppercase tracking-widest pl-1">Observações Adicionais</Label>
              <Textarea 
                className="min-h-[70px] border-slate-800 bg-[#0B0F19] !text-white rounded-2xl p-4 focus:ring-[#EAB308] focus:border-[#EAB308] resize-none text-xs font-medium italic placeholder:text-slate-500"
                value={remarks} 
                onChange={e => setRemarks(e.target.value)} 
                placeholder="Forma de pagamento, prazo de execução ou observações gerais..."
              />
            </div>

            {/* Photo upload field allowing multiple photos in a neat responsive grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-slate-300 uppercase tracking-widest pl-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><Camera className="w-3.5 h-3.5 text-[#EAB308]" /> Fotos do Serviço / Projeto</span>
                  {isUploadingPhoto && (
                    <span className="text-[9px] text-amber-400 flex items-center gap-1 animate-pulse"><Loader2 className="w-3 h-3 animate-spin" /> Anexando foto...</span>
                  )}
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {photos.map((p, idx) => (
                    <div key={idx} className="relative w-full aspect-square rounded-2xl overflow-hidden border border-slate-800 bg-[#0B0F19] flex-shrink-0 group">
                      <img src={p} alt={`Projeto ${idx + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPhotos(photos.filter((_, i) => i !== idx));
                        }}
                        className="absolute top-1.5 right-1.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white rounded-lg p-1.5 shadow-lg transition-transform flex items-center justify-center cursor-pointer z-10"
                        title="Remover foto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {photos.length < 9 && (
                    <div className={`relative flex flex-col items-center justify-center aspect-square border-2 border-dashed border-slate-700 hover:border-[#EAB308] bg-[#0B0F19] hover:bg-[#0B0F19]/80 rounded-2xl cursor-pointer transition-all ${isUploadingPhoto ? 'opacity-50 pointer-events-none' : ''}`}>
                      <div className="flex flex-col items-center gap-1 pointer-events-none">
                        {isUploadingPhoto ? <Loader2 className="w-4 h-4 animate-spin text-[#EAB308]" /> : <Camera className="w-4 h-4 text-[#EAB308]" />}
                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-wider">{isUploadingPhoto ? 'Enviando...' : '+ Foto'}</span>
                      </div>
                      <input 
                        type="file" 
                        accept="image/*" 
                        multiple
                        disabled={isUploadingPhoto}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" 
                        onChange={async (e) => {
                          const fileList = e.target.files;
                          if (!fileList || fileList.length === 0) return;

                          const files = Array.from(fileList);
                          setIsUploadingPhoto(true);

                          try {
                            const newPhotos: string[] = [];
                            for (let i = 0; i < files.length; i++) {
                              try {
                                const base64 = await resizeImage(files[i], 800, 800, 0.65);
                                if (base64) {
                                  newPhotos.push(base64);
                                }
                              } catch (err: any) {
                                console.error("Erro ao processar imagem:", err);
                                showToast(err?.message || 'Erro ao processar foto', 'error');
                              }
                            }

                            if (newPhotos.length > 0) {
                              setPhotos(prev => [...prev, ...newPhotos]);
                              showToast(`${newPhotos.length} foto(s) anexada(s) com sucesso!`, 'success');
                            }
                          } catch (globalErr: any) {
                            console.error("Erro geral no upload de fotos:", globalErr);
                            showToast('Não foi possível anexar as fotos selecionadas.', 'error');
                          } finally {
                            setIsUploadingPhoto(false);
                            e.target.value = '';
                          }
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-slate-300 uppercase tracking-widest pl-1">Desconto R$</Label>
                  <Input 
                    placeholder="Valor desconto" 
                    type="number"
                    className="h-14 border-slate-800 bg-[#0B0F19] rounded-2xl text-center text-xl font-black focus:ring-[#EAB308] focus:border-[#EAB308] !text-rose-400 placeholder:text-slate-500"
                    value={discount || ''}
                    onChange={(e) => setDiscount(Math.max(0, Number(e.target.value) || 0))}
                  />
                </div>
                
                <div className="flex items-center justify-between p-4 border border-slate-800 rounded-2xl bg-[#0B0F19] shadow-sm">
                  <Label className="text-[11px] font-black text-slate-200 uppercase tracking-wide cursor-pointer" htmlFor="includesMaterial">
                    Material Incluso
                  </Label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      id="includesMaterial"
                      type="checkbox"
                      className="sr-only peer"
                      checked={includesMaterial}
                      onChange={(e) => setIncludesMaterial(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#EAB308]/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#EAB308]"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 border border-slate-800 rounded-2xl bg-[#0B0F19] shadow-sm">
                  <Label className="text-[11px] font-black text-slate-200 uppercase tracking-wide cursor-pointer" htmlFor="applyCashDiscount">
                    Exibir 15% Desc. à Vista
                  </Label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      id="applyCashDiscount"
                      type="checkbox"
                      className="sr-only peer"
                      checked={applyCashDiscount}
                      onChange={(e) => setApplyCashDiscount(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#EAB308]/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#EAB308]"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 border border-slate-800 rounded-2xl bg-[#0B0F19] shadow-sm">
                  <Label className="text-[11px] font-black text-slate-200 uppercase tracking-wide cursor-pointer" htmlFor="hideDetailedPrices">
                    Ocultar Valores Detalhados
                  </Label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      id="hideDetailedPrices"
                      type="checkbox"
                      className="sr-only peer"
                      checked={hideDetailedPrices}
                      onChange={(e) => setHideDetailedPrices(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#EAB308]/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#EAB308]"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 bg-[#1E293B] sticky bottom-0 flex flex-col gap-3 mt-4 border-t border-slate-800">
            <div className="p-3 bg-[#0B0F19] rounded-xl flex justify-between items-center text-white border border-slate-800">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Previsto:</span>
              <span className="text-lg font-black italic text-[#EAB308]">R$ {Number(form.totalAmount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>

            <Button type="submit" size="lg" className="w-full font-black italic uppercase h-14 rounded-2xl shadow-xl shadow-[#EAB308]/20 tracking-tighter text-sm bg-[#EAB308] hover:bg-[#ca8a04] text-[#0B0F19] transition-all hover:scale-[1.01]">
              {editingQuote ? 'Confirmar Ajustes' : 'Emitir Documento'}
            </Button>
          </div>
        </div>

        {/* Right Side: Professional Points Calculator */}
        {isCalculatorActive && (
          <PointsCalculator
            calculatorPoints={calculatorPoints}
            setCalculatorPoints={setCalculatorPoints}
            calculatorPreset={calculatorPreset}
            handlePresetChange={handlePresetChange}
            handleApplyCalculator={handleApplyCalculator}
            showToast={showToast}
          />
        )}
      </form>
    </div>
  );
};
