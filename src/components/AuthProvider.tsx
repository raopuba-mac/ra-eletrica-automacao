import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDocFromServer, setDoc, serverTimestamp } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: () => Promise<void>;
  logOut: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  signIn: async () => {},
  logOut: async () => {},
  clearError: () => {}
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        // Ensure user doc exists
        try {
          const userRef = doc(db, 'users', u.uid);
          const docSnap = await getDocFromServer(userRef);
          if (!docSnap.exists()) {
            await setDoc(userRef, {
              email: u.email,
              createdAt: Date.now(),
              updatedAt: Date.now()
            });
          }
        } catch (e) {
          console.error("Error creating user profile", e);
        }
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const signIn = async () => {
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (e: any) {
      console.error(e);
      let message = "Ocorreu um erro ao fazer login. Tente novamente.";
      if (e.code === 'auth/popup-blocked') {
        message = "O popup de login foi bloqueado pelo navegador. Por favor, permita popups para este site ou abra o aplicativo em uma nova aba.";
      } else if (e.code === 'auth/cancelled-popup-request' || e.code === 'auth/popup-closed-by-user') {
        message = "O login foi cancelado, a janela foi fechada ou bloqueada por políticas de privacidade do navegador (comum em iframes). Por favor, abra o aplicativo em uma nova aba para fazer o login de forma direta.";
      } else if (e.code === 'auth/unauthorized-domain') {
        message = "Este domínio (" + window.location.hostname + ") não está autorizado no Firebase. Adicione este domínio no painel do Firebase Console (Authentication > Settings > Authorized Domains).";
      } else if (e.message && (e.message.includes('network-error') || e.code === 'auth/network-request-failed')) {
        message = "Erro de conexão com o Firebase. Verifique sua conexão de rede ou se o seu firewall/rede corporativa está bloqueando os servidores do Google. Tente usar dados móveis (4G/5G) se persistir.";
      }
      setError(message);
    }
  };

  const logOut = async () => {
    await signOut(auth);
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider value={{ user, loading, error, signIn, logOut, clearError }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
