// components/SearchBar.jsx
'use client';
import { useState } from 'react';

export default function SearchBar({ onSearch }) {
  const [query, setQuery] = useState('');
  const [onlyLatino, setOnlyLatino] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(query, onlyLatino); // Pasas ambos valores a tu page.jsx
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full max-w-2xl mx-auto">
      <div className="relative flex items-center">
        <input 
          type="text" 
          placeholder="Buscar anime (ej. Jujutsu Kaisen)..." 
          className="w-full bg-[#1c1b22] border border-gray-700 text-white px-5 py-4 rounded-xl focus:outline-none focus:border-[#e2005e] shadow-lg text-lg"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit" className="absolute right-3 bg-[#e2005e] hover:bg-pink-600 p-2 rounded-lg transition-colors">
          🔍
        </button>
      </div>

      {/* Dentro de tu contenedor de la imagen en AnimeCard */}
{anime.hasDub && (
  <div className="absolute top-2 left-2 z-20">
    <span className="bg-gradient-to-r from-blue-600 to-blue-400 text-white text-[10px] font-black tracking-widest px-2 py-1 rounded-md shadow-[0_0_10px_rgba(37,99,235,0.8)] border border-blue-300/30 uppercase flex items-center gap-1">
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
      </svg>
      Latino
    </span>
  </div>
)}

      {/* EL SWITCH ÉPICO */}
      <label className="flex items-center gap-3 cursor-pointer self-end mr-2">
        <div className="relative">
          <input 
            type="checkbox" 
            className="sr-only" 
            checked={onlyLatino} 
            onChange={() => setOnlyLatino(!onlyLatino)} 
          />
          <div className={`block w-10 h-6 rounded-full transition-colors ${onlyLatino ? 'bg-[#e2005e]' : 'bg-gray-700'}`}></div>
          <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${onlyLatino ? 'translate-x-4' : ''}`}></div>
        </div>
        <span className={`text-sm font-bold tracking-wider ${onlyLatino ? 'text-[#e2005e]' : 'text-gray-400'}`}>
          SOLO AUDIO LATINO 🎙️
        </span>
      </label>
    </form>
  );
}
