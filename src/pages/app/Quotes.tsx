import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, FileText, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '../../components/ui/dialog';
import { PageHeader } from '../../components/PageHeader';

import { useQuotes } from './Quotes/hooks/useQuotes';
import { generateAndShareQuotePDF } from './Quotes/services/quotePdfService';
import { QuoteForm } from './Quotes/components/QuoteForm';
import { QuoteCard } from './Quotes/components/QuoteCard';
import { Quote, QuoteItem, CalculatorPointsMap, CalculatorPoint, PresetType } from './Quotes/types/quote.types';
import { initialCalculatorPoints, presetPricing } from './Quotes/data/calculatorPresets';

export default function Quotes() {
  const {
    user,
    quotes,
    clients,
    loading,
    toast,
    setToast,
    showToast,
    updateStatus,
    deleteQuote,
    saveQuote
  } = useQuotes();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);

  // Main Form state
  const [form, setForm] = useState({ clientId: '', totalAmount: 0 });
  const [items, setItems] = useState<QuoteItem[]>([{ id: '1', name: '', quantity: 1, price: 0 }]);
  const [remarks, setRemarks] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [includesMaterial, setIncludesMaterial] = useState<boolean>(false);
  const [applyCashDiscount, setApplyCashDiscount] = useState<boolean>(false);
  const [hideDetailedPrices, setHideDetailedPrices] = useState<boolean>(false);

  // Points calculator state
  const [isCalculatorActive, setIsCalculatorActive] = useState<boolean>(false);
  const [calculatorPreset, setCalculatorPreset] = useState<PresetType>('standard');
  const [calculatorPoints, setCalculatorPoints] = useState<CalculatorPointsMap>(initialCalculatorPoints);

  // Voice AI assistant state
  const [isListening, setIsListening] = useState<boolean>(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [transcriptionText, setTranscriptionText] = useState<string>('');
  const [isManualInputOpen, setIsManualInputOpen] = useState<boolean>(false);
  const [voiceLoading, setVoiceLoading] = useState<boolean>(false);

  // Auto-recalculate totalAmount when items or discount changes
  useEffect(() => {
    const sum = items.reduce((acc, it) => acc + (Number(it.price) * Number(it.quantity) || 0), 0);
    const finalTotal = Math.max(0, sum - (discount || 0));
    setForm(prev => ({ ...prev, totalAmount: finalTotal }));
  }, [items, discount]);

  // Speech Recognition setup
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = 'pt-BR';

        rec.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          setTranscriptionText(currentTranscript);
        };

        rec.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          setIsListening(false);
          showToast("Erro ao reconhecer voz. Tente digitar ou colar o texto.", "error");
        };

        rec.onend = () => {
          setIsListening(false);
        };

        setRecognition(rec);
      }
    }
  }, []);

  const toggleListening = () => {
    if (!recognition) {
      showToast("Reconhecimento de voz não é suportado pelo seu navegador.", "error");
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      setTranscriptionText('');
      recognition.start();
      setIsListening(true);
      showToast("Ouvindo... Fale o comando de voz.", "success");
    }
  };

  const processVoiceData = async () => {
    if (!transcriptionText.trim()) {
      showToast("Fale ou digite algo para a IA processar.", "error");
      return;
    }

    setVoiceLoading(true);
    try {
      const token = user ? await user.getIdToken().catch(() => null) : null;
      if (!token) {
        showToast("Sessão expirada. Faça login novamente para usar a IA.", "error");
        setVoiceLoading(false);
        return;
      }

      const response = await fetch('/api/voice-budget-extractor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ text: transcriptionText }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao processar áudio.');
      }

      if (data.items && Array.isArray(data.items) && data.items.length > 0) {
        const newItems: QuoteItem[] = data.items.map((it: any, idx: number) => ({
          id: String(Date.now() + idx),
          name: it.name || 'Serviço',
          quantity: Number(it.quantity) || 1,
          price: Number(it.price) || 0,
        }));
        setItems(newItems);
      }

      if (data.remarks) {
        setRemarks(data.remarks);
      }

      if (typeof data.discount === 'number') {
        setDiscount(data.discount);
      }

      if (typeof data.includesMaterial === 'boolean') {
        setIncludesMaterial(data.includesMaterial);
      }

      showToast("Informações preenchidas com sucesso pela IA!", "success");
      setTranscriptionText('');
      setIsManualInputOpen(false);
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Erro ao processar voz com a IA.", "error");
    } finally {
      setVoiceLoading(false);
    }
  };

  const handlePresetChange = (preset: PresetType) => {
    setCalculatorPreset(preset);
    const newPrices = presetPricing[preset];
    setCalculatorPoints(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(key => {
        if (newPrices[key] !== undefined) {
          updated[key] = { ...updated[key], price: newPrices[key] };
        }
      });
      return updated;
    });
  };

  const handleApplyCalculator = () => {
    const selectedPoints = Object.values(calculatorPoints).filter((p: CalculatorPoint) => p.qty > 0);
    if (selectedPoints.length === 0) {
      showToast("Selecione ao menos 1 ponto na calculadora.", "error");
      return;
    }

    const calculatedItems: QuoteItem[] = selectedPoints.map((p: CalculatorPoint, idx: number) => ({
      id: String(Date.now() + idx),
      name: p.label,
      quantity: p.qty,
      price: p.price,
    }));

    setItems(calculatedItems);
    showToast(`${calculatedItems.length} tipos de serviço importados da calculadora!`, "success");
  };

  const openCreate = () => {
    setEditingQuote(null);
    setForm({ clientId: '', totalAmount: 0 });
    setItems([{ id: '1', name: '', quantity: 1, price: 0 }]);
    setRemarks('');
    setPhotos([]);
    setDiscount(0);
    setIncludesMaterial(false);
    setApplyCashDiscount(false);
    setHideDetailedPrices(false);
    setTranscriptionText('');
    setIsManualInputOpen(false);
    setIsDialogOpen(true);
  };

  const openEdit = (quote: Quote) => {
    setEditingQuote(quote);
    let parsed = {
      items: [{ id: '1', name: '', quantity: 1, price: 0 }],
      remarks: '',
      photo: '',
      photos: [] as string[],
      discount: 0,
      includesMaterial: false,
      applyCashDiscount: false,
      hideDetailedPrices: false,
    };

    try {
      if (quote.description && (quote.description.startsWith('{') || quote.description.startsWith('['))) {
        parsed = JSON.parse(quote.description);
      }
    } catch (e) {}

    setForm({ clientId: quote.clientId, totalAmount: quote.totalAmount });
    setItems(parsed.items && parsed.items.length > 0 ? parsed.items : [{ id: '1', name: quote.description || '', quantity: 1, price: quote.totalAmount || 0 }]);
    setRemarks(parsed.remarks || '');
    setPhotos(parsed.photos || (parsed.photo ? [parsed.photo] : []));
    setDiscount(parsed.discount || 0);
    setIncludesMaterial(parsed.includesMaterial || false);
    setApplyCashDiscount(parsed.applyCashDiscount || false);
    setHideDetailedPrices(parsed.hideDetailedPrices || false);
    setTranscriptionText('');
    setIsManualInputOpen(false);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await saveQuote(
      editingQuote ? editingQuote.id : null,
      form.clientId,
      items,
      remarks,
      photos,
      discount,
      includesMaterial,
      applyCashDiscount,
      hideDetailedPrices,
      editingQuote ? editingQuote.status : 'pending'
    );

    if (success) {
      setIsDialogOpen(false);
    }
  };

  const shareWhatsApp = async (quote: Quote) => {
    const client = clients.find(c => c.id === quote.clientId);
    await generateAndShareQuotePDF(quote, client, user, showToast);
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <PageHeader
          title="Orçamentos & Propostas"
          description="Gestão comercial de propostas, orçamentos rápidos e aprovações de clientes."
        />
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger
            render={
              <Button onClick={openCreate} className="h-14 px-8 font-black uppercase tracking-widest bg-[#EAB308] hover:bg-[#ca8a04] text-[#0B0F19] rounded-2xl shadow-xl shadow-[#EAB308]/20 italic">
                 <Plus className="w-5 h-5 mr-3" /> Nova Proposta
              </Button>
            }
          />
          <DialogContent className={`max-h-[95vh] p-0 overflow-hidden rounded-[2.5rem] border-slate-800 bg-[#1E293B] text-white flex flex-col transition-all duration-300 ${
            isCalculatorActive ? 'sm:max-w-5xl' : 'sm:max-w-xl'
          }`}>
             <QuoteForm
               editingQuote={editingQuote}
               form={form}
               setForm={setForm}
               clients={clients}
               items={items}
               setItems={setItems}
               remarks={remarks}
               setRemarks={setRemarks}
               photos={photos}
               setPhotos={setPhotos}
               discount={discount}
               setDiscount={setDiscount}
               includesMaterial={includesMaterial}
               setIncludesMaterial={setIncludesMaterial}
               applyCashDiscount={applyCashDiscount}
               setApplyCashDiscount={setApplyCashDiscount}
               hideDetailedPrices={hideDetailedPrices}
               setHideDetailedPrices={setHideDetailedPrices}
               isCalculatorActive={isCalculatorActive}
               setIsCalculatorActive={setIsCalculatorActive}
               calculatorPoints={calculatorPoints}
               setCalculatorPoints={setCalculatorPoints}
               calculatorPreset={calculatorPreset}
               handlePresetChange={handlePresetChange}
               handleApplyCalculator={handleApplyCalculator}
               isListening={isListening}
               toggleListening={toggleListening}
               isManualInputOpen={isManualInputOpen}
               setIsManualInputOpen={setIsManualInputOpen}
               transcriptionText={transcriptionText}
               setTranscriptionText={setTranscriptionText}
               voiceLoading={voiceLoading}
               processVoiceData={processVoiceData}
               handleSubmit={handleSubmit}
               showToast={showToast}
             />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence>
          {loading ? (
            <div className="col-span-full py-40 flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sincronizando Propostas</span>
            </div>
          ) : quotes.map((q, idx) => (
            <QuoteCard
              key={q.id}
              quote={q}
              index={idx}
              clients={clients}
              updateStatus={updateStatus}
              openEdit={openEdit}
              handleDelete={deleteQuote}
              shareWhatsApp={shareWhatsApp}
            />
          ))}
        </AnimatePresence>
        {quotes.length === 0 && !loading && (
          <div className="col-span-full py-40 text-center bg-[#1E293B] border-4 border-dashed rounded-[3rem] border-slate-800 space-y-4">
             <div className="p-6 bg-[#0B0F19] border border-slate-800 rounded-3xl shadow-xl inline-block mb-4">
                <FileText className="w-12 h-12 text-[#EAB308] opacity-80" />
             </div>
             <h3 className="text-white font-black text-2xl tracking-tighter uppercase italic">Fluxo Comercial Vazio</h3>
             <p className="text-slate-400 text-sm font-medium italic max-w-xs mx-auto leading-relaxed">Desenvolva suas propostas técnicas aqui para impressionar seus clientes.</p>
          </div>
        )}
      </div>

      {/* Visual Toast Notification */}
      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.2 } }}
            className={`fixed bottom-10 right-6 z-50 max-w-sm w-full text-white border border-white/10 p-4 rounded-2xl shadow-2xl flex items-center gap-3 font-sans ${
              toast.type === 'success' ? 'bg-slate-900 border-emerald-500/20' : 'bg-rose-950 border-rose-500/20'
            }`}
            role="alert"
          >
            <div className={`p-2 rounded-xl shrink-0 ${toast.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
              {toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
            </div>
            <div className="flex-1">
              <p className={`text-xs font-black uppercase tracking-widest leading-none mb-1 ${
                toast.type === 'success' ? 'text-emerald-400' : 'text-rose-400'
              }`}>{toast.type === 'success' ? 'Sucesso' : 'Erro'}</p>
              <p className="text-sm font-semibold leading-tight text-white">{toast.message}</p>
            </div>
            <button
              type="button"
              onClick={() => setToast(prev => ({ ...prev, show: false }))}
              className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer text-xs"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
