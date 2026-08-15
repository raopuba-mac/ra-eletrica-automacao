import React from 'react';
import { Plus, Image as ImageIcon } from 'lucide-react';
import { cn } from '../../../../lib/utils';

interface PortfolioMediaUploadProps {
  photo: string | null;
  isDragging: boolean;
  onDrag: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onPhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const PortfolioMediaUpload: React.FC<PortfolioMediaUploadProps> = ({
  photo,
  isDragging,
  onDrag,
  onDrop,
  onPhotoUpload,
}) => {
  return (
    <div
      onDragEnter={onDrag}
      onDragLeave={onDrag}
      onDragOver={onDrag}
      onDrop={onDrop}
      className={cn(
        'border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center relative overflow-hidden group transition-all duration-300',
        isDragging
          ? 'border-primary bg-primary/5 scale-[1.02] shadow-xl'
          : 'border-slate-200 bg-slate-50',
        photo ? 'p-2' : 'py-10'
      )}
    >
      {photo ? (
        <div className="relative w-full h-48">
          <img
            src={photo}
            alt="Preview"
            className="w-full h-full object-contain rounded-xl"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity flex-col gap-2">
            <ImageIcon className="w-8 h-8 text-white" />
            <span className="text-[10px] text-white font-black uppercase tracking-widest">
              Alterar Foto
            </span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center pointer-events-none">
          <div className="w-16 h-16 rounded-full bg-white shadow-xs flex items-center justify-center mb-4 text-slate-400 group-hover:text-primary transition-colors">
            <Plus
              className={cn(
                'w-8 h-8 transition-transform',
                isDragging && 'rotate-45'
              )}
            />
          </div>
          <p className="text-sm text-slate-600 font-black tracking-tight">
            Solte suas fotos aqui
          </p>
          <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
            Ou clique para selecionar múltiplos arquivos
          </p>
        </div>
      )}
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={onPhotoUpload}
        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
      />
    </div>
  );
};
