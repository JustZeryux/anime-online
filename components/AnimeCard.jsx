import Link from 'next/link';

export default function AnimeCard({ anime }) {
  // 🛡️ ESCUDO PROTECTOR: Si la API falla y manda un anime nulo, no renderiza nada y evita el crash.
  if (!anime) return null;

  // Manejo de errores por si la API de Jikan devuelve un dato incompleto
  const imageUrl = anime.images?.webp?.large_image_url || 'https://via.placeholder.com/225x318?text=Sin+Imagen';
  
  return (
    <Link href={`/anime/${anime.mal_id}`} className="group cursor-pointer flex flex-col h-full">
      <div className="relative overflow-hidden rounded-lg aspect-[3/4] shadow-md border border-gray-800">
        <img 
          src={imageUrl} 
          alt={anime.title || 'Anime'} 
          className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        
        {/* =========================================
            BADGE ÉPICO DE AUDIO LATINO 🎙️
            ========================================= */}
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

        {/* Etiquetas de tipo o estado flotantes */}
        <div className="absolute top-2 right-2 flex flex-col gap-1 z-20">
          {anime.year && (
            <span className="bg-[#e2005e]/90 text-white text-[10px] font-bold px-2 py-1 rounded shadow">
              {anime.year}
            </span>
          )}
          {anime.type && (
            <span className="bg-blue-600/90 text-white text-[10px] font-bold px-2 py-1 rounded shadow uppercase">
              {anime.type}
            </span>
          )}
        </div>

        {/* Gradiente oscuro en la parte inferior para que el texto resalte */}
        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/90 to-transparent pt-6 text-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
           <span className="text-xs font-bold text-[#e2005e]">Ver Detalles</span>
        </div>
      </div>
      
      <h2 className="mt-2 text-sm font-medium line-clamp-2 group-hover:text-[#e2005e] transition-colors">
        {anime.title}
      </h2>
    </Link>
  );
}
