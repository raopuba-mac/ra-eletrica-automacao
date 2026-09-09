import React from 'react';
import { PageHeader } from '../../components/PageHeader';
import { AnimatePresence } from 'motion/react';
import { usePortfolio } from './Portfolio/hooks/usePortfolio';
import { PortfolioCard } from './Portfolio/components/PortfolioCard';
import { PortfolioForm } from './Portfolio/components/PortfolioForm';
import { PortfolioFilters } from './Portfolio/components/PortfolioFilters';
import { PortfolioCategoryForm } from './Portfolio/components/PortfolioCategoryForm';
import { PortfolioToast } from './Portfolio/components/PortfolioToast';

export default function PortfolioAdmin() {
  const {
    items,
    isDialogOpen,
    setIsDialogOpen,
    form,
    setForm,
    photo,
    mediaUrlsText,
    setMediaUrlsText,
    editingId,
    activeTab,
    setActiveTab,
    categoryPhotos,
    isUploadingCategory,
    isDragging,
    isSaving,
    toast,
    setToast,
    handleCategoryPhotoUpload,
    handleDrag,
    handleDrop,
    handlePhotoUpload,
    handleOpenNewDialog,
    resetForm,
    handleEdit,
    handleSubmit,
    toggleVisibility,
    handleDelete,
  } = usePortfolio();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestão do Site"
        description="Gerencie as fotos e projetos que seus clientes veem."
        action={
          activeTab === 'projects' && (
            <PortfolioForm
              isDialogOpen={isDialogOpen}
              setIsDialogOpen={setIsDialogOpen}
              editingId={editingId}
              form={form}
              setForm={setForm}
              photo={photo}
              mediaUrlsText={mediaUrlsText}
              setMediaUrlsText={setMediaUrlsText}
              isDragging={isDragging}
              isSaving={isSaving}
              onOpenNewDialog={handleOpenNewDialog}
              onResetForm={resetForm}
              onDrag={handleDrag}
              onDrop={handleDrop}
              onPhotoUpload={handlePhotoUpload}
              onSubmit={handleSubmit}
            />
          )
        }
      />

      <PortfolioFilters activeTab={activeTab} setActiveTab={setActiveTab} />

      {activeTab === 'projects' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {items.map((item, idx) => (
              <PortfolioCard
                key={item.id}
                item={item}
                idx={idx}
                onEdit={handleEdit}
                onToggleVisibility={toggleVisibility}
                onDelete={handleDelete}
              />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <PortfolioCategoryForm
          categoryPhotos={categoryPhotos}
          isUploadingCategory={isUploadingCategory}
          onUploadCategoryPhoto={handleCategoryPhotoUpload}
        />
      )}

      <PortfolioToast
        toast={toast}
        onClose={() => setToast((prev) => ({ ...prev, show: false }))}
      />
    </div>
  );
}
