import React, { useState } from 'react';
import { CreditCard, Wallet, Smartphone, ChevronLeft, CheckCircle2, DollarSign, X } from 'lucide-react';

interface PaymentScreenProps {
  elapsedTime: string;
  amount: number;
  onBack: () => void;
  // Recibe la función que conecta con el API
  onComplete: (paymentData: { method: string, details: any }) => void;
}

export const PaymentScreen: React.FC<PaymentScreenProps> = ({ elapsedTime, amount, onBack, onComplete }) => {
  const [status, setStatus] = useState<'idle' | 'form' | 'processing' | 'success'>('idle');
  const [method, setMethod] = useState<string>('');
  
  // Estados para datos del formulario
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  
  const [nequiNumber, setNequiNumber] = useState('');
  const [googleData] = useState({ email: 'usuario@gmail.com' }); // Simulado, normalmente viene de la API del navegador

  const handleSelectMethod = (selectedMethod: string) => {
    setMethod(selectedMethod);
    setStatus('form');
  };

  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('processing');
    
    // Recopilar TODOS los datos ingresados sin censura
    let details = {};
    
    if (method === 'Tarjeta de Crédito') {
        details = { 
            cardNumber: cardNumber,    // Número completo
            cardHolder: cardHolder,    // Nombre del titular
            expiryDate: cardExpiry,    // Fecha de expiración
            cvv: cardCvv               // Código de seguridad
        };
    } else if (method === 'Nequi') {
        details = { 
            phoneNumber: nequiNumber   // Número de celular completo
        };
    } else if (method === 'Google Pay') {
        details = { 
            email: googleData.email,
            linkedCard: '**** 8888'    // Dato simulado de la billetera
        };
    }

    // Enviar al padre (App.tsx) para que llame al API
    // Usamos setTimeout solo para simular visualmente la carga, pero en App.tsx se hará el fetch
    setTimeout(() => {
        onComplete({ method, details });
    }, 1500); 
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="relative w-full h-[100dvh] flex flex-col items-center justify-between pb-12 pt-20 bg-gray-950 overflow-hidden">
      
      {/* Fondo */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_50%_10%,_#1f2937_0%,_#030712_100%)]" />
      
      {/* Contenido */}
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-between">
        
        {/* Resumen - Se oculta al mostrar formulario */}
        <div className={`flex-1 w-full flex flex-col items-center justify-center px-6 transition-all duration-500 ${status !== 'idle' ? 'opacity-0 scale-95 pointer-events-none absolute' : 'opacity-100 scale-100'}`}>
           <div className="text-center space-y-1 mb-8 animate-fade-in-down">
              <p className="text-gray-400 text-xs font-mono tracking-widest uppercase">Total a Pagar</p>
              <h1 className="text-5xl font-black text-white tracking-tighter drop-shadow-lg">{formatCurrency(amount)}</h1>
              <div className="inline-flex items-center gap-2 bg-gray-800/50 px-3 py-1 rounded-full border border-gray-700 mt-2">
                 <span className="text-xs text-gray-300 font-mono">{elapsedTime} de estadía</span>
              </div>
           </div>
        </div>

        {/* --- FORMULARIO --- */}
        {status === 'form' && (
            <div className="absolute inset-0 z-20 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-fade-in">
                <div className="w-full max-w-[320px] bg-gray-900 border border-gray-700 rounded-2xl p-6 shadow-2xl relative">
                    <button onClick={() => setStatus('idle')} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={20} /></button>
                    
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
                                    <input required type="text" placeholder="0000 0000 0000 0000" maxLength={19}
                                       value={cardNumber}
                                       onChange={e => setCardNumber(e.target.value)}
                                       className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500 outline-none" />
                                </div>
                                <div className="flex gap-3">
                                    <div className="space-y-1 flex-1">
                                        <label className="text-[10px] text-gray-400 font-mono uppercase">Fecha Exp</label>
                                        <input required type="text" placeholder="MM/YY" maxLength={5}
                                            value={cardExpiry}
                                            onChange={e => setCardExpiry(e.target.value)}
                                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500 outline-none" />
                                    </div>
                                    <div className="space-y-1 w-20">
                                        <label className="text-[10px] text-gray-400 font-mono uppercase">CVV</label>
                                        <input required type="password" placeholder="123" maxLength={4}
                                            value={cardCvv}
                                            onChange={e => setCardCvv(e.target.value)}
                                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500 outline-none" />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-gray-400 font-mono uppercase">Nombre Titular</label>
                                    <input required type="text" placeholder="NOMBRE APELLIDO" 
                                        value={cardHolder}
                                        onChange={e => setCardHolder(e.target.value)}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500 outline-none" />
                                </div>
                            </>
                        )}
                        {method === 'Nequi' && (
                            <div className="space-y-1">
                                <label className="text-[10px] text-gray-400 font-mono uppercase">Celular</label>
                                <input required type="tel" placeholder="300 123 4567" 
                                       value={nequiNumber}
                                       onChange={e => setNequiNumber(e.target.value)}
                                       className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-pink-500 outline-none" />
                            </div>
                        )}
                        {method === 'Google Pay' && (
                             <div className="space-y-1">
                                <label className="text-[10px] text-gray-400 font-mono uppercase">Cuenta Google</label>
                                <div className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm flex items-center justify-between">
                                    <span>{googleData.email}</span>
                                    <CheckCircle2 size={14} className="text-green-500" />
                                </div>
                                <p className="text-[9px] text-gray-500 mt-1">Se usará la tarjeta predeterminada.</p>
                             </div>
                        )}

                        <button type="submit" className="w-full mt-2 bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg">
                            Pagar {formatCurrency(amount)}
                        </button>
                    </form>
                </div>
            </div>
        )}

        {status === 'processing' && (
           <div className="absolute inset-0 flex flex-col items-center justify-center z-20 animate-fade-in">
              <div className="w-12 h-12 border-4 border-gray-800 border-t-green-500 rounded-full animate-spin mb-4" />
              <h2 className="text-xl font-bold text-white">Procesando...</h2>
           </div>
        )}

        {/* Botones de Selección */}
        <div className={`w-full max-w-[280px] px-4 flex flex-col gap-3 animate-fade-in-up transition-all duration-500 ${status !== 'idle' ? 'translate-y-20 opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}`}>
           <button onClick={() => handleSelectMethod('Tarjeta de Crédito')} className="w-full bg-gray-900/60 hover:bg-gray-800/80 border border-white/10 p-3 rounded-xl flex items-center gap-3 text-white font-bold text-sm"><CreditCard size={20}/> Tarjeta de Crédito</button>
           <button onClick={() => handleSelectMethod('Nequi')} className="w-full bg-[#200020]/80 hover:bg-[#3b003b] border border-white/10 p-3 rounded-xl flex items-center gap-3 text-white font-bold text-sm"><Smartphone size={20}/> Nequi</button>
           <button onClick={() => handleSelectMethod('Google Pay')} className="w-full bg-white hover:bg-gray-100 text-gray-900 p-3 rounded-xl flex items-center gap-3 font-bold text-sm"><Wallet size={20}/> Google Pay</button>
           <button onClick={onBack} className="mt-2 text-gray-500 text-xs flex justify-center items-center gap-1"><ChevronLeft size={14}/> Cancelar</button>
        </div>
      </div>
    </div>
  );
};