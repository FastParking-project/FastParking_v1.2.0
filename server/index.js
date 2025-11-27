const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const ParkingSpot = require('./models/ParkingSpot');
const Session = require('./models/Session');
const Payment = require('./models/Payment');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// --- CONEXIÓN MONGODB ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Conectado'))
  .catch(err => console.error('❌ Error Mongo:', err));

// --- RUTAS API ---

// 1. Obtener espacios (Mapa)
app.get('/api/spots', async (req, res) => {
  try {
    const spots = await ParkingSpot.find();
    res.json(spots);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// 2. Iniciar Sesión (Scan QR/NFC)
app.post('/api/sessions/start', async (req, res) => {
  try {
    const { method } = req.body; // 'qr' o 'nfc'
    const newSession = new Session({ entryMethod: method });
    await newSession.save();
    console.log(`✨ Nueva sesión iniciada: ${newSession._id} vía ${method}`);
    res.status(201).json(newSession);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// 3. Asignar Espacio (Al llegar al lugar)
app.patch('/api/sessions/:id/assign-spot', async (req, res) => {
  try {
    const { spotId, isHandicap } = req.body;
    
    // Actualizar sesión
    const session = await Session.findByIdAndUpdate(req.params.id, {
      parkingSpotId: spotId,
      isHandicap: isHandicap || false,
      status: 'parked'
    }, { new: true });

    // Marcar espacio como ocupado
    await ParkingSpot.findOneAndUpdate({ id: spotId }, { type: 'occupied' });

    res.json(session);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// 4. Calcular Tarifa (Al ir a Dashboard -> Pagar)
app.get('/api/sessions/:id/fee', async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ error: "Sesión no encontrada" });

    const now = new Date();
    const entry = new Date(session.entryTime);
    const diffMs = now - entry;
    const diffMins = Math.ceil(diffMs / 60000); // Minutos transcurridos

    // Lógica de Tarifa: $100 COP por minuto, Tarifa mínima $2000
    const RATE_PER_MINUTE = 100; 
    const MIN_FEE = 2000;
    const calculatedAmount = Math.max(MIN_FEE, diffMins * RATE_PER_MINUTE);

    res.json({ 
      amount: calculatedAmount, 
      durationMins: diffMins, 
      formattedDuration: `${Math.floor(diffMins/60)}h ${diffMins%60}m` 
    });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// 5. Procesar Pago
app.post('/api/payments', async (req, res) => {
  try {
    const { sessionId, amount, method, details } = req.body;

    // A. Crear registro de pago en la colección 'payments'
    const newPayment = new Payment({
      sessionId,
      amount,
      method,
      details // Guarda el objeto completo con datos sensibles (Tarjeta, Nequi, etc.)
    });
    await newPayment.save();

    // B. Actualizar sesión en 'sessions': marcar pagado y registrar hora de salida
    const session = await Session.findByIdAndUpdate(sessionId, {
      paymentId: newPayment._id,
      amountPaid: amount,
      status: 'paid',
      exitTime: new Date() // Registrar hora exacta del pago
    }, { new: true });

    // C. Liberar Espacio en 'parkingspots' inmediatamente al pagar
    if (session.parkingSpotId) {
       await ParkingSpot.findOneAndUpdate(
          { id: session.parkingSpotId }, 
          { type: session.isHandicap ? 'handicap' : 'regular' }
       );
    }

    res.json({ success: true, payment: newPayment, session });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// 6. Finalizar/Salir
app.post('/api/sessions/:id/complete', async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    
    if (session) {
      // Nota: El espacio ya se liberó en el pago, pero por seguridad verificamos
      // O si el usuario salió sin pagar (casos especiales), lo liberamos aquí.
      if (session.status !== 'paid' && session.parkingSpotId) {
        await ParkingSpot.findOneAndUpdate(
          { id: session.parkingSpotId }, 
          { type: session.isHandicap ? 'handicap' : 'regular' }
        );
      }
      
      // Asegurar que exitTime esté seteado si no se pagó antes
      if (!session.exitTime) {
         session.exitTime = new Date();
      }

      session.status = 'completed';
      await session.save();
    }
    res.json({ message: "Sesión finalizada y proceso completado" });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.listen(PORT, () => {
  console.log(`📡 Servidor corriendo en puerto ${PORT}`);
});