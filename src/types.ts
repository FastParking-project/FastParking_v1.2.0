
// Definición de coordenadas base (porcentaje 0-100)
export interface Coordinate {
  x: number; 
  y: number; 
}

// Estructura de un espacio de estacionamiento
export interface ParkingSpot {
  id: string;         // Identificador único (ej: 'L-A-12')
  label: string;      // Etiqueta visible (ej: 'A-12')
  type: 'regular' | 'handicap' | 'occupied'; // Tipo de espacio
  coordinates: Coordinate; // Ubicación en el mapa
}

// Paso individual de navegación (instrucción visual y auditiva simulada)
export interface NavigationStep {
  instruction: string; // Texto a mostrar
  distance: number;    // Distancia estimada para este paso
  coordinate: Coordinate; // Coordenada clave del paso
  action: 'start' | 'straight' | 'turn-left' | 'turn-right' | 'arrive'; // Icono/Acción
}

// Máquina de estados principal de la aplicación
export enum AppState {
  WELCOME = 'WELCOME',               // Pantalla de bienvenida (QR/NFC)
  ACCESSIBILITY_CHECK = 'ACCESSIBILITY_CHECK', // Pregunta de discapacidad
  IDLE = 'IDLE',                     // Mapa interactivo esperando selección
  NAVIGATING = 'NAVIGATING',         // Simulación de conducción hacia el espacio
  PARKED = 'PARKED',                 // Pantalla de llegada/confirmación
  DASHBOARD = 'DASHBOARD',           // Panel principal (Timer, opciones)
  PAYMENT = 'PAYMENT',               // Pantalla de pago
  FINDING_CAR = 'FINDING_CAR',       // Navegación peatonal de regreso
  EXITING = 'EXITING',               // Navegación vehicular hacia la salida
}

// Modos de cámara para el mapa
export type CameraMode = 'free' | 'top' | 'drone';
