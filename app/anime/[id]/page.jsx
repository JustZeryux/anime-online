import { getEpisodeServers } from '@/services/videoApi';
import { getAnimeDetails } from '@/services/jikanApi';
import VideoPlayer from '@/components/VideoPlayer';
import BackButton from '@/components/BackButton';
import Link from 'next/link';
import HistoryTracker from '@/components/HistoryTracker';

// ⚡ CRITICAL FOR CLOUDFLARE PAGES: Force the Edge runtime
export const runtime = 'edge';

export async function generateMetadata({ params }) {
  const { episodeId } = await params;
  const animeId = episodeId.split('-')[0];
  const epNum = episodeId.split('-episodio-')[1];
  
  return {
    title: `Episodio ${epNum} - AnimeOnline`,
    description: `Disfruta del episodio ${epNum} en la mejor calidad.`,
  };
}

export default async function EpisodePage({ params }) {
  const { episodeId } = await params;
  
  // Extract IDs
  const animeId = episodeId.split('-')[0];
  const epNum = parseInt(episodeId.split('-episodio-')[1], 10);

  // Fetch data in parallel
  const [servers, animeDetails] = await Promise.all([
    getEpisodeServers(episodeId),
    getAnimeDetails(animeId)
  ]);

  // Determine Next and Previous episodes
  const totalEpisodes = animeDetails?.episodes || 999; 
  const nextEp = epNum < totalEpisodes ? epNum + 1 : null;
  const prevEp = epNum > 1 ? epNum - 1 : null;

  const imageUrl = animeDetails?.images?.webp?.large_image_url || '';
  const animeTitle = animeDetails?.title || 'Anime';

  return (
    <main className="min-h-screen bg-[#0f0e13] text-white flex flex-col relative">
      
      {/* Background Ambilight (subtle for the whole page) */}
      <div className="absolute top-0 left-0 w-full h-[50vh] pointer-events-none z-0 overflow-hidden">
        {imageUrl && (
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-10 blur-[80px] scale-150 saturate-150"
            style={{ backgroundImage: `url(${imageUrl})` }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f0e13] to-transparent" />
      </div>

      <div className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 flex flex-col gap-6 relative z-10">
        
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-16 md:mt-20">
          <div className="flex items-center gap-4">
             <Link 
                href={`/anime/${animeId}`} 
                className="bg-gray-800/80 hover:bg-gray-700 text-white p-2 rounded-lg transition-colors border border-gray-700 backdrop-blur-sm"
                title="Volver a los episodios"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
            <div>
              <h1 className="text-xl md:text-3xl font-black text-white line-clamp-1 drop-shadow-md">
                {animeTitle}
              </h1>
              <span className="text-[#e2005e] font-bold text-sm tracking-widest uppercase">
                Episodio {epNum}
              </span>
            </div>
          </div>
        </div>

        {/* HISTORY TRACKER 
          Silently records that the user watched this episode 
        */}
        <HistoryTracker 
          episodeId={episodeId} 
          animeId={animeId} 
          animeTitle={animeTitle}
          episodeTitle={`Episodio ${epNum}`}
          image={imageUrl}
        />

        {/* Video Player Component */}
        <div className="w-full">
          <VideoPlayer 
            servers={servers} 
            jikanId={animeId} 
            nextEp={nextEp} 
            coverImage={imageUrl}
          />
        </div>

        {/* Lower Navigation Controls */}
        <div className="flex items-center justify-between bg-[#1c1b22]/80 backdrop-blur-md p-4 rounded-xl border border-gray-800 mt-2">
          {prevEp ? (
            <Link 
              href={`/ver/${animeId}-episodio-${prevEp}`}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group px-4 py-2 hover:bg-gray-800 rounded-lg"
            >
              <span className="text-xl group-hover:-translate-x-1 transition-transform">«</span>
              <span className="font-bold text-sm hidden sm:block">Anterior</span>
            </Link>
          ) : (
            <div className="w-24"></div> // Spacer
          )}

          <Link 
             href={`/anime/${animeId}`} 
             className="text-gray-400 hover:text-[#e2005e] font-black text-sm tracking-widest uppercase transition-colors"
          >
             Lista de Episodios
          </Link>

          {nextEp ? (
            <Link 
              href={`/ver/${animeId}-episodio-${nextEp}`}
              className="flex items-center gap-2 text-white bg-[#e2005e] hover:bg-pink-600 px-6 py-2 rounded-lg transition-all shadow-[0_0_15px_rgba(226,0,94,0.4)] group"
            >
              <span className="font-bold text-sm">Siguiente</span>
              <span className="text-xl group-hover:translate-x-1 transition-transform">»</span>
            </Link>
          ) : (
            <div className="w-24 text-center text-gray-600 font-bold text-sm">Final</div>
          )}
        </div>
        
      </div>
    </main>
  );
}
