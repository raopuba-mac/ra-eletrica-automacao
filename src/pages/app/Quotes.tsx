import React from 'react';
import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../components/AuthProvider';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Textarea } from '../../components/ui/textarea';
import { Plus, Trash2, CheckCircle, XCircle, FileText, Edit, Send, Zap, Camera, Image as ImageIcon, Download, Mic, Square, Keyboard, Sparkles, Loader2 } from 'lucide-react';
import { OperationType, handleFirestoreError } from '../../lib/error';
import { resizeImage } from '../../lib/imageHandler';
import { PageHeader } from '../../components/PageHeader';
import { motion, AnimatePresence } from 'motion/react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const sanitizeForPDF = (text: string) => {
  if (!text) return '';
  return text
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F000}-\u{1F0FF}]/gu, '') // Remove wide emojis
    .replace(/[\u2022\u2023\u25B8\u2043\u2219]/g, '-') // Replace bullets with dash
    .replace(/[\u2018\u2019\u201A\u201B\u2039\u203A]/g, "'") // Replace smart single quotes
    .replace(/[\u201C\u201D\u201E\u201F\u00AB\u00BB]/g, '"') // Replace smart double quotes
    .replace(/[\u2013\u2014]/g, '-') // Replace em/en dashes
    .replace(/[^\x00-\xFF\n\r]/g, ''); // Strip remaining non-Latin1 characters
};

const getBase64ImageFromUrl = async (imageUrl: string): Promise<string> => {
  try {
    const res = await fetch(imageUrl);
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.error("Error loading image as base64", e);
    return '';
  }
};

