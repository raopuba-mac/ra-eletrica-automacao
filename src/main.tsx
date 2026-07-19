import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';

// Register Service Worker for offline support and push notifications
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const isDevelopment = 
      window.location.hostname === 'localhost' || 
      window.location.hostname === '127.0.0.1' || 
      window.location.hostname.includes('ais-dev-') ||
      window.location.hostname.includes('ais-pre-') ||
      window.location.hostname.includes('.run.app');

    if (isDevelopment) {
      console.log('[PWA] Ambiente de desenvolvimento/preview detectado. Removendo Service Workers para evitar cache estático antigo.');
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        let unregisteredAny = false;
        const promises = registrations.map(registration => 
          registration.unregister().then((success) => {
            if (success) {
              unregisteredAny = true;
            }
          })
        );
        
        Promise.all(promises).then(() => {
          if (unregisteredAny) {
            console.log('[PWA] Service Worker desregistrado com sucesso no desenvolvimento.');
            if ('caches' in window) {
              caches.keys().then((keys) => {
                Promise.all(keys.map(key => caches.delete(key))).then(() => {
                  const hasReloaded = sessionStorage.getItem('sw-cleaned-reload');
                  if (!hasReloaded) {
                    sessionStorage.setItem('sw-cleaned-reload', 'true');
                    window.location.reload();
                  }
                });
              });
            }
          }
        });
      });
    } else {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('[PWA] Service Worker registrado com sucesso:', registration.scope);
        })
        .catch((error) => {
          console.error('[PWA] Falha ao registrar Service Worker:', error);
        });
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
