import { getAnimeDetails } from '@/services/jikanApi';
import Link from 'next/link';
import BackButton from '@/components/BackButton';
import FavoriteButton from '@/components/FavoriteButton';

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  
  try {
    const anime = await getAnimeDetails(id);
    if (!anime) return { title: 'Anime no encontrado - AnimeOnline' };

    return {
      title: `Ver ${anime.title} Sub Español - AnimeOnline`,
      description: anime.synopsis?.substring(0, 160) + '...',
    };
  } catch (error) {
    return { title: 'AnimeOnline - Error' };
  }
}

export default async function AnimeDetailsPage({ params }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;

  const anime = await getAnimeDetails(id);

  if (!anime || !anime.title) {
    return (
      <div className="min-h-screen bg-[#1c1b22] flex flex-col items-center justify-center text-white relative">
        <BackButton />
        <span className="text-6xl mb-4 block">🚧</span>
        <h1 className="text-2xl font-bold text-gray-500 mb-6">Error de conexión con la base de datos</h1>
      </div>
    );
  }

  // GENERADOR INVENCIBLE DE EPISODIOS
  let episodiosNombres = {};
  let totalEpisodiosAPI = 0;

  try {
    const epRes = await fetch(`https://api.jikan.moe/v4/anime/${id}/episodes`, { next: { revalidate: 3600 } });
    if (epRes.ok) {
      const epData = await epRes.json();
      if (epData.data) {
        totalEpisodiosAPI = epData.data.length;
        epData.data.forEach(ep => {
          episodiosNombres[ep.mal_id] = ep.title;
        });
      }
    }
  } catch (error) {
    console.error("⚠️ Falló API de episodios");
  }

  let totalEps = anime.episodes;
  if (!totalEps) {
    totalEps = totalEpisodiosAPI > 0 ? totalEpisodiosAPI : 12;
  }

  const episodios = Array.from({ length: totalEps }, (_, i) => {
    const num = i + 1;
    return {
      mal_id: num,
      title: episodiosNombres[num] || `Episodio ${num}`
    };
  });

  const bannerImage = 
    anime.trailer?.images?.maximum_image_url || 
    anime.trailer?.images?.large_image_url || 
    anime.images?.webp?.large_image_url;

  return (
    <main className="min-h-screen bg-[#151419] text-white relative">
      
      <BackButton />

      {/* HEADER CON BANNER */}
      <div className="relative w-full h-[40vh] md:h-[50vh]">
        <div className="absolute inset-0 bg-[#1c1b22]">
          {bannerImage && (
            <img 
              src={bannerImage} 
              alt="Banner" 
              className="w-full h-full object-cover opacity-40 blur-sm mix-blend-screen"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#151419] via-[#151419]/80 to-transparent"></div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-32 relative z-10 pb-12">
        <div className="flex flex-col md:flex-row gap-8">
          {/* PORTADA */}
          <div className="w-48 md:w-64 flex-shrink-0 mx-auto md:mx-0">
            <div className="rounded-xl overflow-hidden shadow-2xl border-4 border-[#1c1b22]">
              <img src={anime.images?.webp?.large_image_url} alt={anime.title} className="w-full h-auto object-cover"/>
            </div>
          </div>

          {/* INFO DEL ANIME */}
          <div className="flex-grow pt-4 text-center md:text-left">
            <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-3">
              <span className="bg-pink-600 text-white text-xs font-bold px-3 py-1 rounded-full">{anime.status || 'Desconocido'}</span>
              <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase">{anime.type || 'TV'}</span>
              <span className="bg-yellow-500 text-black text-xs font-bold px-3 py-1 rounded-full">⭐ {anime.score || 'N/A'}</span>
            </div>

            {/* BOTÓN DE FAVORITOS */}
            <div className="flex justify-center md:justify-start mb-4">
              <FavoriteButton 
                animeId={id} 
                animeTitle={anime.title} 
                animeImage={anime.images?.webp?.large_image_url} 
              />
            </div>

            <h1 className="text-3xl md:text-5xl font-black mb-2 text-white">{anime.title}</h1>
            <p className="text-gray-400 font-medium mb-6">{anime.title_english}</p>
            <div className="bg-[#1c1b22] p-4 rounded-xl border border-gray-800 mb-6 text-sm text-gray-300 leading-relaxed max-h-48 overflow-y-auto">
              {anime.synopsis || "No hay sinopsis disponible en este momento."}
            </div>
          </div>
        </div>

        {/* LISTA DE EPISODIOS */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-pink-600 flex items-center justify-center text-sm">▶</span>
            Episodios Disponibles ({episodios.length})
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
            {episodios.map((ep) => (
              <Link 
                href={`/ver/${id}-episodio-${ep.mal_id}`} 
                key={ep.mal_id}
                className="flex items-center gap-4 bg-[#1c1b22] hover:bg-gray-800 border border-gray-800 hover:border-pink-500 p-3 rounded-xl transition-all group shadow-md"
              >
                <div className="text-3xl font-black text-gray-700 group-hover:text-pink-500 transition-colors w-14 text-center">
                  {ep.mal_id}
                </div>
                <div className="flex-1 border-l border-gray-700 pl-4">
                  <h3 className="text-sm font-bold text-gray-200 line-clamp-1 group-hover:text-white transition-colors">
                    {ep.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] bg-pink-600/20 text-pink-400 px-2 py-0.5 rounded font-bold uppercase tracking-wider">Sub Español</span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-pink-600/10 flex items-center justify-center group-hover:bg-pink-600 transition-colors">
                  <span className="text-pink-500 group-hover:text-white text-sm">▶</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}