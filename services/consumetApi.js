// services/consumetApi.js

// Usamos la API principal y un clon de respaldo por si el principal se cae
const CONSUMET_URL = 'https://api.consumet.org/anime/animeflv';
const FALLBACK_URL = 'https://consumet-api-clone.vercel.app/anime/animeflv'; 

export async function getDubsFromConsumet(query) {
  try {
    // Forzamos la búsqueda para que siempre incluya "latino"
    const searchQuery = query ? `${query} latino` : 'latino';

    // 1er Intento: API Principal
    let res = await fetch(`${CONSUMET_URL}/${encodeURIComponent(searchQuery)}`, {
      signal: AbortSignal.timeout(4000)
    }).catch(() => null);

    // 2do Intento: Si falla o está caída, usamos el Fallback
    if (!res || !res.ok) {
        console.warn("⚠️ Consumet Principal falló. Usando servidor de respaldo...");
        res = await fetch(`${FALLBACK_URL}/${encodeURIComponent(searchQuery)}`, {
            signal: AbortSignal.timeout(4000)
        }).catch(() => null);
    }

    if (!res || !res.ok) return [];

    const data = await res.json();

    if (data.results && data.results.length > 0) {
      // Extraemos solo los títulos y los pasamos a minúsculas para hacer Match con Jikan
      return data.results.map(anime => anime.title.toLowerCase());
    }

    return [];
  } catch (error) {
    console.error("❌ Error total en Consumet API:", error.message);
    return [];
  }
}
