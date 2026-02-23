const path = require('path');
// Buscamos el .env subiendo niveles hasta la raíz del proyecto
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const express = require('express');
const transactionRoutes = require('./src/routes/transactionRoutes');
const { connectProducer, disconnectProducer } = require('./src/kafka/producer');

// Iniciar conexión
connectProducer();

// Escuchar señales de terminación
const gracefulShutdown = async () => {
  console.log('Shutting down API...');
  await disconnectProducer();
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Rutas
app.use('/v1/transactions', transactionRoutes);

// Healthcheck (Básico para Docker/Kubernetes)
app.get('/health', (req, res) => res.send('OK'));

app.listen(PORT, () => {
  console.log(`🚀 Producer API running on http://localhost:${PORT}`);
});