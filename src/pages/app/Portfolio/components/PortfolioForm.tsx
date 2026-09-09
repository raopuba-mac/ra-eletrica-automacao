import React from 'react';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { Textarea } from '../../../../components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../../../components/ui/dialog';
import { Plus } from 'lucide-react';
import { PortfolioFormData } from '../types/portfolio.types';
import { PortfolioMediaUpload } from './PortfolioMediaUpload';

interface PortfolioFormProps {
  isDialogOpen: boolean;
  setIsDialogOpen: (open: boolean) => void;
  editingId: string | null;
  form: PortfolioFormData;
  setForm: React.Dispatch<React.SetStateAction<PortfolioFormData>>;
  photo: string | null;
  mediaUrlsText: string;
  setMediaUrlsText: (val: string) => void;
  isDragging: boolean;
  isSaving: boolean;
  onOpenNewDialog: () => void;
  onResetForm: () => void;
  onDrag: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onPhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const PortfolioForm: React.FC<PortfolioFormProps> = ({
  isDialogOpen,
  setIsDialogOpen,
  editingId,
  form,
  setForm,
  photo,
  mediaUrlsText,
  setMediaUrlsText,
  isDragging,
  isSaving,
  onOpenNewDialog,
  onResetForm,
  onDrag,
  onDrop,
  onPhotoUpload,
  onSubmit,
}) => {
  return (
    <Dialog
      open={isDialogOpen}
      onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) onResetForm();
      }}
    >
      <DialogTrigger
        render={
          <Button
            size="lg"
            className="h-14 px-8 font-black uppercase tracking-widest bg-[#EAB308] hover:bg-[#ca8a04] text-[#0B0F19] rounded-2xl shadow-xl shadow-[#EAB308]/20 italic"
            onClick={onOpenNewDialog}
          >
            <Plus className="w-5 h-5 mr-2" /> Adicionar Projeto
          </Button>
        }
      />
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl bg-white text-slate-900 border-slate-200 rounded-3xl p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">
            {editingId ? 'Editar Projeto' : 'Novo Projeto no Portfólio'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-5 pt-4">
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-wider text-slate-700">Título do Projeto *</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ex: Reforma Elétrica Apartamento X"
              className="h-12 border-slate-300 bg-slate-50 text-slate-900 placeholder:text-slate-400 rounded-xl focus:border-[#EAB308] focus:bg-white"
              required
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-wider text-slate-700">Categoria</Label>
            <Input
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="Ex: Elétrica Residencial"
              className="h-12 border-slate-300 bg-slate-50 text-slate-900 placeholder:text-slate-400 rounded-xl focus:border-[#EAB308] focus:bg-white"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-wider text-slate-700">Descrição</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Conte detalhes sobre o serviço realizado..."
              className="min-h-[100px] border-slate-300 bg-slate-50 text-slate-900 placeholder:text-slate-400 rounded-xl focus:border-[#EAB308] focus:bg-white"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-wider text-slate-700">Foto Principal e Galeria</Label>
            <div className="flex flex-col gap-4">
              <PortfolioMediaUpload
                photo={photo}
                isDragging={isDragging}
                onDrag={onDrag}
                onDrop={onDrop}
                onPhotoUpload={onPhotoUpload}
              />
            </div>
          </div>
          <div className="pt-4 border-t border-slate-200 space-y-3">
            <Label className="text-xs font-black uppercase tracking-wider text-slate-700">Links Adicionais (Fotos/Vídeos)</Label>
            <Textarea
              value={mediaUrlsText}
              onChange={(e) => setMediaUrlsText(e.target.value)}
              placeholder="Cole um link por linha (Instagram, YouTube...)"
              className="min-h-[80px] border-slate-300 bg-slate-50 text-slate-900 placeholder:text-slate-400 rounded-xl focus:border-[#EAB308] focus:bg-white"
            />
          </div>
          <Button
            type="submit"
            size="lg"
            className="w-full font-black uppercase italic tracking-wider h-14 bg-[#EAB308] hover:bg-[#ca8a04] text-[#0B0F19] rounded-2xl shadow-xl shadow-[#EAB308]/20 text-sm"
            disabled={isSaving}
          >
            {isSaving
              ? 'Enviando...'
              : editingId
              ? 'Salvar Alterações'
              : 'Publicar Projeto'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
