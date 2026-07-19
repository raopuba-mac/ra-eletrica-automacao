import express from 'express';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import webpush from 'web-push';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, getDocs, query, where, doc, updateDoc, setDoc } from 'firebase/firestore';

const app = express();
const PORT = 3000;

app.use(express.json());

  // CORS middleware to allow cross-origin requests
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Load Firebase configuration
  let firebaseConfig: any;
  try {
    const configUrl = new URL('./firebase-applet-config.json', import.meta.url);
    if (fs.existsSync(configUrl)) {
      firebaseConfig = JSON.parse(fs.readFileSync(configUrl, 'utf8'));
    } else {
      const firebaseConfigPath = path.join(process.cwd(), 'firebase-applet-config.json');
      if (fs.existsSync(firebaseConfigPath)) {
        firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf8'));
      } else {
        throw new Error('Firebase config file not found in any location.');
      }
    }
  } catch (err: any) {
    console.error('[Firebase Init Error] Could not load configuration:', err.message);
    process.exit(1);
  }

  // Initialize Firebase Client App
  const firebaseApp = initializeApp(firebaseConfig);
  const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);
  const auth = getAuth(firebaseApp);
  console.log('[Push Server] Firebase Client inicializado com sucesso.');

  let isAuthInitialized = false;

  async function ensureAuthenticated(): Promise<boolean> {
    if (isAuthInitialized && auth.currentUser) {
      return true;
    }
    
    const email = 'scheduler@ra-eletrica.com';
    const password = 'RA_Eletrica_Scheduler_Secure_Password_2026_!';
    
    try {
      console.log('[Push Server] Tentando autenticar o scheduler...');
      await signInWithEmailAndPassword(auth, email, password);
      console.log('[Push Server] Autenticação do scheduler realizada com sucesso.');
      isAuthInitialized = true;
      return true;
    } catch (error: any) {
      if (error.code === 'auth/operation-not-allowed') {
        console.error(`\n================================================================================`);
        console.error(`[Push Server] ERRO DE AUTENTICAÇÃO: O provedor "E-mail/Senha" está DESATIVADO no Firebase.`);
        console.error(`Para corrigir este problema e ativar notificações push em segundo plano:`);
        console.error(`1. Acesse o console do seu projeto Firebase:`);
        console.error(`   https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/providers`);
        console.error(`2. Sob a aba "Método de login" (Sign-in method), ative o provedor "E-mail/Senha" (Email/Password).`);
        console.error(`3. Salve as alterações.`);
        console.error(`================================================================================\n`);
        return false;
      }

      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential' || error.code === 'auth/invalid-email') {
        console.log('[Push Server] Usuário scheduler não encontrado. Criando nova conta...');
        try {
          await createUserWithEmailAndPassword(auth, email, password);
          console.log('[Push Server] Conta do scheduler criada e autenticada com sucesso.');
          isAuthInitialized = true;
          return true;
        } catch (createError: any) {
          if (createError.code === 'auth/operation-not-allowed') {
            console.error(`\n================================================================================`);
            console.error(`[Push Server] ERRO DE AUTENTICAÇÃO: O provedor "E-mail/Senha" está DESATIVADO no Firebase.`);
            console.error(`Para corrigir este problema e ativar notificações push em segundo plano:`);
            console.error(`1. Acesse o console do seu projeto Firebase:`);
            console.error(`   https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/providers`);
            console.error(`2. Sob a aba "Método de login" (Sign-in method), ative o provedor "E-mail/Senha" (Email/Password).`);
            console.error(`3. Salve as alterações.`);
            console.error(`================================================================================\n`);
          } else {
            console.error('[Push Server] Erro ao criar conta do scheduler:', createError);
          }
          return false;
        }
      } else {
        console.error('[Push Server] Erro na autenticação do scheduler:', error);
        return false;
      }
    }
  }

  // VAPID keys setup for Web Push
  let vapidKeys: { publicKey: string; privateKey: string };
  const keysUrl = new URL('./vapid-keys.json', import.meta.url);
  const keysPath = path.join(process.cwd(), 'vapid-keys.json');

  if (fs.existsSync(keysUrl)) {
    vapidKeys = JSON.parse(fs.readFileSync(keysUrl, 'utf8'));
    console.log('[Push Server] Chaves VAPID carregadas com sucesso via URL.');
  } else if (fs.existsSync(keysPath)) {
    vapidKeys = JSON.parse(fs.readFileSync(keysPath, 'utf8'));
    console.log('[Push Server] Chaves VAPID carregadas com sucesso via cwd.');
  } else {
    vapidKeys = webpush.generateVAPIDKeys();
    try {
      fs.writeFileSync(keysPath, JSON.stringify(vapidKeys, null, 2), 'utf8');
      console.log('[Push Server] Novas chaves VAPID geradas e salvas em vapid-keys.json.');
    } catch (writeErr: any) {
      console.warn('[Push Server] Não foi possível salvar as chaves VAPID no disco (provavelmente ambiente serverless):', writeErr.message);
    }
  }

  webpush.setVapidDetails(
    'mailto:raop.uba@gmail.com',
    vapidKeys.publicKey,
    vapidKeys.privateKey
  );

  // Background scheduler to check agenda and trigger push notifications
  async function checkAndSendNotifications() {
    try {
      const authenticated = await ensureAuthenticated();
      if (!authenticated) {
        // Silent return to avoid log flooding, since we already printed a clear, detailed instruction in ensureAuthenticated
        return;
      }
      const now = Date.now();
      console.log('[Push Scheduler] Verificando agendamentos pendentes...');
      
      const agendaRef = collection(db, 'agenda');
      const querySnapshot = await getDocs(query(agendaRef, where('notified', '!=', true)));
      
      for (const d of querySnapshot.docs) {
        const event = { id: d.id, ...d.data() } as any;
        if (!event.date || !event.userId || event.notifyTime === 'none') continue;
        
        const diffMs = event.date - now;
        let shouldNotify = false;
        let timeLabel = '';

        // 1 minute tolerance windows
        if (event.notifyTime === 'at_event') {
          if (diffMs <= 60000 && diffMs >= -120000) {
            shouldNotify = true;
            timeLabel = 'está agendado para agora!';
          }
        } else if (event.notifyTime === '15_min') {
          if (diffMs <= 16 * 60000 && diffMs >= 14 * 60000) {
            shouldNotify = true;
            timeLabel = 'começa em 15 minutos.';
          }
        } else if (event.notifyTime === '1_hour') {
          if (diffMs <= 61 * 60000 && diffMs >= 59 * 60000) {
            shouldNotify = true;
            timeLabel = 'começa em 1 hora.';
          }
        } else if (event.notifyTime === '24_hours') {
          if (diffMs <= 24.1 * 60 * 60000 && diffMs >= 23.9 * 60 * 60000) {
            shouldNotify = true;
            timeLabel = 'está agendado para amanhã.';
          }
        }

        if (shouldNotify) {
          console.log(`[Push Scheduler] Enviando notificação para o evento: "${event.title}" do usuário: ${event.userId}`);
          
          const subsSnapshot = await getDocs(query(collection(db, 'push_subscriptions'), where('userId', '==', event.userId)));
          
          const payload = JSON.stringify({
            title: `Lembrete de Compromisso: ${event.title}`,
            body: `O seu agendamento "${event.title}" ${timeLabel}\nDetalhes: ${event.description || 'Sem descrição adicional'}`,
            icon: '/logo.jpg',
            badge: '/favicon.png',
            data: {
              url: '/app/agenda'
            }
          });

          for (const subDoc of subsSnapshot.docs) {
            const subData = subDoc.data() as any;
            if (subData.subscription && !subData.expired) {
              try {
                await webpush.sendNotification(subData.subscription, payload);
                console.log(`[Push Scheduler] Notificação enviada para sub: ${subDoc.id}`);
              } catch (error: any) {
                console.error(`[Push Scheduler] Erro ao enviar para sub ${subDoc.id}:`, error);
                if (error.statusCode === 410 || error.statusCode === 404) {
                  // Mark subscription as expired
                  await setDoc(doc(db, 'push_subscriptions', subDoc.id), { ...subData, expired: true });
                  console.log(`[Push Scheduler] Inscrição expirada marcada: ${subDoc.id}`);
                }
              }
            }
          }

          // Mark event as notified so we don't notify again
          await updateDoc(doc(db, 'agenda', event.id), { notified: true });
        }
      }
    } catch (error) {
      console.error('[Push Scheduler] Erro na verificação em segundo plano:', error);
    }
  }

  // API route for Gemini using modern SDK and gemini-3.5-flash
  app.post('/api/chat', async (req, res) => {
    try {
      const { message, history, stream } = req.body;
      const key = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

      if (!key || key.trim() === '') {
        return res.status(500).json({ error: "API_KEY_MISSING", message: "A chave API do Gemini não foi encontrada no servidor." });
      }

      const ai = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      // Prune history to avoid token size or rate limit issues (retains last 6 messages / 3 interactions)
      const maxHistoryLength = 6;
      const prunedHistory = history && history.length > maxHistoryLength
        ? history.slice(-maxHistoryLength)
        : (history || []);

      const chat = ai.chats.create({
        model: "gemini-3.5-flash",
        config: {
          systemInstruction: `Você é o assistente virtual da RA | Elétrica, Automação e Segurança Eletrônica (do técnico Renan Augusto).
Objetivo: Atendimento inicial, triagem de interesse e coleta de informações básicas.

Seus Serviços:
- Instalações Elétricas (Residenciais e Industriais)
- Automação Residencial (Luzes, Portões, Som, Alexa)
- Segurança Eletrônica (Câmeras CFTV, Alarmes)
- Interfones e Fechaduras Inteligentes
- Painéis Elétricos e Quadro de Distribuição

Sua conduta:
1. Seja educado, profissional e use termos técnicos apenas quando necessário para explicar algo.
2. Identifique: (A) Qual o serviço desejado, (B) Se é para casa ou empresa, (C) Qual a cidade/bairro.
3. Não forneça valores de mão de obra ou materiais, diga que isso requer análise técnica.
4. Ao coletar os dados, encerre assim:

"Perfeito! Já registrei sua solicitação para análise do técnico Renan. 
Dados do Protocolo:
* **Serviço:** [Descreva aqui]
* **Ambiente:** [Residencial/Comercial]
* **Local:** [Bairro/Cidade]

Agora, por favor, clique no botão **'Falar no WhatsApp'** que apareceu logo abaixo para enviar essas informações diretamente para o Renan e agendar sua visita técnica."`
        },
        history: prunedHistory.map((h: any) => ({
          role: h.role === 'user' ? 'user' : 'model',
          parts: [{ text: h.text || "..." }]
        }))
      });

      if (stream === false) {
        const response = await chat.sendMessage({ message: message });
        return res.json({ text: response.text });
      }

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');

      const streamResponse = await chat.sendMessageStream({ message: message });

      for await (const chunk of streamResponse) {
        const chunkText = chunk.text;
        if (chunkText) {
          res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
        }
      }
      res.write('data: [DONE]\n\n');
      res.end();
    } catch (e: any) {
      console.error("Gemini Server Error:", e);
      const errStr = String(e).toLowerCase();
      const isQuotaError = errStr.includes("429") || 
                           errStr.includes("quota") || 
                           errStr.includes("limit") || 
                           errStr.includes("exhausted") || 
                           errStr.includes("rate");

      if (!res.headersSent) {
          if (isQuotaError) {
              res.status(429).json({ error: "RATE_LIMIT_EXCEEDED", message: "O limite de requisições do assistente foi atingido temporariamente." });
          } else {
              res.status(500).json({ error: e.message || String(e) });
          }
      } else {
          const errObj = { error: isQuotaError ? "RATE_LIMIT_EXCEEDED" : (e.message || String(e)) };
          res.write(`data: ${JSON.stringify(errObj)}\n\n`);
          res.end();
      }
    }
  });

  // API Route to extract quote information from voice/text transcription
  app.post('/api/voice-budget-extractor', async (req, res) => {
    try {
      const { text } = req.body;
      if (!text || text.trim() === '') {
        return res.status(400).json({ error: "TEXT_MISSING", message: "Nenhum texto de transcrição foi enviado." });
      }

      const key = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
      if (!key || key.trim() === '') {
        return res.status(500).json({ error: "API_KEY_MISSING", message: "A chave API do Gemini não foi encontrada no servidor." });
      }

      const ai = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Analise a seguinte transcrição de áudio de um serviço elétrico/automação em português brasileiro e extraia as informações de forma estruturada para preencher um orçamento.
        
Transcrição de áudio:
"${text}"`,
        config: {
          systemInstruction: `Você é um assistente de inteligência artificial especializado em extrair itens de orçamento e informações de serviços a partir de comandos de voz ou notas faladas de eletricistas.
Sua tarefa é retornar estritamente um objeto JSON com as seguintes propriedades:
1. 'description' (string): Breve resumo ou descrição geral do serviço (máximo 120 caracteres).
2. 'items' (array de objetos): Cada objeto deve representar um item/serviço com:
   - 'name' (string): Nome descritivo do item ou do ponto de serviço (ex: 'Instalação de Chuveiro Elétrico', 'Ponto de tomada 20A').
   - 'quantity' (integer): Quantidade (padrão: 1).
   - 'price' (number): Preço unitário estimado em Reais (BRL). Se o preço for mencionado diretamente na transcrição (ex: "cinquenta reais cada" ou "total deu cem reais para duas"), extraia-o. Caso contrário, se o serviço corresponder a itens comuns, use valores razoáveis padrão (ex: Chuveiro: 150, Tomada comum: 80, Tomada especial: 120, Interruptor: 80, Ponto iluminação: 80, Fita LED/metro: 100, Quadro distribuição grande: 650, Quadro pequeno: 400). Se não fizer ideia, coloque 0.
3. 'remarks' (string): Observações adicionais, alertas de segurança ou ferramentas/materiais necessários falados (ex: 'Trazer escada de 8 degraus').
4. 'includesMaterial' (boolean): true se o usuário disser que materiais estão inclusos ou que o orçamento inclui material, senão false.
5. 'discount' (number): Valor do desconto extra mencionado, senão 0.`,
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              description: { type: "STRING" },
              items: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    name: { type: "STRING" },
                    quantity: { type: "INTEGER" },
                    price: { type: "NUMBER" }
                  },
                  required: ["name", "quantity", "price"]
                }
              },
              remarks: { type: "STRING" },
              includesMaterial: { type: "BOOLEAN" },
              discount: { type: "NUMBER" }
            },
            required: ["description", "items", "remarks", "includesMaterial", "discount"]
          }
        }
      });

      const extractedText = response.text;
      if (!extractedText) {
        throw new Error("Resposta vazia do modelo Gemini.");
      }

      const parsedData = JSON.parse(extractedText.trim());
      res.json(parsedData);
    } catch (e: any) {
      console.error("Voice Budget Extractor Error:", e);
      res.status(500).json({ error: e.message || String(e) });
    }
  });

  // GET VAPID public key
  app.get('/api/notifications/vapid-public-key', (req, res) => {
    res.json({ publicKey: vapidKeys.publicKey });
  });

  // POST Subscribe to Push Notifications
  app.post('/api/notifications/subscribe', async (req, res) => {
    try {
      const authenticated = await ensureAuthenticated();
      if (!authenticated) {
        return res.status(403).json({
          error: 'AUTH_METHOD_DISABLED',
          message: `O provedor de autenticação "E-mail/Senha" está desativado no Firebase. Ative-o em https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/providers para registrar inscrições push.`
        });
      }
      const { subscription, userId } = req.body;
      if (!subscription || !userId) {
        return res.status(400).json({ error: 'subscription e userId são obrigatórios' });
      }

      if (!subscription.endpoint) {
        return res.status(400).json({ error: 'Endpoint da inscrição inválido' });
      }

      // Base64 hash for stable doc ID
      const subscriptionHash = Buffer.from(subscription.endpoint).toString('base64').replace(/[^a-zA-Z0-9]/g, '');
      const subDocRef = doc(db, 'push_subscriptions', subscriptionHash);
      
      await setDoc(subDocRef, {
        userId,
        subscription,
        expired: false,
        createdAt: Date.now()
      });

      console.log(`[Push Server] Nova inscrição registrada para o usuário: ${userId}`);
      res.json({ success: true });
    } catch (error: any) {
      console.error('[Push Server] Erro ao registrar inscrição:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // POST Send test push notification
  app.post('/api/notifications/test-push', async (req, res) => {
    try {
      const authenticated = await ensureAuthenticated();
      if (!authenticated) {
        return res.status(403).json({
          error: 'AUTH_METHOD_DISABLED',
          message: `O provedor de autenticação "E-mail/Senha" está desativado no Firebase. Ative-o em https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/providers para enviar notificações push.`
        });
      }
      const { userId, title, body } = req.body;
      if (!userId) {
        return res.status(400).json({ error: 'userId é obrigatório' });
      }

      const querySnapshot = await getDocs(query(collection(db, 'push_subscriptions'), where('userId', '==', userId)));
      
      if (querySnapshot.empty) {
        return res.status(404).json({ error: 'Nenhuma inscrição ativa encontrada para este usuário' });
      }

      const payload = JSON.stringify({
        title: title || 'Teste RA Elétrica & Automação',
        body: body || 'Este é um teste de notificação push em tempo real!',
        icon: '/logo.jpg',
        badge: '/favicon.png',
        data: {
          url: '/app/agenda'
        }
      });

      let sentCount = 0;
      for (const d of querySnapshot.docs) {
        const subData = d.data() as any;
        if (subData.subscription && !subData.expired) {
          try {
            await webpush.sendNotification(subData.subscription, payload);
            sentCount++;
          } catch (err: any) {
            console.error(`[Push Server] Erro ao enviar para sub ${d.id}:`, err);
            if (err.statusCode === 410 || err.statusCode === 404) {
              await setDoc(doc(db, 'push_subscriptions', d.id), { ...subData, expired: true });
            }
          }
        }
      }

      res.json({ success: true, sentCount });
    } catch (error: any) {
      console.error('[Push Server] Erro ao enviar teste:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  async function setupViteAndListen() {
    if (process.env.NODE_ENV !== "production") {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), 'dist');
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }

    // Only listen and start scheduler if NOT running in serverless environment (Vercel)
    if (!process.env.VERCEL) {
      app.listen(PORT, "0.0.0.0", () => {
        console.log(`Server running on http://localhost:${PORT}`);
      });

      // Start background scheduler
      console.log('[Push Server] Iniciando scheduler em segundo plano...');
      setInterval(checkAndSendNotifications, 30000); // Check every 30 seconds
    } else {
      console.log('[Push Server] Executando em ambiente Serverless (Vercel). Escuta de porta desativada.');
    }
  }

  setupViteAndListen();

export default app;
