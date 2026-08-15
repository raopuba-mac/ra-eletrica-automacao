import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Smartphone } from 'lucide-react';
import { Card } from '../../../../components/ui/card';

interface DashboardPwaGuideProps {
  showPwaGuide: boolean;
  onClose: () => void;
}

export const DashboardPwaGuide: React.FC<DashboardPwaGuideProps> = ({
  showPwaGuide,
  onClose,
}) => {
  return (
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
              onClick={onClose}
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
  );
};
