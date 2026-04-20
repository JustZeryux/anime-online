'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

// Diccionario para limpiar los nombres feos de los servidores
const getServerName = (id) => {
  const names = {
    flv: 'Servidor Alfa',
    sbfull: 'Servidor Beta',
    mega: 'Mega Premium',
    okru: 'OkRu HD',
    fembed: 'F-Embed',
    stape: 'StreamTape'
  };
  return names[id?.toLowerCase()] || `Servidor ${id?.toUpperCase()}`;
};

export default function VideoPlayer({ servers, jikanId, nextEp, coverImage }) {
  const [activeLanguage, setActiveLanguage] = useState('');
  const [activeServer, setActiveServer] = useState(null);
  
  // Estado para controlar si el temporizador del final ya terminó
  const [showNextTimer, setShowNextTimer] = useState(false);
  
  // Estado para el Modo Cine Volumétrico
  const [isTheaterMode, setIsTheaterMode] = useState(false);

  const availableLanguages = servers ? Object.keys(servers).filter(lang => servers[lang] && servers[lang].length > 0) : [];

  useEffect(() => {
    if (availableLanguages.length > 0 && !availableLanguages.includes(activeLanguage)) {
      setActiveLanguage(availableLanguages[0]);
    }
  }, [servers]);

  useEffect(() => {
    if (servers && activeLanguage && servers[activeLanguage]?.length > 0) {
      setActiveServer(servers[activeLanguage][0]);
    } else {
      setActiveServer(null);
    }
  }, [activeLanguage, servers]);

  // TEMPORIZADOR INTELIGENTE (Aparece el botón al final del capítulo)
  useEffect(() => {
    // Si cambiamos de servidor o de episodio, ocultamos el botón de nuevo
    setShowNextTimer(false);

    if (activeServer && nextEp) {
      // 22 minutos = 1,320,000 milisegundos.
      const timer = setTimeout(() => {
        setShowNextTimer(true);
      }, 1320000); 

      // Limpiamos el temporizador si el usuario sale de la página
      return () => clearTimeout(timer);
    }
  }, [activeServer, nextEp]);

  if (!servers || availableLanguages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-[#111] rounded-xl border border-gray-800 text-gray-500">
        <span className="text-4xl mb-2 block">🔌</span>
        <p>No se encontraron servidores para este episodio.</p>
      </div>
    );
  }

  return (
    <>
      {/* CAPA DE OSCURIDAD MODO CINE */}
      {isTheaterMode && (
        <div 
          className="fixed inset-0 bg-black/95 z-40 transition-opacity duration-700 backdrop-blur-sm"
          onClick={() => setIsTheaterMode(false)}
        />
      )}

      <div className={`flex flex-col gap-4 relative transition-all duration-700 ${isTheaterMode ? 'z-50 max-w-6xl mx-auto scale-[1.02] mt-8' : ''}`}>
        
        {/* EL REPRODUCTOR CON AMBILIGHT */}
        <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/5 group">
          
          {/* EFECTO AMBILIGHT VOLUMÉTRICO */}
          {coverImage && (
            <div className="absolute inset-0 -inset-y-12 z-0 overflow-hidden pointer-events-none">
              <div 
                className="absolute inset-0 bg-cover bg-center opacity-60 blur-[60px] scale-150 animate-pulse-slow"
                style={{ backgroundImage: `url(${coverImage})` }}
              />
              {/* Degradado para fundir los bordes con el diseño */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />
            </div>
          )}

          {/* CONTENEDOR DEL IFRAME */}
          <div className="relative z-10 w-full h-full bg-black">
            {activeServer ? (
              <iframe
                src={activeServer.url}
                className="w-full h-full absolute top-0 left-0"
                frameBorder="0"
                allowFullScreen
                allow="autoplay; fullscreen"
              ></iframe>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <span className="animate-spin text-4xl mb-2 block">⏳</span>
                <p>Cargando reproductor...</p>
              </div>
            )}
          </div>

          {/* OVERLAY TIPO CRUNCHYROLL: Botón flotante dentro del video */}
          {nextEp && activeServer && (
            <div className={`absolute bottom-16 right-4 z-50 transition-opacity duration-500 pointer-events-none ${
              showNextTimer ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}>
              {/* El botón recupera los clics con pointer-events-auto */}
              <Link 
                href={`/ver/${jikanId}-episodio-${nextEp}`} 
                className="pointer-events-auto bg-black/70 backdrop-blur-md hover:bg-[#e2005e] hover:text-white text-white px-5 py-3 rounded-lg font-bold text-sm flex items-center gap-2 border border-white/10 transition-all duration-300 transform hover:scale-105 shadow-[0_0_20px_rgba(0,0,0,0.5)]"
              >
                Siguiente <span className="text-lg">⏭️</span>
              </Link>
            </div>
          )}
        </div>

        {/* BARRA DE HERRAMIENTAS: MODO CINE */}
        <div className={`flex items-center justify-between px-2 relative z-10 ${isTheaterMode ? 'text-white' : 'text-gray-400'}`}>
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#e2005e] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#e2005e]"></span>
            </span>
            <span className="text-xs font-bold tracking-widest uppercase">Motor de Video Optimizado</span>
          </div>

          <button 
            onClick={() => setIsTheaterMode(!isTheaterMode)}
            className="flex items-center gap-2 hover:text-[#e2005e] transition-colors px-4 py-2 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/10"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
            <span className="text-sm font-bold tracking-wide">{isTheaterMode ? 'Apagar Modo Cine' : 'Modo Cine'}</span>
          </button>
        </div>

        {/* SELECTOR DE IDIOMAS Y SERVIDORES */}
        <div className={`bg-[#1c1b22]/90 backdrop-blur-lg rounded-xl border border-gray-800 p-4 relative z-10 transition-all duration-500 ${isTheaterMode ? 'shadow-2xl' : ''}`}>
          
          {/* PESTAÑAS DE IDIOMA LIMPIAS */}
          <div className="flex gap-2 mb-4 border-b border-gray-800/50 pb-4 overflow-x-auto custom-scrollbar">
            {availableLanguages.map((lang) => {
              // Limpiamos los nombres de los idiomas
              let cleanLang = lang;
              if (lang.toLowerCase().includes('sub')) cleanLang = '🇯🇵 Japonés (Sub Español)';
              if (lang.toLowerCase().includes('lat')) cleanLang = '🇲🇽 Doblaje Latino';

              return (
                <button
                  key={lang}
                  onClick={() => setActiveLanguage(lang)}
                  className={`px-6 py-2.5 rounded-lg font-black text-sm tracking-wider transition-all duration-300 whitespace-nowrap ${
                    activeLanguage === lang
                      ? 'bg-[#e2005e] text-white shadow-[0_0_15px_rgba(226,0,94,0.4)]'
                      : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  {cleanLang}
                </button>
              )
            })}
          </div>

          {/* LISTA DE SERVIDORES CON NOMBRES PREMIUM */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {servers[activeLanguage]?.map((server) => (
              <button
                key={server.id}
                onClick={() => setActiveServer(server)}
                className={`text-center p-3 rounded-lg transition-all duration-300 font-bold text-xs md:text-sm border overflow-hidden relative group ${
                  activeServer?.id === server.id
                    ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white border-blue-400 shadow-[0_0_15px_rgba(37,99,235,0.3)]'
                    : 'bg-gray-800/50 text-gray-400 border-gray-700/50 hover:border-gray-500 hover:text-gray-200 hover:bg-gray-800'
                }`}
              >
                <div className="relative z-10 flex items-center justify-center gap-2">
                  <span className="text-[10px]">▶</span> {getServerName(server.id)}
                </div>
              </button>
            ))}
          </div>
        </div>

      </div>
    </>
  );
}
