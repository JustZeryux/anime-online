'use client';
import { useRouter } from 'next/navigation';

export default function BackButton() {
  const router = useRouter();

  return (
    <button 
      onClick={() => router.back()}
      className="absolute top-4 left-4 md:top-6 md:left-8 z-50 bg-black/50 backdrop-blur-md hover:bg-pink-600 text-white px-4 py-2.5 rounded-full font-bold transition-all border border-gray-700 hover:border-pink-500 flex items-center gap-2 shadow-xl cursor-pointer"
    >
      <span>←</span> <span className="hidden sm:inline">Volver</span>
    </button>
  );
}