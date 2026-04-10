'use client';
import { useState, useEffect } from 'react';

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // 1. Detectar si ya está instalada la App
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
      setIsInstalled(true);
    }

    // 2. Capturar el evento de instalación que manda el navegador
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Mostrar el mensaje nativo del navegador (Chrome/Edge/Android)
    deferredPrompt.prompt();

    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('Usuario aceptó la instalación');
      setDeferredPrompt(null);
    }
  };

  // Si ya está instalada o el navegador no soporta la instalación automática (como iOS), no mostramos nada
  if (isInstalled || !deferredPrompt) {
    return null; 
  }

  return (
    <button
      onClick={handleInstallClick}
      className="flex items-center gap-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white px-4 py-2 rounded-full text-sm font-black shadow-lg shadow-pink-600/20 transition-all transform hover:scale-105 active:scale-95 animate-pulse"
    >
      <span className="text-lg">📲</span>
      INSTALAR APP
    </button>
  );
}
