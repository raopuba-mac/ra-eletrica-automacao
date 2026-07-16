import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Zap, Camera, Clock, CheckCircle2, Phone, ArrowLeft, Download } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '../../components/ui/button';
import SEO from '../../components/SEO';

export default function OSView() {
  const { orderId } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [companyProfile, setCompanyProfile] = useState<any>(null);

  const [sigName, setSigName] = useState('');
  const [sigDoc, setSigDoc] = useState('');
  const [signing, setSigning] = useState(false);

  const [logoError, setLogoError] = useState(false);
  const [logoSrc, setLogoSrc] = useState('/logo.jpg?v=6');

  const handleLogoError = () => {
    if (logoSrc === '/logo.jpg?v=6') {
      setLogoSrc(`/logo.jpg?t=${Date.now()}`);
    } else {
      setLogoError(true);
    }
  };

  const handleSign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId || !sigName.trim()) return;
    setSigning(true);
    try {
      const docRef = doc(db, 'serviceOrders', orderId);
      const timestamp = Date.now();
      await updateDoc(docRef, {
        clientSignatureName: sigName,
        clientSignatureDoc: sigDoc || '',
        signedAt: timestamp,
        updatedAt: timestamp
      });
      setOrder((prev: any) => ({
        ...prev,
        clientSignatureName: sigName,
        clientSignatureDoc: sigDoc || '',
        signedAt: timestamp,
        updatedAt: timestamp
      }));
    } catch(err) {
      console.error("Erro ao registrar assinatura:", err);
      alert("Falha ao registrar assinatura digital. Por favor, tente novamente.");
    } finally {
      setSigning(false);
    }
  };

  useEffect(() => {
    async function fetchOS() {
      if (!orderId) return;
      try {
        const orderSnap = await getDoc(doc(db, 'serviceOrders', orderId));
        if (orderSnap.exists()) {
          const orderData = orderSnap.data();
          setOrder({ id: orderSnap.id, ...orderData });

          // Fetch client info
          if (orderData.clientId) {
            const clientSnap = await getDoc(doc(db, 'clients', orderData.clientId));
            if (clientSnap.exists()) {
              setClient(clientSnap.data());
            }
          }

          // Fetch user profile (company details)
          if (orderData.userId) {
            const userSnap = await getDoc(doc(db, 'users', orderData.userId));
            if (userSnap.exists()) {
              setCompanyProfile(userSnap.data());
            }
          }
        } else {
          setError('Ordem de Serviço não encontrada.');
        }
      } catch (err) {
        console.error("Error fetching OS:", err);
        setError('Ocorreu um erro ao carregar os dados.');
      } finally {
        setLoading(false);
      }
    }

    fetchOS();
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Carregando Documento</span>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md w-full bg-white p-8 rounded-[2rem] shadow-xl text-center space-y-6">
          <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto">
             <Zap className="w-8 h-8 opacity-20" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase italic">{error || 'Erro inesperado'}</h1>
          <p className="text-slate-500 font-medium italic">O link pode ter expirado ou o documento foi removido.</p>
          <Link to="/">
            <Button className="w-full h-12 rounded-xl font-bold">Voltar para o Site</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20 pt-10 px-4 md:px-6">
      <SEO 
        title={`Ordem de Serviço #${orderId?.slice(0, 8).toUpperCase() || ''} - RA Elétrica & Automação`}
        description={`Ordem de Serviço emitida para ${client?.name || 'Cliente'} em serviços de elétrica, automação ou segurança eletrônica.`}
        keywords="ordem de serviço, ra elétrica, automação, cftv, eletricista, cerca elétrica"
      />
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Header/Logo */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden">
           <div className="absolute inset-0 bg-dot-pattern opacity-5 pointer-events-none"></div>
           <div className="flex items-center gap-4 relative z-10">
              <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-xl border border-slate-100 shrink-0 bg-white">
                 {!logoError ? (
                    <img 
                      src={logoSrc} 
                      alt="RA Logo" 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer" 
                      onError={handleLogoError}
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center p-2 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-indigo-600/20" />
                      <svg className="w-9 h-9 text-blue-500 z-10 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" className="text-blue-400 fill-blue-500/10" />
                      </svg>
                    </div>
                  )}
              </div>
              <div className="flex flex-col">
                 <span className="text-xl font-black tracking-tighter italic text-slate-900 leading-none">{companyProfile?.companyName?.toUpperCase() || 'RA | ELÉTRICA & AUTOMAÇÃO'}</span>
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Comprovante de Serviço Realizado</span>
              </div>
           </div>
           
           <div className="flex flex-col items-center md:items-end relative z-10">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Status do Documento</span>
              <div className="bg-emerald-500 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20">
                 Serviço Concluído
              </div>
           </div>
        </div>

        {/* Content Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden"
        >
          <div className="p-10 space-y-10">
             
             {/* Client & Date Info */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                <div className="space-y-2">
                   <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] leading-none">Destinatário</h3>
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                         <Phone className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-lg font-black tracking-tight text-slate-900 uppercase italic leading-none truncate max-w-[200px]">{client?.name || 'Cliente'}</span>
                        <span className="text-xs text-slate-400 font-medium mt-1">{client?.phone || ''}</span>
                      </div>
                   </div>
                </div>
                
                <div className="space-y-2 md:text-right">
                   <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] leading-none md:justify-end">Data de Conclusão</h3>
                   <div className="flex items-center gap-3 md:justify-end">
                      <div className="flex flex-col items-end">
                        <span className="text-lg font-black tracking-tight text-slate-900 uppercase italic leading-none">
                           {order.scheduledDate ? new Date(order.scheduledDate + 'T00:00:00').toLocaleDateString('pt-BR', {day: '2-digit', month: 'long', year: 'numeric'}) : 'N/A'}
                        </span>
                        <span className="text-xs text-slate-400 font-medium mt-1">Ref: {order.id.slice(0, 8).toUpperCase()}</span>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                         <Clock className="w-5 h-5" />
                      </div>
                   </div>
                </div>
             </div>

             <div className="h-px bg-slate-100"></div>

             {/* Description */}
             <div className="space-y-4">
                <h3 className="text-[20px] font-black text-slate-900 uppercase tracking-tighter italic leading-none">Descrição Técnica do Serviço</h3>
                <div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl italic text-slate-600 leading-relaxed font-medium">
                   {order.description}
                </div>
             </div>

             {/* Photos Comparison */}
             <div className="space-y-6">
                <h3 className="text-[20px] font-black text-slate-900 uppercase tracking-tighter italic leading-none">Registro Fotográfico</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   {/* BEFORE */}
                   <div className="space-y-4">
                      <div className="flex items-center gap-2">
                         <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                         <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Antes da Intervenção</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                         {order.photos && order.photos.length > 0 ? (
                            order.photos.map((p: string, idx: number) => (
                               <div key={idx} className="aspect-square rounded-2xl overflow-hidden border border-slate-100 shadow-sm transition hover:scale-105 active:scale-95 cursor-zoom-in">
                                  <img src={p} alt="Antes" className="w-full h-full object-cover" />
                               </div>
                            ))
                         ) : (
                            <div className="col-span-2 aspect-video bg-slate-50 border border-slate-100 rounded-2xl flex flex-col items-center justify-center text-slate-300">
                               <Camera className="w-8 h-8 opacity-20 mb-2" />
                               <span className="text-[10px] font-black uppercase tracking-widest">Sem registro</span>
                            </div>
                         )}
                      </div>
                   </div>

                   {/* AFTER */}
                   <div className="space-y-4">
                      <div className="flex items-center gap-2">
                         <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                         <span className="text-[10px] font-black uppercase tracking-widest text-primary">Serviço Finalizado</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                         {order.photosAfter && order.photosAfter.length > 0 ? (
                            order.photosAfter.map((p: string, idx: number) => (
                               <div key={idx} className="aspect-square rounded-2xl overflow-hidden border border-primary/20 shadow-lg shadow-primary/5 transition hover:scale-105 active:scale-95 cursor-zoom-in">
                                  <img src={p} alt="Depois" className="w-full h-full object-cover" />
                               </div>
                            ))
                         ) : (
                            <div className="col-span-2 aspect-video bg-slate-50 border border-slate-100 rounded-2xl flex flex-col items-center justify-center text-slate-300">
                               <Camera className="w-8 h-8 opacity-20 mb-2" />
                               <span className="text-[10px] font-black uppercase tracking-widest">Sem registro</span>
                            </div>
                         )}
                      </div>
                   </div>
                </div>
             </div>

             <div className="h-px bg-slate-100"></div>

             {/* Assinatura / Aceite Digital */}
             <div className="space-y-6">
                <h3 className="text-[20px] font-black text-slate-900 uppercase tracking-tighter italic leading-none">Termo de Conformidade & Recebimento</h3>
                
                {order.clientSignatureName ? (
                   <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[40px] rounded-full"></div>
                      <div className="flex items-center gap-4 relative z-10 w-full sm:w-auto">
                         <div className="p-3 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-500/20">
                            <CheckCircle2 className="w-5 h-5" />
                         </div>
                         <div>
                            <h4 className="font-black text-sm text-emerald-950 uppercase tracking-tight">Serviço Recebido & Aprovado</h4>
                            <span className="text-[9px] text-emerald-600 font-black tracking-widest uppercase">Assinatura Eletrônica Autenticada</span>
                         </div>
                      </div>
                      <div className="text-left md:text-right text-xs text-slate-500 font-medium relative z-10 w-full md:w-auto space-y-1">
                         <p>Assinado por: <span className="font-extrabold text-slate-800 uppercase italic">{order.clientSignatureName}</span></p>
                         {order.clientSignatureDoc && <p>Documento: <span className="font-extrabold text-slate-800">{order.clientSignatureDoc}</span></p>}
                         <p>Data e Hora: <span className="font-extrabold text-slate-800">{new Date(order.signedAt).toLocaleString('pt-BR')}</span></p>
                      </div>
                   </div>
                ) : (
                   <form onSubmit={handleSign} className="bg-slate-50 border border-slate-200 rounded-2xl p-6 md:p-8 space-y-6">
                      <div className="space-y-2">
                         <h4 className="font-black text-lg text-slate-900 uppercase tracking-tight italic">Aceite Online</h4>
                         <p className="text-xs text-slate-500 leading-normal">
                            Ao preencher as informações abaixo, você atesta eletronicamente que o serviço foi executado em perfeita ordem e aprova os valores informados de acordo com o memorial operacional.
                         </p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-slate-400 pl-1">Nome Completo do Responsável</label>
                            <input 
                              type="text" 
                              required
                              value={sigName}
                              onChange={(e) => setSigName(e.target.value)}
                              placeholder="Nome de quem está recebendo" 
                              className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                            />
                         </div>
                         <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-slate-400 pl-1">CPF ou RG (Segurança extra)</label>
                            <input 
                              type="text" 
                              value={sigDoc}
                              onChange={(e) => setSigDoc(e.target.value)}
                              placeholder="Ex: 000.000.000-00 ou RG" 
                              className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                            />
                         </div>
                      </div>
                      <Button 
                        type="submit" 
                        disabled={signing}
                        className="w-full h-12 rounded-xl font-black uppercase tracking-widest text-[10px] gap-2"
                      >
                         {signing ? 'Registrando...' : 'Confirmar e Assinar Eletronicamente'}
                      </Button>
                   </form>
                )}
             </div>

             <div className="h-px bg-slate-100"></div>

             {/* Final Pricing */}
             <div className="bg-slate-900 rounded-[2rem] p-10 text-white relative overflow-hidden group">
                <div className="absolute inset-0 bg-dot-pattern opacity-10"></div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-[50px] -mr-16 -mt-16"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                   <div className="text-center md:text-left space-y-2">
                      <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Investimento Técnico</span>
                      <h3 className="text-4xl lg:text-5xl font-black italic tracking-tighter leading-none uppercase">Valor Final</h3>
                   </div>
                   
                   <div className="text-center md:text-right">
                      <div className="flex items-baseline gap-2 justify-center md:justify-end">
                         <span className="text-xl font-bold text-slate-500 italic">R$</span>
                         <span className="text-5xl lg:text-7xl font-black tracking-tighter italic">
                            {order.finalPrice ? Number(order.finalPrice).toLocaleString('pt-BR', {minimumFractionDigits: 2}) : '0,00'}
                         </span>
                      </div>
                      <div className="flex items-center gap-2 mt-4 justify-center md:justify-end">
                         <div className="flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full border border-white/10">
                            <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Serviço Homologado</span>
                         </div>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
           <Button 
             variant="outline" 
             className="h-16 px-10 rounded-[1.5rem] border-2 font-black italic tracking-tighter uppercase text-slate-600 hover:bg-slate-100 gap-2"
             onClick={() => window.print()}
           >
              <Download className="w-5 h-5" /> Imprimir / PDF
           </Button>
           <Link to="/" className="w-full sm:w-auto">
             <Button className="w-full h-16 px-10 rounded-[1.5rem] font-black italic tracking-tighter uppercase gap-2 shadow-xl shadow-primary/20">
                <Zap className="w-5 h-5 fill-current" /> Voltar ao Site
             </Button>
           </Link>
        </div>

        {/* Fixed Footer with Company Details */}
        <footer className="mt-16 pt-8 border-t border-slate-200 text-center space-y-3">
           <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-sm text-slate-600 font-semibold">
              <span className="uppercase tracking-wider italic text-slate-900">
                {companyProfile?.companyName || 'RA | Elétrica & Automação'}
              </span>
              <span className="hidden sm:inline text-slate-300">|</span>
              <span>
                WhatsApp: {companyProfile?.whatsappInfo || companyProfile?.phone || '(34) 99260-9206'}
              </span>
              <span className="hidden sm:inline text-slate-300">|</span>
              <span>
                E-mail: {companyProfile?.email || 'raop.uba@gmail.com'}
              </span>
           </div>
           <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">
              Soluções em Elétrica, Automação & Segurança Eletrônica de Alto Padrão
           </p>
        </footer>
      </div>
    </div>
  );
}
