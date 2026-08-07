import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../components/AuthProvider';
import { Button } from '../components/ui/button';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Zap, 
  Calendar as CalendarIcon, 
  Image, 
  Settings, 
  LogOut, 
  Tags, 
  Menu, 
  X, 
  ArrowLeft, 
  ExternalLink, 
  Bell,
  Globe,
  FilePlus,
  UserPlus,
  ChevronRight,
  HardHat,
  Sliders
} from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { db } from '../lib/firebase';
import { disableNetwork, enableNetwork, collection, query, where, onSnapshot } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';

const logoImg = '/logo.jpg?v=6';

const playNotificationChime = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc2.frequency.setValueAtTime(880, ctx.currentTime); // A5

    osc1.type = 'sine';
    osc2.type = 'sine';

    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.08);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.0);

    osc1.start(ctx.currentTime);
    osc2.start(ctx.currentTime);

    osc1.stop(ctx.currentTime + 1.0);
    osc2.stop(ctx.currentTime + 1.0);
  } catch (error) {
    console.warn('Could not play notification sound:', error);
  }
};

const navItems = [
  { name: 'Dashboard', path: '/app', icon: LayoutDashboard },
  { name: 'Agenda', path: '/app/agenda', icon: CalendarIcon },
  { name: 'Clientes', path: '/app/clients', icon: Users },
  { name: 'Orçamentos', path: '/app/quotes', icon: FileText },
  { name: 'Ordens de Serviço', path: '/app/orders', icon: Zap },
  { name: 'Serviços', path: '/app/services', icon: Tags },
  { name: 'Portfólio Web', path: '/app/portfolio', icon: Image },
  { name: 'Leads do Site', path: '/app/leads', icon: Users },
  { name: 'Configurações', path: '/app/settings', icon: Settings },
];

