import { searchAnime } from '@/services/jikanApi';
import Link from 'next/link';

export default async function SearchPage({ searchParams }) {
  const resolvedParams = await searchParams;
  const query = resolvedParams.q || '';
  const page = parseInt(resolvedParams.page || '1'); // Obtenemos en qué página estamos
  
  // Llamamos a la API con la página actual
  const { results, hasNextPage } = query ? await searchAnime(query, page) : { results: [], hasNextPage: false };

  return (
    <main className="min-h-screen bg-[#151419] text-white p-6 md:p-12">
      <div className="max-w-7xl mx-auto">
        <header className="mb-10 text-center md:text-left border-b border-gray-800 pb-6">
          <h1 className="text-2xl md:text-4xl font-bold text-gray-200">
            Resultados para: <span className="text-pink-500">"{query}"</span>
          </h1>
          <p className="text-sm text-gray-500 mt-2">Página {page}</p>
        </header>

        {results && results.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {results.map((anime) => (
                <Link href={`/anime/${anime.mal_id}`} key={anime.mal_id} className="group flex flex-col">
                  <div className="relative aspect-[3/4] rounded-xl overflow-hidden shadow-lg border border-gray-800 group-hover:border-pink-500 transition-colors">
                    <img 
                      src={anime.images?.webp?.large_image_url || 'https://via.placeholder.com/225x318?text=Sin+Imagen'} 
                      alt={anime.title} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black via-black/80 to-transparent">
                      <span className="bg-pink-600/90 text-white text-[10px] font-bold px-2 py-1 rounded shadow uppercase tracking-wider">
                        {anime.type || 'TV'}
                      </span>
                    </div>
                  </div>
                  <h2 className="mt-3 text-sm font-bold line-clamp-2 text-gray-300 group-hover:text-white transition-colors">
                    {anime.title}
                  </h2>
                </Link>
              ))}
            </div>

            {/* CONTROLES DE PAGINACIÓN */}
            <div className="flex justify-center items-center gap-4 mt-16">
              {page > 1 ? (
                <Link 
                  href={`/buscar?q=${query}&page=${page - 1}`}
                  className="bg-gray-800 hover:bg-pink-600 text-white px-6 py-3 rounded-full font-bold transition-all border border-gray-700 shadow-lg"
                >
                  « Anterior
                </Link>
              ) : (
                <div className="bg-gray-900 text-gray-600 px-6 py-3 rounded-full font-bold border border-gray-800 cursor-not-allowed">
                  « Anterior
                </div>
              )}

              <span className="font-bold text-gray-400">Página {page}</span>

              {hasNextPage ? (
                <Link 
                  href={`/buscar?q=${query}&page=${page + 1}`}
                  className="bg-gray-800 hover:bg-pink-600 text-white px-6 py-3 rounded-full font-bold transition-all border border-gray-700 shadow-lg"
                >
                  Siguiente »
                </Link>
              ) : (
                <div className="bg-gray-900 text-gray-600 px-6 py-3 rounded-full font-bold border border-gray-800 cursor-not-allowed">
                  Siguiente »
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-24 bg-[#1c1b22] rounded-2xl border border-gray-800 shadow-xl">
            <span className="text-7xl mb-6 block drop-shadow-lg">😕</span>
            <h2 className="text-3xl font-black text-gray-200 mb-3">No encontramos resultados</h2>
            <p className="text-gray-500 text-lg">Intenta escribir el nombre de otra forma o usar palabras clave diferentes.</p>
          </div>
        )}
      </div>
    </main>
  );
}