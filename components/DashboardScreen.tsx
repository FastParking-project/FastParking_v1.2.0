
import React, { useState, useEffect } from 'react';
import { CreditCard, MapPin, Clock, LogOut } from 'lucide-react';

interface DashboardScreenProps {
  parkingLabel: string;
  onPay: () => void;
  onFindCar: () => void;
  onExit: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ parkingLabel, onPay, onFindCar, onExit }) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Efecto para el contador de tiempo de estadía
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between pb-12 pt-20 bg-gray-950 overflow-hidden">
      
      {/* Fondo */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_50%_20%,_#1f2937_0%,_#030712_100%)]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-500/5 rounded-full blur-[80px] animate-pulse" />

      {/* Contenido Principal: Timer */}
      <div className="flex-1 flex flex-col items-center justify-center w-full px-6 z-10 space-y-8">
        
        {/* Badge del Espacio */}
        <div className="flex flex-col items-center animate-fade-in-down">
            <span className="text-gray-500 text-[10px] font-mono tracking-widest uppercase mb-2">Espacio Actual</span>
            <div className="bg-gray-800/50 backdrop-blur border border-green-500/30 px-6 py-2 rounded-xl shadow-[0_0_30px_rgba(34,197,94,0.1)]">
                <h1 className="text-4xl font-black text-green-400 tracking-tighter">{parkingLabel}</h1>
            </div>
        </div>

        {/* Círculo del Timer */}
        <div className="relative w-64 h-64 flex items-center justify-center animate-scale-up">
            <div className="absolute inset-0 border border-gray-800 rounded-full" />
            <div className="absolute inset-2 border border-gray-800/50 rounded-full border-dashed animate-spin-slow" style={{ animationDuration: '60s' }} />
            
            <div className="flex flex-col items-center">
                <Clock size={24} className="text-blue-500 mb-2 opacity-80" />
                <span className="text-5xl font-mono font-bold text-white tabular-nums tracking-tight drop-shadow-lg">
                    {formatTime(elapsedSeconds)}
                </span>
                <span className="text-xs text-gray-500 mt-2 font-medium tracking-wide">TIEMPO TRANSCURRIDO</span>
            </div>
        </div>
      </div>

      {/* Acciones */}
      <div className="w-full max-w-[280px] px-4 flex flex-col gap-2.5 animate-fade-in-up z-10">
           
           {/* Pagar */}
           <button 
             onClick={onPay}
             className="group relative w-full bg-gray-900/60 hover:bg-gray-800/80 backdrop-blur-md border border-white/10 hover:border-green-500/50 p-2.5 rounded-xl flex items-center gap-3 transition-all duration-300 active:scale-95 shadow-lg overflow-hidden"
           >
              <div className="absolute inset-0 bg-green-600/5 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500 ease-out" />
              <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center shadow-lg shadow-green-500/30 group-hover:scale-105 transition-transform shrink-0">
                 <CreditCard size={16} className="text-white" />
              </div>
              <div className="flex flex-col items-start flex-1 min-w-0">
                 <h3 className="text-sm font-bold text-white group-hover:text-green-200 transition-colors">Ir a pagar</h3>
                 <p className="text-[9px] text-gray-400 group-hover:text-gray-300 truncate">Procesar pago de estadía</p>
              </div>
           </button>

           {/* Encontrar Vehículo */}
           <button 
             onClick={onFindCar}
             className="group relative w-full bg-gray-900/60 hover:bg-gray-800/80 backdrop-blur-md border border-white/10 hover:border-blue-500/50 p-2.5 rounded-xl flex items-center gap-3 transition-all duration-300 active:scale-95 shadow-lg overflow-hidden"
           >
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-105 transition-transform shrink-0">
                 <MapPin size={16} className="text-white" />
              </div>
              <div className="flex flex-col items-start flex-1 min-w-0">
                 <h3 className="text-sm font-bold text-white group-hover:text-blue-200 transition-colors">Encontrar vehículo</h3>
                 <p className="text-[9px] text-gray-400 group-hover:text-gray-300 truncate">Ruta de regreso al auto</p>
              </div>
           </button>

           {/* Salida */}
           <button 
             onClick={onExit}
             className="group relative w-full bg-gray-900/60 hover:bg-gray-800/80 backdrop-blur-md border border-white/10 hover:border-red-500/50 p-2.5 rounded-xl flex items-center gap-3 transition-all duration-300 active:scale-95 shadow-lg overflow-hidden"
           >
              <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center shadow-lg shadow-red-500/30 group-hover:scale-105 transition-transform shrink-0">
                 <LogOut size={16} className="text-white ml-0.5" />
              </div>
              <div className="flex flex-col items-start flex-1 min-w-0">
                 <h3 className="text-sm font-bold text-white group-hover:text-red-200 transition-colors">Ir hacia la salida</h3>
                 <p className="text-[9px] text-gray-400 group-hover:text-gray-300 truncate">Navegar hacia el exterior</p>
              </div>
           </button>

           <div className="mt-6 text-center">
             <div className="text-[8px] text-gray-600 font-mono tracking-widest opacity-60">
                ESTADO: ESTACIONADO • PISO 1
             </div>
           </div>
      </div>
    </div>
  );
};
