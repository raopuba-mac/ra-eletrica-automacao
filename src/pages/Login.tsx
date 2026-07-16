import { Zap, ShieldCheck, ArrowLeft, ExternalLink } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../components/AuthProvider';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader } from '../components/ui/card';
import { motion } from 'motion/react';

export default function Login() {
  const { user, signIn, error, clearError } = useAuth();

  if (user) {
    return <Navigate to="/app" replace />;
  }

  const isInIframe = typeof window !== 'undefined' && window.self !== window.top;

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 overflow-hidden relative">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="absolute top-4 left-4 z-20 md:top-8 md:left-8"
      >
        <Link to="/">
          <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-white/10 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-widest px-4 sm:px-6 h-10 sm:h-12 flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Voltar para o site</span>
            <span className="sm:hidden">Voltar</span>
          </Button>
        </Link>
      </motion.div>

      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full" 
        />
        <motion.div 
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.1, 0.15, 0.1] }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-400/20 blur-[120px] rounded-full" 
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        <div className="flex flex-col items-center mb-10">
           <motion.div 
             initial={{ scale: 0, rotate: -45 }}
             animate={{ scale: 1, rotate: 0 }}
             transition={{ type: 'spring', damping: 15, stiffness: 200, delay: 0.2 }}
             className="bg-blue-600 p-5 rounded-[2.5rem] text-white shadow-2xl shadow-blue-600/40 mb-8 ring-4 ring-blue-600/10"
           >
             <Zap className="w-12 h-12 fill-white" />
           </motion.div>
           <h1 className="text-4xl font-black text-white tracking-tighter text-center leading-none">RA | ELÉTRICA<br/><span className="text-blue-500">& AUTOMAÇÃO</span></h1>
           <p className="text-slate-500 font-bold mt-4 uppercase tracking-[0.2em] text-[10px]">Portal do Administrador</p>
        </div>

        <Card className="border-none bg-slate-800/40 backdrop-blur-2xl shadow-2xl overflow-hidden rounded-[2rem] ring-1 ring-white/10">
          <div className="h-1.5 w-full bg-blue-600" />
          <CardHeader className="text-center pt-10 pb-6">
            <h2 className="text-xs font-black text-white uppercase tracking-[0.3em] mb-2 opacity-60">Acesso Seguro</h2>
            <CardDescription className="text-slate-300 font-medium text-base">Identifique-se para continuar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 px-10 pb-12">
            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-5 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-2xl flex flex-col gap-4"
              >
                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-6 h-6 shrink-0 opacity-80" />
                  <p className="font-bold leading-tight">{error}</p>
                </div>
                <button 
                  onClick={clearError} 
                  className="text-[10px] font-black uppercase tracking-widest text-white hover:bg-red-500/30 transition-colors bg-red-500/20 px-4 py-2 rounded-xl w-fit"
                >
                  Limpar Erro
                </button>
              </motion.div>
            )}

            {isInIframe && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 bg-blue-500/15 border border-blue-500/20 text-blue-300 text-xs sm:text-sm rounded-2xl flex flex-col gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse mt-1.5 shrink-0" />
                  <div className="space-y-1">
                    <p className="font-bold text-white leading-tight">Executando no Preview (Iframe)</p>
                    <p className="opacity-80 text-[11px] leading-relaxed">
                      Navegadores modernos costumam bloquear o popup de login do Google dentro de iframes devido a políticas de privacidade (cookies de terceiros).
                    </p>
                  </div>
                </div>
                <Button 
                  onClick={() => window.open(window.location.href, '_blank')}
                  variant="outline"
                  className="w-full h-10 border-blue-500/30 text-blue-300 hover:bg-blue-500/20 font-bold text-xs uppercase tracking-wider rounded-xl gap-2 mt-1"
                >
                  <ExternalLink className="w-4.5 h-4.5" />
                  Abrir em Nova Aba ↗
                </Button>
              </motion.div>
            )}
            
            <div className="space-y-6">
              <Button 
                className="w-full h-16 rounded-2xl bg-white text-slate-900 hover:bg-slate-100 text-lg font-black tracking-tight shadow-xl transition-all active:scale-[0.98] group" 
                onClick={signIn}
              >
                <img src="https://www.google.com/favicon.ico" className="w-6 h-6 mr-3 grayscale group-hover:grayscale-0 transition-all" alt="Google" />
                Acessar via Google
              </Button>
              
              <div className="flex items-center gap-4 py-2">
                <div className="h-px flex-1 bg-white/5" />
                <span className="text-[10px] text-slate-600 font-black uppercase tracking-widest">Protocolo SSL Ativo</span>
                <div className="h-px flex-1 bg-white/5" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="mt-10 flex justify-center gap-8 text-[10px] font-black text-slate-700 uppercase tracking-widest">
           <span className="hover:text-slate-400 cursor-pointer transition-colors">Segurança</span>
           <span className="hover:text-slate-400 cursor-pointer transition-colors">Termos</span>
           <span className="hover:text-slate-400 cursor-pointer transition-colors">Ajuda</span>
        </div>
      </motion.div>
    </div>
  );
}
