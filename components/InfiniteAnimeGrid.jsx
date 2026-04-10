'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import AnimeCard from './AnimeCard';

export default function InfiniteAnimeGrid({ type }) {
  const [animes, setAnimes] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef(null);

  const loadAnimes = useCallback(async (pageToLoad) => {
    if (loading || !hasMore) return;
    setLoading(true);

    try {
      // 1. DETERMINAR LA URL SEGÚN EL TIPO
      let url = `https://api.jikan.moe/v4/top/anime?page=${pageToLoad}&limit=25`;
      
      if (type === 'airing') url += '&filter=airing';
      if (type === 'popular') url += '&filter=bypopularity';
      if (type === 'upcoming') url += '&filter=upcoming';
      
      // Para NSFW usamos el género 12 (Hentai) y 49 (Erotica) en la búsqueda general para mayor precisión
      if (type === 'nsfw') {
        url = `https://api.jikan.moe/v4/anime?genres=12,49&order_by=score&sort=desc&page=${pageToLoad}&limit=25`;
      }

      const res = await fetch(url);
      
      if (!res.ok) {
        if (res.status === 429) {
          // Si Jikan nos bloquea, esperamos 2 segundos y reintentamos
          setTimeout(() => loadAnimes(pageToLoad), 2000);
        } else {
          setLoading(false);
        }
        return;
      }

      const data = await res.json();
      const newAnimes = data.data || [];

      // 2. FILTRADO DE CONTENIDO (Paz mental para el desarrollador)
      const filteredAnimes = newAnimes.filter(anime => {
        const isExplicit = 
          anime.rating === 'Rx - Hentai' || 
          anime.rating === 'R+ - Mild Nudity' || 
          anime.genres.some(g => g.name === 'Hentai' || g.name === 'Erotica');

        if (type === 'nsfw') {
          return isExplicit; // En la pestaña NSFW solo pasan los explícitos
        } else {
          return !isExplicit; // En las demás pestañas, los bloqueamos
        }
      });

      if (newAnimes.length > 0) {
        setAnimes(prev => {
          // Filtro matemático final para evitar cualquier duplicado por ID
          const combined = [...prev, ...filteredAnimes];
          const uniqueAnimes = Array.from(new Map(combined.map(item => [item.mal_id, item])).values());
          return uniqueAnimes;
        });
        setPage(pageToLoad + 1);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error al cargar animes:", error);
    }
    setLoading(false);
  }, [loading, hasMore, type]);

  // Reiniciar estado cuando se cambia de pestaña
  useEffect(() => {
    setAnimes([]);
    setPage(1);
    setHasMore(true);
    setLoading(false);
    
    const timer = setTimeout(() => loadAnimes(1), 150);
    return () => clearTimeout(timer);
  }, [type]); // eslint-disable-line react-hooks/exhaustive-deps

  // Intersection Observer para el Scroll Infinito
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && hasMore) {
          loadAnimes(page);
        }
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) observer.observe(observerRef.current);
    
    return () => {
      if (observerRef.current) observer.unobserve(observerRef.current);
    };
  }, [loadAnimes, loading, hasMore, page]);

  return (
    <div>
      {/* GRILLA DE ANIMES */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {animes.map((anime, index) => (
          <AnimeCard key={`${type}-${anime.mal_id}-${index}`} anime={anime} />
        ))}
      </div>

      {/* ESTADO DE CARGA / GATILLO */}
      <div ref={observerRef} className="w-full h-40 mt-8 flex flex-col items-center justify-center">
        {loading && (
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(236,72,153,0.4)]"></div>
            <span className="text-pink-500 font-bold tracking-widest animate-pulse">CARGANDO...</span>
          </div>
        )}
        
        {!hasMore && animes.length > 0 && (
          <div className="text-center py-10">
            <p className="text-gray-500 text-lg italic">Has llegado al final del catálogo de {type}.</p>
            <button 
              onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}
              className="mt-4 text-pink-500 hover:underline text-sm font-bold"
            >
              Volver arriba ↑
            </button>
          </div>
        )}

        {animes.length === 0 && !loading && (
          <p className="text-gray-500 italic">No se encontraron resultados en esta categoría.</p>
        )}
      </div>
    </div>
  );
}