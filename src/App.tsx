import React, { useState, useEffect } from 'react';
import { MapView } from './components/MapView';
import { NavigationOverlay } from './components/NavigationOverlay';
import { WelcomeScreen } from './components/WelcomeScreen';
import { AccessibilityCheckScreen } from './components/AccessibilityCheckScreen';
import { DashboardScreen } from './components/DashboardScreen';
import { PaymentScreen } from './components/PaymentScreen';
import { AppState, ParkingSpot, Coordinate, NavigationStep, CameraMode, UserSession } from './types';
import { calculatePath, calculatePedestrianPath, calculateExitPath, getPathLength } from './utils/navigationService';
import { PARKING_SPOTS as FALLBACK_SPOTS } from './constants';
import { Navigation, Map as MapIcon, Compass, CheckCircle2, Home } from 'lucide-react';

export default function App() {
  const [appState, setAppState] = useState<AppState>(AppState.WELCOME);
  const [spots, setSpots] = useState<ParkingSpot[]>([]);
  
  // DATOS DE SESIÓN Y PAGO
  const [currentSession, setCurrentSession] = useState<UserSession | null>(null);
  const [paymentInfo, setPaymentInfo] = useState<{amount: number, formattedDuration: string}>({ amount: 0, formattedDuration: '' });

  const [selectedSpot, setSelectedSpot] = useState<ParkingSpot | null>(null);
  const [currentStep, setCurrentStep] = useState<NavigationStep | null>(null);
  const [navData, setNavData] = useState<{path: Coordinate[], steps: NavigationStep[]} | null>(null);
  const [cameraMode, setCameraMode] = useState<CameraMode>('free');
  const [isHandicapEnabled, setIsHandicapEnabled] = useState(false);
  const [breakpoints, setBreakpoints] = useState<number[]>([]);
  const [totalPathDistance, setTotalPathDistance] = useState<number>(0);
  const [stats, setStats] = useState({ remainingDist: 0, remainingTime: 0 });
  const SIMULATION_SPEED = 0.0075 * 1000; 

  // --- 1. CARGA INICIAL DE DATOS ---
  useEffect(() => {
    fetch('/api/spots')
      .then(res => res.json())
      .then(data => setSpots(data))
      .catch(() => setSpots(FALLBACK_SPOTS));
  }, []);

  // --- 2. INICIAR SESIÓN (QR/NFC) ---
  const handleWelcomeComplete = async (method: 'qr' | 'nfc') => {
    try {
      const res = await fetch('/api/sessions/start', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ method })
      });
      const session = await res.json();
      setCurrentSession(session);
      setAppState(AppState.ACCESSIBILITY_CHECK);
    } catch (e) {
      console.error("Error iniciando sesión", e);
      // Fallback para demo offline
      setAppState(AppState.ACCESSIBILITY_CHECK);
    }
  };

  const handleAccessibilityChoice = (required: boolean) => {
    setIsHandicapEnabled(required);
    setAppState(AppState.IDLE);
  };

  const handleSpotSelect = (spot: ParkingSpot) => {
    if (spot.type === 'handicap' && !isHandicapEnabled) return;
    setSelectedSpot(spot);
    const data = calculatePath(spot);
    setupNavigation(data, false);
  };

  const setupNavigation = (data: {path: Coordinate[], steps: NavigationStep[]}, isWalking: boolean) => {
    setNavData(data);
    if (data.path.length > 0) {
        const totalLen = getPathLength(data.path);
        setTotalPathDistance(totalLen);
        setStats({ remainingDist: totalLen, remainingTime: totalLen / (isWalking ? SIMULATION_SPEED * 0.5 : SIMULATION_SPEED) });
        const dists = [0];
        let runningTotal = 0;
        for(let i=0; i < data.path.length - 1; i++) {
            const dx = data.path[i+1].x - data.path[i].x;
            const dy = data.path[i+1].y - data.path[i].y;
            runningTotal += Math.sqrt(dx*dx + dy*dy);
            dists.push(runningTotal);
        }
        const normDists = dists.map(d => totalLen > 0 ? d/totalLen : 0);
        setBreakpoints(normDists);
        setCurrentStep(data.steps[0]);
    }
  };

  const startNavigation = () => {
    if (selectedSpot && navData) {
      setAppState(AppState.NAVIGATING);
      setCameraMode('drone'); 
    }
  };

  const cancelNavigation = () => {
    setAppState(AppState.IDLE);
    setCameraMode('free'); 
    setSelectedSpot(null);
    setNavData(null);
  };

  // --- 3. LLEGADA AL ESPACIO (ASIGNAR EN BD) ---
  const handleArrivalAtSpot = async () => {
    if (selectedSpot && currentSession) {
       // Actualizar en frontend
       setSpots(prev => prev.map(s => s.id === selectedSpot.id ? {...s, type: 'occupied'} : s));
       
       // Llamar API
       try {
          await fetch(`/api/sessions/${currentSession._id}/assign-spot`, {
             method: 'PATCH',
             headers: {'Content-Type': 'application/json'},
             body: JSON.stringify({ spotId: selectedSpot.id, isHandicap: isHandicapEnabled })
          });
       } catch(e) { console.error(e); }
    }
    setAppState(AppState.PARKED);
  };

  // --- 4. DASHBOARD & PAGOS ---
  const handleDashboardAction = async (action: 'pay' | 'find' | 'exit') => {
    if (action === 'pay') {
       if (currentSession) {
          // Calcular tarifa real
          const res = await fetch(`/api/sessions/${currentSession._id}/fee`);
          const data = await res.json();
          setPaymentInfo({ amount: data.amount, formattedDuration: data.formattedDuration });
       } else {
          setPaymentInfo({ amount: 5000, formattedDuration: '0h 30m' }); // Fallback
       }
       setAppState(AppState.PAYMENT);

    } else if (action === 'find') {
      if (selectedSpot) {
          const data = calculatePedestrianPath(selectedSpot);
          setupNavigation(data, true);
          setAppState(AppState.FINDING_CAR);
          setCameraMode('drone');
      }
    } else if (action === 'exit') {
       if (selectedSpot) {
          const data = calculateExitPath(selectedSpot);
          setupNavigation(data, false);
          setAppState(AppState.EXITING);
          setCameraMode('drone');
       }
    }
  };

  // --- 5. PROCESAR PAGO ---
  const handlePaymentSubmit = async (paymentData: { method: string, details: any }) => {
     if (currentSession) {
        await fetch('/api/payments', {
           method: 'POST',
           headers: {'Content-Type': 'application/json'},
           body: JSON.stringify({
              sessionId: currentSession._id,
              amount: paymentInfo.amount,
              ...paymentData
           })
        });
     }
     setAppState(AppState.DASHBOARD);
  };

  // --- 6. SALIDA FINAL ---
  const handleExitComplete = async () => {
    if (currentSession) {
       await fetch(`/api/sessions/${currentSession._id}/complete`, { method: 'POST' });
       // Liberar spot en local
       if (selectedSpot) {
          setSpots(prev => prev.map(s => s.id === selectedSpot.id ? {...s, type: isHandicapEnabled ? 'handicap' : 'regular'} : s));
       }
    }
    setAppState(AppState.WELCOME);
    setCurrentSession(null);
  };

  const handleProgressUpdate = (progress: number) => {
    if (!navData || breakpoints.length === 0) return;
    const remainingUnits = totalPathDistance * (1 - progress);
    const isWalking = appState === AppState.FINDING_CAR;
    const speed = isWalking ? SIMULATION_SPEED * 0.5 : SIMULATION_SPEED;
    setStats({ remainingDist: Math.max(0, remainingUnits), remainingTime: Math.max(0, (remainingUnits/speed)*60) });

    let segmentIndex = 0;
    for(let i=0; i < breakpoints.length - 1; i++) {
        if (progress >= breakpoints[i] && progress < breakpoints[i+1]) { segmentIndex = i; break; }
    }
    let targetStepIndex = segmentIndex + 1;
    const segStart = breakpoints[segmentIndex];
    const segEnd = breakpoints[segmentIndex+1];
    if (segEnd > segStart && (progress - segStart)/(segEnd - segStart) > 0.90) targetStepIndex = segmentIndex + 2;
    if (targetStepIndex >= navData.steps.length) targetStepIndex = navData.steps.length - 1;
    if (navData.steps[targetStepIndex]) setCurrentStep(navData.steps[targetStepIndex]);

    if (progress >= 0.99) {
      if (appState === AppState.NAVIGATING) handleArrivalAtSpot();
      else if (appState === AppState.FINDING_CAR) {
          setAppState(AppState.PARKED);
          setCurrentStep({ instruction: "Has llegado a tu vehículo", distance: 0, coordinate: {x:0,y:0}, action: 'arrive' });
      } else if (appState === AppState.EXITING) {
          handleExitComplete();
      }
    }
  };

  if (appState === AppState.WELCOME) return <WelcomeScreen onStart={handleWelcomeComplete} />;
  if (appState === AppState.ACCESSIBILITY_CHECK) return <AccessibilityCheckScreen onSelect={handleAccessibilityChoice} />;
  if (appState === AppState.DASHBOARD) return <DashboardScreen parkingLabel={selectedSpot?.label || "P1-00"} onPay={() => handleDashboardAction('pay')} onFindCar={() => handleDashboardAction('find')} onExit={() => handleDashboardAction('exit')} />;
  if (appState === AppState.PAYMENT) return <PaymentScreen elapsedTime={paymentInfo.formattedDuration} amount={paymentInfo.amount} onBack={() => setAppState(AppState.DASHBOARD)} onComplete={handlePaymentSubmit} />;

  return (
    <div className="relative w-full h-[100dvh] bg-gray-900 flex flex-col">
      <div className={`absolute top-0 left-0 right-0 z-40 transition-transform duration-500 ${appState === AppState.NAVIGATING || appState === AppState.FINDING_CAR || appState === AppState.EXITING ? '-translate-y-full' : 'translate-y-0'}`}>
        <div className="bg-gray-800/90 backdrop-blur-md p-4 shadow-lg border-b border-gray-700">
            <div className="max-w-md mx-auto flex items-center gap-3 bg-gray-700 rounded-lg px-4 py-3 border border-gray-600 justify-center">
                <span className="text-gray-300 font-medium">Centro Comercial NanXiang</span>
            </div>
            <p className="text-center text-gray-400 text-sm mt-2">{isHandicapEnabled ? "Selecciona un espacio (Regular o Discapacitado)" : "Selecciona un espacio libre para comenzar"}</p>
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden">
        <MapView spots={spots} path={navData?.path || []} targetSpot={selectedSpot} appState={appState} cameraMode={cameraMode} isHandicapEnabled={isHandicapEnabled} onSpotSelect={handleSpotSelect} onProgressUpdate={handleProgressUpdate} />
        <div className="absolute top-48 right-3 z-40 flex flex-col gap-3">
           {(appState === AppState.NAVIGATING || appState === AppState.FINDING_CAR || appState === AppState.EXITING) && (
             <>
                <button onClick={() => setCameraMode('top')} className={`p-2.5 rounded-full shadow-xl border border-white/10 backdrop-blur-sm ${cameraMode === 'top' ? 'bg-blue-600' : 'bg-gray-900/80'}`}><MapIcon size={18}/></button>
                <button onClick={() => setCameraMode('drone')} className={`p-2.5 rounded-full shadow-xl border border-white/10 backdrop-blur-sm ${cameraMode === 'drone' ? 'bg-blue-600' : 'bg-gray-900/80'}`}><Compass size={18}/></button>
             </>
           )}
        </div>
        {appState === AppState.IDLE && selectedSpot && (
           <div className="absolute bottom-10 left-0 right-0 flex justify-center z-40 animate-bounce-small">
              <button onClick={startNavigation} className="bg-blue-600 hover:bg-blue-500 text-white text-lg font-bold py-3 px-8 rounded-full shadow-lg shadow-blue-500/50 flex items-center gap-2 transform transition-all active:scale-95 border border-blue-400/30">
                <Navigation size={20} fill="currentColor" /> Navegar al espacio {selectedSpot.label}
              </button>
           </div>
        )}
      </div>

      {(appState === AppState.NAVIGATING || appState === AppState.FINDING_CAR || appState === AppState.EXITING) && (
        <NavigationOverlay currentStep={currentStep} remainingDistance={stats.remainingDist} remainingTime={stats.remainingTime} onCancel={cancelNavigation} />
      )}

      {appState === AppState.PARKED && (
         <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-gray-800 p-8 rounded-3xl border border-green-500/30 shadow-[0_0_60px_rgba(34,197,94,0.2)] text-center max-w-sm mx-4 transform animate-scale-up">
                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/30 animate-pulse-slow">
                    {currentStep?.action === 'arrive' ? <CheckCircle2 size={40} className="text-white" /> : <Home size={40} className="text-white" />}
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">{currentStep?.action === 'arrive' ? "¡Llegaste!" : "Destino alcanzado"}</h2>
                <button onClick={() => setAppState(AppState.DASHBOARD)} className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-6 rounded-xl transition-colors border border-green-500/50 shadow-lg shadow-green-900/40">Continuar</button>
            </div>
         </div>
      )}
    </div>
  );
}