import React from 'react';
import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../components/AuthProvider';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Plus, Trash2, Edit, User, Phone, Mail, MapPin, Search, ChevronDown, ChevronUp, History, FileText, Zap, CheckCheck, X } from 'lucide-react';
import { OperationType, handleFirestoreError } from '../../lib/error';
import { PageHeader } from '../../components/PageHeader';
import { motion, AnimatePresence } from 'motion/react';

function ClientHistory({ clientId, userId }: { clientId: string, userId: string }) {
  const [quotes, setQuotes] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId || !clientId) return;
    
    // Fetch quotes
    const qQuotes = query(
      collection(db, 'quotes'), 
      where('userId', '==', userId),
      where('clientId', '==', clientId)
    );
    const unsubQuotes = onSnapshot(qQuotes, snap => {
      setQuotes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, err => handleFirestoreError(err, OperationType.GET, 'quotes'));

    // Fetch orders
    const qOrders = query(
      collection(db, 'serviceOrders'), 
      where('userId', '==', userId),
      where('clientId', '==', clientId)
    );
    const unsubOrders = onSnapshot(qOrders, snap => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, err => handleFirestoreError(err, OperationType.GET, 'serviceOrders'));

    return () => { unsubQuotes(); unsubOrders(); };
  }, [clientId, userId]);

  if (loading) return <div className="py-8 text-center text-xs text-slate-400">Carregando histórico...</div>;

  return (
    <div className="pt-6 space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-3">
          <History className="w-3.5 h-3.5 text-[#EAB308]" />
          <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Orçamentos</h4>
        </div>
        {quotes.length > 0 ? (
          <div className="space-y-2">
            {quotes.map(q => (
              <div key={q.id} className="p-3 bg-[#0B0F19] border border-slate-800 rounded-xl">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[11px] font-bold text-white truncate flex-1 mr-2">{q.description}</span>
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                    q.status === 'approved' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 
                    q.status === 'rejected' ? 'bg-rose-950 text-rose-400 border border-rose-800' : 'bg-amber-950 text-amber-400 border border-amber-800'
                  }`}>
                    R$ {Number(q.totalAmount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="text-[9px] text-slate-400 font-medium">
                  {new Date(q.createdAt).toLocaleDateString('pt-BR')}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-xl border border-dashed border-slate-800 flex flex-col items-center justify-center bg-[#0B0F19]">
            <FileText className="w-6 h-6 text-slate-600 mb-1" />
            <p className="text-[10px] text-slate-400 font-medium">Nenhum orçamento.</p>
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-3.5 h-3.5 text-[#EAB308]" />
          <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ordens de Serviço</h4>
        </div>
        {orders.length > 0 ? (
          <div className="space-y-2">
            {orders.map(o => (
              <div key={o.id} className="p-3 bg-[#0B0F19] border border-slate-800 rounded-xl">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[11px] font-bold text-white truncate flex-1 mr-2">{o.description}</span>
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                    o.status === 'completed' ? 'bg-blue-950 text-blue-400 border border-blue-800' : 
                    o.status === 'in_progress' ? 'bg-indigo-950 text-indigo-400 border border-indigo-800' : 'bg-amber-950 text-amber-400 border border-amber-800'
                  }`}>
                    {o.status === 'completed' ? 'Concluído' : o.status === 'in_progress' ? 'Em Andamento' : 'Agendado'}
                  </span>
                </div>
                <div className="text-[9px] text-slate-400 font-medium">
                  {new Date(o.createdAt).toLocaleDateString('pt-BR')}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-xl border border-dashed border-slate-800 flex flex-col items-center justify-center bg-[#0B0F19]">
            <Zap className="w-6 h-6 text-slate-600 mb-1" />
            <p className="text-[10px] text-slate-400 font-medium">Nenhuma OS.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Clients() {
  const { user } = useAuth();
  const [clients, setClients] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
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
    const unsub = onSnapshot(query(collection(db, 'clients'), where('userId', '==', user.uid)), 
      snap => {
        setClients(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      },
      err => handleFirestoreError(err, OperationType.GET, 'clients')
    );
    return () => unsub();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      const docData = {
        ...form,
        updatedAt: Date.now()
      };
      
      if (editingId) {
        await updateDoc(doc(db, 'clients', editingId), docData);
        showToast(`Cliente "${form.name}" atualizado com sucesso!`);
      } else {
        await addDoc(collection(db, 'clients'), {
          userId: user.uid,
          ...docData,
          createdAt: Date.now(),
        });
        showToast(`Cliente "${form.name}" cadastrado com sucesso!`);
      }
      setIsDialogOpen(false);
      resetForm();
    } catch(err: any) {
      console.error(err);
      showToast(err?.message || "Erro de permissão ou dados inválidos ao salvar cliente.", "error");
    }
  };

  const handleEdit = (client: any) => {
    setForm({ name: client.name, phone: client.phone || '', email: client.email || '', address: client.address || '' });
    setEditingId(client.id);
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setForm({ name: '', phone: '', email: '', address: '' });
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este cliente? Esta ação não pode ser desfeita.")) return;
    try { 
      await deleteDoc(doc(db, 'clients', id)); 
      showToast("Cliente excluído permanentemente.");
    } catch(err: any) { 
      console.error(err);
      showToast("Erro ao excluir cliente: Permissão negada.", "error");
    }
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone?.includes(searchTerm) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Clientes" 
        description="Gerencie seus contatos e informações dos clientes."
        action={
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger 
              render={
                <Button size="lg" className="bg-[#EAB308] hover:bg-[#ca8a04] text-[#0B0F19] font-black uppercase tracking-widest text-xs h-14 px-6 rounded-2xl shadow-xl shadow-[#EAB308]/20 italic"><Plus className="w-5 h-5 mr-2" /> Novo Cliente</Button>
              }
            />
            <DialogContent className="sm:max-w-[425px] bg-[#1E293B] border-slate-800 text-white rounded-[2rem]">
              <DialogHeader><DialogTitle className="text-2xl font-black italic tracking-tighter uppercase text-white">{editingId ? 'Editar Cliente' : 'Cadastrar Cliente'}</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-5 pt-4">
                <div className="space-y-2"><Label className="text-xs font-bold text-slate-300">Nome Completo *</Label><Input className="h-12 bg-[#0B0F19] border-slate-800 text-white rounded-xl focus:ring-[#EAB308]" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Ex: João Silva" required /></div>
                <div className="space-y-2"><Label className="text-xs font-bold text-slate-300">Telefone</Label><Input className="h-12 bg-[#0B0F19] border-slate-800 text-white rounded-xl focus:ring-[#EAB308]" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="(00) 00000-0000" /></div>
                <div className="space-y-2"><Label className="text-xs font-bold text-slate-300">E-mail</Label><Input className="h-12 bg-[#0B0F19] border-slate-800 text-white rounded-xl focus:ring-[#EAB308]" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="joao@email.com" /></div>
                <div className="space-y-2"><Label className="text-xs font-bold text-slate-300">Endereço</Label><Input className="h-12 bg-[#0B0F19] border-slate-800 text-white rounded-xl focus:ring-[#EAB308]" value={form.address} onChange={e => setForm({...form, address: e.target.value})} placeholder="Rua, Número, Bairro, Cidade" /></div>
                <Button type="submit" size="lg" className="w-full mt-4 font-black uppercase italic tracking-wider h-14 bg-[#EAB308] hover:bg-[#ca8a04] text-[#0B0F19] rounded-2xl">{editingId ? 'Salvar Alterações' : 'Cadastrar Cliente'}</Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="mb-6 relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input 
          className="pl-11 h-14 bg-[#1E293B] border-slate-800 text-white rounded-2xl placeholder:text-slate-500 focus:ring-[#EAB308]"
          placeholder="Pesquisar por nome, telefone ou e-mail..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <AnimatePresence>
          {filteredClients.map((c, idx) => (
            <motion.div 
              key={c.id} 
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-[#1E293B] rounded-3xl shadow-xl border border-slate-800 group hover:border-[#EAB308]/40 transition-all overflow-hidden"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                   <div className="h-12 w-12 rounded-2xl bg-[#0B0F19] border border-slate-800 text-[#EAB308] flex items-center justify-center">
                      <User className="w-6 h-6" />
                   </div>
                   <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-10 w-10 text-slate-400 hover:text-white hover:bg-[#0B0F19] border-slate-800 rounded-xl transition-all cursor-pointer flex items-center justify-center shrink-0 bg-[#0B0F19]" 
                        onClick={() => handleEdit(c)}
                        id={`edit-client-btn-${c.id}`}
                        title="Editar Cliente"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-10 w-10 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 border-slate-800 rounded-xl transition-all cursor-pointer flex items-center justify-center shrink-0 bg-[#0B0F19]" 
                        onClick={() => handleDelete(c.id)}
                        id={`delete-client-btn-${c.id}`}
                        title="Excluir Cliente"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                   </div>
                </div>
                
                <h3 className="font-black text-white text-lg leading-tight mb-4">{c.name}</h3>
                
                <div className="space-y-3">
                   {c.phone && <div className="flex items-center gap-3 text-sm text-slate-300">
                      <Phone className="w-4 h-4 text-slate-500" /> <span className="font-medium">{c.phone}</span>
                   </div>}
                   {c.email && <div className="flex items-center gap-3 text-sm text-slate-300">
                      <Mail className="w-4 h-4 text-slate-500" /> <span className="font-medium truncate">{c.email}</span>
                   </div>}
                   {c.address && <div className="flex items-start gap-3 text-sm text-slate-300">
                      <MapPin className="w-4 h-4 text-slate-500 mt-0.5" /> <span className="font-medium">{c.address}</span>
                   </div>}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between items-center">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-[#EAB308] hover:text-[#ca8a04] hover:bg-[#0B0F19] font-bold text-xs"
                    onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                  >
                    {expandedId === c.id ? (
                      <>Ocultar Histórico <ChevronUp className="w-4 h-4 ml-1" /></>
                    ) : (
                      <>Ver Histórico <ChevronDown className="w-4 h-4 ml-1" /></>
                    )}
                  </Button>
                </div>

                <AnimatePresence>
                  {expandedId === c.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <ClientHistory clientId={c.id} userId={user?.uid || ''} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {filteredClients.length === 0 && (
           <div className="col-span-full py-12 text-center bg-[#1E293B] border-2 border-dashed border-slate-800 rounded-3xl text-slate-400">
             Nenhum cliente encontrado.
           </div>
        )}
      </div>

      {/* Visual Toast Notification for Client Actions */}
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
      </AnimatePresence>
    </div>
  );
}
