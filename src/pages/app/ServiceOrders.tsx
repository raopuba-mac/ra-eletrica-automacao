import React from 'react';
import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../components/AuthProvider';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Textarea } from '../../components/ui/textarea';
import { PageHeader } from '../../components/PageHeader';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, Camera, User as UserIcon, Calendar, Clock, Edit, AlertTriangle, Send, Zap, Printer } from 'lucide-react';
import { OperationType, handleFirestoreError } from '../../lib/error';
import { resizeImage } from '../../lib/imageHandler';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { cn } from '../../lib/utils';
import jsPDF from 'jspdf';

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

export default function ServiceOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isPdfSelectOpen, setIsPdfSelectOpen] = useState(false);
  const [selectedOrderForPdf, setSelectedOrderForPdf] = useState<string>('');
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  const [editingOrder, setEditingOrder] = useState<any | null>(null);
  const [form, setForm] = useState({ clientId: '', description: '', status: 'scheduled' as any, scheduledDate: '', scheduledTime: '', finalPrice: '' });
  const [attachments, setAttachments] = useState<string[]>([]);
  const [attachmentsAfter, setAttachmentsAfter] = useState<string[]>([]);
  const [isDraggingBefore, setIsDraggingBefore] = useState(false);
  const [isDraggingAfter, setIsDraggingAfter] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsubOrders = onSnapshot(query(collection(db, 'serviceOrders'), where('userId', '==', user.uid)), 
      (snap) => {
        const sorted = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));
        setOrders(sorted);
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'serviceOrders')
    );

    const unsubClients = onSnapshot(query(collection(db, 'clients'), where('userId', '==', user.uid)), 
      (snap) => {
        setClients(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'clients')
    );

    return () => {
      unsubOrders();
      unsubClients();
    };
  }, [user]);

  const processUploadedFiles = async (files: FileList | File[], isAfter: boolean) => {
    const fileArray = Array.from(files);
    for (const file of fileArray) {
      try {
        if (file.type.startsWith('image/')) {
          const resized = await resizeImage(file, 1200, 1200);
          if (isAfter) {
            setAttachmentsAfter(prev => [...prev, resized]);
          } else {
            setAttachments(prev => [...prev, resized]);
          }
        } else if (file.type.startsWith('video/')) {
          const reader = new FileReader();
          reader.onload = (event) => {
             const result = event.target?.result as string;
             if (isAfter) {
               setAttachmentsAfter(prev => [...prev, result]);
             } else {
               setAttachments(prev => [...prev, result]);
             }
          };
          reader.readAsDataURL(file);
        }
      } catch (err) {
        console.error("Failed to process file", err);
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processUploadedFiles(e.target.files, false);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleFileUploadAfter = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processUploadedFiles(e.target.files, true);
    }
  };

  const removeAttachmentAfter = (index: number) => {
    setAttachmentsAfter(prev => prev.filter((_, i) => i !== index));
  };

  const handleDragBefore = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDraggingBefore(true);
    } else if (e.type === "dragleave") {
      setIsDraggingBefore(false);
    }
  };

  const handleDropBefore = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingBefore(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processUploadedFiles(e.dataTransfer.files, false);
    }
  };

  const handleDragAfter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDraggingAfter(true);
    } else if (e.type === "dragleave") {
      setIsDraggingAfter(false);
    }
  };

  const handleDropAfter = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingAfter(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processUploadedFiles(e.dataTransfer.files, true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsDialogOpen(false);
    
    try {
      const data = {
        userId: user.uid,
        clientId: form.clientId,
        description: form.description,
        status: form.status,
        scheduledDate: form.scheduledDate,
        scheduledTime: form.scheduledTime,
        finalPrice: form.finalPrice || '',
        photos: attachments,
        photosAfter: attachmentsAfter,
        updatedAt: Date.now()
      };

      if (editingOrder) {
        await updateDoc(doc(db, 'serviceOrders', editingOrder.id), data);
      } else {
        await addDoc(collection(db, 'serviceOrders'), { ...data, createdAt: Date.now() });
      }
      
      setEditingOrder(null);
      setForm({ clientId: '', description: '', status: 'scheduled', scheduledDate: '', scheduledTime: '', finalPrice: '' });
      setAttachments([]);
      setAttachmentsAfter([]);
    } catch(err) {
      handleFirestoreError(err, editingOrder ? OperationType.UPDATE : OperationType.CREATE, 'serviceOrders');
    }
  };

  const handleDelete = async () => {
     if (!orderToDelete) return;
     try {
       await deleteDoc(doc(db, 'serviceOrders', orderToDelete));
       setIsConfirmDeleteOpen(false);
       setOrderToDelete(null);
     } catch(err) {
       handleFirestoreError(err, OperationType.DELETE, `serviceOrders/${orderToDelete}`);
     }
  };

  const confirmDelete = (id: string) => {
    setOrderToDelete(id);
    setIsConfirmDeleteOpen(true);
  };

  const getClientName = (id: string) => clients.find(c => c.id === id)?.name || 'Desconhecido';

  const openEdit = (order: any) => {
    setEditingOrder(order);
    setForm({
      clientId: order.clientId,
      description: order.description,
      status: order.status,
      scheduledDate: order.scheduledDate || '',
      scheduledTime: order.scheduledTime || '',
      finalPrice: order.finalPrice || ''
    });
    setAttachments(order.photos || []);
    setAttachmentsAfter(order.photosAfter || []);
    setIsDialogOpen(true);
  };

  const openCreate = () => {
    setEditingOrder(null);
    setForm({ clientId: '', description: '', status: 'scheduled', scheduledDate: '', scheduledTime: '', finalPrice: '' });
    setAttachments([]);
    setAttachmentsAfter([]);
    setIsDialogOpen(true);
  };

  const statusColors: any = {
    scheduled: 'bg-yellow-100 text-yellow-800',
    in_progress: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800'
  };
  const statusNames: any = {
    scheduled: 'Agendado',
    in_progress: 'Em Andamento',
    completed: 'Concluído',
    cancelled: 'Cancelado'
  };

  const shareWhatsApp = (order: any) => {
    const client = clients.find(c => c.id === order.clientId);
    if (!client || !client.phone) {
      alert('Cliente não encontrado ou sem telefone cadastrado.');
      return;
    }

    const docUrl = window.location.origin + `/os/${order.id}`;
    const price = order.finalPrice ? `\n\n💰 *Valor do Investimento:* R$ ${Number(order.finalPrice).toLocaleString('pt-BR', {minimumFractionDigits: 2})}` : '';
    const text = `Olá, ${client.name}! Tudo bem?\n\nA sua Ordem de Serviço foi atualizada para *Concluída*!\n\n🛠 *Descrição:* ${order.description}${price}\n\n✅ *Veja o comprovante completo com fotos de antes/depois no link abaixo:*\n${docUrl}\n\nMuito obrigado pela preferência!`;

    const phone = client.phone.replace(/\D/g, '');
    const url = `https://wa.me/55${phone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const generatePdf = async (order: any) => {
    if (!order) return;
    const client = clients.find(c => c.id === order.clientId) || { name: 'Desconhecido', phone: '', email: '' };

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
        console.error("Error loading user profile for OS PDF", e);
      }
    }

    // Fetch and load logo
    let logoBase64 = '';
    try {
      logoBase64 = await getBase64ImageFromUrl('/logo.jpg?v=6');
    } catch (e) {
      console.error('Error loading logo', e);
    }

    try {
      const doc = new jsPDF();
      
      // Header
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text("ORDEM DE SERVIÇO", 14, 22);

      if (logoBase64) {
        try {
          doc.addImage(logoBase64, 'JPEG', 166, 10, 30, 30);
        } catch (e) {
          console.error("Error drawing logo in PDF", e);
        }
      }

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Protocolo: ${order.id.slice(0, 8).toUpperCase()}`, 14, 30);
      
      const formattedDate = order.scheduledDate 
          ? new Date(order.scheduledDate + 'T00:00:00').toLocaleDateString('pt-BR') 
          : new Date(order.createdAt || Date.now()).toLocaleDateString('pt-BR');
      doc.text(`Data: ${formattedDate}`, 14, 35);
      
      // Client Info
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text("DADOS DO CLIENTE", 14, 50);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      doc.text(`Nome/Empresa: ${sanitizeForPDF(client.name || '')}`, 14, 57);
      if(client.phone) doc.text(`Telefone: ${sanitizeForPDF(client.phone || '')}`, 14, 63);
      if(client.email) doc.text(`E-mail: ${sanitizeForPDF(client.email || '')}`, 14, 69);

      // Status
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text("STATUS DO SERVIÇO", 120, 50);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      doc.text(sanitizeForPDF(statusNames[order.status] || order.status), 120, 57);

      let endY = 85;

      // Description
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text("MEMORIAL DESCRITIVO / SERVIÇOS", 14, endY);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      
      const splitText = doc.splitTextToSize(sanitizeForPDF(order.description || ''), 180);
      doc.text(splitText, 14, endY + 7);
      endY += (splitText.length * 5) + 15;

      // Final Price
      // Prevent page overflow for Final Price title and value text
      if (endY > 260) {
        doc.addPage();
        endY = 20;
      }

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      const totalFormatted = order.finalPrice ? `R$ ${Number(order.finalPrice).toLocaleString('pt-BR', {minimumFractionDigits: 2})}` : 'R$ 0,00';
      doc.text(`Valor Final do Serviço: ${totalFormatted}`, 14, endY);
      endY += 20;

      // Photos
      const drawPhotos = (photos: string[], title: string, startY: number) => {
        if (!photos || photos.length === 0) return startY;
        
        // Ensure we don't go out of page
        if (startY > 230) {
            doc.addPage();
            startY = 20;
        }

        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(15, 23, 42);
        doc.text(title, 14, startY);
        
        let currentY = startY + 5;
        let pX = 14;
        
        const imgSize = 45; 
        const margin = 10;
        
        photos.forEach((p, index) => {
           if (pX + imgSize > 200) {
               pX = 14;
               currentY += imgSize + margin;
               if (currentY + imgSize > 270) {
                   doc.addPage();
                   currentY = 20;
               }
           }
           
           if (p.startsWith('data:video')) {
              doc.setFontSize(9);
              doc.setFont("helvetica", "italic");
              doc.setTextColor(100, 100, 100);
              doc.text("[Vídeo anexado - Ver no Sistema]", pX, currentY + (imgSize/2));
           } else if (p.startsWith('data:image')) {
               try {
                   const formatMatch = p.match(/data:image\/([a-zA-Z0-9]+);/);
                   const format = formatMatch ? formatMatch[1].toUpperCase() : 'JPEG';
                   doc.addImage(p, format === 'JPG' ? 'JPEG' : format, pX, currentY, imgSize, imgSize);
               } catch(e) {
                   console.error("Could not add image to PDF", e);
               }
           }
           pX += imgSize + margin;
        });
        
        return currentY + imgSize + 15;
      };

      endY = drawPhotos(order.photos, "EVIDÊNCIAS (ANTES)", endY);
      endY = drawPhotos(order.photosAfter, "EVIDÊNCIAS (DEPOIS)", endY);

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
      doc.text(`Documento gerado eletronicamente em ${new Date().toLocaleDateString('pt-BR')}.`, 14, 288);

      doc.save(`OS_${client.name.replace(/\s+/g, '_')}_${order.id.slice(0, 5).toUpperCase()}.pdf`);
    } catch(err) {
      console.error(err);
      alert('Erro ao gerar PDF da OS.');
    }
  };

  return (
    <div className="space-y-10">
      <PageHeader 
        title="Gestão de Serviços" 
        description="Controle operacional de ordens de serviço, manutenção e instalações."
        action={
          <div className="flex flex-wrap items-center gap-4">
            <Dialog open={isPdfSelectOpen} onOpenChange={setIsPdfSelectOpen}>
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
                            {getClientName(order.clientId)} - {order.scheduledDate ? new Date(order.scheduledDate + 'T00:00:00').toLocaleDateString('pt-BR') : 'Sem data'} ({order.id.slice(0, 5).toUpperCase()})
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
                      generatePdf(order);
                      setIsPdfSelectOpen(false);
                    }}
                    className="w-full h-14 bg-[#EAB308] hover:bg-[#ca8a04] text-[#0B0F19] font-black uppercase text-xs tracking-[0.2em] rounded-2xl shadow-xl shadow-[#EAB308]/20 italic"
                  >
                    Gerar e Imprimir PDF
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) setEditingOrder(null);
            }}>
              <DialogTrigger
                render={
                  <Button onClick={openCreate} className="h-14 px-8 font-black uppercase tracking-widest bg-[#EAB308] hover:bg-[#ca8a04] text-[#0B0F19] rounded-2xl shadow-2xl shadow-[#EAB308]/20 italic">
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
                        <Select onValueChange={(val: any) => setForm({...form, status: val})} value={form.status}>
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

                <div className="space-y-4">
                  <Label className="text-[10px] font-black text-slate-300 uppercase tracking-widest pl-1 italic">Evidências (Antes)</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div 
                      onDragEnter={handleDragBefore}
                      onDragLeave={handleDragBefore}
                      onDragOver={handleDragBefore}
                      onDrop={handleDropBefore}
                      className={cn(
                        "relative border-4 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center group transition-all cursor-pointer",
                        isDraggingBefore ? "border-[#EAB308] bg-[#EAB308]/10 scale-[1.02] shadow-xl" : "border-slate-800 bg-[#0B0F19] hover:border-[#EAB308]/50"
                      )}
                    >
                      <Camera className={cn("w-10 h-10 mb-4 transition-all duration-300", isDraggingBefore ? "text-[#EAB308] scale-110" : "text-slate-600 group-hover:text-[#EAB308] group-hover:scale-110")} />
                      <span className={cn("text-[10px] font-black uppercase tracking-widest transition-all duration-300", isDraggingBefore ? "text-[#EAB308] font-black" : "text-slate-400 group-hover:text-[#EAB308]")}>Arraste ou Clique</span>
                      <input 
                        type="file" 
                        accept="image/*,video/*" 
                        multiple 
                        onChange={handleFileUpload} 
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      {attachments.map((file, idx) => (
                        <div key={idx} className="relative group aspect-square rounded-2xl overflow-hidden border border-slate-800 shadow-sm">
                          {file.startsWith('data:video/') ? (
                            <embed src={file} className="w-full h-full object-cover" />
                          ) : (
                            <img src={file} className="w-full h-full object-cover" />
                          )}
                          <button
                            type="button"
                            onClick={() => removeAttachment(idx)}
                            className="absolute inset-0 bg-rose-600/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-5 h-5 scale-75 group-hover:scale-100 transition-transform" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

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

                    <div className="space-y-4">
                      <Label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest pl-1 italic">Evidências Finais (Depois)</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div 
                          onDragEnter={handleDragAfter}
                          onDragLeave={handleDragAfter}
                          onDragOver={handleDragAfter}
                          onDrop={handleDropAfter}
                          className={cn(
                            "relative border-4 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center group transition-all cursor-pointer",
                            isDraggingAfter ? "border-emerald-500 bg-emerald-500/10 scale-[1.02] shadow-xl" : "border-slate-800 bg-[#0B0F19] hover:border-emerald-500/50"
                          )}
                        >
                          <Camera className={cn("w-10 h-10 mb-4 transition-all duration-300", isDraggingAfter ? "text-emerald-400 scale-110" : "text-slate-600 group-hover:text-emerald-400 group-hover:scale-110")} />
                          <span className={cn("text-[10px] font-black uppercase tracking-widest transition-all duration-300", isDraggingAfter ? "text-emerald-400 font-black" : "text-slate-400 group-hover:text-emerald-400")}>Arraste ou Clique</span>
                          <input 
                            type="file" 
                            accept="image/*,video/*" 
                            multiple 
                            onChange={handleFileUploadAfter} 
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          {attachmentsAfter.map((file, idx) => (
                            <div key={idx} className="relative group aspect-square rounded-2xl overflow-hidden border border-slate-800 shadow-sm">
                              {file.startsWith('data:video/') ? (
                                <embed src={file} className="w-full h-full object-cover" />
                              ) : (
                                <img src={file} className="w-full h-full object-cover" />
                              )}
                              <button
                                type="button"
                                onClick={() => removeAttachmentAfter(idx)}
                                className="absolute inset-0 bg-rose-600/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Trash2 className="w-5 h-5 scale-75 group-hover:scale-100 transition-transform" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                <Button type="submit" size="lg" className="w-full font-black italic uppercase h-16 rounded-3xl shadow-2xl shadow-[#EAB308]/20 tracking-tighter text-lg bg-[#EAB308] hover:bg-[#ca8a04] text-[#0B0F19] transition-all hover:scale-[1.01]">
                  {editingOrder ? 'Salvar Certificação' : 'Protocolar Chamado'}
                </Button>
             </form>
          </DialogContent>
        </Dialog>
      </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <AnimatePresence>
          {orders.map((order, idx) => (
            <motion.div 
              key={order.id} 
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className="group bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden hover:shadow-2xl hover:shadow-slate-200/50 hover:border-slate-200 transition-all flex flex-col relative"
            >
              <div className={`h-2 w-full ${statusColors[order.status].split(' ')[0]}`} />
              
              <div className="p-8 md:p-10 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-8">
                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                       <div className="h-12 w-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all duration-500">
                          <UserIcon className="w-6 h-6" />
                       </div>
                       <div className="flex flex-col">
                          <span className="font-black text-slate-900 tracking-tighter uppercase italic text-xl leading-none">{getClientName(order.clientId)}</span>
                          <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1">ID Protocolo: {order.id.slice(0, 8).toUpperCase()}</span>
                       </div>
                    </div>
                  </div>
                  <div className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-full italic shadow-sm ${statusColors[order.status]}`}>
                     {statusNames[order.status]}
                  </div>
                </div>

                <div className="mb-8">
                   <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-3">Memorial Técnico</div>
                   <p className="text-sm text-slate-600 font-medium italic leading-relaxed bg-slate-50/50 p-6 rounded-3xl border border-slate-50 line-clamp-4">{order.description}</p>
                </div>
                
                {/* Visual Documentation Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    {/* Photos Preview */}
                    <div className="space-y-4">
                       <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Antes</span>
                       </div>
                       <div className="grid grid-cols-2 gap-2">
                          {(order.photos || []).slice(0, 2).map((file: string, i: number) => (
                             <div key={i} className="aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 group/img overflow-hidden">
                                <img src={file} className="w-full h-full object-cover transition-transform group-hover/img:scale-110" />
                             </div>
                          ))}
                          {(!order.photos || order.photos.length === 0) && (
                             <div className="col-span-2 py-4 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200 uppercase text-[8px] font-black tracking-widest">Sem fotos</div>
                          )}
                       </div>
                    </div>

                    <div className="space-y-4">
                       <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Depois</span>
                       </div>
                       <div className="grid grid-cols-2 gap-2">
                          {(order.photosAfter || []).slice(0, 2).map((file: string, i: number) => (
                             <div key={i} className="aspect-square rounded-2xl overflow-hidden bg-emerald-50 border border-emerald-100 group/img overflow-hidden">
                                <img src={file} className="w-full h-full object-cover transition-transform group-hover/img:scale-110" />
                             </div>
                          ))}
                          {(!order.photosAfter || order.photosAfter.length === 0) && (
                             <div className="col-span-2 py-4 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200 uppercase text-[8px] font-black tracking-widest">Sem fotos</div>
                          )}
                       </div>
                    </div>
                </div>

                <div className="mt-auto pt-8 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
                   <div className="flex flex-col">
                      <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1">Custo Final</span>
                      <span className="text-2xl font-black text-slate-900 italic tracking-tighter">
                         R$ {order.finalPrice ? Number(order.finalPrice).toLocaleString('pt-BR', {minimumFractionDigits: 2}) : '0,00'}
                      </span>
                   </div>
                   
                   <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl hover:bg-slate-100 hover:text-primary text-slate-300 transition-colors mr-2" onClick={() => generatePdf(order)} title="Gerar PDF da OS">
                          <Printer className="w-5 h-5" />
                       </Button>
                       <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl hover:bg-rose-50 hover:text-rose-600 text-slate-300 transition-colors" onClick={() => confirmDelete(order.id)}>
                         <Trash2 className="w-5 h-5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl hover:bg-slate-100 hover:text-slate-900 text-slate-300 transition-colors" onClick={() => openEdit(order)}>
                         <Edit className="w-5 h-5" />
                      </Button>
                      {order.status === 'completed' && (
                        <Button 
                          onClick={() => shareWhatsApp(order)}
                          className="h-12 px-6 bg-[#25D366] hover:bg-[#1DA851] text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-xl shadow-green-500/20 italic italic translate-y-[-2px] active:translate-y-[0]" 
                        >
                          <Send className="w-4 h-4 mr-2" /> Cobrar OS
                        </Button>
                      )}
                   </div>
                </div>
              </div>
            </motion.div>
          ))}
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

      <Dialog open={isConfirmDeleteOpen} onOpenChange={setIsConfirmDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="w-5 h-5" /> Confirmar Exclusão
            </DialogTitle>
            <DialogDescription className="pt-2 font-medium">
              Tem certeza que deseja excluir esta Ordem de Serviço? Todos os dados vinculados, incluindo fotos anexadas, serão removidos permanentemente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-3 sm:gap-0">
            <Button variant="outline" className="flex-1 font-bold" onClick={() => setIsConfirmDeleteOpen(false)}>Cancelar</Button>
            <Button variant="destructive" className="flex-1 font-bold" onClick={handleDelete}>Excluir OS</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
