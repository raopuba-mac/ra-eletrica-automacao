import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, limit, addDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../components/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Clock, Users, Wrench, FileText, Calendar as CalendarIcon, ArrowRight, Zap, CheckCircle2, Phone, MapPin, Smartphone, ChevronRight, ChevronDown, Check } from 'lucide-react';
import { OperationType, handleFirestoreError } from '../../lib/error';
import { PageHeader } from '../../components/PageHeader';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ clients: 0, orders: 0, leads: 0, quotes: 0 });
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [finishedOrders, setFinishedOrders] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);

  // PWA & Quick Intake Mobile States
  const [showPwaGuide, setShowPwaGuide] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  
  const [quickClientName, setQuickClientName] = useState('');
  const [quickClientPhone, setQuickClientPhone] = useState('');
  const [quickClientAddress, setQuickClientAddress] = useState('');
  const [quickDescription, setQuickDescription] = useState('');
  const [quickType, setQuickType] = useState<'os' | 'quote'>('os');
  const [isQuickSubmitting, setIsQuickSubmitting] = useState(false);
  const [quickSuccess, setQuickSuccess] = useState(false);

  useEffect(() => {
    // Detect if running as installed standalone app (PWA)
    const mql = window.matchMedia('(display-mode: standalone)');
    setIsStandalone(mql.matches);
    
    // Auto-expand PWA install instructions on mobile browsers (not installed yet)
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile && !mql.matches) {
      setShowPwaGuide(true);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    
    // Fetch clients for name lookup
    const unsubClients = onSnapshot(query(collection(db, 'clients'), where('userId', '==', user.uid)), snap => {
       const clientData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
       setClients(clientData);
       setStats(s => ({ ...s, clients: snap.size }));
    }, err => handleFirestoreError(err, OperationType.GET, 'clients'));

    const unsubOrdersCount = onSnapshot(query(collection(db, 'serviceOrders'), where('userId', '==', user.uid)), snap => {
       setStats(s => ({ ...s, orders: snap.size }));
    }, err => handleFirestoreError(err, OperationType.GET, 'serviceOrders'));
    
    const unsubFinished = onSnapshot(
      query(
        collection(db, 'serviceOrders'), 
        where('userId', '==', user.uid),
        where('status', '==', 'completed'),
        orderBy('updatedAt', 'desc'),
        limit(4)
      ), 
      snap => {
        setFinishedOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }, 
      err => handleFirestoreError(err, OperationType.GET, 'serviceOrders')
    );

    const unsubLeads = onSnapshot(query(collection(db, 'leads'), where('userId', '==', user.uid), where('status', '==', 'new')), snap => {
       setStats(s => ({ ...s, leads: snap.size }));
    }, err => handleFirestoreError(err, OperationType.GET, 'leads'));

    const unsubQuotes = onSnapshot(query(collection(db, 'quotes'), where('userId', '==', user.uid), where('status', '==', 'pending')), snap => {
       setStats(s => ({ ...s, quotes: snap.size }));
    }, err => handleFirestoreError(err, OperationType.GET, 'quotes'));

    const unsubEvents = onSnapshot(
      query(
        collection(db, 'agenda'), 
        where('userId', '==', user.uid),
        orderBy('date', 'asc'),
        limit(5)
      ), 
      snap => {
        setUpcomingEvents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      },
      err => handleFirestoreError(err, OperationType.GET, 'agenda')
    );

    return () => {
      unsubOrdersCount();
      unsubClients();
      unsubLeads();
      unsubQuotes();
      unsubFinished();
      unsubEvents();
    }
  }, [user]);

  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!quickClientName.trim() || !quickDescription.trim()) {
      alert('Por favor, preencha o Nome do Cliente e a Descrição do Serviço.');
      return;
    }

    setIsQuickSubmitting(true);
    try {
      // 1. Create client
      const clientRef = await addDoc(collection(db, 'clients'), {
        userId: user.uid,
        name: quickClientName,
        phone: quickClientPhone || '',
        email: '',
        address: quickClientAddress || '',
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
      const clientId = clientRef.id;

      if (quickType === 'os') {
        // 2a. Create Service Order (OS)
        await addDoc(collection(db, 'serviceOrders'), {
          userId: user.uid,
          clientId: clientId,
          description: quickDescription,
          status: 'scheduled',
          scheduledDate: format(new Date(), 'yyyy-MM-dd'),
          scheduledTime: format(new Date(), 'HH:mm'),
          finalPrice: '',
          photos: [],
          photosAfter: [],
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
        
        setQuickSuccess(true);
        setTimeout(() => {
          setQuickSuccess(false);
          setQuickClientName('');
          setQuickClientPhone('');
          setQuickClientAddress('');
          setQuickDescription('');
          navigate('/app/orders');
        }, 1500);
      } else {
        // 2b. Create Quote / Budget
        const serializedDescription = JSON.stringify({
          items: [{ id: '1', name: quickDescription, quantity: 1, price: 0 }],
          remarks: 'Gerado via Atendimento Rápido no Smartphone',
          photo: '',
          photos: [],
          discount: 0,
          includesMaterial: false,
          applyCashDiscount: false
        });

        await addDoc(collection(db, 'quotes'), {
          userId: user.uid,
          clientId: clientId,
          clientName: quickClientName,
          description: serializedDescription,
          totalAmount: 0,
          status: 'pending',
          createdAt: Date.now(),
          updatedAt: Date.now()
        });

        setQuickSuccess(true);
        setTimeout(() => {
          setQuickSuccess(false);
          setQuickClientName('');
          setQuickClientPhone('');
          setQuickClientAddress('');
          setQuickDescription('');
          navigate('/app/quotes');
        }, 1500);
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao registrar atendimento rápido: ' + (err as Error).message);
    } finally {
      setIsQuickSubmitting(false);
    }
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

  const cards = [
    { title: 'Clientes', value: stats.clients, icon: Users, color: 'text-primary', bg: 'bg-primary/5', path: '/app/clients' },
    { title: 'Ordens de Serviço', value: stats.orders, icon: Zap, color: 'text-amber-500', bg: 'bg-amber-500/5', path: '/app/orders' },
    { title: 'Novos Leads', value: stats.leads, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-600/5', path: '/app/leads' },
    { title: 'Orçamentos', value: stats.quotes, icon: FileText, color: 'text-purple-500', bg: 'bg-purple-500/5', path: '/app/quotes' },
  ];

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <PageHeader 
          title="Painel de Controle" 
          description={`Central de comando da RA | Elétrica & Automação.`}
        />
        <div className="flex gap-2">
            <Link to="/app/leads" className="hidden sm:block">
              <Button size="sm" variant="outline" className="border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-bold rounded-xl h-10 px-6 shadow-xs">
                <Users className="w-4 h-4 mr-2 text-[#ca8a04]" /> Leads
              </Button>
            </Link>
            <Link to="/app/orders">
              <Button size="sm" className="bg-[#EAB308] hover:bg-[#ca8a04] text-slate-950 font-black rounded-xl shadow-md h-10 px-6">
                <Zap className="w-4 h-4 mr-2 fill-current" /> Nova OS
              </Button>
            </Link>
        </div>
      </div>

      {/* PWA Install Instructions Guide */}
      <AnimatePresence>
        {showPwaGuide && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="border border-blue-200 bg-blue-50/80 rounded-[2rem] p-6 relative text-slate-900 shadow-sm">
              <button 
                onClick={() => setShowPwaGuide(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 font-black text-xs bg-white rounded-full h-7 w-7 flex items-center justify-center border border-slate-200 shadow-xs"
              >
                ✕
              </button>
              <div className="flex gap-4 items-start pr-6">
                <div className="bg-blue-600 p-3 rounded-2xl text-white shrink-0 shadow-md">
                  <Smartphone className="w-6 h-6 animate-pulse" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-black text-slate-900 tracking-tight text-base uppercase flex items-center gap-2">
                    Instalar Aplicativo no Celular
                    <span className="text-[9px] font-black bg-blue-600 text-white px-2 py-0.5 rounded-full uppercase tracking-widest shadow-xs">Web+App</span>
                  </h3>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    Salve a RA Elétrica diretamente na tela inicial do seu smartphone para agilizar o atendimento no cliente e utilizar recursos offline!
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3">
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                      <span className="text-[10px] font-black text-blue-600 uppercase tracking-wider block mb-1">No iPhone / iOS (Safari):</span>
                      <p className="text-[11px] text-slate-700 font-medium">
                        Toque no botão de <strong>Compartilhar</strong> (ícone com seta para cima) e selecione <strong>"Adicionar à Tela de Início"</strong>.
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                      <span className="text-[10px] font-black text-blue-600 uppercase tracking-wider block mb-1">No Android (Chrome):</span>
                      <p className="text-[11px] text-slate-700 font-medium">
                        Toque nos <strong>três pontinhos</strong> no canto superior direito e selecione <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Atendimento Rápido Form Card */}
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
          <form onSubmit={handleQuickSubmit} className="space-y-6">
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

      {/* Prominent Lead Alert Card */}
      {stats.leads > 0 && (
        <motion.div
           initial={{ opacity: 0, y: -20 }}
           animate={{ opacity: 1, y: 0 }}
           className="bg-blue-600 rounded-[2.5rem] p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-xl"
        >
           <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
           <div className="flex items-center gap-6 relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20">
                 <Users className="w-8 h-8 text-white" />
              </div>
              <div className="text-center md:text-left">
                 <h2 className="text-3xl font-[1000] tracking-tighter uppercase italic leading-none mb-2">Novos Leads Recebidos</h2>
                 <p className="text-blue-100 font-bold uppercase text-[10px] tracking-widest flex items-center justify-center md:justify-start gap-2">
                   <span className="w-2 h-2 bg-white rounded-full animate-ping"></span>
                   Você tem {stats.leads} {stats.leads === 1 ? 'novo contato' : 'novos contatos'} interessados nos seus serviços
                 </p>
              </div>
           </div>
           <Link to="/app/leads" className="relative z-10 w-full md:w-auto">
              <Button size="lg" className="w-full md:w-auto bg-white text-blue-600 hover:bg-blue-50 font-black uppercase text-xs tracking-[0.2em] px-8 rounded-2xl h-14 shadow-md border-none">
                 Atender Leads
              </Button>
           </Link>
        </motion.div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {cards.map((card, idx) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Link to={card.path}>
              <Card className="shadow-xs border border-slate-200 bg-white hover:border-[#EAB308] hover:shadow-md transition-all relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform"></div>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                  <CardTitle className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">{card.title}</CardTitle>
                  <div className={`${card.bg} p-2 rounded-xl border border-slate-100`}>
                    <card.icon className={`h-4 w-4 ${card.color}`} />
                  </div>
                </CardHeader>
                <CardContent className="relative z-10 pt-4">
                  <div className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tighter leading-none">{card.value}</div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Alerts & Agenda */}
        <div className="lg:col-span-2 space-y-8">
          {stats.quotes > 0 && (
            <div className="grid grid-cols-1 gap-4">
              <Card className="border border-purple-200 bg-purple-50 shadow-xs overflow-hidden relative">
                <div className="absolute top-0 right-0 p-2 opacity-10"><FileText className="w-12 h-12 text-purple-600" /></div>
                <CardContent className="p-6 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-100 rounded-2xl border border-purple-200">
                      <FileText className="w-6 h-6 text-purple-700" />
                    </div>
                    <div>
                      <h3 className="text-purple-900 font-black tracking-tight text-sm uppercase">Orçamentos Pendentes</h3>
                      <p className="text-purple-700 font-bold text-xs">{stats.quotes} aguardando revisão</p>
                    </div>
                  </div>
                  <Link to="/app/quotes">
                    <Button size="sm" variant="ghost" className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl h-8 px-4 font-black text-[10px] uppercase shadow-sm">
                      Revisar
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Agenda Section */}
          <Card className="border border-slate-200 bg-white shadow-xs rounded-[2rem] overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 bg-slate-50/50 p-6 md:p-8">
              <CardTitle className="text-lg font-black tracking-tighter flex items-center gap-2 text-slate-900">
                <CalendarIcon className="w-5 h-5 text-[#ca8a04]" />
                PRÓXIMAS VISITAS
              </CardTitle>
              <Link to="/app/agenda" className="text-[10px] font-black uppercase tracking-widest text-[#ca8a04] hover:underline flex items-center bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full">
                Agenda completa <ArrowRight className="w-3 h-3 ml-2" />
              </Link>
            </CardHeader>
            <CardContent className="p-0 bg-white">
              {upcomingEvents.length === 0 ? (
                <div className="py-16 text-center text-slate-400 text-sm font-medium italic">
                   Sua agenda está livre por enquanto.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {upcomingEvents.map((event) => (
                    <div key={event.id} className="p-6 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                      <div className="flex items-center gap-6">
                        <div className="bg-slate-900 text-white p-4 rounded-2xl flex flex-col items-center justify-center min-w-[72px] shadow-xs group-hover:bg-[#EAB308] group-hover:text-slate-950 transition-colors">
                          <span className="text-[10px] font-black uppercase tracking-widest text-[#EAB308] group-hover:text-slate-950">{format(new Date(event.date), 'MMM', { locale: ptBR })}</span>
                          <span className="text-2xl font-black">{format(new Date(event.date), 'dd')}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                             <span className="text-[10px] font-black px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-slate-700 uppercase tracking-widest">{event.time}</span>
                             <span className="text-[10px] font-black px-2 py-0.5 bg-amber-50 border border-amber-200 rounded text-amber-800 uppercase tracking-widest">{event.type}</span>
                          </div>
                          <h4 className="font-black text-slate-900 tracking-tight text-lg">{event.title}</h4>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Finished OS Section */}
          <Card className="border border-slate-200 bg-white shadow-xs rounded-[2.5rem] overflow-hidden">
             <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 bg-slate-50/50 p-6 md:p-8">
                <CardTitle className="text-lg font-black tracking-tighter flex items-center gap-2 uppercase text-slate-900">
                   <div className="w-8 h-8 rounded-lg bg-emerald-100 border border-emerald-200 flex items-center justify-center">
                     <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                   </div>
                   SERVIÇOS CONCLUÍDOS
                </CardTitle>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Recém Finalizados</div>
             </CardHeader>
             <CardContent className="p-0 bg-white">
                {finishedOrders.length === 0 ? (
                   <div className="py-16 text-center text-slate-400 text-sm font-medium italic">
                      Nenhum serviço concluído recentemente.
                   </div>
                ) : (
                   <div className="divide-y divide-slate-100">
                      {finishedOrders.map((order) => (
                         <div key={order.id} className="p-6 md:p-8 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-6 group">
                            <div className="flex items-center gap-6">
                               <div className="relative">
                                  <div className="w-16 h-16 rounded-2xl bg-slate-100 overflow-hidden border border-slate-200">
                                     {order.photosAfter && order.photosAfter[0] ? (
                                        <img src={order.photosAfter[0]} className="w-full h-full object-cover transition-all" />
                                     ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                                           <Wrench className="w-6 h-6 outline-none" />
                                        </div>
                                     )}
                                  </div>
                                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-md">
                                     <CheckCircle2 className="w-4 h-4" />
                                  </div>
                               </div>
                               <div>
                                  <h4 className="font-black text-slate-900 tracking-tight text-lg leading-none mb-2 uppercase italic">{clients.find(c => c.id === order.clientId)?.name || 'Cliente'}</h4>
                                  <p className="text-xs text-slate-500 font-medium line-clamp-1 max-w-[200px] italic">{order.description}</p>
                               </div>
                            </div>
                            
                            <div className="flex items-center gap-6 justify-between md:justify-end">
                               <div className="text-right">
                                  <div className="text-[8px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">Finalizado em</div>
                                  <div className="text-[10px] font-black text-slate-700">{order.updatedAt ? format(order.updatedAt, 'dd/MM/yyyy') : '--/--/--'}</div>
                               </div>
                               <div className="text-right">
                                  <div className="text-[8px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">Total</div>
                                  <div className="text-sm font-black text-emerald-700 italic">R$ {order.finalPrice || '0,00'}</div>
                               </div>
                               <Button 
                                 size="sm" 
                                 onClick={() => shareWhatsApp(order)}
                                 className="bg-[#25D366] hover:bg-[#1DA851] text-white font-black text-[10px] uppercase tracking-widest rounded-2xl h-10 px-6 shadow-md"
                               >
                                  Cobrar
                               </Button>
                            </div>
                         </div>
                      ))}
                   </div>
                )}
                <div className="p-6 bg-slate-50 border-t border-slate-100 text-center">
                   <Link to="/app/orders" className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-[#ca8a04] transition-colors flex items-center justify-center gap-2">
                       Ver todas as ordens de serviço <ArrowRight className="w-3 h-3" />
                   </Link>
                </div>
             </CardContent>
          </Card>
        </div>

        {/* Right Column: Tips & Performance */}
        <div className="space-y-8">
          <Card className="border border-slate-200 bg-white text-slate-900 rounded-[2rem] overflow-hidden relative group h-full shadow-xs">
            <CardHeader className="relative z-10 p-8 border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-xl font-black tracking-tighter flex items-center gap-3 text-slate-900">
                <div className="p-2 bg-amber-100 rounded-xl border border-amber-200">
                   <Zap className="w-5 h-5 text-[#ca8a04] fill-current" />
                </div>
                INSIGHTS TÉCNICOS
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 relative z-10 space-y-8 bg-white">
              <div className="space-y-4">
                <p className="text-slate-600 text-sm leading-relaxed font-medium">
                  "Mantenha seu portfólio web atualizado com fotos de <strong className="text-[#ca8a04]">antes e depois</strong>. Isso transmite transparência e organização, gerando confiança imediata nos novos clientes."
                </p>
                <Link to="/app/portfolio">
                  <Button variant="secondary" size="sm" className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl h-10 px-6 border border-slate-200">
                    Atualizar Portfólio <ArrowRight className="w-4 h-4 ml-2 text-[#ca8a04]" />
                  </Button>
                </Link>
              </div>
              
              <div className="pt-8 border-t border-slate-100">
                 <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Performance Mensal</span>
                    <span className="text-[#ca8a04] font-black text-sm">84%</span>
                 </div>
                 <div className="w-full h-2 bg-slate-100 border border-slate-200 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: "84%" }}
                      transition={{ duration: 1, delay: 0.5 }}
                      className="h-full bg-[#EAB308]"
                    />
                 </div>
                 <p className="text-[10px] text-slate-500 mt-4 leading-relaxed uppercase font-bold">
                    Meta de fechar 10 novos contratos este mês. <br/> Falta pouco, Renan!
                 </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
