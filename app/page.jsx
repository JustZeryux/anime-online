'use client';
import { useState } from 'react';
import InfiniteAnimeGrid from '@/components/InfiniteAnimeGrid';

export default function Home() {
  const [activeTab, setActiveTab] = useState('airing');

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      <h1 className="text-3xl md:text-4xl font-black text-white mb-8">
        Watch <span className="text-pink-500">AnimeOnline</span>
      </h1>

      {/* SISTEMA DE PESTAÑAS (TABS) */}
      <div className="flex flex-wrap gap-4 mb-8 border-b border-gray-800 pb-6">
        <button 
          onClick={() => setActiveTab('airing')}
          className={`px-6 py-2 rounded-full font-bold transition-all shadow-lg ${
            activeTab === 'airing' 
              ? 'bg-pink-600 text-white shadow-pink-500/30' 
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          ⚡ En Emisión
        </button>
        <button 
          onClick={() => setActiveTab('popular')}
          className={`px-6 py-2 rounded-full font-bold transition-all shadow-lg ${
            activeTab === 'popular' 
              ? 'bg-yellow-500 text-white shadow-yellow-500/30' 
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          ⭐ Más Populares
        </button>
        <button 
          onClick={() => setActiveTab('upcoming')}
          className={`px-6 py-2 rounded-full font-bold transition-all shadow-lg ${
            activeTab === 'upcoming' 
              ? 'bg-blue-600 text-white shadow-blue-500/30' 
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          🗓️ Próximamente
        </button>
        <button 
          onClick={() => setActiveTab('nsfw')}
          className={`px-6 py-2 rounded-full font-bold transition-all shadow-lg ${
            activeTab === 'nsfw' 
              ? 'bg-red-600 text-white shadow-red-500/30' 
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          🔞 NSFW
        </button>
      </div>

      {/* AQUÍ ESTÁ LA SOLUCIÓN:
        La propiedad key={activeTab} fuerza a React a destruir y recrear 
        el componente cada vez que el valor de activeTab cambia. 
        Así se limpia el estado interno de la grilla anterior.
      */}
      <InfiniteAnimeGrid key={activeTab} type={activeTab} />
      
    </main>
  );
}