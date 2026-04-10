import Link from 'next/link';

export default function AnimeCard({ anime }) {
  // Manejo de errores por si la API de Jikan devuelve un dato incompleto
  const imageUrl = anime.images?.webp?.large_image_url || 'https://via.placeholder.com/225x318?text=Sin+Imagen';
  
  return (
    <Link href={`/anime/${anime.mal_id}`} className="group cursor-pointer flex flex-col h-full">
      <div className="relative overflow-hidden rounded-lg aspect-[3/4] shadow-md border border-gray-800">
        <img 
          src={imageUrl} 
          alt={anime.title} 
          className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        
        {/* Etiquetas de tipo o estado flotantes */}
        <div className="absolute top-2 right-2 flex flex-col gap-1">
          {anime.year && (
            <span className="bg-pink-600/90 text-white text-[10px] font-bold px-2 py-1 rounded shadow">
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
        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/90 to-transparent pt-6 text-center opacity-0 group-hover:opacity-100 transition-opacity">
           <span className="text-xs font-bold text-pink-400">Ver Detalles</span>
        </div>
      </div>
      
      <h2 className="mt-2 text-sm font-medium line-clamp-2 group-hover:text-pink-500 transition-colors">
        {anime.title}
      </h2>
    </Link>
  );
}