export default function DashboardLayout() {
  const { user, logOut } = useAuth();
  const location = useLocation();
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [newLeadsCount, setNewLeadsCount] = useState(0);
  const [activeNotification, setActiveNotification] = useState<any | null>(null);
  const [logoError, setLogoError] = useState(false);
  const [logoSrc, setLogoSrc] = useState(logoImg);

  const handleLogoError = () => {
    if (logoSrc === logoImg) {
      setLogoSrc(`/logo.jpg?t=${Date.now()}`);
    } else {
      setLogoError(true);
    }
  };
  
  const isFirstRun = useRef(true);

  useEffect(() => {
    if (!user) return;
    
    // Listen for new leads targeted to current user
    const q = query(
      collection(db, 'leads'), 
      where('userId', '==', user.uid),
      where('status', '==', 'new')
    );
    
    const unsub = onSnapshot(q, (snapshot) => {
      setNewLeadsCount(snapshot.size);
      
      if (isFirstRun.current) {
        isFirstRun.current = false;
        return;
      }

      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const leadData = change.doc.data();
          setActiveNotification({
            id: change.doc.id,
            name: leadData.name || 'Novo Lead',
            phone: leadData.phone || '',
            serviceType: leadData.serviceType || 'Não especificado',
            timestamp: Date.now()
          });
          playNotificationChime();
        }
      });
    }, (error) => {
      console.error("Error listening to leads:", error);
    });

    return () => unsub();
  }, [user]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      enableNetwork(db).catch(console.error);
    };
    const handleOffline = () => {
      setIsOffline(true);
      disableNetwork(db).catch(console.error);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!activeNotification) return;
    const timer = setTimeout(() => {
      setActiveNotification(null);
    }, 8000);
    return () => clearTimeout(timer);
  }, [activeNotification]);

  // Active section checks
  const isRootApp = location.pathname === '/app' || location.pathname === '/app/';
  const isMeuSiteTab = location.pathname.startsWith('/app/portfolio') || 
                       location.pathname.startsWith('/app/services') || 
                       location.pathname.startsWith('/app/leads');
  const isSettingsTab = location.pathname.startsWith('/app/settings');
  const isEmCampoTab = !isMeuSiteTab && !isSettingsTab;

  return (
    <div className="flex h-screen bg-slate-100 text-slate-900 overflow-hidden font-sans select-none">
      {/* Desktop Sidebar */}
      <aside className="w-72 bg-slate-900 text-slate-300 flex flex-col hidden lg:flex h-full border-r border-slate-800 relative z-30 shadow-xl shrink-0" aria-label="Navegação Lateral">
        <div className="p-6 border-b border-slate-800 flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-xl border border-[#EAB308]/40 shrink-0 bg-slate-800 flex items-center justify-center font-black italic text-xs text-white">
              {!logoError ? (
                <img 
                  src={logoSrc} 
                  alt="RA Logo" 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer" 
                  onError={handleLogoError}
                />
              ) : (
                <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center p-1 relative overflow-hidden">
                  <Zap className="w-5 h-5 text-[#EAB308] fill-[#EAB308]/20" />
                </div>
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-white font-black tracking-tight text-base leading-none">RA ELÉTRICA</span>
              <span className="text-[10px] text-[#EAB308] font-extrabold uppercase tracking-widest mt-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#EAB308] animate-pulse"></span>
                MODO OBRA
              </span>
            </div>
          </div>

          <Link to="/" aria-label="Voltar para o site público">
            <Button variant="secondary" className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white justify-start gap-2 h-10 rounded-xl border border-slate-700 transition-all text-xs font-bold">
               <ArrowLeft className="w-4 h-4 text-[#EAB308]" />
               <span>Ver Site Público</span>
            </Button>
          </Link>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4 px-3 scrollbar-thin scrollbar-thumb-slate-800">
          <nav className="flex flex-col gap-1.5" aria-label="Principal">
            {navItems.map(item => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3.5 px-3.5 py-3 rounded-xl transition-all duration-200 group font-bold text-sm ${
                    isActive 
                      ? 'bg-[#EAB308] text-slate-950 font-black shadow-md shadow-[#EAB308]/20 scale-[1.01]' 
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className={`w-5 h-5 transition-transform ${isActive ? 'text-slate-950' : 'text-slate-400 group-hover:text-[#EAB308]'}`} aria-hidden="true" />
                  <span className="flex-1">{item.name}</span>
                  {item.path === '/app/leads' && newLeadsCount > 0 && (
                    <span 
                      className={`text-[10px] font-black h-5 px-1.5 rounded-full flex items-center justify-center animate-pulse ${
                        isActive ? 'bg-slate-950 text-[#EAB308]' : 'bg-[#EAB308] text-slate-950'
                      }`}
                    >
                      {newLeadsCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-950/60 backdrop-blur-sm flex flex-col gap-3">
          <div className="flex items-center gap-3 p-2.5 bg-slate-800/80 rounded-xl border border-slate-700/80">
            <div className="w-9 h-9 rounded-lg bg-[#EAB308]/20 border border-[#EAB308]/40 flex items-center justify-center text-[#EAB308] font-black text-sm">
              {user?.email?.charAt(0).toUpperCase() || 'R'}
            </div>
            <div className="truncate flex-1">
              <p className="text-white font-bold text-xs truncate uppercase">{user?.displayName || 'Técnico RA'}</p>
              <div className="flex items-center gap-1.5 text-[#EAB308]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span className="text-[9px] font-bold tracking-wider uppercase">MODO OPERACIONAL</span>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="w-full text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors h-9 rounded-xl justify-start text-xs font-bold" onClick={logOut}>
            <LogOut className="w-4 h-4 mr-2" />
            <span>Sair do Sistema</span>
          </Button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col h-full relative overflow-hidden bg-slate-100">
        
        {/* Top Header Bar */}
        <header className="bg-white/95 backdrop-blur-xl border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl overflow-hidden shadow-md border border-[#EAB308] shrink-0 bg-slate-900 flex items-center justify-center font-black italic text-[10px] text-white">
              {!logoError ? (
                <img 
                  src={logoSrc} 
                  alt="RA Logo" 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer" 
                  onError={handleLogoError}
                />
              ) : (
                <Zap className="w-5 h-5 text-[#EAB308] fill-[#EAB308]/20" />
              )}
            </div>
            <div>
              <span className="font-black text-slate-900 tracking-tight text-base md:text-lg block leading-none">
                RA ELÉTRICA
              </span>
              <span className="text-[10px] font-black text-[#ca8a04] uppercase tracking-wider flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#EAB308] animate-pulse"></span>
                Painel Modo Obra
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/" className="hidden sm:inline-flex">
              <Button size="sm" variant="outline" className="border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs h-9 px-3">
                <ExternalLink className="w-3.5 h-3.5 mr-1.5 text-[#ca8a04]" />
                Ver Site
              </Button>
            </Link>

            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl h-9 w-9 border border-slate-200" 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Abrir Menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5 text-[#ca8a04]" /> : <Menu className="w-5 h-5 text-slate-700" />}
            </Button>
          </div>
        </header>

        {/* Sub-menu interno no topo para a aba "Meu Site" */}
        {isMeuSiteTab && (
          <div className="bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 py-2.5 flex items-center justify-center gap-2 sticky top-[57px] z-30 shadow-xs">
            <Link
              to="/app/portfolio"
              className={`flex-1 max-w-[140px] text-center py-2 px-3 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-1.5 ${
                location.pathname.startsWith('/app/portfolio')
                  ? 'bg-[#EAB308] text-slate-950 shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Image className="w-3.5 h-3.5 shrink-0" />
              <span>Portfólio</span>
            </Link>

            <Link
              to="/app/services"
              className={`flex-1 max-w-[140px] text-center py-2 px-3 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-1.5 ${
                location.pathname.startsWith('/app/services')
                  ? 'bg-[#EAB308] text-slate-950 shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Tags className="w-3.5 h-3.5 shrink-0" />
              <span>Serviços</span>
            </Link>

            <Link
              to="/app/leads"
              className={`flex-1 max-w-[140px] text-center py-2 px-3 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-1.5 relative ${
                location.pathname.startsWith('/app/leads')
                  ? 'bg-[#EAB308] text-slate-950 shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5 shrink-0" />
              <span>Leads</span>
              {newLeadsCount > 0 && (
                <span className={`ml-1 text-[9px] font-black h-4 px-1 rounded-full flex items-center justify-center animate-pulse ${
                  location.pathname.startsWith('/app/leads') ? 'bg-slate-950 text-[#EAB308]' : 'bg-[#EAB308] text-slate-950'
                }`}>
                  {newLeadsCount}
                </span>
              )}
            </Link>
          </div>
        )}

        {/* Offline Alert Banner */}
        {isOffline && (
          <div className="bg-[#EAB308] text-slate-950 font-black text-xs uppercase tracking-widest py-2 px-4 text-center flex items-center justify-center gap-2 sticky top-[57px] z-30 shadow-md" role="alert">
            <span className="w-2 h-2 rounded-full bg-slate-950 animate-ping"></span>
            MODO OFFLINE: OPERAÇÕES SERÃO SINCRONIZADAS AO CONECTAR
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-5 md:p-8 pb-32 scroll-smooth" id="main-content">
          <div className="max-w-5xl mx-auto space-y-6">

            {/* Painel com Botões Operacionais Gigantes para a Rota Raiz (/app) */}
            {isRootApp && (
              <motion.section 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3.5 mb-6"
              >
                {/* Botões Operacionais Gigantes Lado a Lado */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* [📝 NOVA O.S. / Gerar Relatório] Em destaque Amarelo Elétrico (#EAB308) */}
                  <Link 
                    to="/app/orders" 
                    className="group bg-[#EAB308] hover:bg-[#ca8a04] text-slate-950 p-5 md:p-6 rounded-2xl shadow-md border border-[#ca8a04]/30 transition-all transform active:scale-[0.98] flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-slate-950 text-[#EAB308] flex items-center justify-center shrink-0 shadow-md">
                        <FilePlus className="w-6 h-6" />
                      </div>
                      <div className="text-left">
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-900/80">EM CAMPO</div>
                        <div className="text-base md:text-lg font-black leading-tight tracking-tight uppercase">
                          📝 NOVA O.S.
                        </div>
                        <div className="text-xs font-bold text-slate-900/90">
                          Gerar Relatório Técnico
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-6 h-6 text-slate-950 group-hover:translate-x-1 transition-transform" />
                  </Link>

                  {/* [💰 ORÇAMENTO / Proposta Comercial] Em Destaque Claro com Borda Amarela */}
                  <Link 
                    to="/app/quotes" 
                    className="group bg-white hover:bg-slate-50 text-slate-900 p-5 md:p-6 rounded-2xl shadow-md border-2 border-[#EAB308] transition-all transform active:scale-[0.98] flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-[#EAB308]/40 text-[#ca8a04] flex items-center justify-center shrink-0 shadow-sm">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div className="text-left">
                        <div className="text-[10px] font-black uppercase tracking-widest text-[#ca8a04]">COMERCIAL</div>
                        <div className="text-base md:text-lg font-black leading-tight tracking-tight uppercase text-slate-900">
                          💰 ORÇAMENTO
                        </div>
                        <div className="text-xs font-bold text-slate-500">
                          Proposta Comercial Rápida
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-6 h-6 text-[#ca8a04] group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>

                {/* Botões de Linha Logo Abaixo */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* [👤 Cadastrar Novo Cliente Rápido] */}
                  <Link
                    to="/app/clients"
                    className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 hover:border-[#EAB308] p-3.5 rounded-xl flex items-center justify-between font-extrabold text-xs sm:text-sm transition-all group shadow-xs"
                  >
                    <div className="flex items-center gap-3">
                      <UserPlus className="w-4 h-4 text-[#ca8a04]" />
                      <span>👤 Cadastrar Novo Cliente Rápido</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#ca8a04] group-hover:translate-x-0.5 transition-all" />
                  </Link>

                  {/* [📅 Agenda de Instalações e Obras] */}
                  <Link
                    to="/app/agenda"
                    className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 hover:border-[#EAB308] p-3.5 rounded-xl flex items-center justify-between font-extrabold text-xs sm:text-sm transition-all group shadow-xs"
                  >
                    <div className="flex items-center gap-3">
                      <CalendarIcon className="w-4 h-4 text-[#ca8a04]" />
                      <span>📅 Agenda de Instalações e Obras</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#ca8a04] group-hover:translate-x-0.5 transition-all" />
                  </Link>
                </div>
              </motion.section>
            )}

            {/* Sub-Páginas do Firebase carregando através de Outlet */}
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        {/* Barra de Abas Fixas no Rodapé (Bottom Navigation) - 3 Pilares */}
        <nav 
          className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-200 z-50 px-3 py-1.5 shadow-xl flex justify-around items-center"
          aria-label="Navegação Inferior"
        >
          {/* Pilar 1: "Em Campo" -> /app */}
          <Link
            to="/app"
            className={`flex flex-col items-center py-1.5 px-4 rounded-xl transition-all relative ${
              isEmCampoTab ? 'text-[#ca8a04]' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {isEmCampoTab && (
              <motion.div 
                layoutId="activeBottomTab" 
                className="absolute inset-0 bg-[#EAB308]/15 rounded-xl border border-[#EAB308]/30"
              />
            )}
            <HardHat className={`w-5 h-5 relative z-10 transition-transform ${isEmCampoTab ? 'scale-110 text-[#ca8a04]' : ''}`} />
            <span className="text-[10px] font-black uppercase tracking-wider mt-1 relative z-10">Em Campo</span>
          </Link>

          {/* Pilar 2: "Meu Site" -> /app/portfolio */}
          <Link
            to="/app/portfolio"
            className={`flex flex-col items-center py-1.5 px-4 rounded-xl transition-all relative ${
              isMeuSiteTab ? 'text-[#ca8a04]' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {isMeuSiteTab && (
              <motion.div 
                layoutId="activeBottomTab" 
                className="absolute inset-0 bg-[#EAB308]/15 rounded-xl border border-[#EAB308]/30"
              />
            )}
            <div className="relative">
              <Globe className={`w-5 h-5 relative z-10 transition-transform ${isMeuSiteTab ? 'scale-110 text-[#ca8a04]' : ''}`} />
              {newLeadsCount > 0 && (
                <span className="absolute -top-1 -right-2 bg-[#EAB308] text-slate-950 text-[9px] font-black h-4 w-4 rounded-full flex items-center justify-center animate-pulse z-20">
                  {newLeadsCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider mt-1 relative z-10">Meu Site</span>
          </Link>

          {/* Pilar 3: "Ajustes" -> /app/settings */}
          <Link
            to="/app/settings"
            className={`flex flex-col items-center py-1.5 px-4 rounded-xl transition-all relative ${
              isSettingsTab ? 'text-[#ca8a04]' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {isSettingsTab && (
              <motion.div 
                layoutId="activeBottomTab" 
                className="absolute inset-0 bg-[#EAB308]/15 rounded-xl border border-[#EAB308]/30"
              />
            )}
            <Sliders className={`w-5 h-5 relative z-10 transition-transform ${isSettingsTab ? 'scale-110 text-[#ca8a04]' : ''}`} />
            <span className="text-[10px] font-black uppercase tracking-wider mt-1 relative z-10">Ajustes</span>
          </Link>
        </nav>

        {/* Drawer Menu Mobile Completo */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-0 bg-white text-slate-900 z-50 lg:hidden flex flex-col"
            >
              <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl overflow-hidden shadow-md border border-[#EAB308] shrink-0 bg-slate-900 flex items-center justify-center font-black italic text-[10px] text-white">
                    {!logoError ? (
                      <img src={logoSrc} alt="RA Logo" className="w-full h-full object-cover" onError={handleLogoError} />
                    ) : (
                      <Zap className="w-5 h-5 text-[#EAB308] fill-[#EAB308]/20" />
                    )}
                  </div>
                  <div>
                    <span className="font-black text-slate-900 tracking-tight text-base block leading-none">RA ELÉTRICA</span>
                    <span className="text-[10px] text-[#ca8a04] font-extrabold uppercase">Menu de Navegação</span>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="text-slate-500 hover:text-slate-900 rounded-xl" onClick={() => setIsMobileMenuOpen(false)}>
                  <X className="w-6 h-6 text-[#ca8a04]" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="block mb-4">
                  <Button variant="secondary" className="w-full bg-slate-100 text-slate-800 hover:bg-slate-200 justify-start gap-2 h-11 rounded-xl border border-slate-200 font-bold text-xs">
                     <ArrowLeft className="w-4 h-4 text-[#ca8a04]" />
                     <span>Voltar para o Site Principal</span>
                  </Button>
                </Link>

                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 py-1">TODAS AS PÁGINAS</div>

                {navItems.map(item => {
                  const isActive = location.pathname === item.path;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-3.5 p-3.5 rounded-xl font-extrabold text-sm transition-all ${
                        isActive 
                          ? 'bg-[#EAB308] text-slate-950 font-black shadow-sm' 
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? 'text-slate-950' : 'text-[#ca8a04]'}`} />
                      <span className="flex-1">{item.name}</span>
                      {item.path === '/app/leads' && newLeadsCount > 0 && (
                        <span className="text-[10px] font-black h-5 px-1.5 rounded-full bg-[#EAB308] text-slate-950">
                          {newLeadsCount}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>

              <div className="p-5 border-t border-slate-200 bg-slate-50">
                <Button variant="destructive" className="w-full py-6 font-black text-xs uppercase tracking-widest rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-md" onClick={logOut}>
                  <LogOut className="w-4 h-4 mr-2" /> LOGOUT
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Real-time Toast Notification for Leads */}
        <AnimatePresence>
          {activeNotification && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 50, x: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.2 } }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="fixed bottom-20 lg:bottom-10 right-4 z-50 max-w-sm w-[calc(100%-2rem)] bg-white text-slate-900 border-2 border-[#EAB308] p-4 rounded-2xl shadow-2xl backdrop-blur-xl flex flex-col gap-3 font-sans"
              role="alert"
            >
              <div className="absolute top-3 right-3">
                <button
                  onClick={() => setActiveNotification(null)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                  aria-label="Dispensar notificação"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex gap-3.5 items-start pr-6">
                <div className="bg-amber-100 p-2.5 rounded-xl text-[#ca8a04] relative shrink-0">
                  <div className="absolute inset-0 bg-[#EAB308]/30 rounded-xl animate-ping opacity-40"></div>
                  <Bell className="w-5 h-5 animate-bounce relative z-10" />
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-[#ca8a04] tracking-widest uppercase flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#EAB308] block animate-pulse"></span>
                    Novo Lead do Site!
                  </span>
                  <h4 className="text-sm font-black text-slate-900 leading-tight">
                    {activeNotification.name}
                  </h4>
                  <p className="text-xs font-semibold text-slate-600">
                    {activeNotification.serviceType}
                  </p>
                  {activeNotification.phone && (
                    <p className="text-[10px] font-mono text-slate-500 mt-0.5">
                      Contato: {activeNotification.phone}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-2 mt-1">
                <Link 
                  to="/app/leads" 
                  onClick={() => setActiveNotification(null)}
                  className="flex-1"
                >
                  <Button className="w-full h-9 bg-[#EAB308] hover:bg-[#ca8a04] text-slate-950 font-black text-xs rounded-xl shadow-md uppercase tracking-wider flex items-center justify-center gap-1.5">
                    Atender Lead <ExternalLink className="w-3.5 h-3.5" />
                  </Button>
                </Link>
                <Button 
                  variant="ghost" 
                  onClick={() => setActiveNotification(null)}
                  className="h-9 px-3 text-[10px] text-slate-500 hover:text-slate-900 hover:bg-slate-100 font-black uppercase tracking-wider rounded-xl border border-slate-200"
                >
                  Dispensar
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}

