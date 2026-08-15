import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import { ToastState } from '../../Clients/types/client.types';

interface FinancialToastProps {
  toast: ToastState;
  onClose: () => void;
}

export const FinancialToast: React.FC<FinancialToastProps> = ({ toast, onClose }) => {
  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        onClose();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast.show, onClose]);

  return (
    <AnimatePresence>
      {toast.show && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className={`fixed bottom-20 lg:bottom-10 right-4 z-50 max-w-sm w-[calc(100%-2rem)] p-4 rounded-2xl shadow-2xl backdrop-blur-xl border flex items-center justify-between gap-3 text-xs font-black uppercase tracking-wider ${
            toast.type === 'success'
              ? 'bg-slate-900/95 text-emerald-400 border-emerald-500/40'
              : 'bg-slate-900/95 text-rose-400 border-rose-500/40'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
