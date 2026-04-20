'use client';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function HistoryTracker({ episodeId, animeId, animeTitle, episodeTitle, image }) {
  useEffect(() => {
    // Retrasar el guardado 10 segundos para asegurar que el usuario realmente está viendo el video
    const timer = setTimeout(async () => {
      try {
        const historyItem = {
          episodeId,
          animeId,
          title: animeTitle || 'Anime',
          epTitle: episodeTitle || `Episodio ${episodeId.split('-').pop()}`,
          image: image || '',
          watchedAt: new Date().toISOString()
        };

        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          // Guardar en la base de datos (Requiere tabla 'historial')
          await supabase
            .from('historial')
            .upsert({
              user_id: session.user.id,
              episode_id: episodeId,
              anime_id: animeId,
              anime_title: historyItem.title,
              episode_title: historyItem.epTitle,
              image_url: historyItem.image,
              watched_at: historyItem.watchedAt
            }, { onConflict: 'user_id, episode_id' });
        } else {
          // Guardar en localStorage para invitados
          let localHistory = JSON.parse(localStorage.getItem('animeEngine_history') || '[]');
          
          // Eliminar el registro viejo si ya existía, para moverlo al principio (más reciente)
          localHistory = localHistory.filter(item => item.episodeId !== episodeId);
          localHistory.unshift(historyItem);
          
          // Limitar el historial local a 100 episodios para no saturar la memoria
          if (localHistory.length > 100) localHistory.pop();
          
          localStorage.setItem('animeEngine_history', JSON.stringify(localHistory));
          
          // Disparar un evento personalizado por si otros componentes necesitan actualizarse al instante
          window.dispatchEvent(new Event('historyUpdated'));
        }
      } catch (error) {
        console.error("Error guardando el historial:", error);
      }
    }, 10000); // 10,000 ms = 10 segundos

    return () => clearTimeout(timer);
  }, [episodeId, animeId, animeTitle, episodeTitle, image]);

  return null; // Componente lógico, no renderiza UI
}
