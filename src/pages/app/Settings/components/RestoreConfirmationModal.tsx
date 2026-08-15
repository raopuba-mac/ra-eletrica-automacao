import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../../../components/ui/dialog';
import { Button } from '../../../../components/ui/button';
import { BackupPreviewSummary } from '../types/settings.types';
import {
  Users,
  UserCheck,
  FileText,
  Briefcase,
  Calendar,
  Wrench,
  Image as ImageIcon,
  Settings as SettingsIcon,
  DollarSign,
  AlertTriangle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

interface RestoreConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  preview: BackupPreviewSummary | null;
  isRestoring: boolean;
}

export const RestoreConfirmationModal: React.FC<
  RestoreConfirmationModalProps
> = ({ isOpen, onClose, onConfirm, preview, isRestoring }) => {
  if (!preview) return null;

  const { counts, version, app, exportedAt } = preview;

  const itemsList = [
    { label: 'Clientes', count: counts.clients, icon: Users, color: 'text-blue-500' },
    { label: 'Leads', count: counts.leads, icon: UserCheck, color: 'text-emerald-500' },
    { label: 'Orçamentos', count: counts.quotes, icon: FileText, color: 'text-purple-500' },
    { label: 'Ordens de Serviço', count: counts.serviceOrders, icon: Briefcase, color: 'text-amber-500' },
    { label: 'Agenda', count: counts.agenda, icon: Calendar, color: 'text-indigo-500' },
    { label: 'Serviços', count: counts.services, icon: Wrench, color: 'text-teal-500' },
    { label: 'Portfólio', count: counts.portfolio, icon: ImageIcon, color: 'text-rose-500' },
    { label: 'Configurações', count: counts.site_settings, icon: SettingsIcon, color: 'text-slate-500' },
    { label: 'Financeiro', count: counts.financial_transactions, icon: DollarSign, color: 'text-green-500' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isRestoring && onClose()}>
      <DialogContent className="max-w-lg p-6 rounded-2xl bg-slate-900 border border-slate-800 text-slate-100 shadow-2xl">
        <DialogHeader className="gap-2">
          <div className="flex items-center gap-2 text-amber-400 font-semibold text-lg">
            <AlertTriangle className="w-5 h-5" />
            <DialogTitle className="text-xl font-bold text-slate-100">
              Confirmar Restauração de Backup
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm text-slate-400">
            Confira o resumo dos dados identificados no arquivo de backup antes de prosseguir com a restauração.
          </DialogDescription>
        </DialogHeader>

        <div className="my-3 space-y-4">
          {/* Metadata Badge */}
          <div className="grid grid-cols-2 gap-2 text-xs bg-slate-800/80 p-3 rounded-xl border border-slate-700/60 text-slate-300">
            <div>
              <span className="text-slate-400 font-medium">Aplicação:</span>{' '}
              <span className="font-semibold text-slate-200">{app}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Versão Backup:</span>{' '}
              <span className="font-semibold text-amber-400">{version}</span>
            </div>
            <div className="col-span-2">
              <span className="text-slate-400 font-medium">Exportado em:</span>{' '}
              <span className="font-semibold text-slate-200">{exportedAt}</span>
            </div>
          </div>

          {/* Counts Grid */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Resumo dos Registros Encontrados
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {itemsList.map(({ label, count, icon: Icon, color }) => (
                <div
                  key={label}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/40"
                >
                  <div className="flex items-center gap-2 text-slate-300">
                    <Icon className={`w-4 h-4 ${color}`} />
                    <span>{label}</span>
                  </div>
                  <span className="font-bold text-slate-100 bg-slate-700/60 px-2 py-0.5 rounded">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Total Badge */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-200 text-sm font-semibold">
            <span>Total de Registros a Restaurar:</span>
            <span className="text-base font-bold bg-amber-500/20 px-3 py-1 rounded-lg text-amber-300">
              {counts.total} itens
            </span>
          </div>

          {/* Restoring Strategy Warning */}
          <div className="text-xs text-slate-400 bg-slate-800/40 p-3 rounded-lg border border-slate-700/40 leading-relaxed">
            <p className="font-medium text-slate-300 mb-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Modo de Restauração Seguro (Mesclar / Importar):
            </p>
            Os dados serão incorporados à sua conta. Registros existentes com o mesmo ID serão atualizados e os vínculos entre Ordens de Serviço e Financeiro serão preservados. Nenhum dado existente será excluído.
          </div>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-2 border-t border-slate-800">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isRestoring}
            className="border-slate-700 text-slate-300 hover:bg-slate-800 h-11"
          >
            Cancelar
          </Button>

          <Button
            type="button"
            onClick={onConfirm}
            disabled={isRestoring || counts.total === 0}
            className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold h-11 px-5 shadow-lg shadow-amber-600/20"
          >
            {isRestoring ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Restaurando Dados...
              </>
            ) : (
              'Confirmar e Restaurar Dados'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
