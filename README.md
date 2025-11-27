# FastParking App 🚗⚡

Aplicación Full Stack (MERN) para gestión de estacionamientos inteligentes con navegación simulada.

## 📋 Requisitos Previos

- Node.js (v18 o superior)
- Una cuenta en MongoDB Atlas (Base de datos en la nube)

## 🚀 Instalación en un nuevo dispositivo

Sigue estos pasos para clonar y ejecutar el proyecto:

### 1. Clonar el repositorio
```bash
git clone <URL_DE_TU_REPOSITORIO>
cd FastParking
```

### 2. Instalar Dependencias
El proyecto tiene dos partes (Frontend y Backend), debes instalar ambas.

**Frontend (Raíz):**
```bash
npm install
```

**Backend (Carpeta server):**
```bash
cd server
npm install
cd ..
```

### 3. Configuración de Base de Datos (Backend)
1. Ve a la carpeta `server`.
2. Crea un archivo llamado `.env` (sin nombre, solo la extensión).
3. Copia el contenido de `.env.example` y pégalo en tu nuevo `.env`.
4. Reemplaza `MONGO_URI` con tu cadena de conexión real de MongoDB Atlas.

### 4. Poblar Base de Datos (Solo si es nueva)
Si conectas a una base de datos vacía por primera vez:
```bash
cd server
npm run seed
```

### 5. Ejecutar el Proyecto
Necesitas dos terminales abiertas:

**Terminal 1 (Backend):**
```bash
cd server
npm run dev
```

**Terminal 2 (Frontend):**
```bash
npm run dev
```

Abre tu navegador en `http://localhost:5173`.
