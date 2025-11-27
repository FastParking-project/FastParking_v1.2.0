
import React, { useState } from 'react';
import { CreditCard, Wallet, Smartphone, ChevronLeft, CheckCircle2, DollarSign, X } from 'lucide-react';

interface PaymentScreenProps {
  elapsedTime: string;
  amount: number;
  onBack: () => void;
  onComplete: () => void;
}

export const PaymentScreen: React.FC<PaymentScreenProps> = ({ elapsedTime, amount, onBack, onComplete }) => {
  const [status, setStatus] = useState<'idle' | 'form' | 'processing' | 'success'>('idle');
  const [method, setMethod] = useState<string>('');
  
  // Datos del formulario
  const [googleData] = useState({ email: 'usuario@gmail.com' });

  const handleSelectMethod = (selectedMethod: string) => {
    setMethod(selectedMethod);
    setStatus('form');
  };

  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('processing');
    
    // Simular llamada a API de pagos
    setTimeout(() => {
      setStatus('success');
      // Regresar al dashboard después del éxito
      setTimeout(() => {
        onComplete();
      }, 2000);
    }, 2500);
  };

  // Formato de moneda colombiana
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between pb-12 pt-20 bg-gray-950 overflow-hidden">
      
      {/* Fondo */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_50%_10%,_#1f2937_0%,_#030712_100%)]" />
      
      {/* Contenido */}
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-between">
        
        {/* Resumen - Se oculta al mostrar formulario */}
        <div className={`flex-1 w-full flex flex-col items-center justify-center px-6 transition-all duration-500 ${status !== 'idle' ? 'opacity-0 scale-95 pointer-events-none absolute' : 'opacity-100 scale-100'}`}>
           <div className="text-center space-y-1 mb-8 animate-fade-in-down">
              <p className="text-gray-400 text-xs font-mono tracking-widest uppercase">Total a Pagar</p>
              <h1 className="text-5xl font-black text-white tracking-tighter drop-shadow-lg">
                {formatCurrency(amount)}
              </h1>
              <div className="inline-flex items-center gap-2 bg-gray-800/50 px-3 py-1 rounded-full border border-gray-700 mt-2">
                 <ClockIcon size={12} className="text-blue-400" />
                 <span className="text-xs text-gray-300 font-mono">{elapsedTime} de estadía</span>
              </div>
           </div>
        </div>

        {/* --- OVERLAY DE FORMULARIO --- */}
        {status === 'form' && (
            <div className="absolute inset-0 z-20 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-fade-in">
                <div className="w-full max-w-[320px] bg-gray-900 border border-gray-700 rounded-2xl p-6 shadow-2xl relative">
                    <button onClick={() => setStatus('idle')} className="absolute top-4 right-4 text-gray-500 hover:text-white">
                        <X size={20} />
                    </button>
                    
                    <div className="mb-6 flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-lg
                             ${method === 'Nequi' ? 'bg-[#da0081]' : method === 'Google Pay' ? 'bg-white' : 'bg-blue-600'}
                        `}>
                             {method === 'Nequi' && <Smartphone size={20} className="text-white" />}
                             {method === 'Google Pay' && <Wallet size={20} className="text-gray-800" />}
                             {method === 'Tarjeta de Crédito' && <CreditCard size={20} className="text-white" />}
                        </div>
                        <div>
                            <h3 className="text-white font-bold text-sm">{method}</h3>
                            <p className="text-gray-400 text-[10px]">Ingrese sus datos</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmitPayment} className="space-y-4">
                        {method === 'Tarjeta de Crédito' && (
                            <>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-gray-400 font-mono uppercase">Número de Tarjeta</label>
                                    <input required type="text" placeholder="0000 0000 0000 0000" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500 focus:outline-none placeholder-gray-600" />
                                </div>
                                <div className="flex gap-3">
                                    <div className="space-y-1 flex-1">
                                        <label className="text-[10px] text-gray-400 font-mono uppercase">Fecha Exp</label>
                                        <input required type="text" placeholder="MM/YY" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500 focus:outline-none placeholder-gray-600" />
                                    </div>
                                    <div className="space-y-1 w-20">
                                        <label className="text-[10px] text-gray-400 font-mono uppercase">CVV</label>
                                        <input required type="text" placeholder="123" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500 focus:outline-none placeholder-gray-600" />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-gray-400 font-mono uppercase">Nombre Titular</label>
                                    <input required type="text" placeholder="NOMBRE APELLIDO" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500 focus:outline-none placeholder-gray-600" />
                                </div>
                            </>
                        )}

                        {method === 'Nequi' && (
                            <div className="space-y-1">
                                <label className="text-[10px] text-gray-400 font-mono uppercase">Número Celular</label>
                                <div className="flex">
                                    <span className="bg-gray-800 border border-gray-700 border-r-0 rounded-l-lg px-3 py-2 text-gray-400 text-sm flex items-center">+57</span>
                                    <input required type="tel" placeholder="300 000 0000" className="w-full bg-gray-800 border border-gray-700 rounded-r-lg px-3 py-2 text-white text-sm focus:border-pink-500 focus:outline-none placeholder-gray-600" />
                                </div>
                                <p className="text-[9px] text-gray-500 mt-1">Recibirás una notificación push para confirmar.</p>
                            </div>
                        )}

                        {method === 'Google Pay' && (
                             <div className="space-y-1">
                                <label className="text-[10px] text-gray-400 font-mono uppercase">Cuenta Google</label>
                                <div className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm flex items-center justify-between">
                                    <span>{googleData.email}</span>
                                    <CheckCircle2 size={14} className="text-green-500" />
                                </div>
                                <p className="text-[9px] text-gray-500 mt-1">Se usará la tarjeta predeterminada terminada en **88.</p>
                             </div>
                        )}

                        <button type="submit" className="w-full mt-2 bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl transition-all active:scale-95 shadow-lg shadow-green-900/20">
                            Pagar {formatCurrency(amount)}
                        </button>
                    </form>
                </div>
            </div>
        )}

        {/* OVERLAY DE PROCESAMIENTO */}
        {status === 'processing' && (
           <div className="absolute inset-0 flex flex-col items-center justify-center z-20 animate-fade-in">
              <div className="relative w-24 h-24 mb-6">
                 <div className="absolute inset-0 border-4 border-gray-800 rounded-full" />
                 <div className="absolute inset-0 border-4 border-t-green-500 border-r-green-500 border-b-transparent border-l-transparent rounded-full animate-spin" />
              </div>
              <h2 className="text-xl font-bold text-white mb-1">Procesando Pago</h2>
              <p className="text-gray-400 text-sm">Conectando con {method}...</p>
           </div>
        )}

        {/* OVERLAY DE ÉXITO */}
        {status === 'success' && (
           <div className="absolute inset-0 flex flex-col items-center justify-center z-20 animate-scale-up">
              <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(34,197,94,0.5)] mb-6">
                 <CheckCircle2 size={48} className="text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-1">¡Pago Exitoso!</h2>
              <p className="text-gray-400 text-sm">Gracias por usar FastParking</p>
           </div>
        )}

        {/* Métodos de Pago */}
        <div className={`w-full max-w-[280px] px-4 flex flex-col gap-3 animate-fade-in-up transition-all duration-500 ${status !== 'idle' ? 'translate-y-20 opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}`}>
           
           {/* Tarjeta */}
           <button 
             onClick={() => handleSelectMethod('Tarjeta de Crédito')}
             className="group relative w-full bg-gray-900/60 hover:bg-gray-800/80 backdrop-blur-md border border-white/10 hover:border-blue-500/50 p-3 rounded-xl flex items-center gap-3 transition-all duration-300 active:scale-95 shadow-lg overflow-hidden"
           >
              <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center group-hover:bg-blue-600 transition-colors shrink-0">
                 <CreditCard size={20} className="text-white" />
              </div>
              <div className="flex flex-col items-start">
                 <span className="font-bold text-sm text-white">Tarjeta de Crédito</span>
                 <span className="text-[9px] text-gray-400">Visa / Mastercard</span>
              </div>
           </button>

           {/* Nequi */}
           <button 
             onClick={() => handleSelectMethod('Nequi')}
             className="group relative w-full bg-[#200020]/80 hover:bg-[#3b003b] backdrop-blur-md border border-white/10 hover:border-pink-500/50 p-3 rounded-xl flex items-center gap-3 transition-all duration-300 active:scale-95 shadow-lg overflow-hidden"
           >
              <div className="w-10 h-10 rounded-lg bg-[#da0081] flex items-center justify-center shadow-lg shadow-pink-500/20 shrink-0">
                 <Smartphone size={20} className="text-white" />
              </div>
              <div className="flex flex-col items-start">
                 <span className="font-bold text-sm text-white">Nequi</span>
                 <span className="text-[9px] text-pink-200/60">Pago rápido</span>
              </div>
           </button>

           {/* Google Pay */}
           <button 
             onClick={() => handleSelectMethod('Google Pay')}
             className="group relative w-full bg-white hover:bg-gray-100 backdrop-blur-md border border-gray-200 p-3 rounded-xl flex items-center gap-3 transition-all duration-300 active:scale-95 shadow-lg overflow-hidden"
           >
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200 shrink-0">
                 <Wallet size={20} className="text-gray-800" />
              </div>
              <div className="flex flex-col items-start">
                 <span className="font-bold text-sm text-gray-900">Google Pay</span>
                 <span className="text-[9px] text-gray-500">Billetera digital</span>
              </div>
           </button>

           {/* Volver */}
           <button 
             onClick={onBack}
             className="mt-2 flex items-center justify-center gap-2 text-gray-500 hover:text-white text-xs font-medium py-2 transition-colors"
           >
             <ChevronLeft size={14} />
             Volver al Dashboard
           </button>
        </div>
      </div>
    </div>
  );
};

// Componente simple de Icono
const ClockIcon = ({ size, className }: { size: number, className: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);
