// services/jikanApi.js
const BASE_URL = 'https://api.jikan.moe/v4';

// Obtener los animes en emisión (Top Airing)
// Obtener los animes en emisión (Top Airing)
export async function getAiringAnimes() {
  try {
    // Usamos caché con revalidación: Solo actualizará la lista 1 vez por hora (3600 segundos).
    // Esto evita que Jikan te bloquee la IP por exceso de peticiones.
    const res = await fetch(`${BASE_URL}/top/anime?filter=airing&limit=24`, { 
      next: { revalidate: 3600 } 
    });
    
    if (!res.ok) {
      console.warn(`La API de Jikan está saturada (Status: ${res.status}). Mostrando lista vacía.`);
      return []; // Si falla, devolvemos un array vacío para no romper la página
    }
    
    const data = await res.json();
    return data.data || [];
    
  } catch (error) {
    console.error('Fallo al conectar con Jikan API:', error);
    return []; // Respaldo de emergencia en caso de que no haya internet
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
    return null; // Devuelve null en vez de romper la página
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
        // Si hay episodios registrados, los devolvemos con su título real
        return data.data.map(ep => ({
          mal_id: ep.mal_id,
          title: ep.title || `Episodio ${ep.mal_id}`
        }));
      }
    }

    // 2. FALLBACK: Si no hay lista de episodios (muy común en animes en emisión)
    // pedimos los detalles para ver cuántos capítulos totales hay registrados.
    const resDetail = await fetch(`${BASE_URL}/anime/${id}`);
    if (!resDetail.ok) throw new Error("No se pudo obtener detalle para episodios");
    
    const dataDetail = await resDetail.json();
    const totalEpisodios = dataDetail.data?.episodes;

    // Si tiene un número definido, generamos los botones manualmente
    if (totalEpisodios && totalEpisodios > 0) {
      return Array.from({ length: totalEpisodios }, (_, i) => ({
        mal_id: i + 1,
        title: `Episodio ${i + 1}`
      }));
    }

    // Si "episodes" es null (ej: One Piece o animes muy nuevos) o es película
    return [{ mal_id: 1, title: "Película / OVA / Emisión" }];

  } catch (error) {
    console.error("❌ Error cargando episodios:", error.message);
    // Fallback de emergencia total
    return [{ mal_id: 1, title: "Episodio 1" }];
  }
}

// ==========================================
// BÚSQUEDA BLINDADA (Soporta espacios y ordena mejor)
// ==========================================
// ==========================================
// BÚSQUEDA BLINDADA (Soporta espacios, NSFW y ordena mejor)
// ==========================================
export async function searchAnime(query, page = 1) {
  try {
    const cleanQuery = encodeURIComponent(query);
    
    // Hacemos dos peticiones en paralelo protegiéndolas de caídas con .catch()
    // 1. Búsqueda normal global
    // 2. Búsqueda forzando explícitamente los géneros Hentai (12) y Erotica (49)
    const [resNormal, resNsfw] = await Promise.all([
      fetch(`${BASE_URL}/anime?q=${cleanQuery}&limit=24&order_by=popularity&page=${page}`).catch(() => null),
      fetch(`${BASE_URL}/anime?q=${cleanQuery}&genres=12,49&limit=10&page=${page}`).catch(() => null)
    ]);
    
    let results = [];
    let hasNextPage = false;

    // Procesamos resultados normales
    if (resNormal && resNormal.ok) {
      const data = await resNormal.json();
      results = [...(data.data || [])];
      if (data.pagination?.has_next_page) hasNextPage = true;
    }

    // Procesamos resultados NSFW y los fusionamos sin duplicar
    if (resNsfw && resNsfw.ok) {
      const dataNsfw = await resNsfw.json();
      const nsfwAnimes = dataNsfw.data || [];
      
      // Añadimos los NSFW asegurándonos de que no existan ya en la lista
      nsfwAnimes.forEach(anime => {
        if (!results.some(a => a.mal_id === anime.mal_id)) {
          results.push(anime);
        }
      });
      if (dataNsfw.pagination?.has_next_page) hasNextPage = true;
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
    const res = await fetch(`${BASE_URL}/top/anime?filter=bypopularity&limit=12`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  } catch (error) {
    console.error("Fallo de red al obtener Populares:", error.message);
    return []; // Si se cae el internet o los DNS fallan, devuelve vacío y no rompe la app
  }
}

export async function getUpcomingAnimes() {
  try {
    const res = await fetch(`${BASE_URL}/seasons/upcoming?limit=12`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  } catch (error) {
    console.error("Fallo de red al obtener Próximos:", error.message);
    return []; // Mismo escudo protector
  }
}