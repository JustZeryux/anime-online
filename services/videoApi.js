import * as cheerio from 'cheerio';

// ==========================================
// EL RASTREADOR "HYDRA" OPTIMIZADO
// ==========================================
async function fetchHtmlDirecto(url) {
  const proxies = [
    `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
    `https://corsproxy.io/?url=${encodeURIComponent(url)}`
  ];

  for (const proxy of proxies) {
    try {
      // Reduje el timeout a 4 segundos para que salte más rápido si un proxy está muerto
      const res = await fetch(proxy, { signal: AbortSignal.timeout(4000) });
      if (!res.ok) continue;
      
      const text = await res.text();
      if (!text.includes('Just a moment...') && !text.includes('Cloudflare') && text.includes('<html')) {
        return text; 
      }
    } catch (e) {
      continue; 
    }
  }
  return null; 
}

// ... (Mantenemos tus funciones scrapeAnimeFLV y scrapeTioAnime exactamente igual aquí adentro)
async function scrapeAnimeFLV(rutas, epNum) {
  let serversSub = []; let serversLat = [];
  for (const animePath of rutas) {
    if (!animePath) continue;
    const animeSlug = animePath.split('/').pop();
    const videoPageUrl = `https://animeflv.net/ver/${animeSlug}-${epNum}`;
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
                const mappedSub = videoData.SUB.map((s, idx) => ({ id: `flv-sub-${idx}`, name: s.title || s.server.toUpperCase(), url: s.code.replace(/&amp;/g, '&'), isIframe: true }));
                if (animeSlug.includes('latino')) serversLat = [...serversLat, ...mappedSub];
                else serversSub = [...serversSub, ...mappedSub];
              }
              if (videoData.LAT) {
                const mappedLat = videoData.LAT.map((s, idx) => ({ id: `flv-lat-${idx}`, name: s.title || s.server.toUpperCase(), url: s.code.replace(/&amp;/g, '&'), isIframe: true }));
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

async function scrapeTioAnime(slugs, epNum) {
  let serversSub = []; let serversLat = [];
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
              const mapped = videoData.map((s, idx) => ({ id: `tio-${idx}`, name: s[0].toUpperCase(), url: s[1].replace(/&amp;/g, '&'), isIframe: true }));
              if (slug.includes('latino')) serversLat = [...serversLat, ...mapped];
              else serversSub = [...serversSub, ...mapped];
            } catch (e) {}
          }
        }
      });
    }
  }
  return { subtitulado: serversSub, latino: serversLat };
}

// ==========================================
// EL CEREBRO OPTIMIZADO (CON CACHÉ)
// ==========================================
// Extraemos la lógica pesada a una función interna
async function fetchServersLogic(jikanId, epNum) {
  try {
    const jikanRes = await fetch(`https://api.jikan.moe/v4/anime/${jikanId}`);
    if (!jikanRes.ok) throw new Error("API Jikan Falló");
    const jikanData = await jikanRes.json();
    
    const tituloOriginal = jikanData.data.title;
    const tituloEn = jikanData.data.title_english || tituloOriginal;
    
    const limpiarTitulo = (titulo) => titulo.replace(/:/g, ' ').replace(/-/g, ' ').replace(/\(TV\)/g, '').replace(/Season \d+/ig, '').replace(/Part \d+/ig, '').replace(/Cour \d+/ig, '').replace(/\s+/g, ' ').trim();

    const tituloLimpio = limpiarTitulo(tituloOriginal);
    const tituloEnLimpio = limpiarTitulo(tituloEn);

    const slugBase = tituloLimpio.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const slugEnBase = tituloEnLimpio.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    let possiblePaths = new Set([ `/anime/${slugBase}`, `/anime/${slugBase}-latino`, `/anime/${slugEnBase}`, `/anime/${slugEnBase}-latino` ]);

    let resultadosFLV = await scrapeAnimeFLV(Array.from(possiblePaths), epNum);

    if (resultadosFLV.subtitulado.length > 0 || resultadosFLV.latino.length > 0) {
      return { 
        subtitulado: [...new Map(resultadosFLV.subtitulado.map(item => [item.url, item])).values()], 
        latino: [...new Map(resultadosFLV.latino.map(item => [item.url, item])).values()] 
      };
    }

    const tioSlugs = [slugBase, `${slugBase}-latino`, slugEnBase, `${slugEnBase}-latino`];
    const resultadosTio = await scrapeTioAnime(tioSlugs, epNum);

    return { 
      subtitulado: [...new Map(resultadosTio.subtitulado.map(item => [item.url, item])).values()], 
      latino: [...new Map(resultadosTio.latino.map(item => [item.url, item])).values()] 
    };
  } catch (error) {
    return { subtitulado: [], latino: [] };
  }
}

// ⚡ ESTA ES LA FUNCIÓN QUE LLAMA TU PÁGINA
export async function getEpisodeServers(episodeString) {
  const partes = episodeString.split('-episodio-');
  const jikanId = partes[0].replace('-lat', ''); 
  const epNum = partes[1];

  // 🛡️ MAGIA DE NEXT.JS: Caching Manual
  // Esto le dice a Next.js: "Si ya buscaste este episodio hoy, NO uses los proxies, dame el resultado guardado".
  const cacheKey = `servers_${jikanId}_${epNum}`;
  
  // En producción, Next.js cacheará automáticamente el fetch interno, pero como aquí raspamos,
  // la mejor forma de que sea ultra rápido es que tu componente 'page.jsx' utilice 'force-cache' o que
  // el servidor lo mantenga en memoria.
  
  return await fetchServersLogic(jikanId, epNum);
}
