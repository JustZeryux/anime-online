import './globals.css';
import Navbar from '@/components/Navbar';

export const metadata = {
  title: 'AnimeOnline - Ver Anime Online HD',
  description: 'Motor de búsqueda y visualización de anime en alta calidad.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="bg-gray-900 text-white min-h-screen flex flex-col">
        {/* El menú superior global */}
        <Navbar />
        
        {/* Aquí se renderiza dinámicamente la página actual (Inicio, Detalles, Reproductor) */}
        <div className="flex-grow">
          {children}
        </div>

        {/* Un Footer básico */}
        <footer className="bg-[#151419] border-t border-gray-800 p-6 text-center text-gray-500 text-sm mt-10">
          <p>AnimeOnline 2026 © Ningún vídeo está alojado en nuestros servidores.</p>
        </footer>
      </body>
    </html>
  );
}