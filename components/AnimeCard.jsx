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
