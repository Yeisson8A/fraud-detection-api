const path = require('path');
// Buscamos el .env subiendo niveles hasta la raíz del proyecto
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const kafka = require('../../shared/kafka-client');
const { TOPICS, GROUPS, STATUS } = require('../../shared/constants');

// 1. Configuración de MongoDB (Persistencia Histórica)
const transactionSchema = new mongoose.Schema({
  transactionId: String,
  userId: String,
  amount: Number,
  status: String,
  reason: String,
  analyzedAt: Date,
  features: Array // Guardamos los datos de Kaggle para futuro re-entrenamiento de ML
});

const Transaction = mongoose.model('Transaction', transactionSchema);

const run = async () => {
  // Conectar a la base de datos
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/fraud_db');
  console.log('📦 [MongoDB]: Connected');

  const consumer = kafka.consumer({ groupId: GROUPS.NOTIFIER_GROUP });
  await consumer.connect();
  await consumer.subscribe({ topic: TOPICS.TRANSACTION_PROCESSED });

  console.log('🔔 Notification & Storage Service is running...');

  await consumer.run({
    eachMessage: async ({ message }) => {
      const event = JSON.parse(message.value.toString());
      
      try {
        // A. Persistir en MongoDB
        await Transaction.create(event);

        // B. Lógica de Alerta Inmediata
        if (event.status === STATUS.REJECTED) {
          sendAlert(event);
        } else if (event.status === STATUS.SUSPICIOUS) {
          sendWarning(event);
        }

      } catch (error) {
        console.error('❌ Error saving/notifying event:', error);
      }
    },
  });
};

// Simulador de envío de alertas
const sendAlert = (event) => {
  console.log(`\n🚨 [ALERT]: Fraud detected!`);
  console.log(`❌ User: ${event.userId} | Amount: $${event.amount}`);
  console.log(`❌ Reason: ${event.reason}`);
  console.log(`-----------------------------------`);
};

const sendWarning = (event) => {
  console.log(`\n⚠️ [WARNING]: Suspicious activity for user ${event.userId}`);
  console.log(`🔍 Checking patterns for $${event.amount}...`);
};

run().catch(console.error);