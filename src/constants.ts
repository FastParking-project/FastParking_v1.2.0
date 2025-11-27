
import { ParkingSpot } from './types';

// --- CONSTANTES DE GEOMETRÍA DEL MAPA ---

// El sistema de coordenadas es porcentual (0-100%) para ser responsive.
export const ROAD_WIDTH_AISLE = 6; // Ancho visual de las carreteras

// Punto de entrada principal (Alimenta el conector vertical izquierdo)
export const ENTRANCE_COORDS = { x: 0, y: 50 };

// Punto de salida principal (Sale del conector vertical derecho)
export const EXIT_COORDS = { x: 100, y: 50 };

// Coordenadas Y de las 4 vías horizontales (Pasillos)
export const ROAD_Y_1 = 15;    // Pasillo Superior
export const ROAD_Y_2 = 38;    // Pasillo Medio-Superior
export const ROAD_Y_3 = 62;    // Pasillo Medio-Inferior
export const ROAD_Y_4 = 85;    // Pasillo Inferior

// Coordenadas X de los conectores verticales (Bucles de retorno)
export const CROSSOVER_LEFT_X = 7;   // Bucle Izquierdo (Entrada)
export const CROSSOVER_RIGHT_X = 93; // Bucle Derecho (Salida)

// Coordenadas Y de las filas de estacionamiento (Centro del espacio)
const ROW_1_Y = 7;   // Mira al Pasillo 1 (Abajo)
const ROW_2_Y = 23;  // Mira al Pasillo 1 (Arriba)
const ROW_3_Y = 30;  // Mira al Pasillo 2 (Abajo)
const ROW_4_Y = 46;  // Mira al Pasillo 2 (Arriba)
const ROW_5_Y = 54;  // Mira al Pasillo 3 (Abajo)
const ROW_6_Y = 70;  // Mira al Pasillo 3 (Arriba)
const ROW_7_Y = 77;  // Mira al Pasillo 4 (Abajo)
const ROW_8_Y = 93;  // Mira al Pasillo 4 (Arriba)

// --- GENERACIÓN DE ESPACIOS ---
// Función auxiliar para generar la matriz de espacios simulados
const generateSpots = (): ParkingSpot[] => {
  const spots: ParkingSpot[] = [];
  
  // Configuración de las 8 filas
  const rowConfigs = [
    { id: 'A', y: ROW_1_Y },
    { id: 'B', y: ROW_2_Y },
    { id: 'C', y: ROW_3_Y },
    { id: 'D', y: ROW_4_Y },
    { id: 'E', y: ROW_5_Y },
    { id: 'F', y: ROW_6_Y },
    { id: 'G', y: ROW_7_Y },
    { id: 'H', y: ROW_8_Y },
  ];

  rowConfigs.forEach((config) => {
    // Generar espacios continuos de izquierda a derecha (X: 12 a 88)
    for (let x = 12; x <= 88; x += 4) {
      
      const isLeftWing = x < 50;
      const spotId = `${isLeftWing ? 'L' : 'R'}-${config.id}-${x}`;
      
      // Lógica para espacios de discapacitados: Alta densidad cerca de los bordes y pasillos verticales
      const isHandicapCol = (x === 12 || x === 16 || x === 48 || x === 52 || x === 84 || x === 88);
      const isHandicap = isHandicapCol; 
      
      // Simulación de ocupación aleatoria (60% libre aprox)
      const isOccupied = Math.random() > 0.6; 

      spots.push({
        id: spotId,
        label: `${config.id}-${Math.floor(x)}`,
        type: isOccupied ? 'occupied' : isHandicap ? 'handicap' : 'regular',
        coordinates: { x, y: config.y },
      });
    }
  });

  return spots;
};

// Exportar la lista estática de espacios generados
export const PARKING_SPOTS = generateSpots();
