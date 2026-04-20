import * as cheerio from 'cheerio';

const BASE_URL = 'https://api.jikan.moe/v4';

// ==========================================
// RASTREADORES SILENCIOSOS DE DOBLAJES
// ==========================================
async function fetchHtmlDirecto(url) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html'
      },
      signal: AbortSignal.timeout(4000) // Timeout rápido para no trabar la búsqueda
    });
    if (!res.ok) return null;
    return await res.text();
  } catch (e) {
    return null;
  }
}

// Revisa en TioAnime si existe el doblaje
async function checkDubsInTioAnime(query) {
  const html = await fetchHtmlDirecto(`https://tioanime.com/directorio?q=${encodeURIComponent(query)}`);
  if (!html) return [];
  const $ = cheerio.load(html);
  const dubs = [];
  $('.animes article.anime h3.title').each((i, el) => {
    const title = $(el).text().toLowerCase();
    if (title.includes('latino')) {
      dubs.push(title.replace(/\(audio latino\)|latino/gi, '').trim());
    }
  });
  return dubs;
}

// Revisa en AnimeFLV si existe el doblaje
async function checkDubsInFLV(query) {
  const html = await fetchHtmlDirecto(`https://www3.animeflv.net/browse?q=${encodeURIComponent(query + ' Latino')}`);
  if (!html) return [];
  const $ = cheerio.load(html);
  const dubs = [];
  $('.ListAnimes li article h3.Title').each((i, el) => {
    const title = $(el).text().toLowerCase();
    if (title.includes('latino') || title.includes('doblaje')) {
      dubs.push(title.replace(/\(audio latino\)|latino|doblaje/gi, '').trim());
    }
  });
  return dubs;
}

// ==========================================
// FUNCIONES NATIVAS DE JIKAN BLINDADAS
// ==========================================
export async function getAiringAnimes() {
  try {
    const res = await fetch(`${BASE_URL}/top/anime?filter=airing&limit=24&sfw=true&genres_exclude=12,49`, { 
      next: { revalidate: 3600 } 
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  } catch (error) {
    return []; 
  }
}

export async function getPopularAnimes() {
  try {
    const res = await fetch(`${BASE_URL}/top/anime?filter=bypopularity&limit=12&sfw=true&genres_exclude=12,49`, { 
      next: { revalidate: 3600 } 
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  } catch (error) {
    return []; 
  }
}

export async function getUpcomingAnimes() {
  try {
    const res = await fetch(`${BASE_URL}/seasons/upcoming?limit=12&sfw=true&genres_exclude=12,49`, { 
      next: { revalidate: 3600 } 
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  } catch (error) {
    return [];
  }
}

// Limpiamos el "-lat" para que Jikan no colapse al pedir detalles
export async function getAnimeDetails(id) {
  try {
    const realId = id.toString().replace('-lat', '');
    const res = await fetch(`${BASE_URL}/anime/${realId}/full`);
    if (!res.ok) return null;
    
    const data = await res.json();
    
    // Si la tarjeta era la del doblaje, mantenemos el título visual
    if (id.toString().includes('-lat')) {
      data.data.title = `${data.data.title} (Audio Latino)`;
      if (data.data.title_english) data.data.title_english += ' (Latino)';
    }

    return data.data;
  } catch (error) {
    return null; 
  }
}

export async function getAnimeEpisodes(id) {
  try {
    const realId = id.toString().replace('-lat', '');
    const res = await fetch(`${BASE_URL}/anime/${realId}/episodes`);
    
    if (res.ok) {
      const data = await res.json();
      if (data.data && data.data.length > 0) {
        return data.data.map(ep => ({
          mal_id: ep.mal_id,
          title: ep.title || `Episodio ${ep.mal_id}`
        }));
      }
    }

    const resDetail = await fetch(`${BASE_URL}/anime/${realId}`);
    if (!resDetail.ok) throw new Error("Fallo fallback episodios");
    
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
    return [{ mal_id: 1, title: "Episodio 1" }];
  }
}

// ==========================================
// EL CEREBRO DE BÚSQUEDA (HÍBRIDO Y CLONADOR)
// ==========================================
export async function searchAnime(query, page = 1) {
  try {
    const cleanQuery = encodeURIComponent(query);
    
    // 1. Buscamos en Jikan la base oficial
    const resNormal = await fetch(`${BASE_URL}/anime?q=${cleanQuery}&limit=20&order_by=popularity&page=${page}&sfw=true&genres_exclude=12,49`).catch(() => null);
    
    let results = [];
    let hasNextPage = false;

    if (resNormal && resNormal.ok) {
      const data = await resNormal.json();
      results = [...(data.data || [])];
      if (data.pagination?.has_next_page) hasNextPage = true;
    }

    // 2. Buscamos paralelamente en los scrapers latinos
    const [tioDubs, flvDubs] = await Promise.all([
      checkDubsInTioAnime(query),
      checkDubsInFLV(query)
    ]);
    const allDubs = [...tioDubs, ...flvDubs];
    
    // 3. LA CLONACIÓN
    const finalResults = [];

    results.forEach(anime => {
      // Agregamos siempre la versión normal
      finalResults.push(anime);

      const titleEn = (anime.title_english || '').toLowerCase();
      const titleJp = (anime.title || '').toLowerCase();
      
      // Chequeamos si nuestros scrapers encontraron un match
      const isDubbed = allDubs.some(dubTitle => 
        titleEn.includes(dubTitle) || titleJp.includes(dubTitle) || dubTitle.includes(titleJp)
      );

      // Si hay match (o si el usuario fue explícito), clonamos la tarjeta
      if (isDubbed || query.toLowerCase().includes('latino')) {
        const latinoClone = { ...anime };
        latinoClone.mal_id = `${anime.mal_id}-lat`; // La magia que permite diferenciar la tarjeta
        latinoClone.title = `${anime.title} (Audio Latino)`;
        if (latinoClone.title_english) {
          latinoClone.title_english = `${anime.title_english} (Latino)`;
        }
        
        finalResults.push(latinoClone);
      }
    });

    // Reordenamos para dejar lo más popular arriba
    finalResults.sort((a, b) => (a.popularity || 99999) - (b.popularity || 99999));

    return {
      results: finalResults,
      hasNextPage: hasNextPage
    };
  } catch (error) {
    console.error("Error en búsqueda híbrida:", error);
    return { results: [], hasNextPage: false };
  }
}
