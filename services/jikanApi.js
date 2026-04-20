// services/jikanApi.js
const BASE_URL = 'https://api.jikan.moe/v4';

// Obtener los animes en emisión (Top Airing)
export async function getAiringAnimes() {
  try {
    // Usamos caché con revalidación: Solo actualizará la lista 1 vez por hora (3600 segundos).
    // Filtramos explícitamente SFW y excluimos Hentai(12) y Erotica(49)
    const res = await fetch(`${BASE_URL}/top/anime?filter=airing&limit=24&sfw=true&genres_exclude=12,49`, { 
      next: { revalidate: 3600 } 
    });
    
    if (!res.ok) {
      console.warn(`La API de Jikan está saturada (Status: ${res.status}). Mostrando lista vacía.`);
      return []; 
    }
    
    const data = await res.json();
    return data.data || [];
    
  } catch (error) {
    console.error('Fallo al conectar con Jikan API:', error);
    return []; 
  }
}

// Obtener detalles de un anime por su ID (BLINDADO)
export async function getAnimeDetails(id) {
  try {
    const res = await fetch(`${BASE_URL}/anime/${id}/full`);
    if (!res.ok) return null;
    
    const data = await res.json();
    return data.data;
  } catch (error) {
    console.error("Fallo de conexión al buscar detalles del anime:", error.message);
    return null; 
  }
}

// ==========================================
// EPISODIOS MEJORADOS (Intenta traer los títulos reales)
// ==========================================
export async function getAnimeEpisodes(id) {
  try {
    // 1. Intentamos pedir la lista REAL de episodios a Jikan
    const res = await fetch(`${BASE_URL}/anime/${id}/episodes`);
    
    if (res.ok) {
      const data = await res.json();
      if (data.data && data.data.length > 0) {
        return data.data.map(ep => ({
          mal_id: ep.mal_id,
          title: ep.title || `Episodio ${ep.mal_id}`
        }));
      }
    }

    // 2. FALLBACK: Si no hay lista de episodios
    const resDetail = await fetch(`${BASE_URL}/anime/${id}`);
    if (!resDetail.ok) throw new Error("No se pudo obtener detalle para episodios");
    
    const dataDetail = await resDetail.json();
    const totalEpisodios = dataDetail.data?.episodes;

    if (totalEpisodios && totalEpisodios > 0) {
      return Array.from({ length: totalEpisodios }, (_, i) => ({
        mal_id: i + 1,
        title: `Episodio ${i + 1}`
      }));
    }

    return [{ mal_id: 1, title: "Película / OVA / Emisión" }];

  } catch (error) {
    console.error("❌ Error cargando episodios:", error.message);
    return [{ mal_id: 1, title: "Episodio 1" }];
  }
}

// ==========================================
// BÚSQUEDA BLINDADA (Soporta espacios, SFW Estricto y ordena mejor)
// ==========================================
export async function searchAnime(query, page = 1) {
  try {
    const cleanQuery = encodeURIComponent(query);
    
    // Solo hacemos la búsqueda normal con los filtros estrictos activados
    const resNormal = await fetch(`${BASE_URL}/anime?q=${cleanQuery}&limit=24&order_by=popularity&page=${page}&sfw=true&genres_exclude=12,49`).catch(() => null);
    
    let results = [];
    let hasNextPage = false;

    if (resNormal && resNormal.ok) {
      const data = await resNormal.json();
      results = [...(data.data || [])];
      if (data.pagination?.has_next_page) hasNextPage = true;
    }

    // Reordenamos para que los resultados más relevantes queden hasta arriba
    results.sort((a, b) => (a.popularity || 99999) - (b.popularity || 99999));

    return {
      results: results,
      hasNextPage: hasNextPage
    };
  } catch (error) {
    console.error("Error en búsqueda:", error);
    return { results: [], hasNextPage: false };
  }
}

export async function getPopularAnimes() {
  try {
    const res = await fetch(`${BASE_URL}/top/anime?filter=bypopularity&limit=12&sfw=true&genres_exclude=12,49`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  } catch (error) {
    console.error("Fallo de red al obtener Populares:", error.message);
    return []; 
  }
}

export async function getUpcomingAnimes() {
  try {
    const res = await fetch(`${BASE_URL}/seasons/upcoming?limit=12&sfw=true&genres_exclude=12,49`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  } catch (error) {
    console.error("Fallo de red al obtener Próximos:", error.message);
    return [];
  }
}
