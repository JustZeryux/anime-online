import { getAnimeDetails, getAnimeEpisodes } from '@/services/jikanApi';
import Link from 'next/link';

// ⚡ CRÍTICO PARA CLOUDFLARE PAGES: Forzar el Edge runtime
export const runtime = 'edge';

// 🛡️ BLINDAJE: Si la API falla al buscar el título, no crashea la página
export async function generateMetadata({ params }) {
  try {
    const { id } = await params;
    const anime = await getAnimeDetails(id);
    return {
      title: anime ? `${anime.title} - AnimeOnline` : 'Cargando Anime...',
      description: anime?.synopsis || 'Mira este anime en la mejor calidad.',
    };
  } catch (error) {
    return {
      title: 'AnimeOnline - Detalles',
      description: 'Mira los mejores animes en alta calidad.',
    };
  }
}

export default async function AnimeDetailsPage({ params }) {
  const { id } = await params; 
  
  let anime = null;
  let episodes = [];

  // 🛡️ BLINDAJE PRINCIPAL: Evita el Crash si Cloudflare corta la conexión
  try {
    const [fetchedAnime, fetchedEpisodes] = await Promise.all([
      getAnimeDetails(id),
      getAnimeEpisodes(id)
    ]);
    anime = fetchedAnime;
    episodes = fetchedEpisodes || [];
  } catch (error) {
    console.error("Error cargando detalles del anime:", error);
  }

  if (!anime) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0f0e13] text-white">
        <span className="text-6xl mb-4 text-gray-600">📡</span>
        <h1 className="text-3xl font-black mb-2">Señal Perdida</h1>
        <p className="text-gray-400">No pudimos cargar la información de este anime.</p>
        <Link href="/" className="mt-6 bg-[#e2005e] px-6 py-2 rounded font-bold hover:bg-pink-600 transition-colors shadow-lg shadow-pink-500/30">
          Volver al Inicio
        </Link>
      </div>
    );
  }

  const imageUrl = anime.images?.webp?.large_image_url || 'https://via.placeholder.com/400x600?text=Sin+Imagen';

  return (
    <main className="min-h-screen bg-[#0f0e13] relative overflow-hidden pb-20">
      
      {/* =========================================
          EFECTO AMBILIGHT DE FONDO (CINEMÁTICO)
          ========================================= */}
      <div className="absolute top-0 left-0 w-full h-[80vh] pointer-events-none z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20 blur-[100px] scale-150 saturate-150"
          style={{ backgroundImage: `url(${imageUrl})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f0e13] via-[#0f0e13]/80 to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-4 pt-24 relative z-10">
        
        {/* BOTÓN VOLVER */}
        <div className="mb-6">
          <Link href="/" className="text-gray-400 hover:text-white flex items-center gap-2 font-bold transition-colors w-fit">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver
          </Link>
        </div>

        {/* =========================================
            SECCIÓN DE INFORMACIÓN (HERO)
            ========================================= */}
        <div className="flex flex-col md:flex-row gap-8 md:gap-12 mb-16">
          
          {/* POSTER 3D */}
          <div className="w-48 sm:w-64 md:w-80 shrink-0 mx-auto md:mx-0 perspective-1000">
            <div className="relative rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-white/10 transform transition-transform duration-500 hover:scale-105">
              <img 
                src={imageUrl} 
                alt={anime.title} 
                className="w-full h-auto object-cover"
              />
              {/* Etiqueta Latino si viene del clonador */}
              {anime.hasDub && (
                <div className="absolute top-3 left-3">
                  <span className="bg-gradient-to-r from-blue-600 to-blue-400 text-white text-xs font-black tracking-widest px-3 py-1.5 rounded-lg shadow-[0_0_15px_rgba(37,99,235,0.8)] border border-blue-300/30 uppercase flex items-center gap-2">
                    🎙️ Audio Latino
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* DETALLES Y SINOPSIS */}
          <div className="flex-1 flex flex-col justify-center">
            
            {/* ETIQUETAS DE ESTADO */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className={`px-3 py-1 text-xs font-black rounded tracking-widest uppercase ${
                anime.status === 'Currently Airing' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 
                'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              }`}>
                {anime.status === 'Currently Airing' ? 'En Emisión' : 'Finalizado'}
              </span>
              <span className="bg-gray-800 text-gray-300 px-3 py-1 rounded text-xs font-bold uppercase tracking-wider">
                ⭐ {anime.score || 'N/A'}
              </span>
              <span className="bg-gray-800 text-gray-300 px-3 py-1 rounded text-xs font-bold uppercase tracking-wider">
                {anime.year || anime.type || 'TV'}
              </span>
            </div>

            <h1 className="text-4xl md:text-6xl font-black text-white mb-4 leading-tight" style={{ textShadow: '2px 4px 10px rgba(0,0,0,0.5)' }}>
              {anime.title}
            </h1>
            
            <div className="flex flex-wrap gap-2 mb-6">
              {anime.genres?.map(genre => (
                <span key={genre.mal_id} className="text-[#e2005e] text-sm font-bold tracking-wider">
                  #{genre.name}
                </span>
              ))}
            </div>

            <p className="text-gray-300 text-base md:text-lg leading-relaxed mb-8 max-w-3xl font-medium">
              {anime.synopsis || "No hay sinopsis disponible para este anime."}
            </p>

            {/* BOTÓN PRINCIPAL */}
            <div className="flex items-center gap-4">
              <Link 
                href={`/ver/${id}-episodio-1`}
                className="bg-[#e2005e] hover:bg-pink-600 text-white px-8 py-4 rounded-xl font-black text-lg tracking-widest uppercase flex items-center gap-3 transition-transform transform hover:scale-105 shadow-[0_0_20px_rgba(226,0,94,0.4)]"
              >
                <span className="text-2xl">▶</span> Ver Episodio 1
              </Link>
            </div>
          </div>
        </div>

        {/* =========================================
            LISTA DE EPISODIOS
            ========================================= */}
        <section className="mt-12">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-1.5 h-8 bg-[#e2005e] rounded-full shadow-[0_0_10px_rgba(226,0,94,0.8)]"></div>
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-wide">
              Episodios Disponibles
            </h2>
            <span className="ml-2 text-gray-500 font-bold">({episodes.length})</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {episodes.map((ep) => (
              <Link 
                key={ep.mal_id}
                href={`/ver/${id}-episodio-${ep.mal_id}`} 
                className="group relative bg-[#1c1b22] border border-gray-800 hover:border-[#e2005e] rounded-xl p-4 flex flex-col justify-center transition-all overflow-hidden shadow-lg hover:shadow-[0_0_20px_rgba(226,0,94,0.2)]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#e2005e]/0 via-[#e2005e]/5 to-[#e2005e]/0 transform -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                
                <span className="text-[#e2005e] font-black text-xs tracking-widest uppercase mb-1">
                  Episodio {ep.mal_id}
                </span>
                <span className="text-gray-300 font-bold text-sm line-clamp-1 group-hover:text-white transition-colors relative z-10">
                  {ep.title}
                </span>
              </Link>
            ))}
          </div>
        </section>

      </div>
    </main>
  );
}
