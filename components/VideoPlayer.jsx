'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Diccionario para limpiar los nombres de los servidores y asignarles una "calidad" visual
const getServerInfo = (id) => {
  const servers = {
    flv: { name: 'Servidor Alfa', quality: 'HD 1080p', color: 'text-green-400' },
    sbfull: { name: 'Servidor Beta', quality: 'HD 720p', color: 'text-yellow-400' },
    mega: { name: 'Mega Premium', quality: 'Full HD', color: 'text-green-400' },
    okru: { name: 'OkRu HD', quality: 'HD 1080p', color: 'text-green-400' },
    fembed: { name: 'F-Embed', quality: 'SD 480p', color: 'text-orange-400' },
    stape: { name: 'StreamTape', quality: 'HD 720p', color: 'text-yellow-400' }
  };
  const key = id?.toLowerCase();
  return servers[key] || { name: `Servidor ${id?.toUpperCase()}`, quality: 'Auto', color: 'text-green-400' };
};

export default function VideoPlayer({ servers, jikanId, nextEp, coverImage }) {
  const router = useRouter();
  const [activeLanguage, setActiveLanguage] = useState('');
  const [activeServer, setActiveServer] = useState(null);
  
  // Estados Cinéticos y de UX
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [iframeLoading, setIframeLoading] = useState(true);
  
  // Estados para el Modo Maratón (Auto-Play)
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(true);
  const [countdown, setCountdown] = useState(null);

  const availableLanguages = servers ? Object.keys(servers).filter(lang => servers[lang] && servers[lang].length > 0) : [];

  useEffect(() => {
    if (availableLanguages.length > 0 && !availableLanguages.includes(activeLanguage)) {
      setActiveLanguage(availableLanguages[0]);
    }
  }, [servers]);

  useEffect(() => {
    if (servers && activeLanguage && servers[activeLanguage]?.length > 0) {
      setIframeLoading(true); // Activar animación de carga al cambiar
      setActiveServer(servers[activeLanguage][0]);
    } else {
      setActiveServer(null);
    }
  }, [activeLanguage, servers]);

  // Lógica del Temporizador del Episodio y Cuenta Regresiva (Modo Maratón)
  useEffect(() => {
    setCountdown(null);
    let timeoutId;
    let intervalId;

    if (activeServer && nextEp) {
      // Configuramos el inicio de la cuenta regresiva al minuto 22 (1,320,000 ms)
      // Nota: Cambia esto a 5000 (5 segundos) para probarlo rápidamente en desarrollo
      const timeToCountdown = 1320000; 

      timeoutId = setTimeout(() => {
        setCountdown(10); // Inicia cuenta regresiva de 10 segundos
        
        intervalId = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(intervalId);
              // Si el Auto-Play está activo, redirige automáticamente
              if (autoPlayEnabled) {
                router.push(`/ver/${jikanId}-episodio-${nextEp}`);
              }
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }, timeToCountdown);
    }

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [activeServer, nextEp, autoPlayEnabled, router, jikanId]);

  if (!servers || availableLanguages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-[#111] rounded-xl border border-gray-800 text-gray-500 shadow-inner">
        <span className="text-5xl mb-3 block opacity-50">📡</span>
        <p className="font-bold tracking-widest">SEÑAL PERDIDA</p>
        <p className="text-xs mt-2">No se encontraron servidores para este episodio.</p>
      </div>
    );
  }

  return (
    <>
      {/* CAPA DE OSCURIDAD MODO CINE */}
      {isTheaterMode && (
        <div 
          className="fixed inset-0 bg-black/95 z-40 transition-opacity duration-700 backdrop-blur-md"
          onClick={() => setIsTheaterMode(false)}
        />
      )}

      <div className={`flex flex-col gap-4 relative transition-all duration-700 ${isTheaterMode ? 'z-50 max-w-6xl mx-auto scale-[1.02] mt-8' : ''}`}>
        
        {/* EL REPRODUCTOR ÉPICO */}
        <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.6)] border border-white/10 group bg-black">
          
          {/* AMBILIGHT VOLUMÉTRICO EXTREMO */}
          {coverImage && (
            <div className="absolute inset-0 -inset-y-16 z-0 overflow-hidden pointer-events-none">
              <div 
                className="absolute inset-0 bg-cover bg-center opacity-70 blur-[80px] scale-150 animate-pulse-slow mix-blend-screen"
                style={{ backgroundImage: `url(${coverImage})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60" />
            </div>
          )}

          {/* TRANSICIÓN Y SPINNER DEL IFRAME */}
          {iframeLoading && activeServer && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-t-2 border-[#e2005e] animate-spin"></div>
                <div className="absolute inset-2 rounded-full border-r-2 border-blue-500 animate-spin-reverse"></div>
              </div>
              <p className="mt-4 text-[#e2005e] font-black tracking-[0.2em] text-xs animate-pulse">ESTABLECIENDO CONEXIÓN...</p>
            </div>
          )}

          {/* CONTENEDOR DEL IFRAME */}
          <div className="relative z-10 w-full h-full">
            {activeServer && (
              <iframe
                src={activeServer.url}
                className={`w-full h-full absolute top-0 left-0 transition-opacity duration-1000 ${iframeLoading ? 'opacity-0' : 'opacity-100'}`}
                frameBorder="0"
                allowFullScreen
                allow="autoplay; fullscreen"
                onLoad={() => setIframeLoading(false)}
              ></iframe>
            )}
          </div>

          {/* OVERLAY DE CUENTA REGRESIVA Y SIGUIENTE EPISODIO */}
          {countdown !== null && nextEp && activeServer && (
            <div className="absolute bottom-10 right-6 z-50 animate-fade-in-up">
              <div className="bg-black/80 backdrop-blur-xl border border-white/20 p-4 rounded-xl shadow-[0_0_30px_rgba(226,0,94,0.3)] flex flex-col items-end gap-3">
                <p className="text-gray-300 text-xs font-bold tracking-widest uppercase">
                  {autoPlayEnabled ? `Siguiente en ${countdown}s` : 'Episodio Finalizado'}
                </p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setCountdown(null)}
                    className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-white transition-colors"
                  >
                    Cancelar
                  </button>
                  <Link 
                    href={`/ver/${jikanId}-episodio-${nextEp}`} 
                    className="bg-[#e2005e] hover:bg-pink-500 text-white px-6 py-2 rounded-lg font-black text-sm flex items-center gap-2 transition-transform transform hover:scale-105 shadow-[0_0_15px_rgba(226,0,94,0.5)]"
                  >
                    Siguiente <span className="text-lg">⏭️</span>
                  </Link>
                </div>
                {/* Barra de progreso visual */}
                {autoPlayEnabled && countdown > 0 && (
                  <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden mt-1">
                    <div 
                      className="h-full bg-[#e2005e] transition-all duration-1000 ease-linear"
                      style={{ width: `${(countdown / 10) * 100}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* CONTROLES INFERIORES: MODO CINE Y AUTO-PLAY */}
        <div className={`flex items-center justify-between px-2 relative z-10 ${isTheaterMode ? 'text-white' : 'text-gray-400'}`}>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#e2005e] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#e2005e]"></span>
              </span>
              <span className="text-xs font-black tracking-widest uppercase text-gray-300">En Línea</span>
            </div>
            
            {/* TOGGLE MODO MARATÓN */}
            <label className="flex items-center gap-2 cursor-pointer group">
              <div className="relative">
                <input 
                  type="checkbox" 
                  className="sr-only" 
                  checked={autoPlayEnabled} 
                  onChange={() => setAutoPlayEnabled(!autoPlayEnabled)} 
                />
                <div className={`block w-8 h-4 rounded-full transition-colors ${autoPlayEnabled ? 'bg-[#e2005e]' : 'bg-gray-700'}`}></div>
                <div className={`absolute left-1 top-1 bg-white w-2 h-2 rounded-full transition-transform ${autoPlayEnabled ? 'translate-x-4' : ''}`}></div>
              </div>
              <span className="text-xs font-bold tracking-wide group-hover:text-white transition-colors">Auto-Play</span>
            </label>
          </div>

          {/* BOTÓN MODO CINE */}
          <button 
            onClick={() => setIsTheaterMode(!isTheaterMode)}
            className="flex items-center gap-2 hover:text-[#e2005e] transition-colors px-4 py-2 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/10"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
            <span className="text-sm font-bold tracking-wide">{isTheaterMode ? 'Apagar Luces' : 'Modo Cine'}</span>
          </button>
        </div>

        {/* PANEL DE SERVIDORES (GLASSMORPHISM) */}
        <div className={`bg-[#1c1b22]/80 backdrop-blur-xl rounded-xl border border-gray-800 p-5 relative z-10 transition-all duration-500 ${isTheaterMode ? 'shadow-2xl' : ''}`}>
          
          <div className="flex gap-2 mb-5 border-b border-gray-800/60 pb-5 overflow-x-auto custom-scrollbar">
            {availableLanguages.map((lang) => {
              let cleanLang = lang;
              if (lang.toLowerCase().includes('sub')) cleanLang = '🇯🇵 Sub Español';
              if (lang.toLowerCase().includes('lat')) cleanLang = '🇲🇽 Doblaje Latino';

              return (
                <button
                  key={lang}
                  onClick={() => setActiveLanguage(lang)}
                  className={`px-6 py-2.5 rounded-lg font-black text-sm tracking-wider transition-all duration-300 whitespace-nowrap ${
                    activeLanguage === lang
                      ? 'bg-gradient-to-r from-[#e2005e] to-pink-600 text-white shadow-[0_0_20px_rgba(226,0,94,0.4)]'
                      : 'bg-gray-800/40 text-gray-400 hover:bg-gray-700 hover:text-white border border-gray-700/50'
                  }`}
                >
                  {cleanLang}
                </button>
              )
            })}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {servers[activeLanguage]?.map((server) => {
              const info = getServerInfo(server.id);
              return (
                <button
                  key={server.id}
                  onClick={() => setActiveServer(server)}
                  className={`relative flex flex-col items-start p-3 rounded-lg transition-all duration-300 border overflow-hidden group ${
                    activeServer?.id === server.id
                      ? 'bg-blue-900/30 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                      : 'bg-gray-900/50 border-gray-800 hover:border-gray-600 hover:bg-gray-800'
                  }`}
                >
                  {/* Decoración visual de servidor */}
                  <div className={`absolute top-0 right-0 w-8 h-8 opacity-20 transform translate-x-2 -translate-y-2 rounded-full blur-md ${activeServer?.id === server.id ? 'bg-blue-500' : 'bg-transparent group-hover:bg-gray-500'}`}></div>
                  
                  <div className="flex items-center gap-2 w-full mb-1">
                    <span className={`h-2 w-2 rounded-full ${info.color} ${activeServer?.id === server.id ? 'animate-pulse' : ''}`}></span>
                    <span className={`font-black text-xs md:text-sm truncate ${activeServer?.id === server.id ? 'text-white' : 'text-gray-300'}`}>
                      {info.name}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-gray-500 tracking-widest uppercase ml-4">
                    {info.quality}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </>
  );
}
