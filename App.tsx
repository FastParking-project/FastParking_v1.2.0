
import React, { useState } from 'react';
import { MapView } from './components/MapView';
import { NavigationOverlay } from './components/NavigationOverlay';
import { WelcomeScreen } from './components/WelcomeScreen';
import { AccessibilityCheckScreen } from './components/AccessibilityCheckScreen';
import { DashboardScreen } from './components/DashboardScreen';
import { PaymentScreen } from './components/PaymentScreen';
import { AppState, ParkingSpot, Coordinate, NavigationStep, CameraMode } from './types';
import { calculatePath, calculatePedestrianPath, calculateExitPath, getPathLength } from './utils/navigationService';
import { PARKING_SPOTS } from './constants';
import { Navigation, Map as MapIcon, Compass, CheckCircle2, Home } from 'lucide-react';

export default function App() {
  // --- ESTADOS GLOBALES ---
  const [appState, setAppState] = useState<AppState>(AppState.WELCOME);
  const [selectedSpot, setSelectedSpot] = useState<ParkingSpot | null>(null);
  const [currentStep, setCurrentStep] = useState<NavigationStep | null>(null);
  const [navData, setNavData] = useState<{path: Coordinate[], steps: NavigationStep[]} | null>(null);
  const [cameraMode, setCameraMode] = useState<CameraMode>('free');
  
  // Preferencia de Accesibilidad
  const [isHandicapEnabled, setIsHandicapEnabled] = useState(false);
  
  // Lógica de Progreso de Navegación
  const [breakpoints, setBreakpoints] = useState<number[]>([]);
  const [totalPathDistance, setTotalPathDistance] = useState<number>(0);
  
  // Estadísticas en Tiempo Real
  const [stats, setStats] = useState({ remainingDist: 0, remainingTime: 0 });

  // Velocidad de simulación (Coincide con MapView)
  const SIMULATION_SPEED = 0.0075 * 1000; 

  // Configura los datos de navegación al seleccionar una ruta
  const setupNavigation = (data: {path: Coordinate[], steps: NavigationStep[]}, isWalking: boolean) => {
    setNavData(data);
    
    if (data.path.length > 0) {
        const totalLen = getPathLength(data.path);
        setTotalPathDistance(totalLen);
        setStats({ 
            remainingDist: totalLen, 
            remainingTime: totalLen / (isWalking ? SIMULATION_SPEED * 0.5 : SIMULATION_SPEED) 
        });

        // Calcular puntos de ruptura para las instrucciones paso a paso
        const dists = [0];
        let runningTotal = 0;
        for(let i=0; i < data.path.length - 1; i++) {
            const dx = data.path[i+1].x - data.path[i].x;
            const dy = data.path[i+1].y - data.path[i].y;
            runningTotal += Math.sqrt(dx*dx + dy*dy);
            dists.push(runningTotal);
        }
        // Normalizar distancias a rango 0-1
        const normDists = dists.map(d => totalLen > 0 ? d/totalLen : 0);
        setBreakpoints(normDists);
        
        setCurrentStep(data.steps[0]);
    }
  };

  // Maneja la selección de un espacio en el mapa
  const handleSpotSelect = (spot: ParkingSpot) => {
    if (spot.type === 'handicap' && !isHandicapEnabled) return;
    
    setSelectedSpot(spot);
    const data = calculatePath(spot);
    setupNavigation(data, false);
  };

  // Inicia la navegación
  const startNavigation = () => {
    if (selectedSpot && navData && navData.steps.length > 0) {
      setAppState(AppState.NAVIGATING);
      setCameraMode('drone'); // Cambiar a vista GPS
    }
  };

  // Cancela la navegación actual
  const cancelNavigation = () => {
    setAppState(AppState.IDLE);
    setCameraMode('free'); 
    setSelectedSpot(null);
    setNavData(null);
    setCurrentStep(null);
    setBreakpoints([]);
    setStats({ remainingDist: 0, remainingTime: 0 });
  };

  // Transiciones de Estado
  const handleWelcomeComplete = () => {
    setAppState(AppState.ACCESSIBILITY_CHECK);
  };

  const handleAccessibilityChoice = (required: boolean) => {
    setIsHandicapEnabled(required);
    setAppState(AppState.IDLE);
  };

  // Manejador de acciones del Dashboard (Pagar, Encontrar, Salir)
  const handleDashboardAction = (action: 'pay' | 'find' | 'exit') => {
    if (action === 'pay') {
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

  const handlePaymentComplete = () => {
    setAppState(AppState.DASHBOARD);
  };

  // Actualización de progreso desde MapView
  const handleProgressUpdate = (progress: number) => {
    if (!navData || breakpoints.length === 0) return;

    // 1. Actualizar Estadísticas
    const remainingUnits = totalPathDistance * (1 - progress);
    const isWalking = appState === AppState.FINDING_CAR;
    const speed = isWalking ? SIMULATION_SPEED * 0.5 : SIMULATION_SPEED;
    const remainingSeconds = remainingUnits / speed;
    
    setStats({
        remainingDist: Math.max(0, remainingUnits),
        remainingTime: Math.max(0, remainingSeconds * 60)
    });

    // 2. Determinar instrucción actual
    let segmentIndex = 0;
    for(let i=0; i < breakpoints.length - 1; i++) {
        if (progress >= breakpoints[i] && progress < breakpoints[i+1]) {
            segmentIndex = i;
            break;
        }
    }

    let targetStepIndex = segmentIndex + 1;

    // Lógica de Anticipación: Si estamos al 90% del segmento, mostrar la siguiente instrucción
    const segStart = breakpoints[segmentIndex];
    const segEnd = breakpoints[segmentIndex + 1];
    
    if (segEnd > segStart) {
        const fractionInSegment = (progress - segStart) / (segEnd - segStart);
        if (fractionInSegment > 0.90) {
            targetStepIndex = segmentIndex + 2;
        }
    }

    if (targetStepIndex < 0) targetStepIndex = 0;
    if (targetStepIndex >= navData.steps.length) targetStepIndex = navData.steps.length - 1;

    if (navData.steps[targetStepIndex]) {
        setCurrentStep(navData.steps[targetStepIndex]);
    }

    // 3. Finalización
    if (progress >= 0.99) {
      if (appState === AppState.FINDING_CAR) {
          setAppState(AppState.PARKED); // Reusa pantalla de llegada
          setCurrentStep({
            instruction: "Has llegado a tu vehículo",
            distance: 0,
            coordinate: { x: 0, y: 0},
            action: 'arrive'
          });
      } else if (appState === AppState.EXITING) {
          setAppState(AppState.WELCOME); // Reiniciar app al salir
          alert("¡Gracias por su visita!");
      } else {
          setAppState(AppState.PARKED);
          setCurrentStep({
            instruction: "Has llegado a tu estacionamiento",
            distance: 0,
            coordinate: { x: 0, y: 0},
            action: 'arrive'
          });
      }
    }
  };

  // --- RENDERIZADO CONDICIONAL POR ESTADO ---

  if (appState === AppState.WELCOME) {
    return <WelcomeScreen onStart={handleWelcomeComplete} />;
  }

  if (appState === AppState.ACCESSIBILITY_CHECK) {
    return <AccessibilityCheckScreen onSelect={handleAccessibilityChoice} />;
  }

  if (appState === AppState.DASHBOARD) {
    return (
      <DashboardScreen 
        parkingLabel={selectedSpot?.label || "P1-00"} 
        onPay={() => handleDashboardAction('pay')}
        onFindCar={() => handleDashboardAction('find')}
        onExit={() => handleDashboardAction('exit')}
      />
    );
  }

  if (appState === AppState.PAYMENT) {
    return (
      <PaymentScreen 
        elapsedTime="1h 15m" 
        amount={8500} 
        onBack={() => setAppState(AppState.DASHBOARD)}
        onComplete={handlePaymentComplete}
      />
    );
  }

  return (
    <div className="relative w-screen h-screen bg-gray-900 flex flex-col">
      {/* Cabecera Informativa (Solo visual) */}
      <div className={`absolute top-0 left-0 right-0 z-40 transition-transform duration-500 ${appState === AppState.NAVIGATING || appState === AppState.FINDING_CAR || appState === AppState.EXITING ? '-translate-y-full' : 'translate-y-0'}`}>
        <div className="bg-gray-800/90 backdrop-blur-md p-4 shadow-lg border-b border-gray-700">
            <div className="max-w-md mx-auto flex items-center gap-3 bg-gray-700 rounded-lg px-4 py-3 border border-gray-600 justify-center">
                <span className="text-gray-300 font-medium">Centro Comercial NanXiang - Nivel P1</span>
            </div>
            <p className="text-center text-gray-400 text-sm mt-2">
               {isHandicapEnabled 
                  ? "Selecciona un espacio (Regular o Discapacitado)" 
                  : "Selecciona un espacio libre para comenzar"}
            </p>
        </div>
      </div>

      {/* Área Principal del Mapa */}
      <div className="flex-1 relative overflow-hidden">
        <MapView 
          spots={PARKING_SPOTS} 
          path={navData?.path || []}
          targetSpot={selectedSpot}
          appState={appState}
          cameraMode={cameraMode}
          isHandicapEnabled={isHandicapEnabled}
          onSpotSelect={handleSpotSelect}
          onProgressUpdate={handleProgressUpdate}
        />

        {/* Controles Globales (Cámara) */}
        <div className="absolute top-48 right-3 z-40 flex flex-col gap-3">
           {(appState === AppState.NAVIGATING || appState === AppState.FINDING_CAR || appState === AppState.EXITING) && (
             <>
                <button 
                  onClick={() => setCameraMode('top')}
                  className={`p-2.5 rounded-full shadow-xl border border-white/10 backdrop-blur-sm transition-all active:scale-95 ${cameraMode === 'top' ? 'bg-blue-600 text-white' : 'bg-gray-900/80 text-gray-400 hover:bg-gray-800'}`}
                  title="Vista Superior"
                >
                  <MapIcon size={18} />
                </button>
                <button 
                  onClick={() => setCameraMode('drone')}
                  className={`p-2.5 rounded-full shadow-xl border border-white/10 backdrop-blur-sm transition-all active:scale-95 ${cameraMode === 'drone' ? 'bg-blue-600 text-white' : 'bg-gray-900/80 text-gray-400 hover:bg-gray-800'}`}
                  title="Vista Panorámica"
                >
                  <Compass size={18} />
                </button>
             </>
           )}
        </div>

        {/* Botón Flotante para Iniciar Navegación */}
        {appState === AppState.IDLE && selectedSpot && (
           <div className="absolute bottom-10 left-0 right-0 flex justify-center z-40 animate-bounce-small">
              <button 
                onClick={startNavigation}
                className="bg-blue-600 hover:bg-blue-500 text-white text-lg font-bold py-3 px-8 rounded-full shadow-lg shadow-blue-500/50 flex items-center gap-2 transform transition-all active:scale-95 border border-blue-400/30"
              >
                <Navigation size={20} fill="currentColor" />
                Navegar al espacio {selectedSpot.label}
              </button>
           </div>
        )}
      </div>

      {/* Overlay de Navegación Activa */}
      {(appState === AppState.NAVIGATING || appState === AppState.FINDING_CAR || appState === AppState.EXITING) && (
        <NavigationOverlay 
          currentStep={currentStep}
          remainingDistance={stats.remainingDist}
          remainingTime={stats.remainingTime}
          onCancel={cancelNavigation}
        />
      )}

      {/* Confirmación de Llegada */}
      {appState === AppState.PARKED && (
         <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-gray-800 p-8 rounded-3xl border border-green-500/30 shadow-[0_0_60px_rgba(34,197,94,0.2)] text-center max-w-sm mx-4 transform animate-scale-up">
                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/30 animate-pulse-slow">
                    {currentStep?.action === 'arrive' 
                      ? <CheckCircle2 size={40} className="text-white" />
                      : <Home size={40} className="text-white" />
                    }
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">
                  {currentStep?.action === 'arrive' ? "¡Llegaste!" : "Destino alcanzado"}
                </h2>
                <p className="text-gray-400 mb-8 text-sm">
                  {currentStep?.instruction || "Has llegado a tu destino."}
                </p>
                
                <button 
                  onClick={() => setAppState(AppState.DASHBOARD)}
                  className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-6 rounded-xl transition-colors border border-green-500/50 shadow-lg shadow-green-900/40"
                >
                  Continuar
                </button>
            </div>
         </div>
      )}
    </div>
  );
}
