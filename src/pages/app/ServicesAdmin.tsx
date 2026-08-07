import React from 'react';
import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../components/AuthProvider';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Plus, Trash2, Edit } from 'lucide-react';
import { Textarea } from '../../components/ui/textarea';
import { OperationType, handleFirestoreError } from '../../lib/error';

export default function ServicesAdmin() {
  const { user } = useAuth();
  const [services, setServices] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', description: '', price: '' });

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(query(collection(db, 'services'), where('userId', '==', user.uid)), 
      snap => setServices(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      err => handleFirestoreError(err, OperationType.GET, 'services')
    );
    return () => unsub();
  }, [user]);

  const handleOpenNewDialog = () => {
    setEditingId(null);
    setForm({ name: '', description: '', price: '' });
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (service: any) => {
    setEditingId(service.id);
    setForm({ name: service.name, description: service.description || '', price: service.price?.toString() || '' });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsDialogOpen(false);
    try {
      if (editingId) {
        await updateDoc(doc(db, 'services', editingId), {
          name: form.name,
          description: form.description,
          price: Number(form.price) || 0,
          updatedAt: Date.now()
        });
      } else {
        await addDoc(collection(db, 'services'), {
          userId: user.uid,
          name: form.name,
          description: form.description,
          price: Number(form.price) || 0,
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
      }
      setEditingId(null);
      setForm({ name: '', description: '', price: '' });
    } catch(err) { handleFirestoreError(err, editingId ? OperationType.UPDATE : OperationType.CREATE, 'services'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
           <h1 className="text-2xl font-black text-slate-900 italic tracking-tight uppercase">Serviços Catálogo</h1>
           <p className="text-slate-500 text-sm">O que você faz? Isso aparecerá no seu site público.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={<Button onClick={handleOpenNewDialog} className="bg-[#EAB308] hover:bg-[#ca8a04] text-slate-950 font-black uppercase italic tracking-wider h-12 px-6 rounded-2xl shadow-md"><Plus className="w-4 h-4 mr-2" /> Cadastrar Serviço</Button>} />
          <DialogContent className="bg-white border-slate-200 text-slate-900 rounded-3xl p-6 shadow-xl">
            <DialogHeader><DialogTitle className="text-xl font-black text-[#ca8a04] uppercase italic">{editingId ? "Editar Serviço" : "Novo Serviço"}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div><Label className="text-xs font-bold text-slate-700">Nome do Serviço *</Label><Input className="h-12 bg-slate-50 border-slate-200 text-slate-900 rounded-xl focus:ring-[#EAB308]" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
              <div><Label className="text-xs font-bold text-slate-700">Descrição</Label><Textarea className="bg-slate-50 border-slate-200 text-slate-900 rounded-xl focus:ring-[#EAB308] min-h-[100px]" value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
              <div><Label className="text-xs font-bold text-slate-700">Preço Base (Opcional)</Label><Input className="h-12 bg-slate-50 border-slate-200 text-slate-900 rounded-xl focus:ring-[#EAB308]" type="number" step="0.01" value={form.price} onChange={e => setForm({...form, price: e.target.value})} /></div>
              <Button type="submit" className="w-full bg-[#EAB308] hover:bg-[#ca8a04] text-slate-950 font-black uppercase italic h-12 rounded-xl shadow-md mt-2">{editingId ? "Salvar Alterações" : "Cadastrar"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map(s => (
          <div key={s.id} className="bg-white rounded-2xl shadow-xs border border-slate-200 p-5 flex flex-col justify-between hover:border-[#EAB308] hover:shadow-md transition-all text-slate-900">
            <div>
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-black text-slate-900 text-lg tracking-tight">{s.name}</h3>
                <div className="flex space-x-1 -mt-1 -mr-1">
                  <Button variant="ghost" size="sm" className="text-[#ca8a04] hover:text-slate-900 hover:bg-slate-100 rounded-lg" onClick={() => handleOpenEditDialog(s)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg" onClick={async () => {
                     if(confirm('Tem certeza que deseja excluir?')) {
                       try { await deleteDoc(doc(db, 'services', s.id)); } catch(e) { handleFirestoreError(e, OperationType.DELETE, 'services'); }
                     }
                  }}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
              <p className="text-sm text-slate-500 font-medium mb-4 leading-relaxed">{s.description}</p>
            </div>
            {s.price > 0 && <div className="font-black text-[#ca8a04] text-base pt-3 border-t border-slate-100">A partir de R$ {s.price.toFixed(2).replace('.', ',')}</div>}
          </div>
        ))}
        {services.length === 0 && <div className="col-span-full py-16 border-2 border-dashed border-slate-200 bg-white rounded-3xl text-center text-slate-400 font-bold uppercase tracking-wider text-xs">Nenhum serviço cadastrado.</div>}
      </div>
    </div>
  );
}
