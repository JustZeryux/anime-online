'use client';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function AuthButton() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Revisar si ya hay una sesión activa al cargar la página
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Escuchar cambios (cuando inicia o cierra sesión)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`, // A dónde vuelve después de loguearse
      }
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  // Si el usuario ya inició sesión, mostramos su foto de perfil y botón de salir
  if (user) {
    return (
      <div className="flex items-center gap-4">
        <Link href="/perfil" className="hover:opacity-80 transition-opacity ring-2 ring-transparent hover:ring-pink-500 rounded-full">
          <img 
            src={user.user_metadata.avatar_url || 'https://via.placeholder.com/150'} 
            alt="Perfil" 
            className="w-8 h-8 rounded-full border border-gray-600 object-cover" 
          />
        </Link>
        <button onClick={signOut} className="text-sm text-gray-400 hover:text-white transition-colors">
          Cerrar Sesión
        </button>
      </div>
    );
  }

  // Si no ha iniciado sesión, mostramos el botón de Google
  return (
    <button 
      onClick={signInWithGoogle} 
      className="bg-white text-black px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 hover:bg-gray-200 transition-colors shadow-lg"
    >
      <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-4 h-4" />
      Ingresar
    </button>
  );
}