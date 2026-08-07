import React from 'react';
import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../components/AuthProvider';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Plus, Trash2, Camera, Eye, EyeOff, Edit, Image as ImageIcon, ExternalLink, CheckCheck, X } from 'lucide-react';
import { Textarea } from '../../components/ui/textarea';
import { OperationType, handleFirestoreError } from '../../lib/error';
import { resizeImage } from '../../lib/imageHandler';
import { PageHeader } from '../../components/PageHeader';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';

export default function PortfolioAdmin() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', category: '', isPublic: true });
  const [photo, setPhoto] = useState<string | null>(null);
  const [mediaUrlsText, setMediaUrlsText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'projects' | 'categories'>('projects');
  const [categoryPhotos, setCategoryPhotos] = useState<Record<string, string>>({});
  const [isUploadingCategory, setIsUploadingCategory] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });

  useEffect(() => {
    if (!toast.show) return;
    const timer = setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast.show]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
  };

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(collection(db, 'portfolio'), 
      snap => {
        setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      },
      err => handleFirestoreError(err, OperationType.GET, 'portfolio')
    );
    
    // Load category images
    const unsubCats = onSnapshot(doc(db, 'site_settings', 'categories'), 
      (docSnap) => {
        if (docSnap.exists()) {
          setCategoryPhotos(docSnap.data().images || {});
        }
      },
      (err) => {
        console.error("Error loading category images:", err);
        // We don't throw here to avoid breaking the whole page if settings are missing
      }
    );

    return () => { unsub(); unsubCats(); };
  }, [user]);

  const handleCategoryPhotoUpload = async (id: string, file: File) => {
    setIsUploadingCategory(id);
    try {
      const resized = await resizeImage(file, 800, 600);
      
      // Use dot notation for nested update to avoid overwriting the whole images object
      const docRef = doc(db, 'site_settings', 'categories');
      try {
        await updateDoc(docRef, {
          [`images.${id}`]: resized
        });
      } catch (e: any) {
        // If document doesn't exist, create it with setDoc
        if (e.code === 'not-found' || e.message?.includes('No document to update')) {
          await setDoc(docRef, { images: { [id]: resized } });
        } else {
          throw e;
        }
      }
      
      console.log(`Category ${id} photo updated successfully`);
    } catch (err: any) {
      console.error("Failed to save category image", err);
      handleFirestoreError(err, OperationType.WRITE, 'site_settings/categories');
    } finally {
      setIsUploadingCategory(null);
    }
  };

  const processFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    // Use current states inside the async loop
    let currentPhoto = photo;
    let currentMediaText = mediaUrlsText;

    // Filter for images only
    const imageFiles = fileArray.filter(f => f.type.startsWith('image/'));
    
    for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        try {
            // Resize to 800px for good quality but safe and compact payload in firestore
            const resized = await resizeImage(file, 800, 800);
            
            if (!currentPhoto && i === 0) {
                currentPhoto = resized;
                setPhoto(resized);
            } else {
                const urls = currentMediaText.split('\n').filter(u => u.trim().length > 0);
                urls.push(resized);
                currentMediaText = urls.join('\n');
                setMediaUrlsText(currentMediaText);
            }
        } catch (err) {
            console.error("Error processing file", file.name, err);
        }
    }
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
      await processFiles(e.dataTransfer.files);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processFiles(e.target.files);
    }
  };

  const handleOpenNewDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setForm({ title: '', description: '', category: '', isPublic: true });
    setPhoto(null);
    setMediaUrlsText("");
    setEditingId(null);
  };

  const handleEdit = (item: any) => {
    setForm({ 
      title: item.title || '', 
      description: item.description || '', 
      category: item.category || '', 
      isPublic: item.isPublic ?? true 
    });
    setPhoto(item.photoUrl || null);
    setMediaUrlsText(item.mediaUrls ? item.mediaUrls.join('\n') : "");
    setEditingId(item.id);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || isSaving) return;
    setIsSaving(true);
    
    const parsedMediaUrls = mediaUrlsText.split('\n').map(u => u.trim()).filter(u => u.length > 0);

    const docData: any = {
      ...form,
      updatedAt: Date.now()
    };
    if (photo) docData.photoUrl = photo;
    if (parsedMediaUrls.length > 0) {
      docData.mediaUrls = parsedMediaUrls;
    } else {
      docData.mediaUrls = [];
    }

    try {
      if (editingId) {
        await updateDoc(doc(db, 'portfolio', editingId), docData);
        showToast("Projeto atualizado com sucesso!", "success");
      } else {
        docData.userId = user.uid;
        docData.createdAt = Date.now();
        await addDoc(collection(db, 'portfolio'), docData);
        showToast("Projeto publicado com sucesso!", "success");
      }
      setIsDialogOpen(false);
      resetForm();
    } catch(err: any) {
      console.error("Failed to save portfolio project:", err);
      let errMsg = "Erro ao salvar projeto no portfólio.";
      const errorStr = err?.message || err?.toString() || "";
      const errorCode = err?.code || "";
      
      if (errorStr.toLowerCase().includes("quota") || errorCode.toLowerCase().includes("quota")) {
        errMsg = "Cota diária do banco de dados excedida ou as imagens são grandes demais. Reduza o número de fotos.";
      } else if (errorStr.toLowerCase().includes("permission") || errorCode.toLowerCase().includes("permission")) {
        errMsg = "Acesso negado. Certifique-se de que a descrição tem até 5000 caract. e o título até 200 caract.";
      } else if (errorStr.toLowerCase().includes("large") || errorStr.toLowerCase().includes("size") || errorCode.toLowerCase().includes("large")) {
        errMsg = "Tamanho do documento excedido. Use imagens menores ou diminua a quantidade de fotos.";
      } else if (errorStr) {
        errMsg = `Erro: ${errorStr}`;
      }
      showToast(errMsg, "error");
      
      try {
        handleFirestoreError(err, editingId ? OperationType.UPDATE : OperationType.CREATE, 'portfolio');
      } catch (inner) {
        // preserve flow, letting user stay on dialog to retry/correct
      }
    } finally {
      setIsSaving(false);
    }
  };

  const toggleVisibility = async (id: string, current: boolean) => {
    try {
      await updateDoc(doc(db, 'portfolio', id), { isPublic: !current, updatedAt: Date.now() });
      showToast(`Projeto alterado para ${!current ? 'Público' : 'Oculto'}`, "success");
    } catch(err) {
      showToast("Não foi possível alterar a visibilidade do projeto.", "error");
      try {
        handleFirestoreError(err, OperationType.UPDATE, 'portfolio');
      } catch (inner) {}
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este projeto?")) return;
    try { 
      await deleteDoc(doc(db, 'portfolio', id)); 
      showToast("Projeto excluído com sucesso!", "success");
    } catch(err) { 
      showToast("Erro ao excluir o projeto.", "error");
      try {
        handleFirestoreError(err, OperationType.DELETE, 'portfolio');
      } catch (inner) {}
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Gestão do Site" 
        description="Gerencie as fotos e projetos que seus clientes veem."
        action={
          activeTab === 'projects' && (
            <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if(!open) resetForm(); }}>
              <DialogTrigger 
                render={
                  <Button size="lg" className="shadow-lg shadow-blue-600/20"><Plus className="w-4 h-4 mr-2" /> Adicionar Projeto</Button>
                }
              />
              <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
                <DialogHeader><DialogTitle className="text-2xl font-bold">{editingId ? "Editar Projeto" : "Novo Projeto no Portfólio"}</DialogTitle></DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-5 pt-4">
                  <div className="space-y-2"><Label className="text-sm font-bold">Título do Projeto *</Label><Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Ex: Reforma Elétrica Apartamento X" required /></div>
                  <div className="space-y-2"><Label className="text-sm font-bold">Categoria</Label><Input value={form.category} onChange={e => setForm({...form, category: e.target.value})} placeholder="Ex: Elétrica Residencial" /></div>
                  <div className="space-y-2"><Label className="text-sm font-bold">Descrição</Label><Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Conte detalhes sobre o serviço realizado..." className="min-h-[100px]" /></div>
                  <div className="space-y-2">
                    <Label className="text-sm font-bold">Foto Principal e Galeria</Label>
                    <div className="flex flex-col gap-4">
                      <div 
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        className={cn(
                          "border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center relative overflow-hidden group transition-all duration-300",
                          isDragging ? "border-primary bg-primary/5 scale-[1.02] shadow-xl" : "border-slate-200 bg-slate-50",
                          photo ? "p-2" : "py-10"
                        )}
                      >
                        {photo ? (
                          <div className="relative w-full h-48">
                             <img src={photo} className="w-full h-full object-contain rounded-xl" />
                             <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity flex-col gap-2">
                                <ImageIcon className="w-8 h-8 text-white" />
                                <span className="text-[10px] text-white font-black uppercase tracking-widest">Alterar Foto</span>
                             </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center pointer-events-none">
                            <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center mb-4 text-slate-400 group-hover:text-primary transition-colors">
                               <Plus className={cn("w-8 h-8 transition-transform", isDragging && "rotate-45")} />
                            </div>
                            <p className="text-sm text-slate-600 font-black tracking-tight">Solte suas fotos aqui</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Ou clique para selecionar múltiplos arquivos</p>
                          </div>
                        )}
                        <input 
                            type="file" 
                            accept="image/*" 
                            multiple 
                            onChange={handlePhotoUpload} 
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" 
                        />
                      </div>
                    </div>
                  </div>
                  <div className="pt-4 border-t space-y-3">
                    <Label className="text-sm font-bold">Links Adicionais (Fotos/Vídeos)</Label>
                    <Textarea 
                      value={mediaUrlsText} 
                      onChange={e => setMediaUrlsText(e.target.value)} 
                      placeholder="Cole um link por linha (Instagram, YouTube...)" 
                      className="min-h-[80px] bg-slate-50"
                    />
                  </div>
                  <Button type="submit" size="lg" className="w-full font-bold" disabled={isSaving}>
                    {isSaving ? "Enviando..." : editingId ? "Salvar Alterações" : "Publicar Projeto"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )
        }
      />

      <div className="flex p-1.5 bg-white border border-slate-200 w-max rounded-2xl mb-6 shadow-xs">
         <button onClick={() => setActiveTab('projects')} className={cn("px-6 py-2.5 rounded-xl text-sm font-black transition-all", activeTab === 'projects' ? "bg-[#EAB308] text-slate-950 shadow-sm" : "text-slate-600 hover:text-slate-900")}>MEUS PROJETOS</button>
         <button onClick={() => setActiveTab('categories')} className={cn("px-6 py-2.5 rounded-xl text-sm font-black transition-all", activeTab === 'categories' ? "bg-[#EAB308] text-slate-950 shadow-sm" : "text-slate-600 hover:text-slate-900")}>CAPAS DOS SERVIÇOS</button>
      </div>

      {activeTab === 'projects' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {items.map((item, idx) => (
              <motion.div 
                key={item.id} 
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: idx * 0.05 }}
                className="group bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:border-[#EAB308] hover:shadow-md transition-all text-slate-900"
              >
                <div className="aspect-[4/3] w-full bg-slate-100 relative overflow-hidden">
                  {item.photoUrl ? (
                    <img src={item.photoUrl} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                  ) : (item.mediaUrls && item.mediaUrls.length > 0) ? (
                    <img src={item.mediaUrls[0]} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex items-center justify-center w-full h-full text-slate-400"><ImageIcon className="w-12 h-12" /></div>
                  )}
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent pointer-events-none" />
                  
                  <div className="absolute top-3 right-3 flex gap-2 z-10">
                     <Button variant="secondary" size="icon" className="h-9 w-9 bg-white/90 border border-slate-200 text-slate-800 rounded-xl shadow-sm hover:bg-slate-50 hover:scale-105 transition-all" onClick={() => handleEdit(item)}>
                        <Edit className="w-4 h-4 text-[#ca8a04]" />
                     </Button>
                     <Button variant="secondary" size="icon" className={`h-9 w-9 bg-white/90 border border-slate-200 rounded-xl shadow-sm hover:bg-slate-50 hover:scale-105 transition-all ${item.isPublic ? 'text-emerald-600' : 'text-slate-400'}`} onClick={() => toggleVisibility(item.id, item.isPublic)}>
                        {item.isPublic ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                     </Button>
                     <Button variant="destructive" size="icon" className="h-9 w-9 rounded-xl shadow-sm hover:scale-105 transition-all bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="w-4 h-4" />
                     </Button>
                  </div>

                  {(item.mediaUrls?.length > 0) && (
                    <div className="absolute bottom-3 left-3 bg-white/90 border border-slate-200 backdrop-blur-md text-[#ca8a04] text-[10px] uppercase font-black px-3 py-1 rounded-full flex items-center gap-1.5 shadow-xs">
                      <Camera className="w-3 h-3" /> +{item.mediaUrls.length} Mídias
                    </div>
                  )}
                </div>
                <div className="p-5">
                   <div className="text-[10px] font-black text-[#ca8a04] uppercase tracking-widest mb-1.5">{item.category || 'Sem Categoria'}</div>
                   <h3 className="font-black text-slate-900 text-lg mb-2 leading-tight group-hover:text-[#ca8a04] transition-colors">{item.title}</h3>
                   <p className="text-slate-500 text-sm line-clamp-2 font-medium mb-1">{item.description}</p>
                   
                   <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <button 
                          onClick={() => toggleVisibility(item.id, item.isPublic)}
                          className={`text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 py-1 px-2.5 rounded-full border transition-all ${
                            item.isPublic 
                              ? 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100' 
                              : 'text-slate-500 bg-slate-50 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${item.isPublic ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                          {item.isPublic ? 'Público no Site' : 'Oculto / Rascunho'}
                        </button>
                        <span className="text-[9px] text-slate-400 font-mono">ID: {item.id.slice(0, 5)}</span>
                      </div>
                      
                      <div className="flex gap-2 pt-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="flex-1 h-9 text-[11px] font-black uppercase tracking-tight text-[#ca8a04] hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl"
                          onClick={() => window.open('/portfolio', '_blank')}
                        >
                          <ExternalLink className="w-3.5 h-3.5 mr-1 shrink-0" /> Ver Site
                        </Button>
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          className="flex-1 h-9 text-[11px] font-black uppercase tracking-tight text-[#ca8a04] hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl"
                          onClick={() => handleEdit(item)}
                        >
                          <Edit className="w-3.5 h-3.5 mr-1 shrink-0" /> Editar
                        </Button>
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          className="flex-1 h-9 text-[11px] font-black uppercase tracking-tight text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1 shrink-0" /> Excluir
                        </Button>
                      </div>
                   </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-8 border border-slate-200 text-slate-900 shadow-sm">
           <h3 className="text-xl font-black text-slate-900 mb-6">Personalizar Capas das Categorias</h3>
           <p className="text-sm text-slate-500 mb-8 max-w-2xl">Aqui você pode subir fotos reais dos seus serviços para as 8 categorias principais do site. Essas fotos nunca serão bloqueadas por redes externas.</p>
           
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { id: '1', name: 'Cercas Eletrificadas' },
                { id: '2', name: 'Instalação de Concertinas' },
                { id: '3', name: 'Projetos Elétricos' },
                { id: '4', name: 'Reparos Elétricos' },
                { id: '5', name: 'Automatizadores' },
                { id: '6', name: 'Sistemas de CFTV' },
                { id: '7', name: 'Controle de Acesso' },
                { id: '8', name: 'Instalações Elétricas' },
              ].map((category) => (
                <div key={category.id} className="space-y-3">
                   <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{category.name}</Label>
                   <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-50 border-2 border-dashed border-slate-200 group">
                      {categoryPhotos[category.id] ? (
                        <img src={categoryPhotos[category.id]} className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400">
                           {isUploadingCategory === category.id ? (
                             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#EAB308]"></div>
                           ) : (
                             <>
                               <ImageIcon className="w-8 h-8 mb-1" />
                               <span className="text-[10px] font-bold italic tracking-tight">Sem Imagem Real</span>
                             </>
                           )}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all cursor-pointer">
                         {isUploadingCategory === category.id ? (
                           <span className="text-white text-[10px] font-black uppercase tracking-widest">Enviando...</span>
                         ) : (
                           <>
                             <span className="text-white text-[10px] font-black uppercase tracking-widest">Alterar Foto</span>
                             <input 
                               type="file" 
                               accept="image/*" 
                               className="absolute inset-0 opacity-0 cursor-pointer" 
                               onChange={(e) => {
                                 if(e.target.files?.[0]) handleCategoryPhotoUpload(category.id, e.target.files[0]);
                               }}
                             />
                           </>
                         )}
                      </div>
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}
    {/* Visual Toast Notification for Actions */}
      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.2 } }}
            className={`fixed bottom-10 right-6 z-50 max-w-sm w-full text-white border border-white/10 p-4 rounded-2xl shadow-2xl flex items-center gap-3 font-sans ${
              toast.type === 'success' ? 'bg-slate-900 border-emerald-500/20' : 'bg-rose-950 border-rose-500/20'
            }`}
            role="alert"
          >
            <div className={`p-2 rounded-xl shrink-0 ${toast.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
              <CheckCheck className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className={`text-xs font-black uppercase tracking-widest leading-none mb-1 ${
                toast.type === 'success' ? 'text-emerald-400' : 'text-rose-400'
              }`}>{toast.type === 'success' ? 'Sucesso' : 'Erro'}</p>
              <p className="text-sm font-semibold leading-tight text-white">{toast.message}</p>
            </div>
            <button 
              type="button"
              onClick={() => setToast(prev => ({ ...prev, show: false }))}
              className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer text-xs"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence></div>
      

  );
}
