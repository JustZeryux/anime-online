'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function FavoriteButton({ animeId, animeTitle, animeImage }) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    checkFavorite();
  }, [animeId]);

  const checkFavorite = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setUser(session.user);
      const { data } = await supabase
        .from('favoritos')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('anime_id', animeId)
        .single();
      
      if (data) setIsFavorite(true);
    }
    setLoading(false);
  };

  const toggleFavorite = async () => {
    if (!user) {
      alert("Debes iniciar sesión para guardar favoritos.");
      return;
    }

    if (isFavorite) {
      await supabase.from('favoritos').delete().eq('user_id', user.id).eq('anime_id', animeId);
      setIsFavorite(false);
    } else {
      await supabase.from('favoritos').insert([{ 
        user_id: user.id, 
        anime_id: animeId, 
        anime_title: animeTitle, 
        anime_image: animeImage 
      }]);
      setIsFavorite(true);
    }
  };

  if (loading) return <div className="h-10 w-32 bg-gray-800 animate-pulse rounded-xl"></div>;

  return (
    <button 
      onClick={toggleFavorite}
      className={`px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg flex items-center gap-2 ${
        isFavorite 
          ? 'bg-gray-800 text-pink-500 hover:bg-gray-700 border border-pink-500/50' 
          : 'bg-pink-600 text-white hover:bg-pink-700 shadow-pink-500/30'
      }`}
    >
      <span>{isFavorite ? '❤️ En tu Lista' : '🤍 Añadir a Mi Lista'}</span>
    </button>
  );
}