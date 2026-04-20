import * as cheerio from 'cheerio';
import { supabase } from '@/lib/supabase';

// ==========================================
// RASTREADOR HYDRA (EL QUE PELEA CON CLOUDFLARE)
// ==========================================
async function fetchHtmlDirecto(url) {
  const proxies = [
    `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
    `https://corsproxy.io/?url=${encodeURIComponent(url)}`
  ];

  for (const proxy of proxies) {
    try {
      const res = await fetch(proxy, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) continue;
      const text = await res.text();
      if (!text.includes('Just a moment...') && text.includes('<html')) return text;
    } catch (e) { continue; }
  }
  return null;
}

// ... (Funciones de scrapeAnimeFLV y scrapeTioAnime que ya tienes)
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
                const mappedSub = videoData.SUB.map((s, idx) => ({ id: `flv-sub-${idx}-${Date.now()}`, name: s.title || s.server.toUpperCase(), url: s.code.replace(/&amp;/g, '&'), isIframe: true }));
                if (animeSlug.includes('latino')) serversLat = [...serversLat, ...mappedSub];
                else serversSub = [...serversSub, ...mappedSub];
              }
              if (videoData.LAT) {
                const mappedLat = videoData.LAT.map((s, idx) => ({ id: `flv-lat-${idx}-${Date.now()}`, name: s.title || s.server.toUpperCase(), url: s.code.replace(/&amp;/g, '&'), isIframe: true }));
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
              const mapped = videoData.map((s, idx) => ({ id: `tio-${idx}-${Date.now()}`, name: s[0].toUpperCase(), url: s[1].replace(/&amp;/g, '&'), isIframe: true }));
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
// EL CEREBRO DE LA BÓVEDA (LÓGICA SUPABASE)
// ==========================================
export async function getEpisodeServers(episodeString) {
  const partes = episodeString.split('-episodio-');
  const jikanId = partes[0].replace('-lat', ''); 
  const epNum = partes[1];

  try {
    // 1. INTENTAR LEER DE LA BÓVEDA (VELOCIDAD NINJA)
    const { data: boveda, error: bovedaError } = await supabase
      .from('anime_servers')
      .select('servers_json')
      .eq('episode_id', episodeString)
      .single();

    if (boveda && boveda.servers_json) {
      console.log("⚡ Servidores recuperados de la Bóveda en 0.1s");
      return boveda.servers_json;
    }

    // 2. SI NO ESTÁ, SOLTAR A LA HIDRA (MODO LENTO)
    console.log("🔍 Episodio no registrado. Raspando fuentes...");
    
    const jikanRes = await fetch(`https://api.jikan.moe/v4/anime/${jikanId}`);
    const jikanData = await jikanRes.json();
    const titulo = jikanData.data.title;
    const slugBase = titulo.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const paths = new Set([`/anime/${slugBase}`, `/anime/${slugBase}-latino`]);
    const flv = await scrapeAnimeFLV(Array.from(paths), epNum);
    
    let finalServers = flv;
    if (flv.subtitulado.length === 0 && flv.latino.length === 0) {
      const tio = await scrapeTioAnime([slugBase, `${slugBase}-latino`], epNum);
      finalServers = tio;
    }

    // 3. GUARDAR EN LA BÓVEDA PARA EL PRÓXIMO USUARIO
    if (finalServers.subtitulado.length > 0 || finalServers.latino.length > 0) {
      await supabase.from('anime_servers').insert([{ 
        episode_id: episodeString, 
        servers_json: finalServers 
      }]);
      console.log("💾 Servidores guardados permanentemente.");
    }

    return finalServers;

  } catch (e) {
    return { subtitulado: [], latino: [] };
  }
}
