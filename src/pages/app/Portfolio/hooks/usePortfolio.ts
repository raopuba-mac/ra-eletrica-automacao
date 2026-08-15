import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../components/AuthProvider';
import { portfolioService } from '../services/portfolioService';
import {
  PortfolioItem,
  PortfolioFormData,
  ToastState,
} from '../types/portfolio.types';
import {
  parseMediaUrlsText,
  formatSaveErrorMessage,
} from '../utils/portfolioUtils';

export function usePortfolio() {
  const { user } = useAuth();
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [form, setForm] = useState<PortfolioFormData>({
    title: '',
    description: '',
    category: '',
    isPublic: true,
  });
  const [photo, setPhoto] = useState<string | null>(null);
  const [mediaUrlsText, setMediaUrlsText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'projects' | 'categories'>(
    'projects'
  );
  const [categoryPhotos, setCategoryPhotos] = useState<
    Record<string, string>
  >({});
  const [isUploadingCategory, setIsUploadingCategory] = useState<
    string | null
  >(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<ToastState>({
    show: false,
    message: '',
    type: 'success',
  });

  useEffect(() => {
    if (!toast.show) return;
    const timer = setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast.show]);

  const showToast = (
    message: string,
    type: 'success' | 'error' = 'success'
  ) => {
    setToast({ show: true, message, type });
  };

  useEffect(() => {
    if (!user) return;

    const unsubItems = portfolioService.subscribeToPortfolio((data) => {
      setItems(data);
    });

    const unsubCats = portfolioService.subscribeToCategoryImages((cats) => {
      setCategoryPhotos(cats);
    });

    return () => {
      unsubItems();
      unsubCats();
    };
  }, [user]);

  const handleCategoryPhotoUpload = async (id: string, file: File) => {
    setIsUploadingCategory(id);
    try {
      const userId = user?.uid || 'anonymous';
      await portfolioService.updateCategoryPhoto(userId, id, file);
      showToast('Capa da categoria atualizada com sucesso!', 'success');
    } catch (err: any) {
      console.error('Failed to save category image', err);
      showToast(err.message || 'Erro ao salvar foto da categoria.', 'error');
    } finally {
      setIsUploadingCategory(null);
    }
  };

  const processFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    let currentPhoto = photo;
    let currentMediaText = mediaUrlsText;

    const imageFiles = fileArray.filter((f) => f.type.startsWith('image/'));
    const userId = user?.uid || 'anonymous';

    setIsSaving(true);
    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      try {
        const downloadUrl = await portfolioService.uploadProjectImage(
          userId,
          editingId,
          file
        );

        if (!currentPhoto && i === 0) {
          currentPhoto = downloadUrl;
          setPhoto(downloadUrl);
        } else {
          const urls = parseMediaUrlsText(currentMediaText);
          urls.push(downloadUrl);
          currentMediaText = urls.join('\n');
          setMediaUrlsText(currentMediaText);
        }
      } catch (err: any) {
        console.error('Error processing file', file.name, err);
        showToast(
          err.message || 'Erro ao enviar imagem ao Firebase Storage.',
          'error'
        );
      }
    }
    setIsSaving(false);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFiles(e.dataTransfer.files);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processFiles(e.target.files);
    }
  };

  const resetForm = () => {
    setForm({ title: '', description: '', category: '', isPublic: true });
    setPhoto(null);
    setMediaUrlsText('');
    setEditingId(null);
  };

  const handleOpenNewDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleEdit = (item: PortfolioItem) => {
    setForm({
      title: item.title || '',
      description: item.description || '',
      category: item.category || '',
      isPublic: item.isPublic ?? true,
    });
    setPhoto(item.photoUrl || null);
    setMediaUrlsText(item.mediaUrls ? item.mediaUrls.join('\n') : '');
    setEditingId(item.id);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || isSaving) return;
    setIsSaving(true);

    const parsedMediaUrls = parseMediaUrlsText(mediaUrlsText);

    const docData: any = {
      ...form,
      updatedAt: Date.now(),
    };
    if (photo) docData.photoUrl = photo;
    if (parsedMediaUrls.length > 0) {
      docData.mediaUrls = parsedMediaUrls;
    } else {
      docData.mediaUrls = [];
    }

    try {
      await portfolioService.savePortfolioItem(editingId, user.uid, docData);
      showToast(
        editingId
          ? 'Projeto atualizado com sucesso!'
          : 'Projeto publicado com sucesso!',
        'success'
      );
      setIsDialogOpen(false);
      resetForm();
    } catch (err: any) {
      console.error('Failed to save portfolio project:', err);
      const errMsg = formatSaveErrorMessage(err);
      showToast(errMsg, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleVisibility = async (id: string, current: boolean) => {
    try {
      await portfolioService.toggleVisibility(id, current);
      showToast(
        `Projeto alterado para ${!current ? 'Público' : 'Oculto'}`,
        'success'
      );
    } catch {
      showToast('Não foi possível alterar a visibilidade do projeto.', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este projeto?')) return;
    try {
      await portfolioService.deletePortfolioItem(id);
      showToast('Projeto excluído com sucesso!', 'success');
    } catch {
      showToast('Erro ao excluir o projeto.', 'error');
    }
  };

  return {
    user,
    items,
    isDialogOpen,
    setIsDialogOpen,
    form,
    setForm,
    photo,
    setPhoto,
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
  };
}
