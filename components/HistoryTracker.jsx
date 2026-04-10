'use client';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function HistoryTracker({ episodeId, animeTitle, animeImage, epNum }) {
  useEffect(() => {
    const saveToHistory = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        const { error } = await supabase
          .from('historial')
          .upsert({ 
            user_id: session.user.id, 
            episode_id: episodeId,
            anime_title: animeTitle,
            anime_image: animeImage,
            ep_num: epNum,
            last_watched: new Date().toISOString()
          }, { onConflict: 'user_id, episode_id' }); 

        if (error) console.error("Error guardando historial:", error);
      } else {
        // Fallback para usuarios sin sesión
        const savedHistory = JSON.parse(localStorage.getItem('animeEngine_history') || '[]');
        const newHistory = savedHistory.filter(item => item.episodeId !== episodeId);
        newHistory.unshift({
          episodeId: episodeId,
          title: animeTitle,
          image: animeImage,
          epNum: epNum,
          date: new Date().toLocaleDateString(),
        });
        localStorage.setItem('animeEngine_history', JSON.stringify(newHistory.slice(0, 50)));
      }
    };
    
    saveToHistory();
  }, [episodeId, animeTitle, animeImage, epNum]);

  return null;
}