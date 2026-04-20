// services/videoApi.js
import * as cheerio from 'cheerio';

const headersBrowser = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'es-MX,es;q=0.9,en-US;q=0.8,en;q=0.7',
};

async function fetchHtmlDirecto(url) {
  try {
    const res = await fetch(url, { headers: headersBrowser, signal: AbortSignal.timeout(8000) });
    const text = await res.text();
    if (text.includes('Just a moment...') || text.includes('Cloudflare')) return null;
    return text;
  } catch (e) {
    return null;
  }
}

// ==========================================
// PLAN A: SCRAPER DE ANIMEFLV (Soporte Sub y Latino)
// ==========================================
async function scrapeAnimeFLV(rutas, epNum) {
  let serversSub = [];
  let serversLat = [];

  for (const animePath of rutas) {
    if (!animePath) continue;
    const animeSlug = animePath.split('/').pop();
    const videoPageUrl = `https://www3.animeflv.net/ver/${animeSlug}-${epNum}`;
    const videoHtml = await fetchHtmlDirecto(videoPageUrl);
    
    if (videoHtml) {
      const $v = cheerio.load(videoHtml);
      
      $v('script').each((_, script) => {
        const content = $v(script).html();
        if (content && content.includes('var videos = {')) {
          const match = content.match(/var videos = (\{.*?\});/);
          if (match) {
            try {
              const videoData = JSON.parse(match[1]);
              
              // Extraer servidores Subtitulados
              if (videoData.SUB) {
                const mappedSub = videoData.SUB.map((s, idx) => ({
                  id: `flv-sub-${idx}-${Date.now()}`,
                  name: s.title || s.server.toUpperCase(),
                  url: s.code.replace(/&amp;/g, '&'),
                  isIframe: true
                }));
                // Si la ruta en sí dice latino, lo asignamos a lat
                if (animeSlug.includes('latino')) {
                  serversLat = [...serversLat, ...mappedSub];
                } else {
                  serversSub = [...serversSub, ...mappedSub];
                }
              }

              // Extraer servidores Latino (si existen en la misma página)
              if (videoData.LAT) {
                const mappedLat = videoData.LAT.map((s, idx) => ({
                  id: `flv-lat-${idx}-${Date.now()}`,
                  name: s.title || s.server.toUpperCase(),
                  url: s.code.replace(/&amp;/g, '&'),
                  isIframe: true
                }));
                serversLat = [...serversLat, ...mappedLat];
              }
            } catch (e) {}
          }
        }
      });
    }
  }
  
  return { subtitulado: serversSub, latino: serversLat };
}

// ==========================================
// PLAN B: SCRAPER DE TIOANIME (RESPALDO)
// ==========================================
async function scrapeTioAnime(titulo, epNum) {
  try {
    const searchUrl = `https://tioanime.com/directorio?q=${encodeURIComponent(titulo)}`;
    const html = await fetchHtmlDirecto(searchUrl);
    if (!html) return [];

    const $ = cheerio.load(html);
    const animeHref = $('.animes article.anime a').first().attr('href');
    if (!animeHref) return [];

    const slug = animeHref.split('/').pop();
    const videoPageUrl = `https://tioanime.com/ver/${slug}-${epNum}`;
    const videoHtml = await fetchHtmlDirecto(videoPageUrl);
    
    if (videoHtml) {
      const $v = cheerio.load(videoHtml);
      let serversFound = [];
      $v('script').each((_, script) => {
        const content = $v(script).html();
        if (content && content.includes('var episodes = ')) {
          const match = content.match(/var episodes = (\[.*?\]);/);
          if (match) {
            try {
              const videoData = JSON.parse(match[1]);
              serversFound = videoData.map((s, idx) => ({
                id: `tio-${idx}-${Date.now()}`,
                name: s[0].toUpperCase(),
                url: s[1].replace(/&amp;/g, '&'),
                isIframe: true
              }));
            } catch (e) {}
          }
        }
      });
      return serversFound;
    }
  } catch (error) {
    return [];
  }
  return [];
}

// ==========================================
// FUNCIÓN PRINCIPAL (EL CEREBRO)
// ==========================================
export async function getEpisodeServers(episodeString) {
  const partes = episodeString.split('-episodio-');
  const jikanId = partes[0];
  const epNum = partes[1];

  try {
    const jikanRes = await fetch(`https://api.jikan.moe/v4/anime/${jikanId}`);
    if (!jikanRes.ok) throw new Error("API Jikan Falló");
    const jikanData = await jikanRes.json();
    
    const tituloOriginal = jikanData.data.title;
    const tituloEn = jikanData.data.title_english || tituloOriginal;
    
    const limpiarTitulo = (titulo) => {
      return titulo.replace(/:/g, ' ').replace(/-/g, ' ').replace(/\(TV\)/g, '').replace(/Season \d+/ig, '').replace(/Part \d+/ig, '').replace(/Cour \d+/ig, '').replace(/\s+/g, ' ').trim();
    };

    const tituloLimpio = limpiarTitulo(tituloOriginal);
    const tituloEnLimpio = limpiarTitulo(tituloEn);

    // Búsqueda en FLV
    const buscarEnFLV = async (query) => {
      if (!query) return [];
      const htmlText = await fetchHtmlDirecto(`https://www3.animeflv.net/browse?q=${encodeURIComponent(query)}`);
      if (!htmlText) return [];
      const $ = cheerio.load(htmlText);
      const links = [];
      $('.ListAnimes li article a').each((i, el) => { if (i < 3) links.push($(el).attr('href')); });
      return links;
    };

    let possiblePaths = new Set();
    
    // Buscamos títulos normales
    (await buscarEnFLV(tituloOriginal)).forEach(p => possiblePaths.add(p));
    (await buscarEnFLV(tituloLimpio)).forEach(p => possiblePaths.add(p));
    if (tituloEnLimpio !== tituloLimpio) {
      (await buscarEnFLV(tituloEnLimpio)).forEach(p => possiblePaths.add(p));
    }
    
    // Buscamos específicamente versiones con Audio Latino
    (await buscarEnFLV(`${tituloLimpio} Latino`)).forEach(p => possiblePaths.add(p));

    // INTENTO 1: Ejecutamos el Plan A (AnimeFLV)
    let resultadosFLV = await scrapeAnimeFLV(Array.from(possiblePaths), epNum);

    // INTENTO 2: Si FLV falla o no encuentra servidores SUB, ejecutamos el Plan B (TioAnime)
    if (resultadosFLV.subtitulado.length === 0 && resultadosFLV.latino.length === 0) {
      console.log("⚠️ FLV Falló o no encontró servidores. Activando Plan B: TioAnime...");
      const tioServers = await scrapeTioAnime(tituloLimpio, epNum);
      return { subtitulado: tioServers, latino: [] };
    }

    // Eliminamos duplicados basados en la URL antes de devolver
    const uniqueSub = [...new Map(resultadosFLV.subtitulado.map(item => [item.url, item])).values()];
    const uniqueLat = [...new Map(resultadosFLV.latino.map(item => [item.url, item])).values()];

    return { subtitulado: uniqueSub, latino: uniqueLat };

  } catch (error) {
    console.error("⚠️ Error Crítico en getEpisodeServers:", error.message);
    return { subtitulado: [], latino: [] };
  }
}
