'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setUser(session.user);
        const { data, error } = await supabase
          .from('historial')
          .select('*')
          .eq('user_id', session.user.id)
          .order('last_watched', { ascending: false });

        if (!error && data) {
          const formattedHistory = data.map(item => ({
            episodeId: item.episode_id,
            title: item.anime_title,
            image: item.anime_image || 'https://via.placeholder.com/600x340?text=Sin+Imagen',
            epNum: item.ep_num || '?',
            date: new Date(item.last_watched).toLocaleDateString()
          }));
          setHistory(formattedHistory);
        }
      } else {
        const localHistory = JSON.parse(localStorage.getItem('animeEngine_history') || '[]');
        setHistory(localHistory);
      }
      setLoading(false);
    };

    fetchHistory();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#151419]">
        <div className="animate-spin w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full shadow-[0_0_15px_rgba(236,72,153,0.5)]"></div>
      </div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen">
      <h1 className="text-3xl font-black text-white mb-8 flex items-center gap-3">
        <span className="text-pink-500 text-4xl">▶</span> Continuar Viendo
      </h1>

      {history.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {history.map((item, index) => (
            <Link 
              href={`/ver/${item.episodeId}`} 
              key={index}
              className="group relative aspect-video bg-gray-900 rounded-xl overflow-hidden shadow-xl border border-gray-800 hover:border-pink-500 transition-all duration-300 transform hover:-translate-y-1 block cursor-pointer"
            >
              {/* Imagen de fondo de la tarjeta */}
              <img 
                src={item.image} 
                alt={item.title} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                onError={(e) => { e.target.src = 'https://via.placeholder.com/600x340?text=Anime+Online' }}
              />
              
              {/* Sombra difuminada para lectura */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#000000] via-[#000000]/50 to-transparent opacity-90 group-hover:opacity-70 transition-opacity"></div>

              {/* Botón Play central flotante */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="w-16 h-16 bg-pink-600/90 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(236,72,153,0.6)] backdrop-blur-sm transform scale-90 group-hover:scale-100 transition-transform">
                  <span className="text-white text-3xl ml-2">▶</span>
                </div>
              </div>

              {/* Textos del episodio */}
              <div className="absolute bottom-0 left-0 right-0 p-4 pb-5">
                <h2 className="font-bold text-white text-lg leading-tight line-clamp-1 drop-shadow-lg group-hover:text-pink-400 transition-colors">
                  {item.title}
                </h2>
                <div className="flex justify-between items-center mt-2">
                  <span className="bg-pink-600 text-white text-[10px] font-black px-2 py-1 rounded shadow-md uppercase tracking-wider">
                    Episodio {item.epNum}
                  </span>
                  <span className="text-[11px] font-medium text-gray-400 drop-shadow">
                    Visto: {item.date}
                  </span>
                </div>
              </div>

              {/* Falsa barra de progreso tipo Netflix */}
              <div className="absolute bottom-0 left-0 h-1 bg-pink-600 w-full opacity-60 group-hover:opacity-100 transition-opacity shadow-[0_0_10px_rgba(236,72,153,0.8)]"></div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-24 bg-[#1c1b22] rounded-2xl border border-gray-800 shadow-2xl">
          <span className="text-7xl mb-6 block drop-shadow-lg">👻</span>
          <h2 className="text-3xl font-black text-gray-200 mb-3">Historial vacío</h2>
          <p className="text-gray-500 text-lg">Tus animes reproducidos aparecerán aquí automáticamente.</p>
          <Link href="/" className="inline-block mt-8 bg-pink-600 text-white px-8 py-3 rounded-full font-bold hover:bg-pink-700 transition-all hover:scale-105 shadow-lg shadow-pink-500/30">
            Explorar Catálogo
          </Link>
        </div>
      )}
    </main>
  );
}