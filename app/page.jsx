import { getAiringAnimes, getPopularAnimes } from '@/services/jikanApi';
import AnimeGrid from '@/components/InfiniteAnimeGrid';
import Link from 'next/link';

export const revalidate = 3600;

export default async function Home() {
  const [airingAnimes, popularAnimes] = await Promise.all([
    getAiringAnimes(),
    getPopularAnimes()
  ]);

  // Elegimos el anime más épico (con tráiler) para el Banner Principal
  const heroAnime = airingAnimes.find(a => a.trailer?.youtube_id) || airingAnimes[0];

  return (
    <main className="min-h-screen bg-[#0f0e13]">
      
      {/* =========================================
          HERO BANNER CINEMATOGRÁFICO (NETFLIX STYLE)
          ========================================= */}
      {heroAnime && (
        <div className="relative w-full h-[70vh] md:h-[85vh] overflow-hidden">
          {/* Fondo: Video o Imagen escalada */}
          <div className="absolute inset-0 w-full h-full pointer-events-none scale-150 md:scale-125">
            {heroAnime.trailer?.youtube_id ? (
              <iframe
                src={`https://www.youtube.com/embed/${heroAnime.trailer.youtube_id}?autoplay=1&mute=1&controls=0&loop=1&playlist=${heroAnime.trailer.youtube_id}&modestbranding=1`}
                className="w-full h-full opacity-60"
                frameBorder="0"
                allow="autoplay; encrypted-media"
              ></iframe>
            ) : (
              <img 
                src={heroAnime.images?.webp?.large_image_url} 
                className="w-full h-full object-cover opacity-50 blur-sm"
              />
            )}
          </div>

          {/* Viñeta oscura agresiva (Degradado) para leer el texto */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f0e13] via-[#0f0e13]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0f0e13] via-[#0f0e13]/80 to-transparent w-full md:w-2/3" />

          {/* Contenido del Hero */}
          <div className="relative z-10 h-full max-w-7xl mx-auto px-4 flex flex-col justify-end pb-24 md:pb-32">
            <span className="text-[#e2005e] font-black tracking-[0.3em] text-sm md:text-base mb-2 drop-shadow-[0_0_10px_rgba(226,0,94,0.8)] animate-pulse-slow">
              #1 EN TENDENCIA
            </span>
            
            <h1 className="text-5xl md:text-7xl font-black text-white mb-4 line-clamp-2 max-w-3xl" style={{ textShadow: '2px 4px 10px rgba(0,0,0,0.8)' }}>
              {heroAnime.title}
            </h1>
            
            <p className="text-gray-300 max-w-2xl text-sm md:text-lg mb-8 line-clamp-3 md:line-clamp-4 font-medium drop-shadow-md">
              {heroAnime.synopsis || "Explora el anime del que todos están hablando esta temporada. Disfrútalo en la mejor calidad."}
            </p>
            
            <div className="flex items-center gap-4">
              {/* Botón con Micro-interacción de Impacto (scale down al presionar) */}
              <Link 
                href={`/anime/${heroAnime.mal_id}`}
                className="bg-white text-black px-8 py-3 rounded-lg font-black text-lg flex items-center gap-2 hover:bg-gray-200 transition-all active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.3)]"
              >
                <span className="text-2xl">▶</span> Ver Ahora
              </Link>
              
              <button className="bg-gray-800/80 backdrop-blur-md text-white border border-gray-600 px-6 py-3 rounded-lg font-bold text-lg hover:bg-gray-700 hover:border-white transition-all active:scale-95">
                Más Info
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================
          CONTENIDO DE LA PÁGINA (GRIDS)
          ========================================= */}
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-16 relative z-20 -mt-10">
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1.5 h-8 bg-[#e2005e] rounded-full shadow-[0_0_10px_rgba(226,0,94,0.8)]"></div>
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-wide">
              Episodios de Estreno
            </h2>
          </div>
          <AnimeGrid initialAnimes={airingAnimes} />
        </section>

        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1.5 h-8 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.8)]"></div>
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-wide">
              Populares de la Temporada
            </h2>
          </div>
          <AnimeGrid initialAnimes={popularAnimes} />
        </section>
      </div>
    </main>
  );
}
