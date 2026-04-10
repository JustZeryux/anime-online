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

export default function VideoPlayer({ servers, jikanId, nextEp }) {
  const [activeLanguage, setActiveLanguage] = useState('');
  const [activeServer, setActiveServer] = useState(null);
  
  // Estado para controlar si el temporizador del final ya terminó
  const [showNextTimer, setShowNextTimer] = useState(false);

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
      // OJO: Si quieres probarlo rápido para ver si funciona, 
      // cambia el número 1320000 por 5000 (para que salga a los 5 segundos).
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
    <div className="flex flex-col gap-4">
      
      {/* EL REPRODUCTOR */}
      <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-gray-800 group">
        
        {activeServer ? (
          <iframe
            src={activeServer.url}
            className="w-full h-full absolute top-0 left-0"
            frameBorder="0"
            allowFullScreen
            // allow="autoplay; fullscreen" es vital para que en celular rote y se vea bien
            allow="autoplay; fullscreen"
          ></iframe>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <span className="animate-spin text-4xl mb-2 block">⏳</span>
            <p>Cargando reproductor...</p>
          </div>
        )}

        {/* OVERLAY TIPO CRUNCHYROLL: Botón flotante dentro del video */}
        {nextEp && activeServer && (
          <div className={`absolute bottom-16 right-4 z-50 transition-opacity duration-500 pointer-events-none ${
            showNextTimer ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}>
            {/* El botón recupera los clics con pointer-events-auto */}
            <Link 
              href={`/ver/${jikanId}-episodio-${nextEp}`} 
              className="pointer-events-auto bg-black/70 backdrop-blur-md hover:bg-white hover:text-black text-white px-4 py-2 rounded font-bold text-sm flex items-center gap-2 border border-white/20 transition-all shadow-lg"
            >
              Siguiente <span className="text-lg">⏭️</span>
            </Link>
          </div>
        )}
      </div>

      {/* SELECTOR DE IDIOMAS Y SERVIDORES */}
      <div className="bg-[#1c1b22] rounded-xl border border-gray-800 p-4">
        
        {/* PESTAÑAS DE IDIOMA LIMPIAS */}
        <div className="flex gap-2 mb-4 border-b border-gray-800 pb-4 overflow-x-auto custom-scrollbar">
          {availableLanguages.map((lang) => {
            // Limpiamos los nombres de los idiomas
            let cleanLang = lang;
            if (lang.toLowerCase().includes('sub')) cleanLang = '🇯🇵 Japonés (Sub Español)';
            if (lang.toLowerCase().includes('lat')) cleanLang = '🇲🇽 Doblaje Latino';

            return (
              <button
                key={lang}
                onClick={() => setActiveLanguage(lang)}
                className={`px-5 py-2.5 rounded-lg font-black text-sm tracking-wider transition-all whitespace-nowrap ${
                  activeLanguage === lang
                    ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
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
              className={`text-center p-3 rounded-lg transition-all font-bold text-xs md:text-sm border ${
                activeServer?.id === server.id
                  ? 'bg-pink-600 text-white border-pink-500 shadow-lg'
                  : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-500 hover:text-gray-200'
              }`}
            >
              ▶ {getServerName(server.id)}
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}
