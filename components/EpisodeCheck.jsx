'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function EpisodeCheck({ episodeId }) {
  const [watched, setWatched] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const checkStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          const { data } = await supabase
            .from('historial')
            .select('episode_id')
            .eq('user_id', session.user.id)
            .eq('episode_id', episodeId)
            .single();
          
          if (data && isMounted) setWatched(true);
        } else {
          const localHistory = JSON.parse(localStorage.getItem('animeEngine_history') || '[]');
          if (localHistory.some(item => item.episodeId === episodeId) && isMounted) {
            setWatched(true);
          }
        }
      } catch (error) {
        // Ignorar errores silenciosos de Supabase (ej. si no encuentra la fila)
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    checkStatus();

    // Escuchar cambios en tiempo real si el usuario está viendo episodios en otra pestaña
    const handleStorageChange = () => checkStatus();
    window.addEventListener('historyUpdated', handleStorageChange);

    return () => {
      isMounted = false;
      window.removeEventListener('historyUpdated', handleStorageChange);
    };
  }, [episodeId]);

  if (isLoading || !watched) return null;

  return (
    <span className="ml-auto bg-[#e2005e]/20 text-[#e2005e] text-[11px] tracking-wider font-extrabold px-2 py-1 rounded border border-[#e2005e]/50 shadow-[0_0_10px_rgba(226,0,94,0.3)]">
      VISTO
    </span>
  );
}
