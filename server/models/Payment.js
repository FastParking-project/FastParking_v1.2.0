const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'COP' },
  method: { type: String, required: true }, // 'Credit Card', 'Nequi', 'Google Pay'
  status: { type: String, enum: ['success', 'failed'], default: 'success' },
  transactionDate: { type: Date, default: Date.now },
  
  // Guardamos TODA la información ingresada por el usuario.
  // Usamos Schema.Types.Mixed para permitir cualquier estructura (Tarjeta completa, Nequi, etc.)
  details: { type: mongoose.Schema.Types.Mixed } 
});

module.exports = mongoose.model('Payment', PaymentSchema);