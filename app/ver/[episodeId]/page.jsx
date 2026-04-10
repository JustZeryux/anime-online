import { getEpisodeServers } from '@/services/videoApi';
import { getAnimeDetails } from '@/services/jikanApi';
import VideoPlayer from '@/components/VideoPlayer';
import Link from 'next/link';
import HistoryTracker from '@/components/HistoryTracker';
import DisqusComments from '@/components/DisqusComments';
export const runtime = 'edge';

export default async function EpisodePage({ params }) {
  const resolvedParams = await params;
  const { episodeId } = resolvedParams; 
  
  const servers = await getEpisodeServers(episodeId);

  const partes = episodeId.split('-episodio-');
  const jikanId = partes[0];
  const epNum = parseInt(partes[1] || '1');

  const prevEp = epNum > 1 ? epNum - 1 : null;
  const nextEp = epNum + 1;

  const anime = await getAnimeDetails(jikanId);
  const realTitle = anime?.title || episodeId.replace(/-/g, ' ').toUpperCase();
  const animeImage = anime?.images?.webp?.large_image_url || 'https://via.placeholder.com/300x170?text=Sin+Imagen';

  return (
    <main className="min-h-screen bg-[#1c1b22] text-white p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        
        <div className="flex justify-between items-center mb-6">
          <Link href={`/anime/${jikanId}`} className="text-pink-500 hover:text-pink-400 font-semibold flex items-center gap-2 transition-colors">
            ← Volver al anime
          </Link>
          <div className="text-right">
             <h1 className="text-sm md:text-xl font-bold text-white truncate max-w-[200px] md:max-w-md">
              {realTitle}
            </h1>
            <p className="text-pink-500 text-xs font-black tracking-widest uppercase">Episodio {epNum}</p>
          </div>
        </div>

        {/* Rastreador de historial */}
        <HistoryTracker 
          episodeId={episodeId} 
          animeTitle={realTitle} 
          animeImage={animeImage} 
          epNum={epNum.toString()} 
        />

        <VideoPlayer servers={servers} />

        {/* CONTROLES DE NAVEGACIÓN */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
          {prevEp ? (
            <Link 
              href={`/ver/${jikanId}-episodio-${prevEp}`} 
              className="bg-gray-800 hover:bg-gray-700 text-center py-4 rounded-xl font-bold transition-all border border-gray-700 shadow-lg"
            >
              « Anterior
            </Link>
          ) : <div className="hidden sm:block"></div>}
          
          <Link 
            href={`/anime/${jikanId}`} 
            className="bg-pink-600 hover:bg-pink-700 py-4 rounded-xl font-black transition-all text-white shadow-lg shadow-pink-500/20 text-center uppercase tracking-tighter"
          >
            Lista de episodios
          </Link>

          <Link 
            href={`/ver/${jikanId}-episodio-${nextEp}`} 
            className="bg-gray-800 hover:bg-blue-600 text-center py-4 rounded-xl font-bold transition-all border border-gray-700 shadow-lg"
          >
            Siguiente »
          </Link>
        </div>

        {/* SECCIÓN DE COMENTARIOS */}
        <DisqusComments 
          url={`https://animeonline.com/ver/${episodeId}`} 
          identifier={episodeId} 
          title={`${realTitle} - Ep ${epNum}`} 
        />

      </div>
    </main>
  );
}
