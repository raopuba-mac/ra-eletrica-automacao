import React from 'react';
import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, setDoc, disableNetwork, enableNetwork, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../components/AuthProvider';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { OperationType, handleFirestoreError } from '../../lib/error';
import { RefreshCcw, Download, Upload, Palette, Sparkles, ShieldCheck } from 'lucide-react';
const logoImg = '/logo.jpg?v=6';

export default function Settings() {
  const { user } = useAuth();
  const [form, setForm] = useState({ name: '', companyName: '', phone: '', whatsappInfo: '', websiteSlug: '', bio: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadConfig() {
      if (!user) return;
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setForm({
            name: data.name || '',
            companyName: data.companyName || '',
            phone: data.phone || '',
            whatsappInfo: data.whatsappInfo || '',
            websiteSlug: data.websiteSlug || '',
            bio: data.bio || ''
          });
        }
      } catch(e) {
         handleFirestoreError(e, OperationType.GET, `users/${user.uid}`);
      } finally {
        setLoading(false);
      }
    }
    loadConfig();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        await updateDoc(docRef, { ...form, updatedAt: Date.now() });
      } else {
        await setDoc(docRef, { ...form, createdAt: Date.now(), updatedAt: Date.now() });
      }
      alert('Configurações salvas!');
    } catch(err) { handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`); }
  };

  const handleExportBackup = async () => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      const profile = userSnap.exists() ? userSnap.data() : null;

      const clientsSnap = await getDocs(query(collection(db, 'clients'), where('userId', '==', user.uid)));
      const clients = clientsSnap.docs.map(doc => ({ _id: doc.id, ...doc.data() }));

      const ordersSnap = await getDocs(query(collection(db, 'serviceOrders'), where('userId', '==', user.uid)));
      const serviceOrders = ordersSnap.docs.map(doc => ({ _id: doc.id, ...doc.data() }));

      const quotesSnap = await getDocs(query(collection(db, 'quotes'), where('userId', '==', user.uid)));
      const quotes = quotesSnap.docs.map(doc => ({ _id: doc.id, ...doc.data() }));

      const agendaSnap = await getDocs(query(collection(db, 'agenda'), where('userId', '==', user.uid)));
      const agenda = agendaSnap.docs.map(doc => ({ _id: doc.id, ...doc.data() }));

      const leadsSnap = await getDocs(query(collection(db, 'leads'), where('userId', '==', user.uid)));
      const leads = leadsSnap.docs.map(doc => ({ _id: doc.id, ...doc.data() }));

      const backupObj = {
        version: "1.0",
        exportedAt: Date.now(),
        profile,
        data: {
          clients,
          serviceOrders,
          quotes,
          agenda,
          leads
        }
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupObj, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `RA-Eletrica-Backup-${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      
      alert('Backup de segurança gerado e baixado com sucesso!');
    } catch(err) {
      console.error("Erro ao gerar backup de dados:", err);
      alert('Não foi possível gerar a cópia de segurança. Erro inesperado.');
    }
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const confirmImport = window.confirm("Você tem certeza que deseja importar este backup? Isso poderá reescrever ou duplicar dados.");
    if (!confirmImport) return;

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const backupObj = JSON.parse(event.target?.result as string);
          if (!backupObj || !backupObj.data) {
            alert("Arquivo de backup inválido ou corrompido.");
            return;
          }

          const { clients, serviceOrders, quotes, agenda, leads } = backupObj.data;

          if (backupObj.profile) {
             const userRef = doc(db, 'users', user.uid);
             await setDoc(userRef, { ...backupObj.profile, updatedAt: Date.now() });
          }

          let restoredCount = 0;

          if (Array.isArray(clients)) {
             for (const item of clients) {
                const { _id, ...docData } = item;
                docData.userId = user.uid;
                await setDoc(doc(db, 'clients', _id), docData);
                restoredCount++;
             }
          }

          if (Array.isArray(serviceOrders)) {
             for (const item of serviceOrders) {
                const { _id, ...docData } = item;
                docData.userId = user.uid;
                await setDoc(doc(db, 'serviceOrders', _id), docData);
                restoredCount++;
             }
          }

          if (Array.isArray(quotes)) {
             for (const item of quotes) {
                const { _id, ...docData } = item;
                docData.userId = user.uid;
                await setDoc(doc(db, 'quotes', _id), docData);
                restoredCount++;
             }
          }

          if (Array.isArray(agenda)) {
             for (const item of agenda) {
                const { _id, ...docData } = item;
                docData.userId = user.uid;
                await setDoc(doc(db, 'agenda', _id), docData);
                restoredCount++;
             }
          }

          if (Array.isArray(leads)) {
             for (const item of leads) {
                const { _id, ...docData } = item;
                docData.userId = user.uid;
                await setDoc(doc(db, 'leads', _id), docData);
                restoredCount++;
             }
          }

          alert(`Importação concluída! ${restoredCount} registros foram restaurados com sucesso.`);
          window.location.reload();
        } catch(err) {
          console.error("Erro ao analisar arquivo de backup:", err);
          alert("Erro crítico ao analisar os dados do backup. Arquivo incompatível.");
        }
      };
      reader.readAsText(file);
    } catch(err) {
      console.error("Erro ao ler o arquivo selecionado:", err);
      alert("Não foi possível carregar o arquivo selecionado.");
    }
  };

  const handleSyncData = async () => {
    try {
      await disableNetwork(db);
      await enableNetwork(db);
      alert('Sincronização forçada concluída com sucesso!');
    } catch (err) {
      console.error(err);
      alert('Erro ao tentar forçar a sincronização de dados.');
    }
  };

  if (loading) return <div>Carregando...</div>;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-white italic tracking-tight uppercase">Configurações do Perfil e Site</h1>
          <p className="text-slate-400 text-sm">Personalize os dados que aparecem na sua página pública.</p>
        </div>
        <Button onClick={handleSyncData} variant="outline" className="shrink-0 font-bold uppercase tracking-widest text-[#EAB308] italic bg-[#0B0F19] hover:bg-slate-800 border-slate-800">
          <RefreshCcw className="w-4 h-4 mr-2 text-[#EAB308]" />
          Sincronizar Dados
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-[#1E293B] p-6 rounded-2xl border border-slate-800 shadow-xl text-white">
        <div className="space-y-4">
          <h2 className="text-lg font-black border-b border-slate-800 pb-2 text-[#EAB308] uppercase italic">Informações Pessoais / Empresa</h2>
          <div><Label className="text-xs font-bold text-slate-300">Seu Nome</Label><Input className="h-12 bg-[#0B0F19] border-slate-800 text-white rounded-xl focus:ring-[#EAB308]" value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
          <div><Label className="text-xs font-bold text-slate-300">Nome da Empresa (Opcional)</Label><Input className="h-12 bg-[#0B0F19] border-slate-800 text-white rounded-xl focus:ring-[#EAB308]" value={form.companyName} onChange={e => setForm({...form, companyName: e.target.value})} /></div>
          <div><Label className="text-xs font-bold text-slate-300">Telefone (Contato Normal)</Label><Input className="h-12 bg-[#0B0F19] border-slate-800 text-white rounded-xl focus:ring-[#EAB308]" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
        </div>

        <div className="space-y-4 pt-4 border-t border-slate-800">
          <h2 className="text-lg font-black border-b border-slate-800 pb-2 text-[#EAB308] uppercase italic">Apresentação Pública (Site)</h2>
          <div>
            <Label className="text-xs font-bold text-slate-300">Sobre Mim / Bio</Label>
            <textarea 
              value={form.bio} 
              onChange={e => setForm({...form, bio: e.target.value})} 
              className="flex min-h-[120px] w-full rounded-xl border border-slate-800 bg-[#0B0F19] p-3 text-sm text-white placeholder:text-slate-500 focus:ring-2 focus:ring-[#EAB308] focus:outline-none"
              placeholder="Escreva um pouco sobre a sua experiência..."
            />
            <p className="text-xs text-slate-400 mt-1">Este texto aparecerá na seção "Sobre Mim" da página inicial.</p>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-slate-800">
          <h2 className="text-lg font-black border-b border-slate-800 pb-2 text-[#EAB308] uppercase italic">Integração com WhatsApp</h2>
          <div>
            <Label className="text-xs font-bold text-slate-300">Número do WhatsApp no formato internacional (ex: 5534992609206)</Label>
            <Input className="h-12 bg-[#0B0F19] border-slate-800 text-white rounded-xl focus:ring-[#EAB308]" value={form.whatsappInfo} onChange={e => setForm({...form, whatsappInfo: e.target.value})} required />
            <p className="text-xs text-slate-400 mt-1">Este número receberá as mensagens do site público.</p>
          </div>
        </div>

        <div className="space-y-4 mt-6">
          <Button type="submit" size="lg" className="w-full bg-[#EAB308] hover:bg-[#ca8a04] text-[#0B0F19] font-black uppercase italic tracking-wider h-14 rounded-2xl shadow-xl">Salvar Configurações</Button>
        </div>
      </form>

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
         <div>
            <h2 className="text-lg font-bold text-slate-900 uppercase tracking-tight italic">Cópia de Segurança & Exportação</h2>
            <p className="text-xs text-slate-500 mt-1">
               Como este aplicativo prioriza integridade e pode funcionar offline, você tem total autonomia e soberania sobre seus dados. Use as ferramentas abaixo para fazer o backup ou restaurar suas informações no sistema.
            </p>
         </div>

         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button 
               type="button" 
               variant="outline"
               onClick={handleExportBackup}
               className="h-14 bg-white border-slate-200 text-slate-700 font-bold uppercase tracking-widest text-[10px] rounded-xl hover:bg-slate-50 transition"
            >
               <Download className="w-4 h-4 mr-2 text-slate-500" /> Exportar Dados (Backup JSON)
            </Button>

            <div className="relative">
               <input 
                  type="file" 
                  accept=".json"
                  onChange={handleImportBackup}
                  id="import-backup-file" 
                  className="hidden" 
               />
               <Button 
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('import-backup-file')?.click()}
                  className="h-14 w-full bg-white border-slate-200 text-slate-700 font-bold uppercase tracking-widest text-[10px] rounded-xl hover:bg-slate-50 transition"
               >
                  <Upload className="w-4 h-4 mr-2 text-slate-500" /> Importar Backup (Restaurar)
               </Button>
            </div>
         </div>
         <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider text-center">
            ⚠️ Atenção: A importação de dados pode reescrever dados de mesmo ID já existentes no sistema.
         </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
         <div className="flex items-center gap-3 border-b pb-4">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl" aria-hidden="true">
               <Palette className="w-5 h-5 animate-pulse" />
            </div>
            <div>
               <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight italic">Identidade Visual & Logomarca</h2>
               <p className="text-xs text-slate-500 mt-0.5">Nova identidade visual premium integrada ao seu aplicativo e website.</p>
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-lg bg-slate-50 p-6 flex flex-col items-center justify-center relative">
               <div className="absolute top-3 right-3 bg-blue-100 text-blue-700 text-[10px] font-black px-2.5 py-1 rounded-full border border-blue-200 tracking-wider uppercase">
                  Design Profissional
               </div>
               <div className="w-48 h-48 rounded-2xl overflow-hidden shadow-md border border-slate-200 shrink-0 bg-white mb-4 mt-2">
                  <img src={logoImg} alt="RA Logo Premium" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
               </div>
               <span className="text-slate-900 font-black tracking-widest text-sm uppercase">RA | Elétrica e Automação</span>
               <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Selo de Qualidade Técnica</span>
            </div>

            <div className="space-y-4 flex flex-col justify-between">
               <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                     <Sparkles className="w-4 h-4 text-amber-500" /> Paleta de Cores Oficial
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                     <div className="bg-[#0f172a] p-3 rounded-xl border border-slate-800 text-center shadow-sm">
                        <div className="w-full h-6 rounded bg-slate-900 border border-slate-800 mb-1.5" />
                        <span className="text-[10px] font-bold text-slate-400 block">Slate Dark</span>
                        <code className="text-[9px] font-mono text-slate-500">#0F172A</code>
                     </div>
                     <div className="bg-white p-3 rounded-xl border border-slate-100 text-center shadow-sm">
                        <div className="w-full h-6 rounded bg-blue-600 mb-1.5" />
                        <span className="text-[10px] font-bold text-slate-600 block">Electric Blue</span>
                        <code className="text-[9px] font-mono text-slate-400">#2563EB</code>
                     </div>
                     <div className="bg-white p-3 rounded-xl border border-slate-100 text-center shadow-sm">
                        <div className="w-full h-6 rounded bg-amber-500 mb-1.5" />
                        <span className="text-[10px] font-bold text-slate-600 block">Power Amber</span>
                        <code className="text-[9px] font-mono text-slate-400">#F59E0B</code>
                     </div>
                  </div>
               </div>

               <div className="space-y-2 pt-2 border-t border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                     <ShieldCheck className="w-4 h-4 text-green-500" /> Conceito Clean & Premium
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                     Esta nova identidade visual é clara, moderna e profissional. Ela integra harmoniosamente as iniciais <strong>RA (Renan Augusto)</strong> com um design minimalista, trazendo foco e legibilidade perfeita em qualquer plataforma (web, app ou documentos de orçamento). O fundo claro confere uma presença corporativa sólida, higiênica e de alto padrão técnico.
                  </p>
               </div>

               <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full font-bold uppercase tracking-wider text-[11px] h-11 rounded-xl bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  onClick={() => {
                     // Fetch as a blob to guarantee reliable download on all devices (especially mobile/iframes)
                     fetch('/logo.jpg?v=6')
                        .then(response => response.blob())
                        .then(blob => {
                           const url = window.URL.createObjectURL(blob);
                           const link = document.createElement('a');
                           link.href = url;
                           link.download = 'RA_Logo_Clean_Professional.jpg';
                           document.body.appendChild(link);
                           link.click();
                           document.body.removeChild(link);
                           window.URL.revokeObjectURL(url);
                        })
                        .catch(err => {
                           console.error('Error downloading logo image:', err);
                           // Safe fallback: open in new tab
                           window.open('/logo.jpg?v=6', '_blank');
                        });
                  }}
               >
                  Baixar Logo em Alta Resolução
               </Button>
            </div>
         </div>
      </div>
    </div>
  );
}
