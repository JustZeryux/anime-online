'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Estados para el formulario
  const [nombre, setNombre] = useState('');
  const [username, setUsername] = useState('');
  const [biografia, setBiografia] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    getProfile();
  }, []);

  const getProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }
      setUser(session.user);

      // Traer datos del perfil
      const { data, error } = await supabase
        .from('perfiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (data) {
        setPerfil(data);
        setNombre(data.nombre || '');
        setUsername(data.username || '');
        setBiografia(data.biografia || '');
      }
    } catch (error) {
      console.error("Error cargando perfil:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async () => {
    try {
      setLoading(true);
      const updates = {
        id: user.id,
        nombre,
        username,
        biografia,
        updated_at: new Date()
      };

      const { error } = await supabase.from('perfiles').upsert(updates);
      if (error) throw error;
      
      setIsEditing(false);
      getProfile(); // Recargar datos
    } catch (error) {
      alert("Error actualizando el perfil.");
    } finally {
      setLoading(false);
    }
  };

  // Función para subir imagen (Avatar o Banner)
  const uploadImage = async (event, bucketName) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) return;

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      // 1. Subir al bucket
      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      // 3. Guardar URL en la tabla de perfiles
      const column = bucketName === 'avatars' ? 'avatar_url' : 'banner_url';
      await supabase.from('perfiles').upsert({ id: user.id, [column]: publicUrl });

      getProfile(); // Recargar la página para ver la imagen
    } catch (error) {
      alert("Error subiendo la imagen.");
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-gray-900 flex justify-center items-center text-pink-500">Cargando...</div>;

  if (!user) return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white">
      <h1 className="text-2xl font-bold mb-4">Debes iniciar sesión</h1>
      <p className="text-gray-400">Inicia sesión con Google para ver tu perfil.</p>
    </div>
  );

  return (
    <main className="min-h-screen bg-[#1c1b22] text-white pb-20">
      {/* SECCIÓN DEL BANNER */}
      <div className="relative w-full h-48 md:h-72 bg-gray-800 group">
        {perfil?.banner_url ? (
          <img src={perfil.banner_url} alt="Banner" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-pink-900 to-gray-900"></div>
        )}
        
        {isEditing && (
          <label className="absolute inset-0 bg-black/50 flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="bg-gray-900 px-4 py-2 rounded-full text-sm font-bold border border-gray-700">Cambiar Banner</span>
            <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadImage(e, 'banners')} disabled={uploading} />
          </label>
        )}
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* AVATAR SOBREPUESTO */}
        <div className="flex justify-between items-end -mt-16 md:-mt-20 mb-6">
          <div className="relative group rounded-full border-4 border-[#1c1b22] w-32 h-32 md:w-40 md:h-40 bg-gray-800 overflow-hidden shadow-xl">
            <img src={perfil?.avatar_url || 'https://via.placeholder.com/150'} alt="Avatar" className="w-full h-full object-cover" />
            
            {isEditing && (
              <label className="absolute inset-0 bg-black/60 flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-xs font-bold text-center">Cambiar<br/>Avatar</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadImage(e, 'avatars')} disabled={uploading} />
              </label>
            )}
          </div>

          {/* BOTÓN DE EDITAR */}
          <button 
            onClick={() => isEditing ? updateProfile() : setIsEditing(true)}
            className={`${isEditing ? 'bg-green-600 hover:bg-green-500' : 'bg-gray-800 hover:bg-gray-700 border-gray-700'} px-6 py-2 rounded-full font-bold text-sm border transition-colors mb-4 shadow-lg`}
          >
            {isEditing ? 'Guardar Cambios' : 'Editar Perfil'}
          </button>
        </div>

        {/* INFO DEL PERFIL */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-lg">
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre para mostrar</label>
                <input 
                  type="text" 
                  value={nombre} 
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full bg-gray-800 text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre de usuario (@)</label>
                <input 
                  type="text" 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-gray-800 text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder="ej: otaku_pro99"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Biografía</label>
                <textarea 
                  value={biografia} 
                  onChange={(e) => setBiografia(e.target.value)}
                  className="w-full bg-gray-800 text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-pink-500 h-24 resize-none"
                  placeholder="¡Cuéntanos sobre tus animes favoritos!"
                />
              </div>
            </div>
          ) : (
            <div>
              <h1 className="text-3xl font-black">{perfil?.nombre || 'Usuario Sin Nombre'}</h1>
              <p className="text-pink-500 font-medium mb-4">@{perfil?.username || 'usuario_nuevo'}</p>
              
              <div className="mt-4 border-t border-gray-800 pt-4">
                <h2 className="text-sm font-bold text-gray-500 uppercase mb-2">Sobre mí</h2>
                <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {perfil?.biografia || 'Este usuario aún no ha escrito una biografía. ¡Seguro está viendo anime!'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}