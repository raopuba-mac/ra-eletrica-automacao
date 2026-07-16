import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../components/AuthProvider';
import { Button } from '../components/ui/button';
import { LayoutDashboard, Users, FileText, Zap, Calendar as CalendarIcon, Image, Settings, LogOut, Tags, Menu, X, ArrowLeft, ExternalLink, Bell } from 'lucide-react';
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

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar Desktop */}
      <aside className="w-72 bg-slate-950 text-slate-400 flex flex-col hidden lg:flex h-full border-r border-slate-800 relative z-30 shadow-2xl" aria-label="Navegação Lateral">
        <div className="absolute inset-0 bg-dot-pattern opacity-5 -z-10"></div>
        
        <div className="p-8 border-b border-white/5 flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-xl border border-white/10 shrink-0 bg-slate-900 flex items-center justify-center font-black italic text-xs text-white" aria-hidden="true">
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
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-indigo-600/20" />
                  <svg className="w-6 h-6 text-blue-500 z-10 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" className="text-blue-400 fill-blue-500/10" />
                  </svg>
                </div>
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-white font-black tracking-tighter text-lg leading-none">RA | DASHBOARD</span>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">SISTEMA INTEGRADO</span>
            </div>
          </div>
          <Link to="/" aria-label="Voltar para o site principal">
            <Button variant="secondary" className="w-full bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white justify-start gap-2 h-10 rounded-xl border border-white/5 transition-all">
               <ArrowLeft className="w-4 h-4" />
               <span className="text-[10px] font-black uppercase tracking-wider">Ver Website</span>
            </Button>
          </Link>
        </div>
        
        <div className="flex-1 overflow-y-auto py-6 px-4 scrollbar-thin scrollbar-thumb-slate-800">
          <nav className="flex flex-col gap-2" aria-label="Principal">
            {navItems.map(item => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group ${
                    isActive 
                      ? 'bg-primary text-white shadow-xl shadow-primary/20 scale-[1.02]' 
                      : 'hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : 'group-hover:translate-x-1'}`} aria-hidden="true" />
                  <span className="font-bold text-sm flex-1">{item.name}</span>
                  {item.path === '/app/leads' && newLeadsCount > 0 && (
                    <span 
                      className={`text-[10px] font-black h-5 w-5 rounded-full flex items-center justify-center animate-pulse shadow-sm ${
                        isActive ? 'bg-white text-primary' : 'bg-primary text-white'
                      }`}
                      aria-label={`${newLeadsCount} novos leads`}
                    >
                      {newLeadsCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-6 border-t border-white/5 bg-slate-900/50 backdrop-blur-sm flex flex-col gap-4">
          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/5">
            <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/20 flex items-center justify-center text-primary text-lg font-black" aria-hidden="true">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <div className="truncate flex-1">
              <p className="text-white font-bold text-sm truncate uppercase tracking-tight">{user?.displayName || 'Técnico'}</p>
              <div className="flex items-center gap-1.5 opacity-50">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                <p className="text-[10px] font-bold truncate">ATIVO AGORA</p>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="w-full text-slate-500 hover:text-white hover:bg-destructive/10 transition-colors h-10 rounded-xl" onClick={logOut} aria-label="Sair da conta">
            <LogOut className="w-4 h-4 mr-2" aria-hidden="true" />
            <span className="text-[10px] font-black uppercase tracking-widest">Logout</span>
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden bg-dot-pattern bg-repeat scroll-smooth" role="main">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white/80 backdrop-blur-md border-b p-4 flex items-center justify-between sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg overflow-hidden shadow-lg border border-slate-200 shrink-0 bg-slate-900 flex items-center justify-center font-black italic text-[10px] text-white" aria-hidden="true">
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
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-indigo-600/20" />
                    <svg className="w-5 h-5 text-blue-500 z-10 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" className="text-blue-400 fill-blue-500/10" />
                    </svg>
                  </div>
                )}
              </div>
              <span className="font-black text-slate-900 tracking-tighter text-xl">RA | DASHBOARD</span>
            </div>
            <Button variant="ghost" size="icon" className="rounded-xl hover:bg-slate-100" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} aria-expanded={isMobileMenuOpen} aria-label="Toggle menu">
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
        </header>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div 
              id="mobile-menu"
              role="dialog"
              aria-modal="true"
              className="fixed inset-0 bg-slate-950 text-slate-400 z-50 lg:hidden flex flex-col pt-safe"
            >
               <div className="absolute inset-0 bg-dot-pattern opacity-5 -z-10"></div>
               <div className="p-8 flex flex-col gap-8 border-b border-white/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl overflow-hidden shadow-2xl border border-white/10 shrink-0 bg-slate-900 flex items-center justify-center font-black italic text-sm text-white" aria-hidden="true">
                        {!logoError ? (
                          <img 
                            src={logoSrc} 
                            alt="RA Logo" 
                            className="w-full h-full object-cover" 
                            referrerPolicy="no-referrer" 
                            onError={handleLogoError}
                          />
                        ) : (
                          <span className="text-white text-xs bg-gradient-to-br from-blue-500 to-indigo-600 w-full h-full flex items-center justify-center font-black">
                            RA
                          </span>
                        )}
                      </div>
                      <span className="text-white font-black tracking-tighter text-2xl">RA | DASHBOARD</span>
                    </div>
                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white rounded-xl" onClick={() => setIsMobileMenuOpen(false)}>
                       <X className="w-6 h-6" />
                    </Button>
                  </div>
                  <Link to="/" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="secondary" className="w-full bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white justify-start gap-3 h-14 rounded-2xl border border-white/5">
                       <ArrowLeft className="w-5 h-5" />
                       <span className="font-black uppercase tracking-widest text-xs">Voltar para o Site Principal</span>
                    </Button>
                  </Link>
               </div>
               <nav className="flex-1 overflow-y-auto py-8 lg:px-4" aria-label="Menu Mobile Principal">
                  <div className="flex flex-col gap-3 px-6">
                    {navItems.map(item => {
                      const isActive = location.pathname === item.path;
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={`flex items-center gap-5 p-5 rounded-2xl transition-all ${
                            isActive 
                              ? 'bg-primary text-white shadow-2xl shadow-primary/20' 
                              : 'hover:bg-white/5'
                          }`}
                        >
                          <Icon className="w-6 h-6" aria-hidden="true" />
                          <span className="font-black text-lg flex-1 leading-none">{item.name}</span>
                        </Link>
                      );
                    })}
                  </div>
               </nav>
               <div className="p-8 border-t border-white/5">
                  <Button variant="destructive" className="w-full py-8 text-lg font-black rounded-2xl" onClick={logOut}>
                    <LogOut className="w-6 h-6 mr-3" aria-hidden="true" /> LOGOUT
                  </Button>
               </div>
            </motion.div>
          )}
        </AnimatePresence>

        {isOffline && (
          <div className="bg-amber-500 text-white p-3 text-xs font-black uppercase tracking-[0.2em] text-center flex justify-center items-center gap-2 sticky top-0 z-30" role="alert">
             <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
             OFFLINE: SINCRONIZAÇÃO PENDENTE
          </div>
        )}

        <div className="flex-1 overflow-auto p-4 md:p-12 pb-24 lg:pb-12 scroll-smooth" id="main-content">
          <div className="max-w-6xl mx-auto">
             <AnimatePresence mode="wait">
               <motion.div
                 key={location.pathname}
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: -10 }}
                 transition={{ duration: 0.3, ease: "easeOut" }}
               >
                 <Outlet />
               </motion.div>
             </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Mobile nav (Bottom Bar) - Redesigned as Floating Glass Rail */}
      <nav 
        className="lg:hidden fixed bottom-6 left-6 right-6 bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-[2rem] flex justify-around items-center p-2 z-40 shadow-2xl"
        aria-label="Navegação Inferior"
      >
          {[navItems[0], navItems[1], navItems[4]].map(item => {
             const isActive = location.pathname === item.path;
             const Icon = item.icon;
             return (
               <Link 
                 key={item.path} 
                 to={item.path} 
                 className={`flex flex-col items-center p-4 rounded-2xl transition-all relative ${isActive ? 'text-white' : 'text-slate-500'}`}
               >
                 {isActive && (
                   <motion.div 
                     layoutId="activeTab" 
                     className="absolute inset-0 bg-primary/20 rounded-2xl"
                   />
                 )}
                 <Icon className={`w-5 h-5 transition-transform relative z-10 ${isActive ? 'scale-110 text-primary' : ''}`} aria-hidden="true" />
                 <span className="text-[10px] font-black leading-none mt-2 relative z-10 tracking-[0.1em]">{item.name.split(' ')[0].toUpperCase()}</span>
               </Link>
             )
          })}
          
          <button 
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            className={`flex flex-col items-center p-4 rounded-2xl transition-all text-slate-500`}
          >
            <Menu className="w-5 h-5" aria-hidden="true" />
            <span className="text-[10px] font-black leading-none mt-2 tracking-[0.1em]">MENU</span>
          </button>
      </nav>

      {/* Real-time Toast Notification for Leads */}
      <AnimatePresence>
        {activeNotification && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 50, x: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.2 } }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-24 lg:bottom-10 right-6 z-50 max-w-sm w-full bg-slate-900 text-white border border-white/10 p-5 rounded-3xl shadow-2xl shadow-primary/30 backdrop-blur-xl flex flex-col gap-4 font-sans"
            role="alert"
          >
            <div className="absolute top-4 right-4">
              <button
                onClick={() => setActiveNotification(null)}
                className="p-1 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                aria-label="Dispensar notificação"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex gap-4 items-start pr-6">
              <div className="bg-primary/20 p-3 rounded-2xl text-primary relative flex-shrink-0">
                <div className="absolute inset-0 bg-primary/30 rounded-2xl animate-ping opacity-40"></div>
                <Bell className="w-5 h-5 animate-bounce relative z-10" />
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-black text-primary tracking-[0.25em] uppercase flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary block animate-pulse"></span>
                  Novo Lead do Site!
                </span>
                <h4 className="text-sm font-black text-white leading-tight">
                  {activeNotification.name}
                </h4>
                <p className="text-xs font-semibold text-slate-400">
                  {activeNotification.serviceType}
                </p>
                {activeNotification.phone && (
                  <p className="text-[10px] font-mono text-slate-500 mt-1">
                    Contato: {activeNotification.phone}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-2.5 mt-1">
              <Link 
                to="/app/leads" 
                onClick={() => setActiveNotification(null)}
                className="flex-1"
              >
                <Button className="w-full h-10 bg-primary hover:bg-primary/90 text-white font-bold text-xs rounded-xl shadow-lg shadow-primary/20 uppercase tracking-widest italic flex items-center justify-center gap-2">
                  Atender Lead <ExternalLink className="w-3.5 h-3.5" />
                </Button>
              </Link>
              <Button 
                variant="ghost" 
                onClick={() => setActiveNotification(null)}
                className="h-10 px-4 text-[10px] text-slate-400 hover:text-white hover:bg-white/5 font-black uppercase tracking-wider rounded-xl border border-white/5"
              >
                Dispensar
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
