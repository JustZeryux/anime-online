'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function EpisodeCheck({ episodeId }) {
  const [watched, setWatched] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data } = await supabase
          .from('historial')
          .select('episode_id')
          .eq('user_id', session.user.id)
          .eq('episode_id', episodeId)
          .single();
        
        if (data) setWatched(true);
      } else {
        // Revisar en localStorage para usuarios sin cuenta
        const localHistory = JSON.parse(localStorage.getItem('animeEngine_history') || '[]');
        if (localHistory.some(item => item.episodeId === episodeId)) {
          setWatched(true);
        }
      }
    };
    checkStatus();
  }, [episodeId]);

  if (!watched) return null;

  return (
    <span className="ml-auto bg-green-500/20 text-green-400 text-[10px] font-bold px-2 py-1 rounded border border-green-500/30">
      VISTO ✅
    </span>
  );
}
