import React from 'react';
import { Label } from '../../../../components/ui/label';
import { Image as ImageIcon } from 'lucide-react';
import { CategoryInfo } from '../types/portfolio.types';

interface PortfolioCategoryCardProps {
  category: CategoryInfo;
  imageUrl?: string;
  isUploading: boolean;
  onUpload: (id: string, file: File) => void;
}

export const PortfolioCategoryCard: React.FC<PortfolioCategoryCardProps> = ({
  category,
  imageUrl,
  isUploading,
  onUpload,
}) => {
  return (
    <div className="space-y-3">
      <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
        {category.name}
      </Label>
      <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-50 border-2 border-dashed border-slate-200 group">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={category.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            {isUploading ? (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#EAB308]" />
            ) : (
              <>
                <ImageIcon className="w-8 h-8 mb-1" />
                <span className="text-[10px] font-bold italic tracking-tight">
                  Sem Imagem Real
                </span>
              </>
            )}
          </div>
        )}
        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all cursor-pointer">
          {isUploading ? (
            <span className="text-white text-[10px] font-black uppercase tracking-widest">
              Enviando...
            </span>
          ) : (
            <>
              <span className="text-white text-[10px] font-black uppercase tracking-widest">
                Alterar Foto
              </span>
              <input
                type="file"
                accept="image/*"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    onUpload(category.id, e.target.files[0]);
                  }
                }}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};
