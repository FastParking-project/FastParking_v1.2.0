
import React, { useState } from 'react';
import { QrCode, Nfc, Zap, Scan, Wifi, CheckCircle2, Loader2 } from 'lucide-react';

interface WelcomeScreenProps {
  onStart: () => void;
}

type InteractionType = 'idle' | 'qr' | 'nfc' | 'success';

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart }) => {
  const [interaction, setInteraction] = useState<InteractionType>('idle');

  // Simula la interacción física de escanear QR o leer NFC
  const handleSimulateEntry = (type: 'qr' | 'nfc') => {
    setInteraction(type);
    
    // Simular tiempo de procesamiento
    setTimeout(() => {
      setInteraction('success');
      
      // Navegar después del mensaje de éxito
      setTimeout(() => {
        onStart();
      }, 1500);
    }, 2500);
  };

  return (
    <div className="relative w-full h-[100dvh] flex flex-col items-center justify-between pb-12 pt-20 overflow-hidden bg-gray-950">
      
      {/* Capa de Fondo CSS */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,_#374151_0%,_#111827_40%,_#000000_100%)]" />
        {/* Luces dinámicas */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-amber-500/10 rounded-full blur-[300px] animate-pulse" style={{ animationDuration: '2s' }} />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-blue-600/10 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
      </div>
      
      {/* --- CONTENIDO --- */}
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-between">
        
        {/* LOGOTIPO */}
        <div className={`flex-1 flex flex-col items-center justify-center w-full transition-opacity duration-500 ${interaction === 'qr' || interaction === 'nfc' ? 'opacity-20 blur-sm' : 'opacity-100'}`}>
           <div className="relative animate-fade-in-down">
              <h1 className="relative text-4xl font-black text-white italic tracking-tighter uppercase transform -skew-x-12 flex items-center shadow-2xl drop-shadow-lg">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-400">FA</span>
                <div className="relative mx-0.5">
                   <Zap 
                      size={40} 
                      className="text-amber-500 fill-amber-500 drop-shadow-[0_0_20px_rgba(245,158,11,0.6)]" 
                      strokeWidth={0} 
                   />
                   <Zap 
                      size={40} 
                      className="absolute inset-0 text-white mix-blend-overlay" 
                      strokeWidth={1}
                   />
                </div>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-gray-400 via-gray-200 to-white">TPARKING</span>
              </h1>
           </div>
        </div>

        {/* --- OVERLAYS DE INTERACCIÓN --- */}
        
        {/* ESCANEO QR */}
        {interaction === 'qr' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-20 animate-fade-in">
             <div className="relative w-64 h-64 border-2 border-amber-500/50 rounded-2xl overflow-hidden bg-black/40 backdrop-blur-sm shadow-[0_0_50px_rgba(245,158,11,0.2)]">
                <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500 shadow-[0_0_15px_#f59e0b] animate-scan-down opacity-80" />
                <div className="absolute inset-0 flex items-center justify-center">
                   <Scan size={48} className="text-white/20" />
                </div>
             </div>
             <p className="mt-6 text-amber-500 font-mono tracking-widest text-sm animate-pulse">ESCANEANDO CÓDIGO...</p>
          </div>
        )}

        {/* LECTURA NFC */}
        {interaction === 'nfc' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-20 animate-fade-in">
             <div className="relative flex items-center justify-center w-64 h-64">
                <div className="absolute w-full h-full border border-purple-500/30 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
                <div className="absolute w-32 h-32 bg-purple-500/10 rounded-full backdrop-blur-md border border-purple-500/50 flex items-center justify-center shadow-[0_0_40px_rgba(168,85,247,0.3)]">
                   <Wifi size={48} className="text-purple-400 animate-pulse" />
                </div>
             </div>
             <p className="mt-6 text-purple-400 font-mono tracking-widest text-sm animate-pulse">LEYENDO TAG NFC...</p>
          </div>
        )}

        {/* ÉXITO */}
        {interaction === 'success' && (
           <div className="absolute inset-0 flex flex-col items-center justify-center z-30 bg-black/60 backdrop-blur-md animate-fade-in">
              <div className="bg-gray-800 p-8 rounded-3xl border border-green-500/30 shadow-[0_0_60px_rgba(34,197,94,0.2)] transform animate-scale-up text-center">
                 <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/40">
                    <CheckCircle2 size={40} className="text-white" />
                 </div>
                 <h2 className="text-2xl font-bold text-white mb-1">Acceso Correcto</h2>
                 <p className="text-gray-400 text-sm">Bienvenido a FastParking</p>
                 <div className="mt-6 flex items-center justify-center gap-2 text-green-400 text-xs font-mono">
                    <Loader2 size={12} className="animate-spin" />
                    CARGANDO MAPA
                 </div>
              </div>
           </div>
        )}

        {/* --- BOTONES --- */}
        {interaction === 'idle' && (
          <div className="w-full max-w-[280px] px-4 flex flex-col gap-2.5 animate-fade-in-up">
              <button 
                onClick={() => handleSimulateEntry('qr')}
                className="group relative w-full bg-gray-900/60 hover:bg-gray-800/80 backdrop-blur-md border border-white/10 text-white p-2.5 rounded-xl flex items-center gap-3 transition-all duration-300 hover:border-amber-500/50 active:scale-95 shadow-lg shadow-black/40 overflow-hidden"
              >
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12" />
                
                <div className="bg-white/5 p-1.5 rounded-lg group-hover:bg-amber-600 transition-colors duration-300 shrink-0">
                  <QrCode size={16} className="text-gray-300 group-hover:text-white" />
                </div>
                <div className="flex flex-col items-start min-w-0">
                  <span className="font-bold text-sm tracking-wide text-gray-100 font-sans">Escanear QR</span>
                  <span className="text-[9px] text-gray-400 group-hover:text-gray-300 truncate">Ingresar código</span>
                </div>
                <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-amber-500 text-[10px] font-bold">SCAN</div>
              </button>

              <button 
                onClick={() => handleSimulateEntry('nfc')}
                className="group relative w-full bg-gray-900/60 hover:bg-gray-800/80 backdrop-blur-md border border-white/10 text-white p-2.5 rounded-xl flex items-center gap-3 transition-all duration-300 hover:border-purple-500/50 active:scale-95 shadow-lg shadow-black/40 overflow-hidden"
              >
                 <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12" />
                 <div className="bg-white/5 p-1.5 rounded-lg group-hover:bg-purple-600 transition-colors duration-300 shrink-0">
                  <Nfc size={16} className="text-gray-300 group-hover:text-white" />
                </div>
                <div className="flex flex-col items-start min-w-0">
                  <span className="font-bold text-sm tracking-wide text-gray-100 font-sans">Usar NFC</span>
                  <span className="text-[9px] text-gray-400 group-hover:text-gray-300 truncate">Aproximar dispositivo</span>
                </div>
                 <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-purple-400 text-[10px] font-bold">READ</div>
              </button>
              
              <div className="mt-6 text-center">
                 <div className="text-[8px] text-gray-600 font-mono tracking-widest opacity-60">
                    v1.2.0 • FASTPARKING
                 </div>
              </div>
          </div>
        )}
      </div>
    </div>
  );
};
