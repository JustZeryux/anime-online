import * as cheerio from 'cheerio';

const headersBrowser = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'es-MX,es;q=0.9,en-US;q=0.8,en;q=0.7',
};

async function fetchHtmlDirecto(url) {
  try {
    const res = await fetch(url, { headers: headersBrowser, signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null; // Ignorar si da 404 (URL incorrecta)
    const text = await res.text();
    if (text.includes('Just a moment...') || text.includes('Cloudflare')) return null;
    return text;
  } catch (e) {
    return null;
  }
}

// ==========================================
// PLAN A: SCRAPER DE ANIMEFLV (Sub & Latino)
// ==========================================
async function scrapeAnimeFLV(rutas, epNum) {
  let serversSub = [];
  let serversLat = [];

  // Recorremos todas las rutas posibles (las encontradas y las predichas)
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
              
              // 1. Extraer SUBTITULADO
              if (videoData.SUB) {
                const mappedSub = videoData.SUB.map((s, idx) => ({
                  id: `flv-sub-${idx}-${Date.now()}`,
                  name: s.title || s.server.toUpperCase(),
                  url: s.code.replace(/&amp;/g, '&'),
                  isIframe: true
                }));
                
                // Si la URL predicha contenía la palabra "latino", entonces este "SUB" en realidad es el audio base latino
                if (animeSlug.includes('latino')) {
                  serversLat = [...serversLat, ...mappedSub];
                } else {
                  serversSub = [...serversSub, ...mappedSub];
                }
              }

              // 2. Extraer LATINO (Cuando guardan ambos audios en la misma página)
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
// PLAN B: SCRAPER DE TIOANIME (Sub & Latino)
// ==========================================
async function scrapeTioAnime(slugs, epNum) {
  let serversSub = [];
  let serversLat = [];

  for (const slug of slugs) {
    const videoPageUrl = `https://tioanime.com/ver/${slug}-${epNum}`;
    const videoHtml = await fetchHtmlDirecto(videoPageUrl);
    
    if (videoHtml) {
      const $v = cheerio.load(videoHtml);
      $v('script').each((_, script) => {
        const content = $v(script).html();
        if (content && content.includes('var episodes = ')) {
          const match = content.match(/var episodes = (\[.*?\]);/);
          if (match) {
            try {
              const videoData = JSON.parse(match[1]);
              const mapped = videoData.map((s, idx) => ({
                id: `tio-${idx}-${Date.now()}`,
                name: s[0].toUpperCase(),
                url: s[1].replace(/&amp;/g, '&'),
                isIframe: true
              }));

              if (slug.includes('latino')) {
                serversLat = [...serversLat, ...mapped];
              } else {
                serversSub = [...serversSub, ...mapped];
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
    
    // Limpiamos los títulos para la búsqueda clásica
    const limpiarTitulo = (titulo) => {
      return titulo.replace(/:/g, ' ').replace(/-/g, ' ').replace(/\(TV\)/g, '').replace(/Season \d+/ig, '').replace(/Part \d+/ig, '').replace(/Cour \d+/ig, '').replace(/\s+/g, ' ').trim();
    };

    const tituloLimpio = limpiarTitulo(tituloOriginal);
    const tituloEnLimpio = limpiarTitulo(tituloEn);

    // ==========================================
    // MAGIA: PREVISIÓN DE SLUGS LATINOS Y SUB
    // ==========================================
    // Convertimos "Jujutsu Kaisen" -> "jujutsu-kaisen"
    const slugBase = tituloLimpio.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const slugEnBase = tituloEnLimpio.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    // Inyectamos las URLs predictivas para no depender del buscador
    let possiblePaths = new Set([
      `/anime/${slugBase}`,
      `/anime/${slugBase}-latino`,       // Muy común en AnimeFLV
      `/anime/${slugBase}-tv`,
      `/anime/${slugBase}-tv-latino`,    // Variante común
      `/anime/${slugBase}-audio-latino`,
      `/anime/${slugEnBase}`,
      `/anime/${slugEnBase}-latino`
    ]);

    // Opcional: Ejecutamos una búsqueda de respaldo rápida por si el slug predictivo falla
    const buscarEnFLV = async (query) => {
      if (!query) return [];
      const htmlText = await fetchHtmlDirecto(`https://www3.animeflv.net/browse?q=${encodeURIComponent(query)}`);
      if (!htmlText) return [];
      const $ = cheerio.load(htmlText);
      const links = [];
      $('.ListAnimes li article a').each((i, el) => { if (i < 3) links.push($(el).attr('href')); });
      return links;
    };

    const [linksOriginal, linksLimpio, linksLatino] = await Promise.all([
      buscarEnFLV(tituloOriginal),
      buscarEnFLV(tituloLimpio),
      buscarEnFLV(`${tituloLimpio} Latino`)
    ]);

    linksOriginal.forEach(p => possiblePaths.add(p));
    linksLimpio.forEach(p => possiblePaths.add(p));
    linksLatino.forEach(p => possiblePaths.add(p));

    // INTENTO 1: AnimeFLV con las rutas predichas y buscadas
    let resultadosFLV = await scrapeAnimeFLV(Array.from(possiblePaths), epNum);

    // Si encontramos al menos 1 servidor (sea Sub o Lat), lo retornamos y evitamos sobrecargar
    if (resultadosFLV.subtitulado.length > 0 || resultadosFLV.latino.length > 0) {
      
      // Eliminar duplicados si los hay
      const uniqueSub = [...new Map(resultadosFLV.subtitulado.map(item => [item.url, item])).values()];
      const uniqueLat = [...new Map(resultadosFLV.latino.map(item => [item.url, item])).values()];
      
      return { subtitulado: uniqueSub, latino: uniqueLat };
    }

    // INTENTO 2: TioAnime predictivo
    console.log("⚠️ FLV Falló. Activando Plan B: TioAnime Predictivo...");
    const tioSlugs = [slugBase, `${slugBase}-latino`, slugEnBase, `${slugEnBase}-latino`];
    const resultadosTio = await scrapeTioAnime(tioSlugs, epNum);

    return { 
      subtitulado: [...new Map(resultadosTio.subtitulado.map(item => [item.url, item])).values()], 
      latino: [...new Map(resultadosTio.latino.map(item => [item.url, item])).values()] 
    };

  } catch (error) {
    console.error("⚠️ Error Crítico en getEpisodeServers:", error.message);
    return { subtitulado: [], latino: [] };
  }
}
