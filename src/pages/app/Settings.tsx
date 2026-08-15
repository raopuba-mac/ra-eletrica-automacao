import React from 'react';
import { useSettings } from './Settings/hooks/useSettings';
import { SettingsHeader } from './Settings/components/SettingsHeader';
import { SettingsForm } from './Settings/components/SettingsForm';
import { SettingsBackup } from './Settings/components/SettingsBackup';
import { SettingsVisualIdentity } from './Settings/components/SettingsVisualIdentity';

export default function Settings() {
  const {
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
  } = useSettings();

  if (loading) return <div>Carregando...</div>;

  return (
    <div className="max-w-2xl space-y-6">
      <SettingsHeader onSyncData={handleSyncData} />

      <SettingsForm
        form={form}
        setForm={setForm}
        onSubmit={handleSubmit}
      />

      <SettingsBackup
        onExportBackup={handleExportBackup}
        onImportBackup={handleImportBackup}
        isModalOpen={isModalOpen}
        onCloseModal={handleCloseModal}
        onConfirmRestore={handleConfirmRestore}
        importPreview={importPreview}
        isRestoring={isRestoring}
      />

      <SettingsVisualIdentity onDownloadLogo={handleDownloadLogo} />
    </div>
  );
}