export default function Quotes() {
  const { user } = useAuth();
  const [quotes, setQuotes] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<string | null>(null);
  const [form, setForm] = useState({ clientId: '', description: '', totalAmount: '', status: 'pending' });
  const [loading, setLoading] = useState(true);

  // Structured estimate states
  const [items, setItems] = useState<{ id: string; name: string; quantity: number; price: number }[]>([
    { id: '1', name: '', quantity: 1, price: 0 }
  ]);
  const [remarks, setRemarks] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [includesMaterial, setIncludesMaterial] = useState<boolean>(false);
  const [applyCashDiscount, setApplyCashDiscount] = useState<boolean>(false);
  const [hideDetailedPrices, setHideDetailedPrices] = useState<boolean>(false);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });

  // Voice Command / Voice Transcription States
  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcriptionText, setTranscriptionText] = useState<string>('');
  const [voiceLoading, setVoiceLoading] = useState<boolean>(false);
  const [isManualInputOpen, setIsManualInputOpen] = useState<boolean>(false);
  const [recognitionInstance, setRecognitionInstance] = useState<any>(null);

  // Initialize speech recognition on mount/demand
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'pt-BR';

      rec.onresult = (event: any) => {
        let currentText = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            currentText += event.results[i][0].transcript;
          }
        }
        if (currentText) {
          setTranscriptionText(prev => {
            const cleanedPrev = prev.trim();
            const cleanedCurrent = currentText.trim();
            if (cleanedPrev.endsWith(cleanedCurrent) || cleanedCurrent.startsWith(cleanedPrev)) {
              return cleanedCurrent;
            }
            return cleanedPrev ? `${cleanedPrev} ${cleanedCurrent}` : cleanedCurrent;
          });
        }
      };

      rec.onerror = (event: any) => {
        console.error('Erro no reconhecimento de voz:', event.error);
        if (event.error === 'not-allowed') {
          showToast('Permissão de microfone negada. Use a digitação manual.', 'error');
        }
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      setRecognitionInstance(rec);
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionInstance) {
      showToast('Reconhecimento de voz não suportado neste navegador. Use a digitação manual.', 'error');
      setIsManualInputOpen(true);
      return;
    }

    if (isListening) {
      recognitionInstance.stop();
      setIsListening(false);
    } else {
      try {
        setTranscriptionText('');
        recognitionInstance.start();
        setIsListening(true);
        showToast('Ouvindo... Fale agora sobre o serviço.', 'success');
      } catch (err) {
        console.error('Error starting recognition:', err);
      }
    }
  };

  const processVoiceData = async () => {
    if (!transcriptionText.trim()) {
      showToast('Por favor, fale ou digite algo antes de preencher.', 'error');
      return;
    }

    setVoiceLoading(true);
    try {
      const response = await fetch('/api/voice-budget-extractor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: transcriptionText })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Erro ao processar áudio.');
      }

      const data = await response.json();
      
      // Update form description
      if (data.description) {
        setForm(prev => ({ ...prev, description: data.description }));
      }

      // Update service items
      if (data.items && Array.isArray(data.items) && data.items.length > 0) {
        const formattedItems = data.items.map((it: any, idx: number) => ({
          id: String(Date.now() + idx),
          name: it.name || 'Serviço',
          quantity: Number(it.quantity) || 1,
          price: Number(it.price) || 0
        }));
        setItems(formattedItems);
      }

      // Update remarks/observações
      if (data.remarks) {
        setRemarks(data.remarks);
      }

      // Update material inclusion
      if (typeof data.includesMaterial === 'boolean') {
        setIncludesMaterial(data.includesMaterial);
      }

      // Update discount
      if (typeof data.discount === 'number' && data.discount > 0) {
        setDiscount(data.discount);
      }

      showToast('Orçamento preenchido pela IA com sucesso! Revise os dados.', 'success');
      setIsManualInputOpen(false);
    } catch (err: any) {
      console.error('Error processing voice budget:', err);
      showToast(err.message || 'Falha ao processar com IA. Tente novamente.', 'error');
    } finally {
      setVoiceLoading(false);
    }
  };

  // Points Calculator States
  const [isCalculatorActive, setIsCalculatorActive] = useState<boolean>(false);
  const [calculatorPreset, setCalculatorPreset] = useState<'economic' | 'standard' | 'premium'>('standard');
  const [calculatorPoints, setCalculatorPoints] = useState<{
    [key: string]: { qty: number; price: number; label: string; category: string }
  }>({
    chuveiro: { qty: 0, price: 150, label: 'Instalação de Chuveiro Elétrico', category: 'Chuveiros' },
    chuveiroFia: { qty: 0, price: 200, label: 'Circuito + Fiação para Chuveiro Novo', category: 'Chuveiros' },
    tomada: { qty: 0, price: 80, label: 'Ponto de Tomada Comum (TUG - 10A/20A)', category: 'Tomadas' },
    tomadaEspecial: { qty: 0, price: 120, label: 'Ponto de Tomada de Uso Especial (TUE - 20A)', category: 'Tomadas' },
    interruptor: { qty: 0, price: 80, label: 'Ponto de Interruptor (Simples/Duplo/Paralelo)', category: 'Interruptores' },
    iluminacao: { qty: 0, price: 80, label: 'Ponto de Iluminação (Luminária/Plafon/Spot)', category: 'Iluminação' },
    fitaLed: { qty: 0, price: 100, label: 'Instalação de Fita LED por metro', category: 'Iluminação' },
    ventilador: { qty: 0, price: 180, label: 'Instalação de Ventilador de Teto c/ Comando', category: 'Outros' },
    qdc: { qty: 0, price: 400, label: 'Montagem de Quadro de Distribuição (QDC) - Até 12 disj.', category: 'QDC' },
    qdcGrande: { qty: 0, price: 650, label: 'Montagem de Quadro de Distribuição (QDC) - Acima de 12 disj.', category: 'QDC' },
    aterramento: { qty: 0, price: 350, label: 'Instalação de Haste de Aterramento + Caixa de Inspeção', category: 'Outros' },
    sensorPresenca: { qty: 0, price: 90, label: 'Instalação de Sensor de Presença / Fotocélula', category: 'Outros' }
  });

  const handlePresetChange = (preset: 'economic' | 'standard' | 'premium') => {
    setCalculatorPreset(preset);
    const pricing: { [key: string]: number } = {
      economic: { chuveiro: 110, chuveiroFia: 150, tomada: 60, tomadaEspecial: 90, interruptor: 60, iluminacao: 60, fitaLed: 70, ventilador: 130, qdc: 300, qdcGrande: 500, aterramento: 250, sensorPresenca: 70 },
      standard: { chuveiro: 150, chuveiroFia: 200, tomada: 80, tomadaEspecial: 120, interruptor: 80, iluminacao: 80, fitaLed: 100, ventilador: 180, qdc: 400, qdcGrande: 650, aterramento: 350, sensorPresenca: 90 },
      premium: { chuveiro: 220, chuveiroFia: 300, tomada: 110, tomadaEspecial: 160, interruptor: 110, iluminacao: 110, fitaLed: 140, ventilador: 250, qdc: 600, qdcGrande: 900, aterramento: 500, sensorPresenca: 130 }
    }[preset];

    setCalculatorPoints(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(key => {
        if (pricing[key] !== undefined) {
          updated[key] = { ...updated[key], price: pricing[key] };
        }
      });
      return updated;
    });
  };

  const handleApplyCalculator = () => {
    const pointsToApply = (Object.entries(calculatorPoints) as [string, { qty: number; price: number; label: string; category: string }][])
      .filter(([_, value]) => value.qty > 0)
      .map(([_, value], idx) => ({
        id: String(Date.now() + idx),
        name: `${value.label}`,
        quantity: value.qty,
        price: value.price
      }));

    if (pointsToApply.length === 0) {
      showToast("Selecione a quantidade de pelo menos um ponto na calculadora.", "error");
      return;
    }

    setItems(pointsToApply);
    showToast(`${pointsToApply.length} itens da calculadora importados com sucesso!`, "success");
  };

  useEffect(() => {
    if (!toast.show) return;
    const timer = setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast.show]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
  };

  // Dynamically recalculate total amount when items change
  useEffect(() => {
    const total = items.reduce((acc, it) => acc + (Number(it.price) * Number(it.quantity) || 0), 0);
    const finalTotal = Math.max(0, total - discount);
    setForm(f => ({ ...f, totalAmount: finalTotal.toString() }));
  }, [items, discount]);

  useEffect(() => {
    if (!user) return;
    const unsubQ = onSnapshot(query(collection(db, 'quotes'), where('userId', '==', user.uid)), 
      snap => {
        setQuotes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      err => {
        handleFirestoreError(err, OperationType.GET, 'quotes');
        setLoading(false);
      }
    );
    const unsubC = onSnapshot(query(collection(db, 'clients'), where('userId', '==', user.uid)), 
      snap => setClients(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      err => handleFirestoreError(err, OperationType.GET, 'clients')
    );
    return () => { unsubQ(); unsubC(); };
  }, [user]);

  const openCreate = () => {
    setEditingQuote(null);
    setForm({ clientId: '', description: '', totalAmount: '0', status: 'pending' });
    setItems([{ id: '1', name: '', quantity: 1, price: 0 }]);
    setRemarks('');
    setPhotos([]);
    setDiscount(0);
    setIncludesMaterial(false);
    setApplyCashDiscount(false);
    setHideDetailedPrices(false);
    
    // Reset points calculator
    setCalculatorPoints(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(key => {
        updated[key] = { ...updated[key], qty: 0 };
      });
      return updated;
    });
    setIsCalculatorActive(false);
    setCalculatorPreset('standard');

    setIsDialogOpen(true);
  };

  const openEdit = (quote: any) => {
    setEditingQuote(quote.id);
    let parsed = { items: [] as any[], remarks: '', photo: '', photos: [] as string[], discount: 0, includesMaterial: false, applyCashDiscount: false, hideDetailedPrices: false };
    try {
      if (quote.description && (quote.description.startsWith('{') || quote.description.startsWith('['))) {
        parsed = JSON.parse(quote.description);
      } else {
        parsed = {
          items: [{ name: quote.description || '', quantity: 1, price: quote.totalAmount || 0 }],
          remarks: '',
          photo: '',
          photos: [],
          discount: 0,
          includesMaterial: false,
          applyCashDiscount: false,
          hideDetailedPrices: false
        };
      }
    } catch (e) {
      parsed = {
        items: [{ name: quote.description || '', quantity: 1, price: quote.totalAmount || 0 }],
        remarks: '',
        photo: '',
        photos: [],
        discount: 0,
        includesMaterial: false,
        applyCashDiscount: false,
        hideDetailedPrices: false
      };
    }

    setForm({ 
      clientId: quote.clientId || '', 
      description: quote.description || '', 
      totalAmount: quote.totalAmount?.toString() || '0', 
      status: quote.status 
    });
    setItems(parsed.items && parsed.items.length > 0 ? parsed.items.map((it: any, index: number) => ({
      id: it.id || String(index + 1),
      name: it.name || it.description || '',
      quantity: it.quantity || 1,
      price: it.price || 0
    })) : [{ id: '1', name: '', quantity: 1, price: 0 }]);
    setRemarks(parsed.remarks || '');
    setPhotos(parsed.photos || (parsed.photo ? [parsed.photo] : []));
    setDiscount(parsed.discount || 0);
    setIncludesMaterial(parsed.includesMaterial || false);
    setApplyCashDiscount(parsed.applyCashDiscount || false);
    setHideDetailedPrices(parsed.hideDetailedPrices || false);

    // Reset points calculator
    setCalculatorPoints(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(key => {
        updated[key] = { ...updated[key], qty: 0 };
      });
      return updated;
    });
    setIsCalculatorActive(false);
    setCalculatorPreset('standard');

    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    // Prevent submitting without setting a client
    if (!form.clientId) {
      showToast("Selecione um cliente para emitir o orçamento.", "error");
      return;
    }

    try {
      const clientName = clients.find(c => c.id === form.clientId)?.name || '';
      const calculatedTotal = items.reduce((acc, it) => acc + (Number(it.price) * Number(it.quantity) || 0), 0);
      
      const serializedDescription = JSON.stringify({
        items: items.filter(it => it.name.trim() !== ''),
        remarks: remarks,
        photo: photos[0] || '',
        photos: photos,
        discount: discount,
        includesMaterial: includesMaterial,
        applyCashDiscount: applyCashDiscount,
        hideDetailedPrices: hideDetailedPrices
      });

      const quoteData = {
        userId: user.uid,
        clientId: form.clientId,
        clientName,
        description: serializedDescription,
        totalAmount: calculatedTotal,
        status: form.status,
        updatedAt: Date.now()
      };

      if (editingQuote) {
        await updateDoc(doc(db, 'quotes', editingQuote), quoteData);
        showToast("Orçamento atualizado com sucesso!", "success");
      } else {
        await addDoc(collection(db, 'quotes'), { ...quoteData, createdAt: Date.now() });
        showToast("Orçamento gerado com sucesso!", "success");
      }

      setIsDialogOpen(false);
      setEditingQuote(null);
      setForm({ clientId: '', description: '', totalAmount: '0', status: 'pending' });
      setItems([{ id: '1', name: '', quantity: 1, price: 0 }]);
      setRemarks('');
      setPhotos([]);
      setDiscount(0);
      setIncludesMaterial(false);
      setApplyCashDiscount(false);
      setHideDetailedPrices(false);
    } catch(err: any) {
      console.error(err);
      showToast(err?.message || "Erro ao salvar orçamento. A foto pode ser muito grande ou você não tem permissão.", "error");
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try { 
      await updateDoc(doc(db, 'quotes', id), { status, updatedAt: Date.now() }); 
      showToast(`Status atualizado para ${status === 'approved' ? 'Aprovado' : status === 'rejected' ? 'Recusado' : 'Pendente'}`, "success");
    } catch(err: any) { 
      console.error(err);
      showToast("Erro ao atualizar status.", "error"); 
    }
  };

  const handleDelete = async (id: string) => {
    if(!window.confirm("Deseja realmente excluir este orçamento?")) return;
    try { 
      await deleteDoc(doc(db, 'quotes', id)); 
      showToast("Orçamento excluído permanentemente", "success");
    } catch(err: any) { 
      console.error(err);
      showToast("Erro ao excluir orçamento.", "error"); 
    }
  };

  const shareWhatsApp = async (quote: any) => {
    const client = clients.find(c => c.id === quote.clientId);
    if (!client) {
      showToast('Cliente não encontrado.', 'error');
      return;
    }

    let parsed = { items: [] as any[], remarks: '', photo: '', photos: [] as string[], discount: 0, includesMaterial: false, applyCashDiscount: false, hideDetailedPrices: false };
    let isJson = false;
    try {
      if (quote.description && (quote.description.startsWith('{') || quote.description.startsWith('['))) {
        parsed = JSON.parse(quote.description);
        isJson = true;
      }
    } catch (e) {}

    // Fetch professional company profile for the PDF footer
    let companyNameFooter = "RA | ELÉTRICA & AUTOMAÇÃO";
    let contactFooter = "WhatsApp: (34) 99260-9206";
    let emailFooter = "E-mail: raop.uba@gmail.com";

    if (user) {
      try {
        const userSnap = await getDoc(doc(db, 'users', user.uid));
        if (userSnap.exists()) {
          const uData = userSnap.data();
          if (uData.companyName) companyNameFooter = uData.companyName.toUpperCase();
          if (uData.whatsappInfo || uData.phone) {
             contactFooter = `WhatsApp: ${uData.whatsappInfo || uData.phone}`;
          }
        }
        if (user.email) {
          emailFooter = `E-mail: ${user.email}`;
        }
      } catch (e) {
        console.error("Error loading user profile for quote PDF", e);
      }
    }

    // Fetch and load logo
    let logoBase64 = '';
    try {
      logoBase64 = await getBase64ImageFromUrl('/logo.jpg?v=6');
    } catch (e) {
      console.error('Error loading logo', e);
    }

    // Generate PDF
    try {
      const doc = new jsPDF();
      
      // Config colors and fonts
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text("ORÇAMENTO PROFISSIONAL", 14, 22);

      if (logoBase64) {
        try {
          doc.addImage(logoBase64, 'JPEG', 166, 10, 30, 30);
        } catch (e) {
          console.error("Error drawing logo in PDF", e);
        }
      }

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100); // gray
      doc.text(`Protocolo: ${quote.id.slice(0, 8).toUpperCase()}`, 14, 30);
      doc.text(`Data: ${new Date(quote.updatedAt || quote.createdAt).toLocaleDateString('pt-BR')}`, 14, 35);

      // Client Info
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text("DADOS DO CLIENTE", 14, 50);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105); // slate-600
      doc.text(`Nome/Empresa: ${sanitizeForPDF(client.name || '')}`, 14, 57);
      if(client.phone) doc.text(`Telefone: ${sanitizeForPDF(client.phone || '')}`, 14, 63);
      if(client.email) doc.text(`E-mail: ${sanitizeForPDF(client.email || '')}`, 14, 69);
      
      let endY = 85;

      const showDetails = !parsed.hideDetailedPrices;

      if (isJson && parsed.items && parsed.items.length > 0) {
        const tableColumn = showDetails 
          ? ["Item / Serviço", "Qtd", "Preço Unit.", "Total"]
          : ["Item / Serviço", "Qtd"];
        
        const tableRows = parsed.items.map((item: any) => showDetails ? [
          sanitizeForPDF(item.name || ''),
          (item.quantity || 1).toString(),
          `R$ ${Number(item.price || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}`,
          `R$ ${Number((item.price || 0) * (item.quantity || 1)).toLocaleString('pt-BR', {minimumFractionDigits: 2})}`
        ] : [
          sanitizeForPDF(item.name || ''),
          (item.quantity || 1).toString()
        ]);

        autoTable(doc, {
          startY: endY,
          head: [tableColumn],
          body: tableRows,
          theme: 'striped',
          headStyles: { fillColor: [15, 23, 42] }, // slate-900
          styles: { font: "helvetica", fontSize: 9 },
          margin: { top: 10 },
        });

        endY = (doc as any).lastAutoTable.finalY + 15;
      } else {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(15, 23, 42);
        doc.text("DESCRIÇÃO", 14, endY);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(71, 85, 105);
        
        const splitText = doc.splitTextToSize(sanitizeForPDF(quote.description || ''), 180);
        doc.text(splitText, 14, endY + 7);
        endY += (splitText.length * 5) + 15;
      }

      if (parsed.remarks) {
        const splitRemarks = doc.splitTextToSize(sanitizeForPDF(parsed.remarks), 180);
        const remarksHeight = (splitRemarks.length * 5) + 15;
        
        // Prevent layout break / page overflow for remarks block
        if (endY + remarksHeight > 275) {
          doc.addPage();
          endY = 20;
        }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42);
        doc.text("OBSERVAÇÕES ADICIONAIS", 14, endY);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(71, 85, 105);
        
        doc.text(splitRemarks, 14, endY + 7);
        endY += remarksHeight;
      }

      // Total Amount
      const subtotal = parsed.items?.reduce((acc, it) => acc + (Number(it.price) * (Number(it.quantity) || 1)), 0) || Number(quote.totalAmount);
      const discountValue = parsed.discount || 0;

      // Prevent page overflow for the financial summary section (subtotal, discount, total, cash discount description, material tag)
      const summaryHeightNeeded = (discountValue > 0 && showDetails ? 15 : 0) + 15 + (parsed.applyCashDiscount ? 10 : 0) + 10;
      if (endY + summaryHeightNeeded > 270) {
        doc.addPage();
        endY = 20;
      }

      if (discountValue > 0 && showDetails) {
        endY += 5;
        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(71, 85, 105);
        doc.text(`Subtotal: R$ ${subtotal.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`, 14, endY);
        
        endY += 7;
        doc.setFont("helvetica", "bold");
        doc.setTextColor(225, 29, 72); // rose-600
        doc.text(`Desconto: - R$ ${discountValue.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`, 14, endY);
        endY += 5;
      }

      endY += 10;
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      
      const totalFormatted = `R$ ${Number(quote.totalAmount || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
      doc.text(`Total Previsto de Investimento: ${totalFormatted}`, 14, endY);
      
      endY += 10;

      if (parsed.applyCashDiscount) {
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(225, 29, 72); // red
        const descAvista = Number(quote.totalAmount || 0) * 0.85;
        doc.text(`*Pagamento à vista tem 15% de desconto: R$ ${descAvista.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`, 14, endY);
        endY += 8;
      }
      
      if (parsed.includesMaterial) {
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(34, 197, 94); // green-500
        doc.text("MATERIAL INCLUSO NESTE ORÇAMENTO", 14, endY);
      } else {
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(245, 158, 11); // amber-500
        doc.text("MATERIAL NÃO INCLUSO (APENAS MÃO DE OBRA)", 14, endY);
      }

      endY += 15;

      const quotePhotos = parsed.photos || (parsed.photo ? [parsed.photo] : []);
      if (quotePhotos.length > 0) {
         if (endY > 180) {
             doc.addPage();
             endY = 20;
         }
         doc.setFontSize(11);
         doc.setFont("helvetica", "bold");
         doc.setTextColor(15, 23, 42);
         doc.text("REGISTRO FOTOGRÁFICO / IMAGENS DE REFERÊNCIA", 14, endY);
         
         endY += 10;
         
         const imgWidth = 85;
         const imgHeight = 65;
         const gap = 10;
         let currentX = 14;
         
         quotePhotos.forEach((imgSrc: string) => {
             if (!imgSrc) return;
             if (endY + imgHeight > 270) {
                 doc.addPage();
                 endY = 20;
                 currentX = 14;
             }
             
             try {
                 const formatMatch = imgSrc.match(/data:image\/([a-zA-Z0-9]+);/);
                 const format = formatMatch ? formatMatch[1].toUpperCase() : 'JPEG';
                 doc.addImage(imgSrc, format === 'JPG' ? 'JPEG' : format, currentX, endY, imgWidth, imgHeight);
                 
                 if (currentX === 14) {
                     currentX = 14 + imgWidth + gap;
                 } else {
                     currentX = 14;
                     endY += imgHeight + gap;
                 }
             } catch(e) {
                 console.error("Could not add image to PDF", e);
             }
         });
         
         if (currentX !== 14) {
             endY += imgHeight + gap;
         }
      }

      // Draw footer divider line
      doc.setDrawColor(226, 232, 240); // border-slate-200
      doc.setLineWidth(0.5);
      doc.line(14, 275, 196, 275);

      // Footer texts
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42); // slate-900 / dark color
      doc.text(companyNameFooter, 14, 282);
      
      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105); // slate-600
      doc.text(contactFooter, 105, 282, { align: "center" });
      doc.text(emailFooter, 196, 282, { align: "right" });

      doc.setFontSize(7);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text("Documento gerado eletronicamente. Aguardando aprovação.", 14, 288);

      // Save PDF implicitly triggers browser download
      doc.save(`Orçamento_${client.name.replace(/\s+/g, '_')}_${quote.id.slice(0, 5).toUpperCase()}.pdf`);
      showToast("PDF Gerado com sucesso! Baixando arquivo...", "success");
      
    } catch(err) {
      console.error(err);
      showToast("Erro ao gerar PDF", "error");
    }

    if (client.phone) {
      const text = `Olá, *${client.name}*! \nEstou enviando em anexo o *Orçamento Profissional* solicitado em formato PDF. \n\n*Protocolo:* ${quote.id.slice(0, 8).toUpperCase()}\n*Valor Total:* R$ ${Number(quote.totalAmount).toLocaleString('pt-BR', {minimumFractionDigits: 2})}\n\nQualquer dúvida estou à disposição!`;
      const phone = client.phone.replace(/\D/g, '');
      if(phone) {
        setTimeout(() => {
          const url = `https://wa.me/55${phone}?text=${encodeURIComponent(text)}`;
          window.open(url, '_blank');
        }, 1500);
      }
    }
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
                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Cliente Solicitante *</Label>
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
                      <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Mic className={`w-4 h-4 ${isListening ? 'text-rose-500 animate-pulse' : 'text-primary'}`} />
                            <span className="text-xs font-black text-slate-800 uppercase tracking-wider">Assistente de Voz IA</span>
                          </div>
                          <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">Incrível</span>
                        </div>
                        
                        <p className="text-[11px] text-slate-500 leading-normal">
                          Fale os detalhes do serviço (ex: "Puxar fiação nova, instalar 2 chuveiros a 150 reais cada, com material incluso, desconto de 20 reais e observação trazer escada") e a IA preencherá tudo!
                        </p>

                        <div className="flex gap-2">
                          <Button
                            type="button"
                            onClick={toggleListening}
                            variant={isListening ? "destructive" : "default"}
                            className="flex-1 h-11 text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all"
                          >
                            {isListening ? (
                              <>
                                <Square className="w-3.5 h-3.5 mr-1" />
                                Parar de Ouvir
                              </>
                            ) : (
                              <>
                                <Mic className="w-3.5 h-3.5 mr-1 animate-bounce" />
                                Falar Comando
                              </>
                            )}
                          </Button>
                          
                          <Button
                            type="button"
                            onClick={() => setIsManualInputOpen(!isManualInputOpen)}
                            variant="outline"
                            className="h-11 px-3 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold"
                            title="Digitar ou colar notas"
                          >
                            <Keyboard className="w-4 h-4" />
                          </Button>
                        </div>

                        {/* Real-time transcribed text preview / manual text block */}
                        {(transcriptionText || isManualInputOpen || voiceLoading) && (
                          <div className="space-y-2 pt-1 border-t border-slate-100">
                            {isManualInputOpen ? (
                              <div className="space-y-2">
                                <textarea
                                  value={transcriptionText}
                                  onChange={(e) => setTranscriptionText(e.target.value)}
                                  placeholder="Digite ou cole as anotações do serviço aqui..."
                                  className="w-full h-20 p-2.5 text-xs border border-slate-100 bg-slate-50 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                                />
                              </div>
                            ) : (
                              transcriptionText && (
                                <div className="p-2.5 bg-white border border-slate-100 rounded-xl text-xs text-slate-700 font-medium italic min-h-[40px]">
                                  {isListening && <span className="inline-block w-2 h-2 bg-rose-500 rounded-full animate-ping mr-1.5" />}
                                  {transcriptionText}
                                </div>
                              )
                            )}

                            {transcriptionText && !isListening && (
                              <Button
                                type="button"
                                disabled={voiceLoading}
                                onClick={processVoiceData}
                                className="w-full h-9 text-xs font-black uppercase tracking-wider bg-slate-900 hover:bg-slate-800 text-white rounded-xl flex items-center justify-center gap-2"
                              >
                                {voiceLoading ? (
                                  <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    Processando com IA...
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="w-3.5 h-3.5" />
                                    Preencher com IA
                                  </>
                                )}
                              </Button>
                            )}
                            
                            {voiceLoading && !transcriptionText && (
                              <div className="flex items-center justify-center gap-2 py-3 text-xs font-semibold text-slate-500">
                                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                Enviando transcrição para a IA...
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* Structured Service Items list */}
                      <div className="space-y-3">
                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 flex justify-between items-center">
                          <span>Lista de Serviços / Produtos *</span>
                        </Label>
                        <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1">
                          {items.map((it, idx) => (
                            <div key={it.id} className="flex gap-2 items-center">
                              <Input 
                                placeholder="Ex: Instalação de painel" 
                                className="flex-1 h-11 border-slate-100 bg-slate-50 rounded-xl text-xs font-semibold focus:ring-primary"
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
                                className="w-16 h-11 border-slate-100 bg-slate-50 rounded-xl text-center text-xs font-black focus:ring-primary"
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
                                className="w-24 h-11 border-slate-100 bg-slate-50 rounded-xl text-center text-xs font-black focus:ring-primary"
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
                                  className="h-11 w-11 text-slate-400 hover:text-rose-500 rounded-xl shrink-0"
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
                          className="w-full text-xs font-bold border-dashed border-slate-200 text-slate-500 hover:bg-slate-50 h-11 rounded-xl flex items-center justify-center gap-1.5"
                        >
                          <Plus className="w-4 h-4" /> Adicionar Serviço ao Orçamento
                        </Button>
                      </div>

                      {/* Optional description notes/remarks */}
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Observações Adicionais</Label>
                        <Textarea 
                          className="min-h-[70px] border-slate-100 bg-slate-50 rounded-2xl p-4 focus:ring-primary resize-none text-xs font-medium italic"
                          value={remarks} 
                          onChange={e => setRemarks(e.target.value)} 
                          placeholder="Forma de pagamento, prazo de execução ou observações gerais..."
                        />
                      </div>

                      {/* Photo upload field allowing multiple photos in a neat responsive grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 flex items-center gap-1.5">
                            <Camera className="w-3.5 h-3.5 text-primary" /> Anexar Fotos do Projeto
                          </Label>
                          <div className="grid grid-cols-3 gap-2">
                            {photos.map((p, idx) => (
                              <div key={idx} className="relative w-full aspect-square rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 flex-shrink-0 group">
                                <img src={p} alt={`Projeto ${idx + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                <button
                                  type="button"
                                  onClick={() => setPhotos(photos.filter((_, i) => i !== idx))}
                                  className="absolute inset-0 bg-slate-950/70 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4 text-rose-400" />
                                </button>
                              </div>
                            ))}
                            {photos.length < 9 && (
                              <label className="flex flex-col items-center justify-center aspect-square border-2 border-dashed border-slate-200 hover:border-primary bg-slate-50 hover:bg-slate-100/50 rounded-2xl cursor-pointer transition-all">
                                <div className="flex flex-col items-center gap-1">
                                  <ImageIcon className="w-4 h-4 text-slate-400" />
                                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Adicionar</span>
                                </div>
                                <input 
                                  type="file" 
                                  accept="image/*" 
                                  multiple
                                  className="hidden" 
                                  onChange={async (e) => {
                                    const files = e.target.files;
                                    if (files && files.length > 0) {
                                      const newPhotos: string[] = [];
                                      for (let i = 0; i < files.length; i++) {
                                        try {
                                          const b64 = await resizeImage(files[i], 800, 800);
                                          newPhotos.push(b64);
                                        } catch (err) {
                                          console.error("Error resizing image:", err);
                                        }
                                      }
                                      setPhotos(prev => [...prev, ...newPhotos]);
                                    }
                                  }}
                                />
                              </label>
                            )}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Desconto R$</Label>
                            <Input 
                              placeholder="Valor desconto" 
                              type="number"
                              className="h-14 border-slate-100 bg-slate-50 rounded-2xl text-center text-xl font-black focus:ring-primary text-rose-500"
                              value={discount || ''}
                              onChange={(e) => setDiscount(Math.max(0, Number(e.target.value) || 0))}
                            />
                          </div>
                          
                          <div className="flex items-center justify-between p-4 border-2 border-slate-100 rounded-2xl bg-white shadow-sm">
                            <Label className="text-[11px] font-black text-slate-500 uppercase tracking-wide cursor-pointer" htmlFor="includesMaterial">
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
                              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                            </label>
                          </div>

                          <div className="flex items-center justify-between p-4 border-2 border-slate-100 rounded-2xl bg-white shadow-sm">
                            <Label className="text-[11px] font-black text-slate-500 uppercase tracking-wide cursor-pointer" htmlFor="applyCashDiscount">
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
                              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                            </label>
                          </div>

                          <div className="flex items-center justify-between p-4 border-2 border-slate-100 rounded-2xl bg-white shadow-sm">
                            <Label className="text-[11px] font-black text-slate-500 uppercase tracking-wide cursor-pointer" htmlFor="hideDetailedPrices">
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
                              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                            </label>
                          </div>
                        </div>
                      </div>
                   </div>

                   <div className="pt-4 bg-white sticky bottom-0 flex flex-col gap-3 mt-4 border-t border-slate-100">
                     <div className="p-3 bg-slate-50 rounded-xl flex justify-between items-center text-slate-900 border border-slate-100">
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Previsto:</span>
                       <span className="text-lg font-black italic text-primary">R$ {Number(form.totalAmount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                     </div>

                     <Button type="submit" size="lg" className="w-full font-black italic uppercase h-14 rounded-2xl shadow-xl shadow-primary/20 tracking-tighter text-sm bg-primary hover:bg-primary/90 text-white transition-all hover:scale-[1.01]">
                       {editingQuote ? 'Confirmar Ajustes' : 'Emitir Documento'}
                     </Button>
                   </div>
                </div>

                {/* Right Side: Professional Points Calculator */}
                {isCalculatorActive && (
                  <div className="w-full md:w-[480px] bg-slate-50 overflow-y-auto p-6 border-t md:border-t-0 border-slate-100 flex flex-col justify-between min-h-0">
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                            <Zap className="w-4 h-4 text-amber-500 fill-current" /> Calculadora por Pontos
                          </h3>
                          <p className="text-[10px] text-slate-400 font-medium">Calcule de forma rápida e profissional</p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setCalculatorPoints(prev => {
                              const updated = { ...prev };
                              Object.keys(updated).forEach(key => {
                                updated[key] = { ...updated[key], qty: 0 };
                              });
                              return updated;
                            });
                            showToast("Calculadora resetada.", "success");
                          }}
                          className="text-[10px] font-black uppercase text-rose-500 hover:text-rose-600 hover:bg-rose-50 px-2.5 h-8 rounded-lg"
                        >
                          Limpar Tudo
                        </Button>
                      </div>

                      {/* Preset pricing selector */}
                      <div className="space-y-2 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                        <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Tabela de Preços (Preset)</Label>
                        <div className="grid grid-cols-3 gap-2">
                          {(['economic', 'standard', 'premium'] as const).map(preset => (
                            <Button
                              key={preset}
                              type="button"
                              variant={calculatorPreset === preset ? 'default' : 'outline'}
                              onClick={() => handlePresetChange(preset)}
                              className={`h-9 text-[9px] font-black uppercase tracking-wider rounded-xl ${
                                calculatorPreset === preset 
                                  ? 'bg-primary text-white shadow-md shadow-primary/20' 
                                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                              }`}
                            >
                              {preset === 'economic' && 'Econômico'}
                              {preset === 'standard' && 'Padrão'}
                              {preset === 'premium' && 'Premium'}
                            </Button>
                          ))}
                        </div>
                        <p className="text-[9px] text-slate-400 italic mt-1 leading-relaxed">
                          {calculatorPreset === 'economic' && '* Preço acessível para serviços mais simples ou volume maior.'}
                          {calculatorPreset === 'standard' && '* Tabela de preço padrão da RA Elétrica e Automação.'}
                          {calculatorPreset === 'premium' && '* Tabela premium de alta complexidade ou ambientes industriais.'}
                        </p>
                      </div>

                      {/* Point inputs grouped by categories */}
                      <div className="space-y-5 max-h-[440px] overflow-y-auto pr-1">
                        {['Chuveiros', 'Tomadas', 'Interruptores', 'Iluminação', 'QDC', 'Outros'].map(category => {
                          const pointsInCategory = (Object.entries(calculatorPoints) as [string, { qty: number; price: number; label: string; category: string }][]).filter(
                            ([_, p]) => p.category === category
                          );
                          if (pointsInCategory.length === 0) return null;

                          return (
                            <div key={category} className="space-y-2">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 block border-l-2 border-primary/40 pl-2">
                                {category}
                              </span>
                              <div className="grid grid-cols-1 gap-2">
                                {pointsInCategory.map(([pointKey, item]) => (
                                  <div 
                                    key={pointKey} 
                                    className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                                      item.qty > 0 
                                        ? 'bg-white border-primary/30 shadow-md shadow-primary/5' 
                                        : 'bg-white border-slate-100 shadow-sm hover:border-slate-200'
                                    }`}
                                  >
                                    <div className="flex-1 min-w-0">
                                      <span className="text-xs font-black text-slate-800 block truncate" title={item.label}>
                                        {item.label}
                                      </span>
                                      <div className="flex items-center gap-1.5 mt-1">
                                        <span className="text-[9px] font-bold text-slate-400 uppercase">Unitário:</span>
                                        <div className="flex items-center bg-slate-50 border border-slate-200/60 rounded-lg px-2 py-0.5 w-20">
                                          <span className="text-[9px] font-bold text-slate-400 mr-0.5">R$</span>
                                          <input 
                                            type="number"
                                            className="w-full bg-transparent border-0 p-0 text-[10px] font-black text-slate-700 focus:outline-none text-center font-mono"
                                            value={item.price}
                                            onChange={(e) => {
                                              const val = Number(e.target.value) || 0;
                                              setCalculatorPoints(prev => ({
                                                ...prev,
                                                [pointKey]: { ...prev[pointKey], price: val }
                                              }));
                                            }}
                                          />
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-1 shrink-0">
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        className="w-7 h-7 rounded-lg border-slate-200 text-slate-500 hover:bg-slate-100 font-bold"
                                        onClick={() => {
                                          setCalculatorPoints(prev => ({
                                            ...prev,
                                            [pointKey]: { ...prev[pointKey], qty: Math.max(0, prev[pointKey].qty - 1) }
                                          }));
                                        }}
                                      >
                                        -
                                      </Button>
                                      
                                      <input 
                                        type="number"
                                        className="w-9 h-7 border border-slate-200 rounded-lg text-center text-xs font-black bg-slate-50 text-slate-800 focus:ring-primary focus:outline-none font-mono"
                                        value={item.qty || ''}
                                        onChange={(e) => {
                                          const val = Math.max(0, Number(e.target.value) || 0);
                                          setCalculatorPoints(prev => ({
                                            ...prev,
                                            [pointKey]: { ...prev[pointKey], qty: val }
                                          }));
                                        }}
                                      />
                                      
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        className="w-7 h-7 rounded-lg border-slate-200 text-slate-500 hover:bg-slate-100 font-bold"
                                        onClick={() => {
                                          setCalculatorPoints(prev => ({
                                            ...prev,
                                            [pointKey]: { ...prev[pointKey], qty: prev[pointKey].qty + 1 }
                                          }));
                                        }}
                                      >
                                        +
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-200 bg-slate-50 space-y-3 shrink-0">
                      <div className="flex justify-between items-center bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total dos Pontos</span>
                          <span className="text-[10px] text-slate-500 font-bold font-mono">
                            {(Object.values(calculatorPoints) as { qty: number; price: number; label: string; category: string }[]).reduce((acc, p) => acc + p.qty, 0)} pontos selecionados
                          </span>
                        </div>
                        <span className="text-lg font-black text-slate-900 font-mono">
                          R$ {(Object.values(calculatorPoints) as { qty: number; price: number; label: string; category: string }[]).reduce((acc, p) => acc + (p.qty * p.price), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      <Button 
                        type="button" 
                        size="lg" 
                        onClick={handleApplyCalculator}
                        className="w-full font-black italic uppercase h-12 rounded-xl text-xs bg-primary hover:bg-primary/90 text-white transition-all shadow-md shadow-primary/10 flex items-center justify-center gap-1.5"
                      >
                        <Zap className="w-4 h-4 fill-current animate-pulse text-amber-300" />
                        Preencher Orçamento
                      </Button>
                    </div>
                  </div>
                )}
             </form>
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
            <motion.div 
              key={q.id} 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className="group bg-[#1E293B] rounded-[2.5rem] shadow-xl border border-slate-800 hover:border-[#EAB308]/40 transition-all flex flex-col relative"
            >
              <div className="p-6 sm:p-8 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-8">
                  <div className="h-14 w-14 bg-[#0B0F19] border border-slate-800 text-[#EAB308] rounded-[1.25rem] flex items-center justify-center shrink-0">
                     <FileText className="w-6 h-6" />
                  </div>
                  <div className="ml-2 text-right">
                    {q.status === 'pending' && <span className="bg-amber-950/80 text-amber-400 border border-amber-800 text-[9px] px-4 py-1.5 rounded-full font-black uppercase tracking-widest italic shadow-sm inline-block">Pendente</span>}
                    {q.status === 'approved' && <span className="bg-emerald-950/80 text-emerald-400 border border-emerald-800 text-[9px] px-4 py-1.5 rounded-full font-black uppercase tracking-widest italic shadow-sm inline-block">Aprovado</span>}
                    {q.status === 'rejected' && <span className="bg-rose-950/80 text-rose-400 border border-rose-800 text-[9px] px-4 py-1.5 rounded-full font-black uppercase tracking-widest italic shadow-sm inline-block">Recusado</span>}
                  </div>
                </div>
                
                <h3 className="font-black text-white text-2xl mb-2 tracking-tighter uppercase italic leading-none group-hover:text-[#EAB308] transition-colors">{q.clientName}</h3>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Protocolo: {q.id.slice(0, 8).toUpperCase()}</div>
                
                {(() => {
                  const isJson = q.description && (q.description.startsWith('{') || q.description.startsWith('['));
                  let parsed = { items: [] as any[], remarks: '', photo: '', photos: [] as string[], includesMaterial: false, applyCashDiscount: false, discount: 0, hideDetailedPrices: false };
                  try {
                    if (isJson) {
                      parsed = JSON.parse(q.description);
                    }
                  } catch (e) {}

                  return isJson ? (
                    <div className="space-y-4 flex-1 mb-6">
                      <div className="bg-[#0B0F19] rounded-3xl p-5 border border-slate-800 space-y-3">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Serviços Inclusos:</span>
                        <div className="space-y-2">
                          {parsed.items?.map((it: any, i: number) => (
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
                              {quotePhotos.map((pUrl: string, pIdx: number) => (
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
                       <p className="text-sm text-slate-300 font-medium italic leading-relaxed line-clamp-4">{q.description}</p>
                    </div>
                  );
                })()}
                
                <div className="flex items-center justify-between p-6 bg-[#0B0F19] border border-slate-800 rounded-[1.5rem] text-white relative overflow-hidden group/price">
                   <div>
                      <div className="text-[8px] font-black uppercase tracking-[0.3em] text-[#EAB308] mb-1">Investimento Est.</div>
                      <div className="text-2xl font-black italic tracking-tighter text-[#EAB308]">
                         R$ {Number(q.totalAmount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                   </div>
                   <div className="w-10 h-10 rounded-xl bg-[#EAB308]/10 flex items-center justify-center text-[#EAB308] border border-[#EAB308]/20">
                      <Zap className="w-5 h-5 fill-current" />
                   </div>
                </div>

                <div className="flex flex-wrap xl:flex-nowrap items-center gap-2 pt-6 mt-4 border-t border-slate-800">
                   {q.status === 'pending' ? (
                     <div className="flex gap-2 flex-1 min-w-[180px]">
                       <Button 
                        variant="ghost" 
                        size="sm" 
                        className="flex-1 shrink-0 font-black text-[10px] sm:text-xs xl:text-[10px] uppercase tracking-widest h-11 bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 hover:bg-emerald-600 hover:text-white rounded-2xl transition-all" 
                        onClick={() => updateStatus(q.id, 'approved')}
                       >
                         <CheckCircle className="w-4 h-4 mr-1 sm:mr-2"/> Aprovar
                       </Button>
                       <Button 
                        variant="ghost" 
                        size="sm" 
                        className="flex-1 shrink-0 font-black text-[10px] sm:text-xs xl:text-[10px] uppercase tracking-widest h-11 bg-rose-950/80 text-rose-400 border border-rose-800/80 hover:bg-rose-600 hover:text-white rounded-2xl transition-all" 
                        onClick={() => updateStatus(q.id, 'rejected')}
                       >
                         <XCircle className="w-4 h-4 mr-1 sm:mr-2"/> Recusar
                       </Button>
                     </div>
                   ) : (
                     <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 shrink-0 min-w-[180px] font-black text-[10px] sm:text-xs xl:text-[10px] uppercase tracking-widest h-11 text-slate-300 border-slate-800 bg-[#0B0F19] hover:bg-slate-800 rounded-2xl"
                      onClick={() => updateStatus(q.id, 'pending')}
                     >
                       Reabrir Proposta
                     </Button>
                   )}
                   
                   <div className="flex gap-1 shrink-0 ml-auto">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        title="Baixar PDF e Enviar WhatsApp"
                        onClick={() => shareWhatsApp(q)} 
                        className="h-11 w-11 shrink-0 bg-[#25D366] hover:bg-[#1DA851] text-white rounded-2xl shadow-xl flex flex-col items-center justify-center"
                      >
                        <Download className="w-4 h-4" />
                      </Button>

                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => openEdit(q)} 
                        className="h-11 w-11 shrink-0 bg-[#0B0F19] text-slate-300 hover:text-white border border-slate-800 rounded-2xl"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDelete(q.id)} 
                        className="h-11 w-11 shrink-0 bg-[#0B0F19] hover:bg-rose-950/80 text-slate-300 hover:text-rose-400 border border-slate-800 rounded-2xl"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                   </div>
                </div>
              </div>
            </motion.div>
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
