import * as cheerio from 'cheerio';

const headersBrowser = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'es-MX,es;q=0.9,en-US;q=0.8,en;q=0.7',
};

// ==========================================
// RASTREADOR INDETECTABLE (ANTI-CLOUDFLARE)
// ==========================================
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

// ==========================================
// PLAN A: SCRAPER DE ANIMEFLV (Sub & Latino)
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
              
              if (videoData.SUB) {
                const mappedSub = videoData.SUB.map((s, idx) => ({
                  id: `flv-sub-${idx}-${Date.now()}`,
                  name: s.title || s.server.toUpperCase(),
                  url: s.code.replace(/&amp;/g, '&'),
                  isIframe: true
                }));
                
                if (animeSlug.includes('latino')) {
                  serversLat = [...serversLat, ...mappedSub];
                } else {
                  serversSub = [...serversSub, ...mappedSub];
                }
              }

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
  // AQUÍ ESTÁ LA MAGIA: Limpiamos el ID clonado para que Jikan lo reconozca
  const jikanId = partes[0].replace('-lat', ''); 
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

    const slugBase = tituloLimpio.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const slugEnBase = tituloEnLimpio.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    // Inyectamos todas las variantes predictivas
    let possiblePaths = new Set([
      `/anime/${slugBase}`,
      `/anime/${slugBase}-latino`,
      `/anime/${slugBase}-tv`,
      `/anime/${slugBase}-tv-latino`,
      `/anime/${slugBase}-audio-latino`,
      `/anime/${slugEnBase}`,
      `/anime/${slugEnBase}-latino`
    ]);

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

    let resultadosFLV = await scrapeAnimeFLV(Array.from(possiblePaths), epNum);

    if (resultadosFLV.subtitulado.length > 0 || resultadosFLV.latino.length > 0) {
      const uniqueSub = [...new Map(resultadosFLV.subtitulado.map(item => [item.url, item])).values()];
      const uniqueLat = [...new Map(resultadosFLV.latino.map(item => [item.url, item])).values()];
      return { subtitulado: uniqueSub, latino: uniqueLat };
    }

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
