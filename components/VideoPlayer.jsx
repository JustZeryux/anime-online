'use client';
import { useState, useEffect, useRef } from 'react';

export default function VideoPlayer({ servers }) {
  const [activeLanguage, setActiveLanguage] = useState('');
  const [activeServer, setActiveServer] = useState(null);
  const playerRef = useRef(null);

  // Extraemos dinámicamente los idiomas que vienen en la API (ej: ['subtitulado', 'latino'])
  const availableLanguages = servers ? Object.keys(servers).filter(lang => servers[lang] && servers[lang].length > 0) : [];

  // Configurar idioma por defecto al cargar
  useEffect(() => {
    if (availableLanguages.length > 0 && !availableLanguages.includes(activeLanguage)) {
      setActiveLanguage(availableLanguages[0]);
    }
  }, [servers]);

  // Cambiar el servidor activo cuando se cambia de idioma
  useEffect(() => {
    if (servers && activeLanguage && servers[activeLanguage]?.length > 0) {
      setActiveServer(servers[activeLanguage][0]);
    } else {
      setActiveServer(null);
    }
  }, [activeLanguage, servers]);

  // Función para forzar pantalla completa en nuestro contenedor, ignorando el iframe
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      if (playerRef.current?.requestFullscreen) playerRef.current.requestFullscreen();
      else if (playerRef.current?.webkitRequestFullscreen) playerRef.current.webkitRequestFullscreen(); // Safari
      else if (playerRef.current?.msRequestFullscreen) playerRef.current.msRequestFullscreen(); // IE11
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  };

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
      
      {/* Banner de Advertencia de Anuncios */}
      <div className="bg-blue-900/30 border border-blue-500/50 text-blue-200 p-3 rounded-lg flex items-start gap-3 text-sm">
        <span className="text-xl">🛡️</span>
        <div>
          <p className="font-bold text-blue-100">Recomendación antibloqueos</p>
          <p className="text-blue-300/80 mt-1">
            Los reproductores contienen anuncios integrados que no podemos quitar. Te recomendamos usar <strong>Brave Browser</strong> o instalar <strong>uBlock Origin</strong>.
          </p>
        </div>
      </div>
      
      {/* NUESTRO CONTENEDOR DEL REPRODUCTOR (El que se hace grande) */}
      <div ref={playerRef} className="w-full bg-black rounded-xl overflow-hidden shadow-2xl border border-gray-800 flex flex-col">
        
        {/* El IFRAME del video */}
        <div className="relative w-full aspect-video">
          {activeServer ? (
            <iframe
              src={activeServer.url}
              className="w-full h-full absolute top-0 left-0"
              frameBorder="0"
              allowFullScreen
              scrolling="no"
            ></iframe>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <span className="animate-spin text-4xl mb-2 block">⏳</span>
              <p>Cargando reproductor...</p>
            </div>
          )}
        </div>

        {/* BARRA DE CONTROLES PROPIA (Aislada de los anuncios del iframe) */}
        <div className="bg-[#0f0e13] border-t border-gray-800 px-4 py-2 flex justify-between items-center">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider hidden sm:block">
            Servidor: <span className="text-pink-500">{activeServer?.id || 'Desconocido'}</span>
          </span>
          <button 
            onClick={toggleFullScreen}
            className="bg-gray-800 hover:bg-pink-600 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-colors ml-auto shadow-md"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
            </svg>
            Pantalla Completa
          </button>
        </div>
      </div>

      {/* SELECTOR DE IDIOMAS Y SERVIDORES */}
      <div className="bg-[#1c1b22] rounded-xl border border-gray-800 p-4 mt-2">
        
        {/* PESTAÑAS DE IDIOMA */}
        <div className="flex gap-2 mb-4 border-b border-gray-800 pb-4 overflow-x-auto custom-scrollbar">
          {availableLanguages.map((lang) => (
            <button
              key={lang}
              onClick={() => setActiveLanguage(lang)}
              className={`px-5 py-2.5 rounded-lg font-black text-sm uppercase tracking-wider transition-all whitespace-nowrap ${
                activeLanguage === lang
                  ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
            >
              {/* Emojis automáticos según el idioma */}
              {lang.toLowerCase().includes('sub') ? '🇯🇵 ' : ''}
              {lang.toLowerCase().includes('lat') ? '🇲🇽 ' : ''}
              {lang.toLowerCase().includes('cast') ? '🇪🇸 ' : ''}
              {lang.toLowerCase().includes('ing') ? '🇺🇸 ' : ''}
              {lang}
            </button>
          ))}
        </div>

        {/* LISTA DE SERVIDORES PARA EL IDIOMA SELECCIONADO */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {servers[activeLanguage]?.map((server) => (
            <button
              key={server.id}
              onClick={() => setActiveServer(server)}
              className={`text-center p-3 rounded-lg transition-all font-bold text-sm border ${
                activeServer?.id === server.id
                  ? 'bg-pink-600 text-white border-pink-500 shadow-lg'
                  : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-500 hover:text-gray-200'
              }`}
            >
              ▶ {server.title || server.id}
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}
