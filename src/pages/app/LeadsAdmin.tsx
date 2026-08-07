import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, deleteDoc, doc, updateDoc, setDoc, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../components/AuthProvider';
import { Button } from '../../components/ui/button';
import { Trash2, MessageCircle, MapPin, Mail, Phone, Calendar, CheckCheck, User, Edit, X, Plus } from 'lucide-react';
import { OperationType, handleFirestoreError } from '../../lib/error';
import { format } from 'date-fns';
import { PageHeader } from '../../components/PageHeader';
import { motion, AnimatePresence } from 'motion/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';

export default function LeadsAdmin() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<any[]>([]);
  const [editingLead, setEditingLead] = useState<any | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });

  const STATUS_LABELS: Record<string, string> = {
    new: 'Novo',
    contacted: 'Lido',
    converted: 'Convertido',
    archived: 'Arquivado'
  };

  useEffect(() => {
    if (!toast.show) return;
    const timer = setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast.show]);

  const showSuccessToast = (message: string) => {
    setToast({ show: true, message, type: 'success' });
  };

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(query(collection(db, 'leads'), where('userId', '==', user.uid)), 
      snap => {
        const lds = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        lds.sort((a: any, b: any) => b.createdAt - a.createdAt);
        setLeads(lds);
        setLoading(false);
      },
      (err: any) => {
        handleFirestoreError(err, OperationType.GET, 'leads');
        setLoading(false);
      }
    );
    return () => unsub();
  }, [user]);

  const updateStatus = async (id: string, status: string) => {
    try { 
      await updateDoc(doc(db, 'leads', id), { status, updatedAt: Date.now() }); 
      const label = STATUS_LABELS[status] || status;
      showSuccessToast(`Status do lead atualizado para "${label}"!`);
    } catch(err: any) { 
      handleFirestoreError(err, OperationType.UPDATE, 'leads'); 
    }
  };

  const convertToClient = async (lead: any) => {
    try {
      const clientId = doc(collection(db, 'clients')).id;
      const clientData = {
        userId: user?.uid,
        name: lead.name,
        phone: lead.phone,
        email: lead.email || '',
        address: lead.address || '',
        notes: `Convertido de lead do site. Serviço solicitado: ${lead.serviceType || 'Nenhum'}`,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      await setDoc(doc(db, 'clients', clientId), clientData);
      await updateDoc(doc(db, 'leads', lead.id), { 
        status: 'converted', 
        updatedAt: Date.now() 
      });
      showSuccessToast(`Lead "${lead.name}" convertido em cliente com sucesso!`);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.WRITE, 'clients');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLead) return;
    
    try {
      const { id, ...data } = editingLead;
      await updateDoc(doc(db, 'leads', id), {
        ...data,
        updatedAt: Date.now()
      });
      setIsEditDialogOpen(false);
      setEditingLead(null);
      showSuccessToast(`Lead "${data.name}" atualizado com sucesso!`);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.UPDATE, 'leads');
    }
  };

  const handleDelete = async () => {
    if (!leadToDelete) return;
    try { 
      await deleteDoc(doc(db, 'leads', leadToDelete)); 
      setIsDeleteDialogOpen(false);
      setLeadToDelete(null);
      showSuccessToast("Lead excluído permanentemente.");
    } catch(err: any) { 
      handleFirestoreError(err, OperationType.DELETE, 'leads'); 
    }
  };

  const confirmDelete = (id: string) => {
    setLeadToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const openEdit = (lead: any) => {
    setEditingLead({ ...lead });
    setIsEditDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Leads do Site" 
        description="Contatos recebidos através do formulário do seu site."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AnimatePresence>
          {loading ? (
            <div className="col-span-full py-20 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
              <p className="text-slate-400 font-medium">Carregando seus contatos...</p>
            </div>
          ) : leads.map((lead, idx) => (
            <motion.div 
              key={lead.id} 
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: idx * 0.05 }}
              className={`bg-white rounded-2xl shadow-xs border overflow-hidden flex flex-col group transition-all hover:border-[#EAB308] hover:shadow-md ${lead.status === 'new' ? 'ring-2 ring-[#EAB308] border-slate-200' : 'border-slate-200'}`}
            >
              <div className="p-6 flex-1 text-slate-900">
                 <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-3">
                       <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${lead.status === 'new' ? 'bg-[#EAB308] text-slate-950 shadow-md font-black' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                          <User className="w-6 h-6" />
                       </div>
                       <div>
                          <h3 className="font-black text-slate-900 text-lg leading-tight">{lead.name}</h3>
                          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1 mt-1">
                             <Calendar className="w-3 h-3 text-[#ca8a04]" /> {lead.createdAt ? format(lead.createdAt, 'dd/MM/yyyy HH:mm') : 'Data não disponível'}
                          </div>
                       </div>
                    </div>
                    {lead.status === 'new' ? (
                      <span className="bg-[#EAB308] text-slate-950 text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest animate-pulse">Novo</span>
                    ) : (
                      <div className="flex flex-col items-end gap-1">
                        <span className="bg-slate-100 border border-slate-200 text-slate-700 text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest flex items-center gap-1">
                          <CheckCheck className="w-3 h-3 text-emerald-600" /> {lead.status === 'contacted' ? 'Lido' : lead.status === 'converted' ? 'Convertido' : 'Arquivado'}
                        </span>
                      </div>
                    )}
                 </div>

                 <div className="space-y-3 mb-6">
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start gap-3">
                      <MessageCircle className="w-5 h-5 text-[#ca8a04] mt-0.5 shrink-0" /> 
                      <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Serviço Solicitado</p>
                        <p className="font-bold text-slate-900">{lead.serviceType || 'Não especificado'}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <a 
                       href={`https://wa.me/${lead.phone?.replace(/\D/g, '')}`} 
                       target="_blank" 
                       rel="noreferrer" 
                       className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 transition-all group/link"
                      >
                        <Phone className="w-4 h-4 text-emerald-600 group-hover/link:animate-bounce" /> 
                        <span className="text-sm font-bold text-slate-800 group-hover/link:text-emerald-700">{lead.phone}</span>
                      </a>
                      
                      {lead.email && (
                        <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50">
                          <Mail className="w-4 h-4 text-slate-400" /> 
                          <span className="text-sm font-medium text-slate-700 truncate">{lead.email}</span>
                        </div>
                      )}
                    </div>

                    {lead.address && (
                      <div className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50">
                        <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" /> 
                        <span className="text-sm font-medium text-slate-700 leading-relaxed">{lead.address}</span>
                      </div>
                    )}
                 </div>
              </div>
              <div className="bg-slate-50 p-4 px-6 border-t border-slate-200 flex items-center justify-between">
                 <div className="flex flex-wrap gap-2">
                    {lead.status === 'new' && (
                      <Button 
                       variant="outline" 
                       size="sm" 
                       onClick={() => updateStatus(lead.id, 'contacted')}
                       className="bg-white border-slate-200 hover:bg-slate-100 text-slate-900 font-bold text-xs h-8"
                      >
                        <CheckCheck className="w-3 h-3 mr-1 text-emerald-600" /> Marcar como Lido
                      </Button>
                    )}
                    {lead.status === 'contacted' && (
                      <Button 
                       variant="outline" 
                       size="sm" 
                       onClick={() => convertToClient(lead)}
                       className="bg-white border-slate-200 hover:bg-slate-100 text-slate-900 font-bold text-xs h-8"
                      >
                        <Plus className="w-3 h-3 mr-1 text-[#ca8a04]" /> Virou Cliente
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="text-slate-600 hover:text-[#ca8a04] h-8 font-bold text-xs" onClick={() => openEdit(lead)}>
                      <Edit className="w-3.5 h-3.5 mr-1" /> Editar
                    </Button>
                 </div>
                 <Button variant="ghost" size="icon" className="text-slate-400 hover:text-rose-600 transition-colors h-8 w-8" onClick={() => confirmDelete(lead.id)}>
                    <Trash2 className="w-4 h-4" />
                 </Button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
         {leads.length === 0 && (
           <motion.div 
             initial={{ opacity: 0 }} 
             animate={{ opacity: 1 }} 
             className="col-span-full py-20 border-2 border-dashed border-slate-200 bg-white rounded-3xl text-center"
           >
             <MessageCircle className="w-12 h-12 text-[#ca8a04] opacity-80 mx-auto mb-4" />
             <h3 className="text-slate-900 font-black text-xl italic uppercase">Sem novos leads</h3>
             <p className="text-slate-500 text-sm mt-1">Os contatos do site aparecerão aqui.</p>
           </motion.div>
         )}
      </div>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md text-slate-900">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Confirmar Exclusão</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-slate-500 font-medium tracking-tight">Tem certeza que deseja excluir permanentemente este lead? Esta ação não pode ser desfeita.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 font-bold" onClick={() => setIsDeleteDialogOpen(false)}>Cancelar</Button>
            <Button variant="destructive" className="flex-1 font-bold" onClick={handleDelete}>Excluir Agora</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Lead</DialogTitle>
          </DialogHeader>
          {editingLead && (
            <form onSubmit={handleEditSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Nome do Cliente</Label>
                <Input 
                  value={editingLead.name} 
                  onChange={e => setEditingLead({...editingLead, name: e.target.value})}
                  required 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input 
                    value={editingLead.phone} 
                    onChange={e => setEditingLead({...editingLead, phone: e.target.value})}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select 
                    value={editingLead.status} 
                    onValueChange={val => setEditingLead({...editingLead, status: val})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">Novo</SelectItem>
                      <SelectItem value="contacted">Lido / Contatado</SelectItem>
                      <SelectItem value="converted">Convertido (Venda)</SelectItem>
                      <SelectItem value="archived">Arquivado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input 
                  value={editingLead.email || ''} 
                  onChange={e => setEditingLead({...editingLead, email: e.target.value})}
                  type="email"
                />
              </div>
              <div className="space-y-2">
                <Label>Endereço</Label>
                <Input 
                  value={editingLead.address || ''} 
                  onChange={e => setEditingLead({...editingLead, address: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Serviço Solicitado</Label>
                <Input 
                  value={editingLead.serviceType || ''} 
                  onChange={e => setEditingLead({...editingLead, serviceType: e.target.value})}
                />
              </div>
              <div className="pt-4 flex gap-3">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setIsEditDialogOpen(false)}>Cancelar</Button>
                <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">Salvar Alterações</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Visual Toast Notification for Updates */}
      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.2 } }}
            className="fixed bottom-10 right-6 z-50 max-w-sm w-full bg-slate-900 text-white border border-white/10 p-4 rounded-2xl shadow-2xl flex items-center gap-3 font-sans"
            role="alert"
          >
            <div className="bg-emerald-500/20 p-2 rounded-xl text-emerald-400 shrink-0">
              <CheckCheck className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-black text-emerald-400 uppercase tracking-widest leading-none mb-1">Sucesso</p>
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
      </AnimatePresence>
    </div>
  );
}
