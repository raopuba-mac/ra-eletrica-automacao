import React from 'react';
import { Button } from '../../../../components/ui/button';
import { Download, Upload, ShieldCheck } from 'lucide-react';
import { BackupPreviewSummary } from '../types/settings.types';
import { RestoreConfirmationModal } from './RestoreConfirmationModal';

interface SettingsBackupProps {
  onExportBackup: () => void;
  onImportBackup: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isModalOpen: boolean;
  onCloseModal: () => void;
  onConfirmRestore: () => void;
  importPreview: BackupPreviewSummary | null;
  isRestoring: boolean;
}

export const SettingsBackup: React.FC<SettingsBackupProps> = ({
  onExportBackup,
  onImportBackup,
  isModalOpen,
  onCloseModal,
  onConfirmRestore,
  importPreview,
  isRestoring,
}) => {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 uppercase tracking-tight italic flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            Cópia de Segurança & Exportação V2
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Gere cópias de segurança completas do seu RA ERP contendo Clientes, Leads, Orçamentos, Ordens de Serviço, Agenda, Serviços, Portfólio, Configurações do Site e Lançamentos Financeiros.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={onExportBackup}
          className="h-14 bg-white border-slate-200 text-slate-700 font-bold uppercase tracking-widest text-[10px] rounded-xl hover:bg-slate-50 transition shadow-xs"
        >
          <Download className="w-4 h-4 mr-2 text-emerald-600" /> Exportar Dados (Backup V2 JSON)
        </Button>

        <div className="relative">
          <input
            type="file"
            accept=".json"
            onChange={onImportBackup}
            id="import-backup-file"
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => document.getElementById('import-backup-file')?.click()}
            className="h-14 w-full bg-white border-slate-200 text-slate-700 font-bold uppercase tracking-widest text-[10px] rounded-xl hover:bg-slate-50 transition shadow-xs"
          >
            <Upload className="w-4 h-4 mr-2 text-blue-600" /> Importar Backup V2 (Restaurar)
          </Button>
        </div>
      </div>

      <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider text-center">
        🔒 A restauração valida o arquivo e solicita confirmação explícita antes de mesclar os registros com sua conta.
      </p>

      {/* Confirmation Modal */}
      <RestoreConfirmationModal
        isOpen={isModalOpen}
        onClose={onCloseModal}
        onConfirm={onConfirmRestore}
        preview={importPreview}
        isRestoring={isRestoring}
      />
    </div>
  );
};
