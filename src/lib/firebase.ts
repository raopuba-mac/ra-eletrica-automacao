import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true
}, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Adicionando ao window para depuração manual se necessário
if (typeof window !== 'undefined') {
  (window as any).firebaseApp = app;
  (window as any).firestoreDb = db;
}

// Testar conexão
async function testConnection() {
  try {
    // Tenta uma leitura simples
    console.log("Iniciando teste de conexão com o Firestore...");
    const testDoc = doc(db, 'system_check', 'connection');
    await getDocFromServer(testDoc);
    console.log("Conectado ao Firestore com sucesso.");
  } catch (error: any) {
    console.warn("Resultado do teste de conexão:", error.code, error.message);
    
    // Se o erro for 'unavailable', 'deadline-exceeded' ou offline, mostramos instruções claras
    if (error.message?.includes('the client is offline') || error.code === 'unavailable' || error.code === 'deadline-exceeded') {
      console.error(
        `ERRO DE CONEXÃO: O Firestore não respondeu.\n\n` +
        `Isso geralmente significa que:\n` +
        `1. O domínio '${window.location.hostname}' precisa ser adicionado no Firebase Console.\n` +
        `   Link: https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/settings\n` +
        `2. Você está em uma rede que bloqueia conexões com '*.googleapis.com'.\n` +
        `3. O banco de dados ainda está terminando de ser provisionado (tente recarregar em 1 minuto).`
      );
    }
  }
}

testConnection();
