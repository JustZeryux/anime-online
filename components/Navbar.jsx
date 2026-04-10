'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AuthButton from './AuthButton';
import InstallPWA from './InstallPWA'; // <-- NUEVA IMPORTACIÓN

export default function Navbar() {
  const [query, setQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/buscar?q=${query}`);
      setIsMenuOpen(false);
    }
  };

  return (
    <nav className="bg-[#151419] border-b border-gray-800 p-4 sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* LOGO */}
        <Link href="/" className="text-2xl font-black text-pink-500 tracking-tighter shrink-0 z-50">
          ANIME<span className="text-white">ONLINE</span>
        </Link>

        {/* BUSCADOR DESKTOP */}
        <form onSubmit={handleSearch} className="hidden md:flex relative max-w-md w-full">
          <input
            type="text"
            placeholder="Buscar anime..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-gray-800 text-white px-4 py-2 pr-10 rounded-full focus:outline-none focus:ring-2 focus:ring-pink-500 border border-gray-700 text-sm"
          />
          <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-pink-500">🔍</button>
        </form>

        {/* ENLACES Y LOGIN DESKTOP */}
        <div className="hidden md:flex items-center gap-6 shrink-0">
          <Link href="/mi-lista" className="text-sm font-semibold text-gray-300 hover:text-pink-500 transition-colors">Mi Lista</Link>
          <Link href="/historial" className="text-sm font-semibold text-gray-300 hover:text-pink-500 transition-colors">Historial</Link>
          
          <div className="w-px h-6 bg-gray-800"></div>

          {/* BOTÓN DE INSTALACIÓN (DESKTOP) */}
          <InstallPWA />

          <AuthButton />
        </div>

        {/* BOTÓN HAMBURGUESA MÓVIL */}
        <button 
          className="md:hidden text-white text-2xl z-50 p-2"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? '✖' : '☰'}
        </button>
      </div>

      {/* MENÚ MÓVIL DESPLEGABLE */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-[#151419] border-b border-gray-800 p-4 flex flex-col gap-4 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-300">
          
          {/* BUSCADOR MÓVIL */}
          <form onSubmit={handleSearch} className="relative w-full">
            <input
              type="text"
              placeholder="Buscar anime..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-gray-800 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 border border-gray-700"
            />
          </form>

          {/* BOTÓN DE INSTALACIÓN (MÓVIL) - Centrado y llamativo */}
          <div className="flex justify-center py-2">
            <InstallPWA />
          </div>

          <div className="flex flex-col gap-3 mt-2 border-t border-gray-800 pt-4">
            <Link 
              href="/mi-lista" 
              onClick={() => setIsMenuOpen(false)} 
              className="text-gray-300 hover:text-pink-500 font-bold p-3 bg-gray-800/50 rounded-lg flex items-center gap-3"
            >
              ❤️ Mi Lista
            </Link>
            <Link 
              href="/historial" 
              onClick={() => setIsMenuOpen(false)} 
              className="text-gray-300 hover:text-pink-500 font-bold p-3 bg-gray-800/50 rounded-lg flex items-center gap-3"
            >
              ▶ Historial
            </Link>
          </div>

          <div className="mt-4 flex justify-center border-t border-gray-800 pt-6 pb-2">
            <AuthButton />
          </div>
        </div>
      )}
    </nav>
  );
}
