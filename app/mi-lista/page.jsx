'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function MiListaPage() {
  const [favoritos, setFavoritos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFavoritos = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data } = await supabase.from('favoritos').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false });
        if (data) setFavoritos(data);
      }
      setLoading(false);
    };
    fetchFavoritos();
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full"></div></div>;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen">
      <h1 className="text-3xl font-black text-white mb-8 flex items-center gap-3">
        <span className="text-pink-500 text-4xl">❤️</span> Mi Lista
      </h1>

      {favoritos.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {favoritos.map((anime) => (
            <Link href={`/anime/${anime.anime_id}`} key={anime.anime_id} className="group cursor-pointer">
              <div className="relative overflow-hidden rounded-lg aspect-[3/4] shadow-md border border-gray-800">
                <img src={anime.anime_image} alt={anime.anime_title} className="object-cover w-full h-full group-hover:scale-105 transition-transform"/>
              </div>
              <h2 className="mt-2 font-bold text-sm text-gray-200 group-hover:text-pink-400 line-clamp-2">{anime.anime_title}</h2>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-[#1c1b22] rounded-2xl border border-gray-800"><p className="text-gray-400">No tienes animes guardados.</p></div>
      )}
    </main>
  );
}