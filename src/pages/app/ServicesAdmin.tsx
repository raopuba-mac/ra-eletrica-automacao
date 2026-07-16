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
           <h1 className="text-2xl font-bold">Serviços</h1>
           <p className="text-slate-500 text-sm">O que você faz? Isso aparecerá na sua página web.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <Button onClick={handleOpenNewDialog}><Plus className="w-4 h-4 mr-2" /> Cadastrar Serviço</Button>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingId ? "Editar Serviço" : "Novo Serviço"}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><Label>Nome do Serviço *</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
              <div><Label>Descrição</Label><Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
              <div><Label>Preço Base (Opcional)</Label><Input type="number" step="0.01" value={form.price} onChange={e => setForm({...form, price: e.target.value})} /></div>
              <Button type="submit" className="w-full">{editingId ? "Salvar Alterações" : "Cadastrar"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map(s => (
          <div key={s.id} className="bg-white rounded-xl shadow-sm border p-4 flex flex-col">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-slate-900">{s.name}</h3>
              <div className="flex space-x-1 -mt-2 -mr-2">
                <Button variant="ghost" size="sm" className="text-slate-500" onClick={() => handleOpenEditDialog(s)}>
                  <Edit className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className="text-red-500" onClick={async () => {
                   if(confirm('Tem certeza que deseja excluir?')) {
                     try { await deleteDoc(doc(db, 'services', s.id)); } catch(e) { handleFirestoreError(e, OperationType.DELETE, 'services'); }
                   }
                }}><Trash2 className="w-4 h-4" /></Button>
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-4">{s.description}</p>
            {s.price > 0 && <div className="font-medium text-blue-600 flex-1 flex items-end">A partir de R$ {s.price.toFixed(2).replace('.', ',')}</div>}
          </div>
        ))}
         {services.length === 0 && <div className="col-span-full py-12 border-2 border-dashed rounded-xl text-center text-slate-500">Nenhum serviço cadastrado.</div>}
      </div>
    </div>
  );
}
