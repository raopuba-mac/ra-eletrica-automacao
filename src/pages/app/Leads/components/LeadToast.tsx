import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCheck, X } from 'lucide-react';
import { ToastState } from '../types/lead.types';

interface LeadToastProps {
  toast: ToastState;
  onClose: () => void;
}

export const LeadToast: React.FC<LeadToastProps> = ({ toast, onClose }) => {
  return (
    <AnimatePresence>
      {toast.show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.2 } }}
          className="fixed bottom-10 right-6 z-50 max-w-sm w-full bg-slate-900 text-white border border-white/10 p-4 rounded-2xl shadow-2xl flex items-center gap-3 font-sans"
          role="alert"
        >
          <div className="bg-emerald-500/20 p-2 rounded-xl text-emerald-400 shrink-0">
            <CheckCheck className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-black text-emerald-400 uppercase tracking-widest leading-none mb-1">
              Sucesso
            </p>
            <p className="text-sm font-semibold leading-tight text-white">{toast.message}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer text-xs"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
