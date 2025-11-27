const mongoose = require('mongoose');

const ParkingSpotSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // Identificador lógico (L-A-12)
  label: { type: String, required: true }, // Etiqueta visual (A-12)
  type: { 
    type: String, 
    enum: ['regular', 'handicap', 'occupied'], 
    default: 'regular' 
  },
  coordinates: {
    x: { type: Number, required: true },
    y: { type: Number, required: true }
  },
  // Campos adicionales para gestión futura
  currentSessionId: { type: String, default: null },
  lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ParkingSpot', ParkingSpotSchema);