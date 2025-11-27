
import React, { useEffect, useState, useRef } from 'react';
import { AppState, Coordinate, ParkingSpot, CameraMode } from '../types';
import { Accessibility } from 'lucide-react';
import { getPointAtDistance, getPathLength } from '../utils/navigationService';
import { 
  ROAD_Y_1, ROAD_Y_2, ROAD_Y_3, ROAD_Y_4,
  CROSSOVER_LEFT_X, CROSSOVER_RIGHT_X, 
  ROAD_WIDTH_AISLE, ENTRANCE_COORDS
} from '../constants';

interface MapViewProps {
  spots: ParkingSpot[];
  path: Coordinate[];
  targetSpot: ParkingSpot | null;
  appState: AppState;
  cameraMode: CameraMode;
  isHandicapEnabled: boolean;
  onSpotSelect: (spot: ParkingSpot) => void;
  onProgressUpdate: (progress: number) => void;
}

export const MapView: React.FC<MapViewProps> = ({ 
  spots, 
  path, 
  targetSpot, 
  appState, 
  cameraMode,
  isHandicapEnabled,
  onSpotSelect,
  onProgressUpdate
}) => {
  // Estado de navegación (Posición y Ángulo del auto)
  // Ángulo inicial 90 grados: Visualmente apunta hacia arriba en el modo vertical del móvil
  const [carPos, setCarPos] = useState<Coordinate>({ x: 0, y: 50 });
  const [carAngle, setCarAngle] = useState(90);
  
  // Refs para el bucle de animación
  const requestRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const totalPathLengthRef = useRef<number>(0);
  const smoothedAngleRef = useRef<number>(90); // Ángulo suavizado para evitar giros bruscos
  
  // Estado del Mapa Interactivo (Pan & Zoom)
  const [manualTransform, setManualTransform] = useState({ x: 0, y: 0, scale: 1.5 });
  const isDragging = useRef(false);
  const lastMousePos = useRef<{x: number, y: number} | null>(null);
  
  // Estado de Inercia para scroll suave
  const inertiaRef = useRef<number | null>(null);
  const velocityRef = useRef({ x: 0, y: 0 });
  const lastMoveTimeRef = useRef<number>(0);

  // Velocidad de simulación (ajustada para realismo)
  const VELOCITY = 0.0075; 

  // --- BUCLE DE ANIMACIÓN DEL AUTO ---
  const animate = (time: number) => {
    if (!startTimeRef.current) startTimeRef.current = time;
    
    const timeElapsed = time - startTimeRef.current;
    const distanceTravelled = timeElapsed * VELOCITY;
    const totalLength = totalPathLengthRef.current;
    
    const progress = Math.min(distanceTravelled / totalLength, 1);

    if (progress < 1) {
      const { point, angle: targetAngle } = getPointAtDistance(path, distanceTravelled);
      
      // Lógica de Rotación Suave (Interpolación)
      // 1. Calcular diferencia
      let diff = targetAngle - smoothedAngleRef.current;
      
      // 2. Normalizar a -180 a 180 para tomar el giro más corto
      while (diff < -180) diff += 360;
      while (diff > 180) diff -= 360;

      // 3. Interpolar (Factor 0.05 da un giro lento y cinemático)
      if (timeElapsed < 100) {
        smoothedAngleRef.current = targetAngle;
      } else {
        smoothedAngleRef.current += diff * 0.05;
      }

      setCarPos(point);
      setCarAngle(smoothedAngleRef.current);
      onProgressUpdate(progress);
      requestRef.current = requestAnimationFrame(animate);
    } else {
      // Final del recorrido
      if (appState === AppState.NAVIGATING && targetSpot) {
        setCarPos(targetSpot.coordinates);
      }
      onProgressUpdate(1);
    }
  };

  // Efecto para iniciar/detener animación según el estado
  useEffect(() => {
    const isActive = (appState === AppState.NAVIGATING || appState === AppState.FINDING_CAR || appState === AppState.EXITING);
    
    if (isActive && path.length > 0) {
      totalPathLengthRef.current = getPathLength(path);
      startTimeRef.current = null;
      
      // Configurar posición inicial
      const startInfo = getPointAtDistance(path, 0.1);
      smoothedAngleRef.current = startInfo.angle;
      setCarAngle(startInfo.angle);
      setCarPos(startInfo.point);

      requestRef.current = requestAnimationFrame(animate);
    } else if (appState === AppState.IDLE) {
      // Resetear a posición de entrada
      setCarPos(ENTRANCE_COORDS);
      setCarAngle(90); 
      smoothedAngleRef.current = 90;
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    }
    
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (inertiaRef.current) cancelAnimationFrame(inertiaRef.current);
    };
  }, [appState, path]);

  // --- MANEJADORES DE INTERACCIÓN (PAN & ZOOM) ---

  const handleWheel = (e: React.WheelEvent) => {
    if (cameraMode !== 'free') return;
    e.stopPropagation();
    const zoomSensitivity = 0.001;
    const newScale = Math.min(Math.max(manualTransform.scale - e.deltaY * zoomSensitivity, 0.5), 3);
    setManualTransform(prev => ({ ...prev, scale: newScale }));
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (cameraMode !== 'free') return;
    
    if (inertiaRef.current) {
      cancelAnimationFrame(inertiaRef.current);
      inertiaRef.current = null;
    }

    isDragging.current = true;
    lastMousePos.current = { x: e.clientX, y: e.clientY };
    velocityRef.current = { x: 0, y: 0 };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current || cameraMode !== 'free' || !lastMousePos.current) return;
    
    const now = Date.now();
    const dxScreen = e.clientX - lastMousePos.current.x;
    const dyScreen = e.clientY - lastMousePos.current.y;
    
    // --- LÓGICA DE MAPEO DE COORDENADAS ---
    // El mapa está rotado -90 grados (La entrada X=0 está visualmente abajo).
    // Por lo tanto, los ejes de arrastre deben invertirse para que el movimiento sea natural.
    
    // Mover Mouse Derecha (+Screen X) debe mover el mapa visualmente hacia la Derecha.
    // Visualmente Derecha corresponde al Eje Y local negativo.
    // Ajuste: Mover derecha pantalla -> Mapa Baja (dyMap = -dxScreen)

    // Mover Mouse Abajo (+Screen Y) debe mover el mapa visualmente Abajo.
    // Visualmente Abajo corresponde al Eje X local negativo (hacia la entrada).
    // Ajuste: Mover abajo pantalla -> Mapa Izquierda (dxMap = -dyScreen)

    const dxMap = -dxScreen; // Mover derecha pantalla -> Controla eje vertical mapa
    const dyMap = -dyScreen; // Mover abajo pantalla -> Controla eje horizontal mapa

    velocityRef.current = { x: dxMap, y: dyMap };
    lastMoveTimeRef.current = now;

    setManualTransform(prev => ({
      ...prev,
      x: prev.x + dxMap,
      y: prev.y + dyMap
    }));
    
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging.current || cameraMode !== 'free') return;
    
    isDragging.current = false;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);

    // Si pasó mucho tiempo, no aplicar inercia
    const timeSinceLastMove = Date.now() - lastMoveTimeRef.current;
    if (timeSinceLastMove > 50) {
      velocityRef.current = { x: 0, y: 0 };
      return;
    }

    // Iniciar loop de inercia
    const runInertia = () => {
       const friction = 0.95; // Factor de fricción
       
       velocityRef.current.x *= friction;
       velocityRef.current.y *= friction;
       
       if (Math.abs(velocityRef.current.x) < 0.1 && Math.abs(velocityRef.current.y) < 0.1) {
         inertiaRef.current = null;
         return;
       }

       setManualTransform(prev => ({
         ...prev,
         x: prev.x + velocityRef.current.x,
         y: prev.y + velocityRef.current.y
       }));

       inertiaRef.current = requestAnimationFrame(runInertia);
    };

    if (Math.abs(velocityRef.current.x) > 0.5 || Math.abs(velocityRef.current.y) > 0.5) {
      runInertia();
    }
  };

  // --- LÓGICA DE TRANSFORMACIÓN DE CÁMARA ---
  const getCameraStyle = () => {
    // Rotación base de -90 para que la entrada quede abajo en pantallas móviles verticales.
    const baseRot = -90; 

    // Modo Libre (Usuario mueve el mapa)
    if (cameraMode === 'free') {
      return {
        transform: `translate(${manualTransform.x}px, ${manualTransform.y}px) scale(${manualTransform.scale}) rotateX(0deg) rotateZ(${baseRot}deg)`,
        transition: 'transform 0.1s linear'
      };
    }

    // Calcular centro basado en la posición del auto
    const centerX = -carPos.x + 50;
    const centerY = -carPos.y + 50;

    let scale = 1;
    let rotateX = 0;
    let rotateZ = baseRot;
    let transitionStyle = 'transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)'; 
    let offsetY = 0; 

    switch (cameraMode) {
      case 'top':
        scale = 1.8;
        rotateX = 0;
        rotateZ = baseRot; // Vista superior respeta la rotación vertical
        break;
      case 'drone':
        scale = 2.5;
        rotateX = 45; // Inclinación 3D
        // En modo Drone, rotamos la cámara para que el auto siempre apunte hacia arriba (Head-Up Display)
        rotateZ = -carAngle; 
        offsetY = 10; 
        transitionStyle = 'transform 0.1s linear';
        break;
    }

    return {
      transform: `
        perspective(1000px)
        scale(${scale})
        translateY(${offsetY}%)
        rotateX(${rotateX}deg)
        rotateZ(${rotateZ}deg)
        translate(${centerX}%, ${centerY}%)
      `,
      transition: transitionStyle
    };
  };

  return (
    <div 
      className={`relative w-full h-full bg-gray-300 overflow-hidden touch-none ${cameraMode === 'free' ? 'cursor-move' : 'cursor-default'}`}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      
      {/* Contenedor de Transformaciones CSS */}
      <div 
        className="w-full h-full origin-center transform-style-3d will-change-transform"
        style={{ 
          ...getCameraStyle(),
          transformStyle: 'preserve-3d' 
        }}
      >

        {/* Cuadrícula decorativa de fondo */}
        <div className="absolute inset-0 opacity-20 pointer-events-none" 
             style={{ backgroundImage: 'linear-gradient(#9ca3af 1px, transparent 1px), linear-gradient(90deg, #9ca3af 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
        </div>

        {/* --- CAPA DE INFRAESTRUCTURA (SVG) --- */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            {/* Filtro de sombra para dar profundidad a las carreteras */}
            <filter id="road-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="0.5" />
              <feOffset dx="0" dy="0.5" result="offsetblur" />
              <feComponentTransfer>
                <feFuncA type="linear" slope="0.3" />
              </feComponentTransfer>
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            
            <filter id="glow-entrance">
              <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Red Vial (Carreteras) */}
          <g filter="url(#road-shadow)">
            <path 
              d={`
                  M 0 50 L ${CROSSOVER_LEFT_X} 50
                  M ${CROSSOVER_RIGHT_X} 50 L 100 50
                  M ${CROSSOVER_LEFT_X} ${ROAD_Y_1} L ${CROSSOVER_LEFT_X} ${ROAD_Y_4}
                  M ${CROSSOVER_RIGHT_X} ${ROAD_Y_1} L ${CROSSOVER_RIGHT_X} ${ROAD_Y_4}
                  M ${CROSSOVER_LEFT_X} ${ROAD_Y_1} L ${CROSSOVER_RIGHT_X} ${ROAD_Y_1}
                  M ${CROSSOVER_LEFT_X} ${ROAD_Y_2} L ${CROSSOVER_RIGHT_X} ${ROAD_Y_2}
                  M ${CROSSOVER_LEFT_X} ${ROAD_Y_3} L ${CROSSOVER_RIGHT_X} ${ROAD_Y_3}
                  M ${CROSSOVER_LEFT_X} ${ROAD_Y_4} L ${CROSSOVER_RIGHT_X} ${ROAD_Y_4}
              `}
              stroke="#374151"
              strokeWidth={ROAD_WIDTH_AISLE}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </g>

          {/* Caminos Peatonales (Andenes y Cebras) */}
          <g>
             {/* Sendero Perimetral Amarillo */}
             <path 
               d={`
                  M 3 44 L 3 3 L 98 3 L 98 44
                  M 98 56 L 98 97 L 3 97 L 3 56
               `} 
               stroke="#f59e0b" // Base Ambar
               strokeWidth="3.5"
               strokeLinecap="butt"
               fill="none"
               opacity="0.3"
             />
             <path 
               d={`
                  M 3 44 L 3 3 L 98 3 L 98 44
                  M 98 56 L 98 97 L 3 97 L 3 56
               `}  
               stroke="#fcd34d" // Textura superior
               strokeWidth="2.5"
               strokeLinecap="butt"
               strokeDasharray="0.3, 0.3"
               fill="none"
               opacity="0.8"
             />
             
             {/* Conexión a la entrada (Arriba Derecha) */}
             <path d="M 98 3 L 98 6" stroke="#f59e0b" strokeWidth="2.5" fill="none" opacity="0.8" />
             
             {/* Pasos de Cebra (Conectores Horizontales) */}
             <g stroke="#fbbf24" strokeWidth="2" strokeDasharray="1, 1" strokeLinecap="butt" opacity="0.9">
                <path d={`M ${CROSSOVER_RIGHT_X} ${ROAD_Y_1} L 98 ${ROAD_Y_1}`} />
                <path d={`M ${CROSSOVER_RIGHT_X} ${ROAD_Y_2} L 98 ${ROAD_Y_2}`} />
                <path d={`M ${CROSSOVER_RIGHT_X} ${ROAD_Y_3} L 98 ${ROAD_Y_3}`} />
                <path d={`M ${CROSSOVER_RIGHT_X} ${ROAD_Y_4} L 98 ${ROAD_Y_4}`} />

                <path d={`M ${CROSSOVER_LEFT_X} ${ROAD_Y_1} L 3 ${ROAD_Y_1}`} />
                <path d={`M ${CROSSOVER_LEFT_X} ${ROAD_Y_2} L 3 ${ROAD_Y_2}`} />
                <path d={`M ${CROSSOVER_LEFT_X} ${ROAD_Y_3} L 3 ${ROAD_Y_3}`} />
                <path d={`M ${CROSSOVER_LEFT_X} ${ROAD_Y_4} L 3 ${ROAD_Y_4}`} />
             </g>
          </g>

          {/* Marcador de Entrada Peatonal (Cebra) - x=98 */}
          <g transform="translate(98, 3)" filter="url(#glow-entrance)">
            <rect x="-6" y="-4" width="12" height="16" fill="#f59e0b" opacity="0.2" rx="2" />
            <rect x="-5" y="-2" width="10" height="12" fill="none" />
            <line x1="-3" y1="-2" x2="-3" y2="10" stroke="white" strokeWidth="1.5" />
            <line x1="0" y1="-2" x2="0" y2="10" stroke="white" strokeWidth="1.5" />
            <line x1="3" y1="-2" x2="3" y2="10" stroke="white" strokeWidth="1.5" />
          </g>

          {/* Líneas punteadas de las carreteras */}
          <g stroke="#6b7280" strokeWidth="0.3" strokeDasharray="2,2" fill="none">
             <line x1={CROSSOVER_LEFT_X} y1={ROAD_Y_1} x2={CROSSOVER_LEFT_X} y2={ROAD_Y_4} />
             <line x1={CROSSOVER_RIGHT_X} y1={ROAD_Y_1} x2={CROSSOVER_RIGHT_X} y2={ROAD_Y_4} />
             <line x1="0" y1="50" x2={CROSSOVER_LEFT_X} y2="50" />
             <line x1={CROSSOVER_RIGHT_X} y1="50" x2="100" y2="50" />
             <line x1={CROSSOVER_LEFT_X} y1={ROAD_Y_1} x2={CROSSOVER_RIGHT_X} y2={ROAD_Y_1} />
             <line x1={CROSSOVER_LEFT_X} y1={ROAD_Y_2} x2={CROSSOVER_RIGHT_X} y2={ROAD_Y_2} />
             <line x1={CROSSOVER_LEFT_X} y1={ROAD_Y_3} x2={CROSSOVER_RIGHT_X} y2={ROAD_Y_3} />
             <line x1={CROSSOVER_LEFT_X} y1={ROAD_Y_4} x2={CROSSOVER_RIGHT_X} y2={ROAD_Y_4} />
          </g>
        </svg>
        
        {/* Etiquetas de Entrada/Salida (Rotadas 90 grados para vista vertical) */}
        <div className="absolute top-1/2 left-1 -translate-y-1/2 text-white/60 font-bold rotate-90 text-[10px] tracking-widest z-0 pointer-events-none drop-shadow-md">ENTRADA</div>
        <div className="absolute top-1/2 right-1 -translate-y-1/2 text-white/60 font-bold rotate-90 text-[10px] tracking-widest z-0 pointer-events-none drop-shadow-md">SALIDA</div>
        
        {/* Etiqueta Acceso Peatonal */}
        <div className="absolute top-0 left-[99%] -translate-x-1/2 mt-4 flex flex-col items-center z-10 pointer-events-none">
           <div className="text-black font-black rotate-90 text-[6px] tracking-widest whitespace-nowrap">
             ACCESO PEATONAL
           </div>
        </div>

        {/* --- DIBUJO DE RUTA ACTIVA --- */}
        {(appState === AppState.NAVIGATING || appState === AppState.FINDING_CAR || appState === AppState.EXITING) && path.length > 0 && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-20">
            <polyline
              points={path.map(p => `${p.x},${p.y}`).join(' ')}
              fill="none"
              stroke={appState === AppState.FINDING_CAR ? "#f59e0b" : "#3b82f6"}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={appState === AppState.FINDING_CAR ? "2, 2" : "none"}
              className="opacity-90 filter drop-shadow-md transition-[stroke-dasharray] duration-500 ease-in-out"
            />
          </svg>
        )}

        {/* --- CAPA DE ESPACIOS DE ESTACIONAMIENTO --- */}
        {spots.map((spot) => {
          const isDisabled = spot.type === 'occupied' || (spot.type === 'handicap' && !isHandicapEnabled);
          return (
          <button
            key={spot.id}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => !isDisabled && onSpotSelect(spot)}
            disabled={isDisabled}
            className={`absolute w-[4.2%] h-[6.5%] -translate-x-1/2 -translate-y-1/2 rounded-[2px] border transition-all duration-300 group z-10 shadow-sm transform-style-flat flex items-center justify-center
              ${spot.type === 'occupied' ? 'bg-red-500/10 border-red-500/30' : 
                spot.type === 'handicap' ? 'bg-blue-600 border-blue-700' : 
                'bg-white/70 border-white hover:bg-green-500/30 hover:border-green-400'}
              
              ${!isDisabled && spot.type === 'handicap' ? 'hover:bg-blue-500' : ''}
              ${isDisabled && spot.type === 'handicap' ? 'opacity-50 grayscale' : ''}

              ${targetSpot?.id === spot.id ? 'bg-green-500/60 border-green-400 ring-2 ring-green-400/50 scale-125 z-20' : ''}
            `}
            style={{ left: `${spot.coordinates.x}%`, top: `${spot.coordinates.y}%` }}
          >
            {/* Contenido del espacio */}
            <div className="relative w-full h-full flex flex-col items-center justify-center">
              {spot.type === 'occupied' && <div className="w-[80%] h-[90%] bg-red-600 rounded-sm shadow-sm z-10" />}
              
              {spot.type === 'handicap' && !spot.type.includes('occupied') && (
                 <Accessibility size={12} className="text-white font-bold z-10" strokeWidth={3} />
              )}
              
              {spot.type === 'regular' && targetSpot?.id === spot.id && (
                 <div className="w-2 h-2 bg-green-500 rounded-full animate-ping z-10" />
              )}

              {/* Número del espacio (En el piso) */}
              {spot.type !== 'occupied' && (
                 <span className={`text-[2.5px] leading-none font-bold absolute bottom-0.5 tracking-tighter
                    ${spot.type === 'handicap' ? 'text-white/80' : 'text-gray-500/80'}
                 `}>
                   {spot.label}
                 </span>
              )}
            </div>
          </button>
        )})}

        {/* --- AVATAR DEL USUARIO (Auto o Persona) --- */}
        <div 
          className="absolute w-8 h-8 z-30 flex items-center justify-center transition-transform duration-75 ease-linear will-change-transform"
          style={{ 
            left: `${carPos.x}%`, 
            top: `${carPos.y}%`,
            transform: `translate(-50%, -50%) rotate(${carAngle}deg)`
          }}
        >
          {appState === AppState.FINDING_CAR ? (
             /* Avatar Peatonal (Punto Ambar) */
             <div className="relative w-full h-full drop-shadow-lg flex items-center justify-center">
                 <div className="w-4 h-4 bg-amber-500 rounded-full border-2 border-white shadow-md" />
             </div>
          ) : (
             /* Avatar Auto (Flecha Azul) */
             <div className="relative w-full h-full drop-shadow-lg">
               <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
                 <path 
                    d="M12 2L2 22L12 18L22 22L12 2Z" 
                    fill="#3b82f6" 
                    stroke="white" 
                    strokeWidth="2" 
                    strokeLinejoin="round"
                 />
               </svg>
             </div>
          )}
        </div>

        {/* Pin de Destino */}
        {targetSpot && (
              <div className="absolute z-20" style={{ left: `${targetSpot.coordinates.x}%`, top: `${targetSpot.coordinates.y}%`, transform: 'translate(-50%, -100%)' }}>
                 <div className="relative animate-bounce">
                   <div className="text-red-500 drop-shadow-md">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#ef4444" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                          <circle cx="12" cy="10" r="3" fill="white"></circle>
                      </svg>
                   </div>
                 </div>
              </div>
        )}
      </div>
      
      {cameraMode === 'free' && (
        <div className="absolute bottom-4 right-4 bg-white/80 p-2 rounded text-xs text-gray-600 pointer-events-none backdrop-blur z-40">
          Usa scroll para zoom • Arrastra para mover
        </div>
      )}

    </div>
  );
};
