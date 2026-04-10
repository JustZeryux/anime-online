export default function GlobalLoading() {
  return (
    <div className="min-h-screen bg-[#151419] flex flex-col items-center justify-center z-50">
      <div className="relative w-24 h-24 flex items-center justify-center">
        {/* Anillo giratorio exterior */}
        <div className="absolute inset-0 border-4 border-gray-800 border-t-pink-500 rounded-full animate-spin shadow-[0_0_30px_rgba(236,72,153,0.3)]"></div>
        {/* Anillo giratorio interior */}
        <div className="absolute inset-3 border-4 border-gray-800 border-b-blue-500 rounded-full animate-spin-slow"></div>
        {/* Icono central */}
        <span className="text-2xl animate-pulse">▶</span>
      </div>
      <h2 className="text-pink-500 font-black tracking-widest mt-6 animate-pulse text-xl">
        CARGANDO...
      </h2>
      <p className="text-gray-500 text-sm mt-2 font-medium">Obteniendo datos de la base de datos</p>
    </div>
  );
}