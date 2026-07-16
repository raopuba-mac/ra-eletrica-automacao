import { Outlet, Link, useLocation } from 'react-router-dom';
import { Zap, Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { collection, query, getDocs, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../components/ui/button';
const logoImg = '/logo.jpg?v=6';

export default function PublicLayout() {
  const [companyName, setCompanyName] = useState('RA | Elétrica & Automação');
  const [phone, setPhone] = useState('5534992609206');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const [logoError, setLogoError] = useState(false);
  const [logoSrc, setLogoSrc] = useState(logoImg);

  const handleLogoError = () => {
    if (logoSrc === logoImg) {
      setLogoSrc(`/logo.jpg?t=${Date.now()}`);
    } else {
      setLogoError(true);
    }
  };

  useEffect(() => {
    async function loadConfig() {
      try {
        const usersSnap = await getDocs(query(collection(db, 'users'), limit(1)));
        if (!usersSnap.empty) {
          const u = usersSnap.docs[0].data();
          if (u.companyName) setCompanyName(u.companyName);
          if (u.whatsappInfo) {
            const p = String(u.whatsappInfo).replace(/\D/g, '');
            setPhone(p.startsWith('55') ? p : (p ? '55' + p : '5534992609206'));
          }
        }
      } catch(e) {}
    }
    loadConfig();
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b bg-white top-0 sticky z-50 w-full animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3.5 group" aria-label="Página Inicial">
              <div className="w-16 h-16 bg-white border border-slate-200 text-white rounded-xl overflow-hidden shadow-md group-hover:border-blue-500 transition-all shrink-0 flex items-center justify-center font-black italic tracking-tighter" aria-hidden="true">
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
            <span className="font-black text-sm sm:text-lg md:text-xl lg:text-2xl tracking-tight text-slate-900 group-hover:text-blue-700 transition leading-tight line-clamp-2">
              {companyName}
            </span>
          </Link>
          
          <nav className="hidden md:flex gap-6 font-medium text-slate-600">
            <Link to="/" className="hover:text-blue-600 transition">Início</Link>
            <Link to="/portfolio" className="hover:text-blue-600 transition">Serviços e Portfólio</Link>
            <a href="/#contact" className="hover:text-blue-600 transition">Contato</a>
            <Link to="/login" className="hover:text-blue-600 transition">Acesso Profissional</Link>
          </nav>

          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden text-slate-600"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-expanded={isMobileMenuOpen}
            aria-label="Alternar menu de navegação"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-950/20 backdrop-blur-sm z-40 md:hidden"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-16 bottom-0 w-[280px] bg-white border-l z-40 md:hidden shadow-2xl p-6"
            >
              <nav className="flex flex-col gap-4 font-bold text-slate-900">
                <Link to="/" className="p-3 rounded-lg hover:bg-slate-50 transition border-b border-slate-50">Início</Link>
                <Link to="/portfolio" className="p-3 rounded-lg hover:bg-slate-50 transition border-b border-slate-50">Serviços e Portfólio</Link>
                <a href="/#contact" className="p-3 rounded-lg hover:bg-slate-50 transition border-b border-slate-50">Contato</a>
                <div className="mt-8 pt-8 border-t border-slate-100">
                  <Link to="/login" className="flex items-center justify-center p-3 rounded-xl bg-slate-100 text-slate-600 text-sm hover:bg-slate-200 transition">
                    Acesso Administrador
                  </Link>
                </div>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main>
        <Outlet />
      </main>
      <footer className="bg-slate-900 text-slate-400 py-12 text-center">
        <div className="container mx-auto px-4">
          <p>© {new Date().getFullYear()} {companyName}. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
