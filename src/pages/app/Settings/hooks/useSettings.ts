import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../components/AuthProvider';
import { settingsService } from '../services/settingsService';
import { SettingsFormData, BackupPreviewSummary } from '../types/settings.types';

export function useSettings() {
  const { user } = useAuth();
  const [form, setForm] = useState<SettingsFormData>({
    name: '',
    companyName: '',
    phone: '',
    whatsappInfo: '',
    websiteSlug: '',
    bio: '',
  });
  const [loading, setLoading] = useState(true);

  // Backup V2 Modal State
  const [importPreview, setImportPreview] = useState<BackupPreviewSummary | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    async function loadConfig() {
      if (!user) return;
      try {
        const profile = await settingsService.getUserProfile(user.uid);
        if (profile) {
          setForm(profile);
        }
      } catch (e) {
        // Error handled in service
      } finally {
        setLoading(false);
      }
    }
    loadConfig();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await settingsService.saveUserProfile(user.uid, form);
      alert('Configurações salvas!');
    } catch (err) {
      // Error handled in service
    }
  };

  const handleExportBackup = async () => {
    if (!user) return;
    try {
      await settingsService.exportBackup(user.uid);
      alert('Backup V2 de segurança gerado e baixado com sucesso!');
    } catch (err) {
      console.error('Erro ao gerar backup de dados:', err);
      alert('Não foi possível gerar a cópia de segurança. Erro inesperado.');
    }
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const summary = settingsService.parseAndValidateBackup(content);
          setImportPreview(summary);
          setIsModalOpen(true);
        } catch (err: any) {
          console.error('Erro ao validar arquivo de backup:', err);
          alert(err.message || 'Erro crítico ao validar o arquivo de backup.');
        } finally {
          e.target.value = '';
        }
      };
      reader.readAsText(file);
    } catch (err) {
      console.error('Erro ao ler o arquivo selecionado:', err);
      alert('Não foi possível ler o arquivo de backup selecionado.');
      e.target.value = '';
    }
  };

  const handleConfirmRestore = async () => {
    if (!user || !importPreview) return;
    setIsRestoring(true);
    try {
      const result = await settingsService.importBackup(user.uid, importPreview);
      const isSuccess = result.failedCount === 0;
      const title = isSuccess
        ? 'Restauração Concluída com Sucesso!'
        : 'Restauração Concluída com Alertas / FalhasParciais';

      alert(
        `${title}\n\n` +
          `• Total restaurados com sucesso: ${result.restoredCount} registro(s)\n` +
          `• Falhas de restauração: ${result.failedCount} registro(s)\n\n` +
          `Os dados válidos foram mesclados com a sua conta.`
      );
      setIsModalOpen(false);
      setImportPreview(null);
      window.location.reload();
    } catch (err: any) {
      console.error('Erro ao restaurar backup:', err);
      alert(err.message || 'Erro durante o processo de restauração.');
    } finally {
      setIsRestoring(false);
    }
  };

  const handleCloseModal = () => {
    if (!isRestoring) {
      setIsModalOpen(false);
      setImportPreview(null);
    }
  };

  const handleSyncData = async () => {
    try {
      await settingsService.forceSyncData();
      alert('Sincronização forçada concluída com sucesso!');
    } catch (err) {
      console.error(err);
      alert('Erro ao tentar forçar a sincronização de dados.');
    }
  };

  const handleDownloadLogo = async () => {
    await settingsService.downloadLogo();
  };

  return {
    user,
    form,
    setForm,
    loading,
    handleSubmit,
    handleExportBackup,
    handleImportBackup,
    handleConfirmRestore,
    handleCloseModal,
    importPreview,
    isModalOpen,
    isRestoring,
    handleSyncData,
    handleDownloadLogo,
  };
}
