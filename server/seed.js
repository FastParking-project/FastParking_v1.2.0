const mongoose = require('mongoose');
require('dotenv').config();
const ParkingSpot = require('./models/ParkingSpot');

// --- CONSTANTES DE GEOMETRÍA (Copiadas del Frontend) ---
const ROW_1_Y = 7;
const ROW_2_Y = 23;
const ROW_3_Y = 30;
const ROW_4_Y = 46;
const ROW_5_Y = 54;
const ROW_6_Y = 70;
const ROW_7_Y = 77;
const ROW_8_Y = 93;

const generateSpots = () => {
  const spots = [];
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
    for (let x = 12; x <= 88; x += 4) {
      const isLeftWing = x < 50;
      const spotId = `${isLeftWing ? 'L' : 'R'}-${config.id}-${x}`;
      
      // Lógica de discapacitados
      const isHandicap = (x === 12 || x === 16 || x === 48 || x === 52 || x === 84 || x === 88);
      
      // Ocupación aleatoria inicial
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

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conectado a MongoDB...');

    // Limpiar colección anterior
    await ParkingSpot.deleteMany({});
    console.log('🗑️  Datos anteriores eliminados.');

    // Generar e insertar nuevos datos
    const spotsData = generateSpots();
    await ParkingSpot.insertMany(spotsData);
    
    console.log(`🚀 ${spotsData.length} espacios insertados en la Base de Datos.`);
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedDB();