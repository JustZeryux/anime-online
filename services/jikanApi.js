// services/jikanApi.js
import * as cheerio from 'cheerio';

const BASE_URL = 'https://api.jikan.moe/v4';

// ==========================================
// BASE DE DATOS MAESTRA DE DOBLAJES (ESCUDO ANTI-CLOUDFLARE)
// ==========================================
// Estos son los IDs de MyAnimeList de los animes más famosos con Audio Latino.
// Si el scraper falla, esta lista garantiza que el usuario siempre vea resultados.
const KNOWN_LATINO_DUBS = new Set([
  20, 1735, 34566, // Naruto, Shippuden, Boruto
  223, 813, 225, 30694, // DB, DBZ, DBGT, DBS
  21, 269, 50613, // One Piece, Bleach, Bleach TYBW
  121, 5114, 1535, // FMA, FMAB, Death Note
  16498, 25777, 35760, 40028, // Attack on Titan (Todas las temporadas)
  40748, 51009, // Jujutsu Kaisen S1 y S2
  38000, 40456, 47778, 51019, // Demon Slayer (Todas)
  31964, 33486, 36456, 38408, 41587, 49918, // My Hero Academia
  44511, 50265, 30276, 32182, // Chainsaw Man, Spy x Family, One Punch Man, Mob Psycho
  11757, 21881, 36474, // Sword Art Online
  38691, 37999, 39535, 37521, // Dr. Stone, Kaguya, Mushoku, Vinland
  30831, 31240, 35790, 37430, // KonoSuba, Re:Zero, Shield Hero, Slime
  42310, 52299, 52588, 52211, 52991, 53118, // Cyberpunk, Solo Leveling, Kaiju 8, Mashle, Frieren, Shangri-La
  34572, 6702, 23755, 11061, 22319, 1, 30 // Black Clover, Fairy Tail, NNT, HxH, Tokyo Ghoul, Bebop, Evangelion
]);
// ==========================================
// RASTREADOR INDETECTABLE (ANTI-CLOUDFLARE)
// ==========================================

// Buscar directamente en la API Open Source de Consumet (AnimeFLV)
async function getDubsFromConsumet(query) {
  try {
    const res = await fetch(`https://api.consumet.org/anime/animeflv/${encodeURIComponent(query + ' latino')}`);
    if (!res.ok) return [];
    
    const data = await res.json();
    
    // Devolvemos los títulos de los resultados que Consumet encontró
    return data.results.map(anime => anime.title.toLowerCase());
  } catch (e) {
    return [];
  }
}

async function fetchHtmlDirecto(url) {
  try {
    // INTENTO 1: Disfraz de Googlebot
    // Engañamos a Cloudflare haciéndole creer que somos el motor de búsqueda de Google.
    let res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        'Referer': 'https://www.google.com/',
        'Accept': 'text/html'
      },
      signal: AbortSignal.timeout(5000)
    });

    let text = await res.text();

    // INTENTO 2: Si Cloudflare es agresivo y nos atrapa, usamos un Proxy Inverso
    // AllOrigins raspará la página desde sus propios servidores y nos devolverá el texto puro.
    if (text.includes('Just a moment...') || text.includes('Cloudflare') || text.includes('Ray ID') || !res.ok) {
      console.warn("🛡️ Cloudflare detectado en intento directo. Activando Proxy AllOrigins...");
      
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
      const proxyRes = await fetch(proxyUrl, { signal: AbortSignal.timeout(6000) });
      const proxyData = await proxyRes.json();
      
      text = proxyData.contents; // Aquí viene el HTML puro sin bloqueos
    }

    return text;
  } catch (error) {
    console.error("❌ Fallo total en rastreador:", error.message);
    return null;
  }
}

async function checkDubsInTioAnime(query) {
  if (!query) return [];
  const html = await fetchHtmlDirecto(`https://tioanime.com/directorio?q=${encodeURIComponent(query)}`);
  if (!html) return [];
  const $ = cheerio.load(html);
  const dubs = [];
  $('.animes article.anime h3.title').each((i, el) => {
    const title = $(el).text().toLowerCase();
    if (title.includes('latino')) dubs.push(title.replace(/\(audio latino\)|latino/gi, '').trim());
  });
  return dubs;
}

async function checkDubsInFLV(query) {
  if (!query) return [];
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
    const res = await fetch(`${BASE_URL}/top/anime?filter=airing&limit=24&sfw=true&genres_exclude=12,49`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    return (await res.json()).data || [];
  } catch (error) { return []; }
}

export async function getPopularAnimes() {
  try {
    const res = await fetch(`${BASE_URL}/top/anime?filter=bypopularity&limit=12&sfw=true&genres_exclude=12,49`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    return (await res.json()).data || [];
  } catch (error) { return []; }
}

export async function getUpcomingAnimes() {
  try {
    const res = await fetch(`${BASE_URL}/seasons/upcoming?limit=12&sfw=true&genres_exclude=12,49`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    return (await res.json()).data || [];
  } catch (error) { return []; }
}

// Limpiamos el "-lat" para que Jikan no colapse al pedir detalles
export async function getAnimeDetails(id) {
  try {
    const realId = id.toString().replace('-lat', '');
    const res = await fetch(`${BASE_URL}/anime/${realId}/full`);
    if (!res.ok) return null;
    
    const data = await res.json();
    
    if (id.toString().includes('-lat')) {
      data.data.title = `${data.data.title} (Audio Latino)`;
      if (data.data.title_english) data.data.title_english += ' (Latino)';
      data.data.hasDub = true; // Forzamos la etiqueta visual
    }
    return data.data;
  } catch (error) { return null; }
}

export async function getAnimeEpisodes(id) {
  try {
    const realId = id.toString().replace('-lat', '');
    const res = await fetch(`${BASE_URL}/anime/${realId}/episodes`);
    if (res.ok) {
      const data = await res.json();
      if (data.data && data.data.length > 0) {
        return data.data.map(ep => ({ mal_id: ep.mal_id, title: ep.title || `Episodio ${ep.mal_id}` }));
      }
    }
    const resDetail = await fetch(`${BASE_URL}/anime/${realId}`);
    if (!resDetail.ok) throw new Error("Fallo");
    const dataDetail = await resDetail.json();
    const totalEpisodios = dataDetail.data?.episodes;
    if (totalEpisodios > 0) {
      return Array.from({ length: totalEpisodios }, (_, i) => ({ mal_id: i + 1, title: `Episodio ${i + 1}` }));
    }
    return [{ mal_id: 1, title: "Película / OVA / Emisión" }];
  } catch (error) { return [{ mal_id: 1, title: "Episodio 1" }]; }
}

// ==========================================
// EL CEREBRO DE BÚSQUEDA HÍBRIDO (AHORA SÍ ES INVENCIBLE)
// ==========================================
export async function searchAnime(query, page = 1, onlyLatino = false) {
  try {
    // Si el usuario escribió "latino", lo quitamos para no confundir a Jikan
    const cleanQuery = query ? encodeURIComponent(query.toLowerCase().replace(/latino|español/g, '').trim()) : '';
    
    // 1. Buscamos en Jikan
    // Si no hay query, traemos los más populares por defecto para que la pantalla no esté vacía
    const urlJikan = cleanQuery 
      ? `${BASE_URL}/anime?q=${cleanQuery}&limit=24&order_by=popularity&page=${page}&sfw=true&genres_exclude=12,49`
      : `${BASE_URL}/top/anime?filter=bypopularity&limit=24&page=${page}&sfw=true&genres_exclude=12,49`;

    const resNormal = await fetch(urlJikan).catch(() => null);
    
    let results = [];
    let hasNextPage = false;

    if (resNormal && resNormal.ok) {
      const data = await resNormal.json();
      results = [...(data.data || [])];
      if (data.pagination?.has_next_page) hasNextPage = true;
    }

    // 2. Intentamos raspar (si Cloudflare nos deja)
    let allDubs = [];
    if (query) {
      const [tioDubs, flvDubs] = await Promise.all([
        checkDubsInTioAnime(cleanQuery),
        checkDubsInFLV(cleanQuery)
      ]);
      allDubs = [...tioDubs, ...flvDubs];
    }
    
    // 3. LA CLONACIÓN Y FILTRADO FINAL
    const finalResults = [];

    results.forEach(anime => {
      const titleEn = (anime.title_english || '').toLowerCase();
      const titleJp = (anime.title || '').toLowerCase();
      
      // Magia: ¿Tiene doblaje? (Chequeamos la base de datos maestra O los resultados del scraper)
      const hasDub = KNOWN_LATINO_DUBS.has(anime.mal_id) || allDubs.some(dubTitle => 
        titleEn.includes(dubTitle) || titleJp.includes(dubTitle) || dubTitle.includes(titleJp)
      );

      // Le inyectamos la propiedad para que tu AnimeCard.jsx muestre el Badge 🎙️ Latino
      anime.hasDub = hasDub;

      // Si el usuario NO activó el switch, mostramos la versión normal
      if (!onlyLatino) {
        finalResults.push(anime);
      }

      // Si tiene doblaje, creamos la tarjeta clonada (o la única tarjeta si el switch está activo)
      if (hasDub || (query && query.toLowerCase().includes('latino'))) {
        const latinoClone = { ...anime };
        latinoClone.mal_id = `${anime.mal_id}-lat`; 
        latinoClone.title = `${anime.title} (Audio Latino)`;
        if (latinoClone.title_english) latinoClone.title_english = `${anime.title_english} (Latino)`;
        latinoClone.hasDub = true;
        
        finalResults.push(latinoClone);
      }
    });

    // Filtramos si el interruptor "Solo Audio Latino" está encendido
    const resultsToReturn = onlyLatino ? finalResults.filter(a => a.hasDub) : finalResults;

    // Reordenamos
    resultsToReturn.sort((a, b) => (a.popularity || 99999) - (b.popularity || 99999));

    return {
      results: resultsToReturn,
      hasNextPage: hasNextPage
    };
  } catch (error) {
    console.error("Error en búsqueda híbrida:", error);
    return { results: [], hasNextPage: false };
  }
}
