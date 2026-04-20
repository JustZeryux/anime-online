'use client';
import Link from 'next/link';
import { useState, useRef } from 'react';

export default function AnimeCard({ anime }) {
  const cardRef = useRef(null);
  const [tiltStyle, setTiltStyle] = useState({});
  const [glowStyle, setGlowStyle] = useState({ opacity: 0 });

  if (!anime) return null;

  // Lógica matemática para el efecto 3D Parallax
  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left; // Posición X del ratón dentro de la tarjeta
    const y = e.clientY - rect.top;  // Posición Y del ratón dentro de la tarjeta
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // Calculamos la rotación (máximo 15 grados)
    const rotateX = ((y - centerY) / centerY) * -15;
    const rotateY = ((x - centerX) / centerX) * 15;

    setTiltStyle({
      transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`,
      transition: 'transform 0.1s ease-out'
    });

    // Brillo dinámico (Glare) que sigue el cursor
    setGlowStyle({
      opacity: 1,
      background: `radial-gradient(circle at ${x}px ${y}px, rgba(255,255,255,0.2) 0%, transparent 50%)`
    });
  };

  const handleMouseLeave = () => {
    setTiltStyle({
      transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
      transition: 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)' // Retorno suave
    });
    setGlowStyle({ opacity: 0, transition: 'opacity 0.5s ease' });
  };

  const imageUrl = anime.images?.webp?.large_image_url || 'https://via.placeholder.com/225x318?text=Sin+Imagen';
  
  return (
    <Link href={`/anime/${anime.mal_id}`} className="group cursor-pointer flex flex-col h-full perspective-1000">
      <div 
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={tiltStyle}
        className="relative overflow-hidden rounded-xl aspect-[3/4] shadow-[0_10px_20px_rgba(0,0,0,0.5)] border border-white/5 z-10"
      >
        {/* Capa de Brillo Dinámico (Glare) */}
        <div 
          className="absolute inset-0 z-30 pointer-events-none mix-blend-overlay"
          style={glowStyle}
        />

        <img 
          src={imageUrl} 
          alt={anime.title || 'Anime'} 
          className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
        />
        
        {/* BADGE AUDIO LATINO */}
        {anime.hasDub && (
          <div className="absolute top-2 left-2 z-40 transform translate-z-10">
            <span className="bg-gradient-to-r from-blue-600 to-blue-400 text-white text-[10px] font-black tracking-widest px-2 py-1 rounded-md shadow-[0_0_15px_rgba(37,99,235,0.8)] border border-blue-300/30 uppercase flex items-center gap-1">
              🎙️ Latino
            </span>
          </div>
        )}

        <div className="absolute top-2 right-2 flex flex-col gap-1 z-40">
          {anime.year && (
            <span className="bg-[#e2005e]/90 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded shadow">
              {anime.year}
            </span>
          )}
        </div>

        {/* Gradiente oscuro inferior interactivo */}
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black via-black/60 to-transparent flex flex-col justify-end p-3 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 z-20">
           <span className="text-xs font-black tracking-widest text-[#e2005e] uppercase opacity-0 group-hover:opacity-100 transition-opacity delay-100 drop-shadow-[0_0_8px_rgba(226,0,94,0.8)]">
             Ver Detalles ▶
           </span>
        </div>
      </div>
      
      <h2 className="mt-3 text-sm font-bold line-clamp-2 text-gray-300 group-hover:text-white transition-colors">
        {anime.title}
      </h2>
    </Link>
  );
}
