
import React from 'react';
import { Accessibility, Car } from 'lucide-react';

interface AccessibilityCheckScreenProps {
  onSelect: (required: boolean) => void;
}

export const AccessibilityCheckScreen: React.FC<AccessibilityCheckScreenProps> = ({ onSelect }) => {
  return (
    <div className="relative w-full h-[100dvh] flex flex-col items-center justify-between pb-12 pt-20 bg-gray-950 overflow-hidden">
      
      {/* Fondo Ambiental */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_50%_50%,_#374151_0%,_#111827_100%)]" />
      <div className="absolute top-0 w-full h-1/2 bg-gradient-to-b from-blue-900/10 to-transparent pointer-events-none" />

      {/* Título y Pregunta */}
      <div className="flex-1 flex flex-col items-center justify-center w-full px-6 z-10">
        <div className="text-center space-y-6 animate-fade-in-down">
           <div className="w-20 h-20 bg-gray-800/50 backdrop-blur rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-black/40 border border-white/5">
              <Accessibility size={40} className="text-blue-500 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
           </div>

           <div className="space-y-3">
             <h2 className="text-3xl font-bold text-white tracking-tight">Preferencias</h2>
             <p className="text-gray-400 text-sm leading-relaxed max-w-[240px] mx-auto">
               ¿Requiere un espacio reservado para <span className="text-blue-400 font-semibold">personas con discapacidad</span>?
             </p>
           </div>
        </div>
      </div>

      {/* Botones de Selección */}
      <div className="w-full max-w-[280px] px-4 flex flex-col gap-2.5 animate-fade-in-up z-10">
           {/* Opción SI */}
           <button 
             onClick={() => onSelect(true)}
             className="group relative w-full bg-gray-900/60 hover:bg-gray-800/80 backdrop-blur-md border border-white/10 hover:border-blue-500/50 p-2.5 rounded-xl flex items-center gap-3 transition-all duration-300 active:scale-95 shadow-lg overflow-hidden"
           >
              <div className="absolute inset-0 bg-blue-600/5 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500 ease-out" />
              
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-105 transition-transform shrink-0">
                 <Accessibility size={16} className="text-white" />
              </div>
              <div className="flex flex-col items-start flex-1 min-w-0">
                 <h3 className="text-sm font-bold text-white group-hover:text-blue-200 transition-colors">Sí, lo requiero</h3>
                 <p className="text-[9px] text-gray-400 group-hover:text-gray-300 truncate">Habilitar espacios azules</p>
              </div>
           </button>

           {/* Opción NO */}
           <button 
             onClick={() => onSelect(false)}
             className="group relative w-full bg-gray-900/60 hover:bg-gray-800/80 backdrop-blur-md border border-white/10 hover:border-gray-500/50 p-2.5 rounded-xl flex items-center gap-3 transition-all duration-300 active:scale-95 shadow-lg overflow-hidden"
           >
              <div className="w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center group-hover:bg-gray-600 transition-colors shrink-0">
                 <Car size={16} className="text-gray-300" />
              </div>
              <div className="flex flex-col items-start flex-1 min-w-0">
                 <h3 className="text-sm font-bold text-white">No, gracias</h3>
                 <p className="text-[9px] text-gray-400">Espacios regulares</p>
              </div>
           </button>

           <div className="mt-6 text-center">
             <div className="text-[8px] text-gray-600 font-mono tracking-widest opacity-60">
                PASO 2 DE 3 • CONFIGURACIÓN
             </div>
           </div>
      </div>
    </div>
  );
};
