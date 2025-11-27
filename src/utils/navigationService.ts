
import { Coordinate, NavigationStep, ParkingSpot } from '../types';
import { 
  ENTRANCE_COORDS, 
  EXIT_COORDS,
  ROAD_Y_1, 
  ROAD_Y_2, 
  ROAD_Y_3, 
  ROAD_Y_4,
  CROSSOVER_LEFT_X,
  CROSSOVER_RIGHT_X
} from '../constants';

// --- FUNCIONES MATEMÁTICAS ---

// Interpolación Lineal: Encuentra un punto entre start y end basado en t (0 a 1)
export const lerp = (start: number, end: number, t: number): number => {
  return start * (1 - t) + end * t;
};

// Obtiene el ángulo en grados entre dos puntos (ajustado +90 para orientación del auto)
export const getAngle = (p1: Coordinate, p2: Coordinate): number => {
  const dy = p2.y - p1.y;
  const dx = p2.x - p1.x;
  return (Math.atan2(dy, dx) * 180 / Math.PI) + 90;
};

// --- LÓGICA DE NAVEGACIÓN ---

/**
 * Calcula la ruta de entrada para un vehículo desde la entrada hasta un espacio específico.
 * Estrategia: Entrada -> Conector Izquierdo -> Subir/Bajar al pasillo -> Recorrer pasillo -> Estacionar.
 */
export const calculatePath = (targetSpot: ParkingSpot): { path: Coordinate[], steps: NavigationStep[] } => {
  const path: Coordinate[] = [];
  const steps: NavigationStep[] = [];

  const tx = targetSpot.coordinates.x;
  const ty = targetSpot.coordinates.y;
  
  // 1. Determinar el pasillo objetivo más cercano a la coordenada Y del espacio
  let targetAisleY = ROAD_Y_1;
  const distY1 = Math.abs(ty - ROAD_Y_1);
  const distY2 = Math.abs(ty - ROAD_Y_2);
  const distY3 = Math.abs(ty - ROAD_Y_3);
  const distY4 = Math.abs(ty - ROAD_Y_4);
  const minDist = Math.min(distY1, distY2, distY3, distY4);

  if (minDist === distY1) targetAisleY = ROAD_Y_1;
  else if (minDist === distY2) targetAisleY = ROAD_Y_2;
  else if (minDist === distY3) targetAisleY = ROAD_Y_3;
  else targetAisleY = ROAD_Y_4;

  const startY = ENTRANCE_COORDS.y;

  // Paso 1: Ingreso
  path.push(ENTRANCE_COORDS);
  steps.push({
    instruction: "Ingresa al estacionamiento.",
    distance: 0,
    coordinate: ENTRANCE_COORDS,
    action: 'start'
  });

  // Paso 2: Llegar al carril vertical
  const junctionPoint = { x: CROSSOVER_LEFT_X, y: startY };
  path.push(junctionPoint);
  
  // Decidir si girar arriba o abajo
  const isTargetAbove = targetAisleY < startY;
  
  let nextAction: 'straight' | 'turn-left' | 'turn-right' = 'straight';
  let instruction = "Avanza hacia el pasillo";

  // Si hay que cambiar de nivel significativamente
  if (Math.abs(targetAisleY - startY) > 2) {
      if (isTargetAbove) {
        nextAction = 'turn-left'; // Viniendo de izq, girar izq es subir (Y disminuye)
        instruction = "Gira a la izquierda hacia los pasillos superiores";
      } else {
        nextAction = 'turn-right'; // Viniendo de izq, girar der es bajar (Y aumenta)
        instruction = "Gira a la derecha hacia los pasillos inferiores";
      }
  }

  steps.push({
    instruction: instruction,
    distance: 10,
    coordinate: junctionPoint,
    action: nextAction
  });

  // Paso 3: Viaje vertical hacia el pasillo
  if (Math.abs(targetAisleY - startY) > 1) {
    path.push({ x: CROSSOVER_LEFT_X, y: targetAisleY });
    
    const turnDirection = isTargetAbove ? 'derecha' : 'izquierda';

    steps.push({
      instruction: `Gira a la ${turnDirection} para entrar al pasillo`,
      distance: Math.abs(targetAisleY - startY),
      coordinate: { x: CROSSOVER_LEFT_X, y: targetAisleY },
      action: isTargetAbove ? 'turn-right' : 'turn-left' // Giro relativo para entrar al pasillo
    });
  }

  // Paso 4: Conducir por el pasillo hasta la coordenada X del espacio
  
  // Lógica: Si el tramo es largo (> 30 unidades), dividir en "Continúa recto"
  const driveDistance = Math.abs(tx - CROSSOVER_LEFT_X);
  const isLongDrive = driveDistance > 30;

  if (isLongDrive) {
    const midX = tx - 15; // Punto intermedio
    path.push({ x: midX, y: targetAisleY });
    
    steps.push({
      instruction: "Continúa recto por el pasillo",
      distance: Math.abs(midX - CROSSOVER_LEFT_X),
      coordinate: { x: midX, y: targetAisleY },
      action: 'straight'
    });
  }

  path.push({ x: tx, y: targetAisleY });
  
  // Determinar giro final para estacionar (Arriba/Izquierda o Abajo/Derecha según el lado del pasillo)
  const isSpotAboveAisle = ty < targetAisleY;
  const parkTurnDirection = isSpotAboveAisle ? 'izquierda' : 'derecha';

  steps.push({
    instruction: `Gira a la ${parkTurnDirection} hacia el espacio ${targetSpot.label}`,
    distance: isLongDrive ? 15 : driveDistance,
    coordinate: { x: tx, y: targetAisleY },
    action: isSpotAboveAisle ? 'turn-left' : 'turn-right'
  });

  // Paso 5: Estacionar
  path.push(targetSpot.coordinates);
  steps.push({
    instruction: "Estaciona en tu espacio",
    distance: 5,
    coordinate: targetSpot.coordinates,
    action: 'arrive'
  });

  return { path, steps };
};

