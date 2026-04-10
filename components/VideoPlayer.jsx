'use client';
import { useState, useEffect } from 'react';

export default function VideoPlayer({ servers }) {
  const [activeLanguage, setActiveLanguage] = useState('subtitulado');
  const [activeServer, setActiveServer] = useState(null);

  useEffect(() => {
    if (servers[activeLanguage] && servers[activeLanguage].length > 0) {
      setActiveServer(servers[activeLanguage][0]);
    } else {
      setActiveServer(null);
    }
  }, [activeLanguage, servers]);

  return (
    <div className="flex flex-col gap-4">
      
      {/* Banner de Advertencia de Anuncios */}
      <div className="bg-blue-900/30 border border-blue-500/50 text-blue-200 p-3 rounded-lg flex items-start gap-3 text-sm">
        <span className="text-xl">🛡️</span>
        <div>
          <p className="font-bold text-blue-100">Recomendación para una mejor experiencia</p>
          <p className="text-blue-300/80 mt-1">
            Los reproductores contienen anuncios integrados de terceros. Te recomendamos usar navegadores como <strong>Brave</strong> o extensiones como <strong>uBlock Origin</strong> para bloquearlos por completo.
          </p>
        </div>
      </div>
      
      {/* EL REPRODUCTOR (SIN SANDBOX) */}
      <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-gray-800">
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
            <span className="text-4xl mb-2 block">🔌</span>
            <p>No se encontraron servidores para este episodio.</p>
          </div>
        )}
      </div>

      {/* SELECTOR DE SERVIDORES */}
      <div className="bg-[#1c1b22] rounded-xl border border-gray-800 p-4 mt-2">
        <h3 className="text-lg font-bold text-gray-200 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 bg-pink-500 rounded-full animate-pulse"></span>
          Servidores Disponibles
        </h3>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {servers[activeLanguage]?.map((server) => (
            <button
              key={server.id}
              onClick={() => setActiveServer(server)}
              className={`text-center p-3 rounded-lg transition-all font-bold text-sm ${
                activeServer?.id === server.id
                  ? 'bg-pink-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {server.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}