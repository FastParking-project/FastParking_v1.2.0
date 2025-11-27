// Definición de coordenadas base
export interface Coordinate {
  x: number; 
  y: number; 
}

// Estructura de un espacio
export interface ParkingSpot {
  id: string;
  label: string;
  type: 'regular' | 'handicap' | 'occupied';
  coordinates: Coordinate;
}

// Datos de la sesión del usuario
export interface UserSession {
  _id: string;
  entryTime: string;
  status: 'active' | 'parked' | 'paid' | 'completed';
  amountPaid?: number;
  parkingSpotId?: string;
}

export interface NavigationStep {
  instruction: string;
  distance: number;
  coordinate: Coordinate;
  action: 'start' | 'straight' | 'turn-left' | 'turn-right' | 'arrive';
}

export enum AppState {
  WELCOME = 'WELCOME',
  ACCESSIBILITY_CHECK = 'ACCESSIBILITY_CHECK',
  IDLE = 'IDLE',
  NAVIGATING = 'NAVIGATING',
  PARKED = 'PARKED',
  DASHBOARD = 'DASHBOARD',
  PAYMENT = 'PAYMENT',
  FINDING_CAR = 'FINDING_CAR',
  EXITING = 'EXITING',
}

export type CameraMode = 'free' | 'top' | 'drone';