import React, { useState } from 'react';
import { Camera, Trash2, Loader2 } from 'lucide-react';
import { Label } from '../../../../components/ui/label';
import { cn } from '../../../../lib/utils';
import { storageService } from '../../../../services/storage/storageService';
import { useAuth } from '../../../../components/AuthProvider';

interface PhotoUploadSectionProps {
  label: string;
  attachments: string[];
  onChangeAttachments: (newAttachments: string[]) => void;
  accentColor?: 'yellow' | 'emerald';
  type?: 'before' | 'after';
  orderId?: string;
}

export const PhotoUploadSection: React.FC<PhotoUploadSectionProps> = ({
  label,
  attachments,
  onChangeAttachments,
  accentColor = 'yellow',
  type = 'before',
  orderId
}) => {
  const { user } = useAuth();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const processUploadedFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    setIsUploading(true);
    const userId = user?.uid || 'anonymous';
    const folderPath = storageService.getServiceOrderPath(userId, orderId || 'draft', type);

    const newUrls: string[] = [];
    for (const file of fileArray) {
      try {
        if (file.type.startsWith('image/')) {
          const downloadUrl = await storageService.prepareAndUploadImage(file, folderPath, 1200, 1200);
          newUrls.push(downloadUrl);
        } else if (file.type.startsWith('video/')) {
          const reader = new FileReader();
          await new Promise<void>((resolve) => {
            reader.onload = (event) => {
              const result = event.target?.result as string;
              if (result) newUrls.push(result);
              resolve();
            };
            reader.readAsDataURL(file);
          });
        }
      } catch (err: any) {
        console.error("Failed to upload image to Firebase Storage:", err);
        alert(err.message || 'Erro ao enviar imagem.');
      }
    }

    if (newUrls.length > 0) {
      onChangeAttachments([...attachments, ...newUrls]);
    }
    setIsUploading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processUploadedFiles(e.target.files);
    }
  };

  const removeAttachment = (index: number) => {
    onChangeAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processUploadedFiles(e.dataTransfer.files);
    }
  };

  const isEmerald = accentColor === 'emerald';

  return (
    <div className="space-y-4">
      <Label className={cn("text-[10px] font-black uppercase tracking-widest pl-1 italic flex items-center justify-between", isEmerald ? "text-emerald-400" : "text-slate-300")}>
        <span>{label}</span>
        {isUploading && (
          <span className="flex items-center gap-1.5 text-amber-400 text-[9px] normal-case not-italic animate-pulse">
            <Loader2 className="w-3 h-3 animate-spin" /> Enviando ao Firebase Storage...
          </span>
        )}
      </Label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div 
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={cn(
            "relative border-4 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center group transition-all cursor-pointer",
            isDragging 
              ? isEmerald
                ? "border-emerald-500 bg-emerald-500/10 scale-[1.02] shadow-xl"
                : "border-[#EAB308] bg-[#EAB308]/10 scale-[1.02] shadow-xl"
              : isEmerald
                ? "border-slate-800 bg-[#0B0F19] hover:border-emerald-500/50"
                : "border-slate-800 bg-[#0B0F19] hover:border-[#EAB308]/50",
            isUploading && "opacity-60 pointer-events-none"
          )}
        >
          {isUploading ? (
            <Loader2 className="w-10 h-10 mb-4 animate-spin text-[#EAB308]" />
          ) : (
            <Camera className={cn(
              "w-10 h-10 mb-4 transition-all duration-300", 
              isDragging 
                ? isEmerald ? "text-emerald-400 scale-110" : "text-[#EAB308] scale-110" 
                : isEmerald 
                  ? "text-slate-600 group-hover:text-emerald-400 group-hover:scale-110"
                  : "text-slate-600 group-hover:text-[#EAB308] group-hover:scale-110"
            )} />
          )}
          <span className={cn(
            "text-[10px] font-black uppercase tracking-widest transition-all duration-300", 
            isDragging 
              ? isEmerald ? "text-emerald-400 font-black" : "text-[#EAB308] font-black" 
              : isEmerald
                ? "text-slate-400 group-hover:text-emerald-400"
                : "text-slate-400 group-hover:text-[#EAB308]"
          )}>
            {isUploading ? "Enviando Imagem..." : "Arraste ou Clique"}
          </span>
          <input 
            type="file" 
            accept="image/*,video/*" 
            multiple 
            disabled={isUploading}
            onChange={handleFileUpload} 
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          {attachments.map((file, idx) => (
            <div key={idx} className="relative group aspect-square rounded-2xl overflow-hidden border border-slate-800 shadow-sm bg-slate-900">
              {file.startsWith('data:video/') ? (
                <embed src={file} className="w-full h-full object-cover" />
              ) : (
                <img src={file} className="w-full h-full object-cover" alt={`Evidence ${idx}`} referrerPolicy="no-referrer" />
              )}
              <button
                type="button"
                onClick={() => removeAttachment(idx)}
                className="absolute inset-0 bg-rose-600/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-5 h-5 scale-75 group-hover:scale-100 transition-transform" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
