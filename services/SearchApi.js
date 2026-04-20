import * as cheerio from 'cheerio';

const JIKAN_URL = 'https://api.jikan.moe/v4';
const headersBrowser = { 'User-Agent': 'Mozilla/5.0' };

// Función auxiliar para buscar rápido en FLV
async function checkFlvLatino(query) {
  try {
    const res = await fetch(`https://www3.animeflv.net/browse?q=${encodeURIComponent(query + ' Latino')}`, { headers: headersBrowser });
    const text = await res.text();
    const $ = cheerio.load(text);
    
    // Extraemos los títulos de los resultados que encontró FLV al buscar "Latino"
    const titles = [];
    $('.ListAnimes li article h3.Title').each((i, el) => {
      titles.push($(el).text().toLowerCase());
    });
    return titles;
  } catch (e) {
    return [];
  }
}

export async function hybridSearch(query, onlyLatino = false) {
  try {
    // 1. SMART PARSING: Detectamos si el usuario escribió "latino" o "español"
    const isLookingForDub = onlyLatino || query.toLowerCase().includes('latino') || query.toLowerCase().includes('español');
    
    // Limpiamos la query para que Jikan no se confunda
    const cleanQuery = query.toLowerCase().replace(/latino|español/g, '').trim();

    // 2. BÚSQUEDA EN PARALELO (Cruce de Datos)
    // Buscamos la metadata bonita en Jikan y al mismo tiempo preguntamos a FLV si existen dubs
    const [jikanRes, flvLatinoTitles] = await Promise.all([
      fetch(`${JIKAN_URL}/anime?q=${encodeURIComponent(cleanQuery)}&sfw=true&genres_exclude=12,49&limit=20`),
      checkFlvLatino(cleanQuery)
    ]);

    if (!jikanRes.ok) return [];
    const jikanData = await jikanRes.json();
    let animes = jikanData.data || [];

    // 3. INYECCIÓN DEL BADGE LATINO
    animes = animes.map(anime => {
      const titleEn = (anime.title_english || '').toLowerCase();
      const titleJp = (anime.title || '').toLowerCase();
      
      // Verificamos si alguno de los títulos de FLV se parece al de Jikan
      const hasLatino = flvLatinoTitles.some(flvTitle => 
        flvTitle.includes(titleEn) || flvTitle.includes(titleJp) || titleEn.includes(flvTitle)
      );

      return {
        ...anime,
        hasDub: hasLatino // Inyectamos esta nueva propiedad
      };
    });

    // 4. FILTRADO FINAL
    // Si el usuario encendió el switch o escribió "latino", borramos los que no tienen dub
    if (isLookingForDub) {
      animes = animes.filter(anime => anime.hasDub);
    }

    // Reordenamos para priorizar los que tienen doblaje (si no estamos en modo "solo latino")
    animes.sort((a, b) => {
      if (a.hasDub && !b.hasDub) return -1;
      if (!a.hasDub && b.hasDub) return 1;
      return (a.popularity || 999) - (b.popularity || 999);
    });

    return animes;

  } catch (error) {
    console.error("Error en Búsqueda Híbrida:", error);
    return [];
  }
}