/**
 * Calcula la ruta PEATONAL desde el acceso (Arriba Derecha) hasta el vehículo estacionado.
 * Usa los andenes amarillos perimetrales.
 */
export const calculatePedestrianPath = (targetSpot: ParkingSpot): { path: Coordinate[], steps: NavigationStep[] } => {
  const path: Coordinate[] = [];
  const steps: NavigationStep[] = [];
  
  // Punto de inicio peatonal
  const START_PT = { x: 99, y: 3 }; 
  const SIDEWALK_X = 99; // Coordenada X del andén principal derecho
  
  const tx = targetSpot.coordinates.x;
  const ty = targetSpot.coordinates.y;

  // 1. Inicio
  path.push(START_PT);
  steps.push({
    instruction: "Ingresa por el Acceso Peatonal",
    distance: 0,
    coordinate: START_PT,
    action: 'start'
  });

  // 2. Caminar por el andén vertical
  path.push({ x: SIDEWALK_X, y: ty });
  
  steps.push({
    instruction: "Camina por el sendero principal amarillo",
    distance: Math.abs(ty - START_PT.y),
    coordinate: { x: SIDEWALK_X, y: ty },
    action: 'straight'
  });

  // 3. Girar hacia el auto
  path.push({ x: tx, y: ty });
  
  steps.push({
    instruction: "Gira a la izquierda hacia tu vehículo",
    distance: Math.abs(SIDEWALK_X - tx),
    coordinate: { x: tx, y: ty },
    action: 'turn-left'
  });

  return { path, steps };
};

/**
 * Calcula la ruta de SALIDA desde un espacio estacionado hacia la Salida (Derecha).
 * Estrategia: Espacio -> Pasillo -> Conector Vertical Derecho -> Salida.
 */
