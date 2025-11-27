const mongoose = require('mongoose');

const SessionSchema = new mongoose.Schema({
  entryTime: { type: Date, default: Date.now },
  exitTime: { type: Date },
  entryMethod: { type: String, enum: ['qr', 'nfc'], required: true },
  
  // Relación con el espacio de estacionamiento
  parkingSpotId: { type: String, default: null }, // ID lógico del espacio (ej: L-A-12)
  isHandicap: { type: Boolean, default: false },
  
  // Relación con el pago
  paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', default: null },
  amountPaid: { type: Number, default: 0 },
  
  status: { 
    type: String, 
    enum: ['active', 'parked', 'paid', 'completed'], 
    default: 'active' 
  }
});

module.exports = mongoose.model('Session', SessionSchema);