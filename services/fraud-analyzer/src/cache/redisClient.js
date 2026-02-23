const path = require('path');
// Buscamos el .env subiendo niveles hasta la raíz del proyecto
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const Redis = require('ioredis');

// Configuración de la conexión
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  retryStrategy: (times) => Math.min(times * 50, 2000), // Reintento exponencial
});

redis.on('connect', () => console.log('✅ [Redis]: Connected successfully'));
redis.on('error', (err) => console.error('❌ [Redis]: Error:', err));

/**
 * Obtiene las métricas de un usuario en un solo viaje (Round-trip) a Redis.
 * Usamos una estructura de datos simple por simplicidad, 
 * pero podría escalarse a un Hash si necesitamos más métricas.
 */
const getUserMetrics = async (userId) => {
  const countKey = `user:${userId}:count`;
  const sumKey = `user:${userId}:sum`;

  // Pipeline reduce la latencia de red al enviar varios comandos a la vez
  const results = await redis.pipeline()
    .get(countKey)
    .get(sumKey)
    .exec();

  // ioredis devuelve [[err, val], [err, val]]
  return {
    recentCount: parseInt(results[0][1]) || 0,
    recentSum: parseFloat(results[1][1]) || 0,
  };
};

/**
 * Incrementa las métricas de un usuario tras una transacción exitosa.
 * @param {string} userId 
 * @param {number} amount 
 * @param {number} ttl - Tiempo de vida en segundos (ventana de tiempo)
 */
const incrementUserMetrics = async (userId, amount, ttl = 60) => {
  const countKey = `user:${userId}:count`;
  const sumKey = `user:${userId}:sum`;

  await redis.pipeline()
    .incr(countKey)
    .expire(countKey, ttl)
    .incrbyfloat(sumKey, amount)
    .expire(sumKey, ttl)
    .exec();
};

module.exports = {
  redis,
  getUserMetrics,
  incrementUserMetrics,
};