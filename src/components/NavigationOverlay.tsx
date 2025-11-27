
import React from 'react';
import { NavigationStep } from '../types';
import { ArrowUp, ArrowLeft, ArrowRight, MapPin, X, Clock, Navigation } from 'lucide-react';

interface NavigationOverlayProps {
  currentStep: NavigationStep | null;
  remainingDistance: number; 
  remainingTime: number; 
  onCancel: () => void;
}

export const NavigationOverlay: React.FC<NavigationOverlayProps> = ({ 
  currentStep, 
  remainingDistance,
  remainingTime,
  onCancel 
}) => {
  if (!currentStep) return null;

  // Renderiza el icono correspondiente a la acción actual
  const renderIcon = () => {
    const iconProps = { size: 20, strokeWidth: 3, className: "text-white" };

    switch (currentStep.action) {
      case 'turn-left': return <ArrowLeft {...iconProps} />;
      case 'turn-right': return <ArrowRight {...iconProps} />;
      case 'straight':
      case 'start': 
        return <ArrowUp {...iconProps} />;
      case 'arrive': return <MapPin size={20} strokeWidth={3} className="text-red-100" />;
      default: return <ArrowUp {...iconProps} />;
    }
  };

  // Formatea el tiempo en minutos:segundos
  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${Math.ceil(seconds)}s`;
    const m = Math.floor(seconds / 60);
    const s = Math.ceil(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <>
      {/* Barra Superior - Instrucción Compacta */}
      <div className="absolute top-16 left-0 right-0 flex justify-center z-50 animate-slide-down pointer-events-none">
        <div className="bg-green-700/90 backdrop-blur-md shadow-lg rounded-full pl-3 pr-5 py-2 flex items-center gap-3 max-w-[90%] border border-green-600/50">
            <div className="bg-white/20 p-1.5 rounded-full shrink-0">
              {renderIcon()}
            </div>
            <div className="min-w-0 flex flex-col">
              <span className="text-sm font-bold text-white leading-none truncate">{currentStep.instruction}</span>
              {currentStep.distance > 0 && (
                 <span className="text-[10px] text-green-100 font-medium mt-0.5 opacity-80">
                   en {Math.round(currentStep.distance)} m
                 </span>
              )}
            </div>
        </div>
      </div>

      {/* Barra Inferior - Estadísticas Flotantes */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center z-50">
        <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-full py-2 pl-5 pr-2 shadow-2xl flex items-center gap-6 animate-slide-up">
          
          {/* Grupo de Estadísticas */}
          <div className="flex items-center gap-5">
             {/* Tiempo Estimado */}
             <div className="flex items-center gap-2">
                <Clock size={14} className="text-blue-400" />
                <div className="flex flex-col leading-none">
                   <span className="text-lg font-bold text-white font-mono tabular-nums">
                     {formatTime(remainingTime)}
                   </span>
                   <span className="text-[8px] text-gray-400 uppercase tracking-wider">Estimado</span>
                </div>
             </div>

             <div className="w-px h-6 bg-gray-700" />

             {/* Distancia Restante */}
             <div className="flex items-center gap-2">
                <Navigation size={14} className="text-emerald-400" />
                <div className="flex flex-col leading-none">
                   <span className="text-lg font-bold text-white font-mono tabular-nums">
                     {Math.round(remainingDistance)} <span className="text-xs font-sans text-gray-400">m</span>
                   </span>
                   <span className="text-[8px] text-gray-400 uppercase tracking-wider">Restante</span>
                </div>
             </div>
          </div>

          {/* Botón Cancelar */}
          <button 
            onClick={onCancel}
            className="ml-2 bg-red-500/10 hover:bg-red-500/30 text-red-500 p-2 rounded-full transition-colors border border-red-500/20 active:scale-95"
            aria-label="Cancelar navegación"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </>
  );
};
