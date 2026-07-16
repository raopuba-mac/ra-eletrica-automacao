import React from 'react';
import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../components/AuthProvider';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Plus, Trash2, Calendar as CalIcon, Clock, MoreVertical, CheckCircle2, Repeat, Bell } from 'lucide-react';
import { OperationType, handleFirestoreError } from '../../lib/error';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PageHeader } from '../../components/PageHeader';
import { motion, AnimatePresence } from 'motion/react';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function Agenda() {
  const { user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<{ id: string; title: string } | null>(null);
  const [form, setForm] = useState({ 
    title: '', 
    description: '', 
    date: '', 
    type: 'service',
    recurrence: 'none',
    notifyTime: 'none'
  });

  const [notificationPermission, setNotificationPermission] = useState<string>('default');

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const subscribeToPushNotifications = async (uid: string) => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn("Navegador não suporta Service Worker ou Push Manager.");
      return;
    }

    try {
      // 1. Fetch public VAPID key
      const res = await fetch('/api/notifications/vapid-public-key');
      if (!res.ok) throw new Error("Falha ao buscar chave VAPID pública");
      const { publicKey } = await res.json();
      if (!publicKey) {
        throw new Error("Não foi possível carregar a chave VAPID pública.");
      }

      // 2. Wait for Service Worker registration to be ready
      const registration = await navigator.serviceWorker.ready;

      // 3. Subscribe user to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      });

      // 4. Send subscription to server
      const subscribeRes = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subscription,
          userId: uid
        })
      });

      if (!subscribeRes.ok) {
        throw new Error("Falha ao registrar inscrição de push no servidor.");
      }

      console.log("[PWA] Inscrição de push registrada com sucesso no backend.");
    } catch (error) {
      console.error("[PWA] Erro ao assinar notificações push:", error);
    }
  };

  useEffect(() => {
    if (user && notificationPermission === 'granted') {
      subscribeToPushNotifications(user.uid);
    }
  }, [user, notificationPermission]);

  const requestNotificationPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      alert("Seu navegador não oferece suporte a notificações push de navegador.");
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === 'granted' && user) {
        await subscribeToPushNotifications(user.uid);
        new Notification("RA Elétrica & Automação", {
          body: "Ótimo! Notificações push ativadas para sua agenda de visitas técnicas.",
          icon: "/favicon.png"
        });
      }
    } catch (error) {
      console.error("Error requesting notifications permission:", error);
    }
  };

  const testPushNotification = async () => {
    if (!user) return;
    
    try {
      const response = await fetch('/api/notifications/test-push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: user.uid,
          title: "Teste RA Elétrica & Automação",
          body: "Este é um alerta push REAL em tempo real!"
        })
      });
      
      const result = await response.json();
      if (response.ok && result.sentCount > 0) {
        console.log(`[PWA] Teste de push enviado com sucesso para ${result.sentCount} dispositivo(s).`);
        return;
      }
    } catch (error) {
      console.warn("[PWA] Falha no teste de push do servidor, tentando fallback local:", error);
    }

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification("RA Elétrica & Automação (Local)", {
        body: "Lembrete de Teste (Local): Visita Técnica agendada para Renan Augusto!",
        icon: "/favicon.png"
      });
    } else {
      alert("Notificações de navegador desativadas ou bloqueadas pelo iframe. Lembrete Simulado com Sucesso: Visita Técnica Importante na agenda de Renan!");
    }
  };

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(query(collection(db, 'agenda'), where('userId', '==', user.uid)), 
      snap => {
        const evts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        evts.sort((a: any, b: any) => a.date - b.date);
        setEvents(evts);
      },
      err => handleFirestoreError(err, OperationType.GET, 'agenda')
    );
    return () => unsub();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsDialogOpen(false);
    try {
      const timestamp = new Date(form.date).getTime();
      await addDoc(collection(db, 'agenda'), {
        userId: user.uid,
        title: form.title,
        description: form.description,
        date: timestamp,
        type: form.type,
        recurrence: form.recurrence,
        notifyTime: form.notifyTime,
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
      setForm({ 
        title: '', 
        description: '', 
        date: '', 
        type: 'service', 
        recurrence: 'none', 
        notifyTime: 'none' 
      });
    } catch(err) {
      handleFirestoreError(err, OperationType.CREATE, 'agenda');
    }
  };

  const confirmDelete = async () => {
    if (!eventToDelete) return;
    try {
      await deleteDoc(doc(db, 'agenda', eventToDelete.id));
      setEventToDelete(null);
    } catch(err) {
      handleFirestoreError(err, OperationType.DELETE, 'agenda');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader 
        title="Agenda" 
        description="Organize seus serviços, visitas técnicas e lembretes com facilidade."
        action={
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger 
              render={
                <Button size="lg" className="shadow-lg shadow-blue-600/20" onClick={() => setForm({ title: '', description: '', date: '', type: 'service', recurrence: 'none', notifyTime: 'none' })}><Plus className="w-4 h-4 mr-2" /> Novo Evento</Button>
              }
            />
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader><DialogTitle className="text-2xl font-black italic uppercase tracking-tighter text-slate-900 border-b pb-2">Agendar Compromisso</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Título do Evento *</Label>
                  <Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Ex: Manutenção Elétrica ou Visita Técnica Intelbras" required className="rounded-xl border-slate-250 py-5 focus-visible:ring-blue-600" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Data e Hora *</Label>
                  <Input type="datetime-local" value={form.date} onChange={e => setForm({...form, date: e.target.value})} required className="rounded-xl border-slate-250 py-5 focus-visible:ring-blue-600" />
                </div>
                
                <div className="space-y-1.5">
                  <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Tipo de Compromisso</Label>
                  <Select onValueChange={(val) => setForm({...form, type: val})} value={form.type}>
                    <SelectTrigger className="w-full rounded-xl py-5 border-slate-250 focus:ring-blue-600"><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
                    <SelectContent>
                       <SelectItem value="service">🔧 Execução de Serviço</SelectItem>
                       <SelectItem value="visit">📋 Visita Técnica</SelectItem>
                       <SelectItem value="reminder">🔔 Lembrete</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Recorrência</Label>
                    <Select onValueChange={(val) => setForm({...form, recurrence: val})} value={form.recurrence}>
                      <SelectTrigger className="w-full rounded-xl py-5 border-slate-250"><SelectValue placeholder="Se repete?" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">🔁 Único</SelectItem>
                        <SelectItem value="daily">🔁 Diário</SelectItem>
                        <SelectItem value="weekly">🔁 Semanal</SelectItem>
                        <SelectItem value="monthly">🔁 Mensal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Notificação Push</Label>
                    <Select onValueChange={(val) => setForm({...form, notifyTime: val})} value={form.notifyTime}>
                      <SelectTrigger className="w-full rounded-xl py-5 border-slate-250"><SelectValue placeholder="Lembrar quando?" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">🔕 Desativada</SelectItem>
                        <SelectItem value="at_event">⏰ No horário</SelectItem>
                        <SelectItem value="15_min">⏱️ 15 min antes</SelectItem>
                        <SelectItem value="1_hour">⏱️ 1 hora antes</SelectItem>
                        <SelectItem value="24_hours">⏱️ 1 dia antes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Descrição (Opcional)</Label>
                  <Input value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Detalhes adicionais ou telefone do cliente..." className="rounded-xl border-slate-250 py-5" />
                </div>
                <Button type="submit" size="lg" className="w-full mt-2 font-black italic uppercase italic h-14 rounded-2xl shadow-xl shadow-blue-600/10 bg-primary hover:bg-primary/95 text-white transition-all transform hover:scale-[1.01]">Confirmar Agendamento</Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
         {/* Left Side: Bento stats and Push Trigger configs widget */}
         <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-950 text-white rounded-[2rem] p-6 relative overflow-hidden border border-white/5 shadow-2xl">
               <div className="absolute inset-0 bg-dot-pattern opacity-15"></div>
               <div className="absolute -top-12 -right-12 w-[180px] h-[180px] bg-primary/10 blur-[50px] rounded-full"></div>
               
               <div className="relative z-10 space-y-4">
                  <div className="flex items-center gap-3">
                     <div className="p-3 bg-primary/10 text-primary rounded-2xl border border-primary/20">
                        <Bell className="w-5 h-5 text-blue-400 animate-swing" />
                     </div>
                     <div>
                        <h4 className="font-extrabold text-sm tracking-tight text-white uppercase italic">Central Push</h4>
                        <span className="text-[9px] text-blue-400 font-extrabold tracking-widest uppercase">Tecnologia Smart</span>
                     </div>
                  </div>
                  
                  <p className="text-xs text-slate-300 leading-relaxed font-medium">
                     Ative avisos instantâneos com tecnologia de som e vibração para que você nunca perca vistorias elétricas importantes.
                  </p>
                  
                  <div className="pt-2 border-t border-white/10">
                     {notificationPermission === 'granted' ? (
                        <div className="space-y-3">
                           <div className="flex items-center gap-2 text-xs text-emerald-400 font-extrabold bg-emerald-500/15 p-2 rounded-xl border border-emerald-500/20 shadow-sm shadow-emerald-500/10">
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                               Alertas Ativos no Dispositivo
                           </div>
                           <Button onClick={testPushNotification} size="sm" variant="outline" className="w-full text-xs font-black border-white/15 text-white bg-white/5 hover:bg-white/15 hover:text-white rounded-xl uppercase tracking-wider italic">
                              Simular Alerta de Teste
                           </Button>
                        </div>
                     ) : (
                        <div className="space-y-3">
                           <Button onClick={requestNotificationPermission} size="sm" className="w-full text-xs font-black bg-blue-600 hover:bg-blue-500 text-white rounded-xl uppercase tracking-wider italic py-4">
                              Permitir Alertas Push
                           </Button>
                           <p className="text-[10px] text-slate-400 text-center leading-normal">
                              *Clique acima e autorize as notificações em seu dispositivo para usufruir do recurso.
                           </p>
                        </div>
                     )}
                  </div>
               </div>
            </div>
            
            <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm space-y-4">
               <div>
                  <h4 className="font-black text-sm text-slate-900 uppercase tracking-widest italic">Análise Agenda</h4>
                  <p className="text-xs text-slate-400">Total de compromissos salvos</p>
               </div>
               
               <div className="space-y-3 pt-2">
                  <div className="flex justify-between items-center text-xs border-b border-slate-100 pb-2.5">
                     <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Total Geral</span>
                     <span className="font-black text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-full">{events.length}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs border-b border-slate-100 pb-2.5">
                     <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Visitas Técnicas
                     </span>
                     <span className="font-black text-slate-900 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                        {events.filter(e => e.type === 'visit').length}
                     </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                     <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span> Monitoramento Push
                     </span>
                     <span className="font-black text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                        {events.filter(e => e.notifyTime && e.notifyTime !== 'none').length}
                     </span>
                  </div>
               </div>
            </div>
         </div>
         
         {/* Right Side: Event schedule list */}
         <div className="lg:col-span-3 space-y-4">
            <AnimatePresence mode="popLayout">
              {events.map((evt, i) => {
                 const isPast = evt.date < Date.now();
                 return (
                   <motion.div 
                     key={evt.id} 
                     layout
                     initial={{ opacity: 0, y: 15 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, scale: 0.95 }}
                     transition={{ delay: i * 0.05 }}
                     className={`group bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex items-center justify-between p-5 md:p-6 hover:shadow-md transition-all ${isPast ? 'opacity-65 grayscale-[0.3]' : ''}`}
                   >
                      <div className="flex items-center gap-4 md:gap-6">
                         <div className={`p-4 rounded-2xl flex flex-col items-center justify-center min-w-[76px] transition-colors ${isPast ? 'bg-slate-100 text-slate-500' : 'bg-blue-50 text-blue-600'}`}>
                            <span className="text-[10px] font-black uppercase tracking-widest">{format(evt.date, 'MMM', {locale: ptBR})}</span>
                            <span className="text-2xl font-black leading-none">{format(evt.date, 'dd', {locale: ptBR})}</span>
                         </div>
                         <div>
                            <div className="flex flex-wrap items-center gap-2 mb-1.5">
                               <h3 className={`font-black text-lg md:text-xl tracking-tight leading-tight ${isPast ? 'line-through text-slate-400' : 'text-slate-900'}`}>{evt.title}</h3>
                               <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-widest ${
                                 evt.type === 'service' ? 'bg-amber-100 text-amber-700 font-bold' : 
                                 evt.type === 'visit' ? 'bg-emerald-100 text-emerald-700 font-bold' : 
                                 'bg-purple-100 text-purple-700 font-bold'
                               }`}>
                                 {evt.type === 'service' ? 'Serviço' : evt.type === 'visit' ? 'Visita' : 'Lembrete'}
                               </span>
                            </div>
                            <div className="flex flex-wrap items-center text-xs font-bold text-slate-500 gap-y-1.5 gap-x-5">
                               <span className="flex items-center gap-1"><Clock className="w-4 h-4 text-slate-400"/> {format(evt.date, 'HH:mm')}</span>
                               {evt.description && <span className="flex items-center gap-1.5 max-w-[200px] md:max-w-md truncate text-slate-400 italic">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-slate-300" /> {evt.description}
                               </span>}
                            </div>
                            
                            {/* Badges for Recurrence and Notification Reminders */}
                            <div className="flex flex-wrap items-center gap-2 mt-3">
                               {evt.recurrence && evt.recurrence !== 'none' && (
                                  <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider bg-purple-50 text-purple-700 px-2.5 py-0.5 rounded-lg border border-purple-100">
                                     <Repeat className="w-3 h-3 text-purple-500" />
                                     Repete: {evt.recurrence === 'daily' ? 'Diário' : evt.recurrence === 'weekly' ? 'Semanal' : 'Mensal'}
                                  </span>
                               )}
                               {evt.notifyTime && evt.notifyTime !== 'none' && (
                                  <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-600 px-2.5 py-0.5 rounded-lg border border-emerald-100">
                                     <Bell className="w-3 h-3 text-emerald-500 animate-swing" />
                                     Lembrete: {evt.notifyTime === 'at_event' ? 'No Horário' : 
                                      evt.notifyTime === '15_min' ? '15 Min Antes' : 
                                      evt.notifyTime === '1_hour' ? '1 Hora Antes' : '1 Dia Antes'}
                                  </span>
                               )}
                            </div>
                         </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <Button variant="ghost" size="icon" className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full" onClick={() => setEventToDelete({ id: evt.id, title: evt.title })}>
                           <Trash2 className="w-5 h-5" />
                         </Button>
                      </div>
                   </motion.div>
                 )
              })}
            </AnimatePresence>

            {events.length === 0 && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="py-24 text-center border-2 border-dashed border-slate-200 bg-slate-50/40 rounded-[2.5rem]"
              >
                <CalIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-slate-400 font-extrabold text-xl uppercase tracking-tight italic">Sua agenda está vazia</h3>
                <p className="text-slate-400 text-sm mt-1 max-w-xs mx-auto">Adicione novos compromissos e agende visitas técnicas com um clique.</p>
              </motion.div>
            )}
         </div>
      </div>

      <Dialog open={!!eventToDelete} onOpenChange={(open) => !open && setEventToDelete(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold flex items-center gap-2 text-rose-600 uppercase italic">
              <Trash2 className="w-5 h-5 animate-bounce" /> Confirmar Exclusão
            </DialogTitle>
            <DialogDescription className="text-slate-500 pt-2 text-sm leading-relaxed">
              Tem certeza de que deseja excluir o compromisso <span className="font-bold text-slate-800">"{eventToDelete?.title}"</span>? Esta ação não poderá ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2 flex flex-row justify-end">
            <Button variant="outline" className="rounded-xl font-bold border-slate-200" onClick={() => setEventToDelete(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" className="rounded-xl font-bold bg-rose-600 hover:bg-rose-700 text-white" onClick={confirmDelete}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
