import React from 'react';
import { DEFAULT_CATEGORIES } from '../utils/portfolioUtils';
import { PortfolioCategoryCard } from './PortfolioCategoryCard';

interface PortfolioCategoryFormProps {
  categoryPhotos: Record<string, string>;
  isUploadingCategory: string | null;
  onUploadCategoryPhoto: (id: string, file: File) => void;
}

export const PortfolioCategoryForm: React.FC<PortfolioCategoryFormProps> = ({
  categoryPhotos,
  isUploadingCategory,
  onUploadCategoryPhoto,
}) => {
  return (
    <div className="bg-white rounded-3xl p-8 border border-slate-200 text-slate-900 shadow-xs">
      <h3 className="text-xl font-black text-slate-900 mb-6">
        Personalizar Capas das Categorias
      </h3>
      <p className="text-sm text-slate-500 mb-8 max-w-2xl">
        Aqui você pode subir fotos reais dos seus serviços para as 8 categorias principais do site. Essas fotos nunca serão bloqueadas por redes externas.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {DEFAULT_CATEGORIES.map((category) => (
          <PortfolioCategoryCard
            key={category.id}
            category={category}
            imageUrl={categoryPhotos[category.id]}
            isUploading={isUploadingCategory === category.id}
            onUpload={onUploadCategoryPhoto}
          />
        ))}
      </div>
    </div>
  );
};