export const calculateExitPath = (startSpot: ParkingSpot): { path: Coordinate[], steps: NavigationStep[] } => {
  const path: Coordinate[] = [];
  const steps: NavigationStep[] = [];

  const sx = startSpot.coordinates.x;
  const sy = startSpot.coordinates.y;
  
  // Determinar pasillo actual
  let currentAisleY = ROAD_Y_1;
  const distY1 = Math.abs(sy - ROAD_Y_1);
  const distY2 = Math.abs(sy - ROAD_Y_2);
  const distY3 = Math.abs(sy - ROAD_Y_3);
  const distY4 = Math.abs(sy - ROAD_Y_4);
  const minDist = Math.min(distY1, distY2, distY3, distY4);

  if (minDist === distY1) currentAisleY = ROAD_Y_1;
  else if (minDist === distY2) currentAisleY = ROAD_Y_2;
  else if (minDist === distY3) currentAisleY = ROAD_Y_3;
  else currentAisleY = ROAD_Y_4;

  // 1. Salir del espacio
  path.push(startSpot.coordinates);
  steps.push({
    instruction: "Sal del espacio de estacionamiento",
    distance: 0,
    coordinate: startSpot.coordinates,
    action: 'start'
  });

  // 2. Incorporarse al pasillo
  path.push({ x: sx, y: currentAisleY });
  
  // 3. Conducir hacia la derecha (Conector de Salida)
  steps.push({
    instruction: "Conduce hacia la salida (Derecha del mapa)",
    distance: 5,
    coordinate: { x: sx, y: currentAisleY },
    action: 'straight'
  });

  // Recorrer pasillo hasta el final
  path.push({ x: CROSSOVER_RIGHT_X, y: currentAisleY });
  
  steps.push({
    instruction: "Avanza hasta el final del pasillo",
    distance: Math.abs(CROSSOVER_RIGHT_X - sx),
    coordinate: { x: CROSSOVER_RIGHT_X, y: currentAisleY },
    action: 'straight'
  });

  // 4. Viaje vertical hacia la coordenada Y de salida (50)
  if (Math.abs(currentAisleY - EXIT_COORDS.y) > 1) {
    path.push({ x: CROSSOVER_RIGHT_X, y: EXIT_COORDS.y });
    const isAboveExit = currentAisleY < EXIT_COORDS.y;
    
    steps.push({
      instruction: `Gira a la ${isAboveExit ? 'derecha' : 'izquierda'} hacia la salida principal`,
      distance: Math.abs(EXIT_COORDS.y - currentAisleY),
      coordinate: { x: CROSSOVER_RIGHT_X, y: EXIT_COORDS.y },
      action: isAboveExit ? 'turn-right' : 'turn-left'
    });
  }

  // 5. Salir
  path.push(EXIT_COORDS);
  steps.push({
    instruction: "Gira a la izquierda para salir",
    distance: 10,
    coordinate: EXIT_COORDS,
    action: 'arrive'
  });

  return { path, steps };
};

// Calcula la longitud total del camino (suma de hipotenusas)
export const getPathLength = (path: Coordinate[]): number => {
  let total = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const dx = path[i+1].x - path[i].x;
    const dy = path[i+1].y - path[i].y;
    total += Math.sqrt(dx * dx + dy * dy);
  }
  return total;
};

// Obtiene un punto y ángulo en el camino dado una distancia recorrida
export const getPointAtDistance = (path: Coordinate[], distance: number): { point: Coordinate, angle: number } => {
  if (path.length === 0) return { point: {x:0, y:0}, angle: 0 };
  if (distance <= 0) return { point: path[0], angle: getAngle(path[0], path[1] || path[0]) };

  let covered = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const p1 = path[i];
    const p2 = path[i+1];
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const segLen = Math.sqrt(dx*dx + dy*dy);

    if (covered + segLen >= distance) {
      const remaining = distance - covered;
      const t = remaining / segLen;
      return {
        point: {
          x: lerp(p1.x, p2.x, t),
          y: lerp(p1.y, p2.y, t)
        },
        angle: getAngle(p1, p2)
      };
    }
    covered += segLen;
  }

  const last = path[path.length - 1];
  const prev = path[path.length - 2] || last;
  return { point: last, angle: getAngle(prev, last) };
};
