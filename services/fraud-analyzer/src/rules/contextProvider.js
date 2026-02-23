const path = require('path');
// Buscamos el .env subiendo niveles hasta la raíz del proyecto
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

/**
 * Obtiene el contexto histórico del usuario en milisegundos
 */
const getUserContext = async (userId) => {
  const countKey = `tx_count:${userId}`;
  const sumKey = `tx_sum:${userId}`;

  // Ejecutamos en pipeline para mayor velocidad
  const [count, totalSum] = await redis.pipeline()
    .get(countKey)
    .get(sumKey)
    .exec();

  const recentCount = parseInt(count[1]) || 0;
  const totalAmount = parseFloat(totalSum[1]) || 0;

  return {
    recentCount,
    averageAmount: recentCount > 0 ? totalAmount / recentCount : 0
  };
};

/**
 * Actualiza Redis con la nueva transacción tras ser procesada
 */
const updateContext = async (userId, amount) => {
  const countKey = `tx_count:${userId}`;
  const sumKey = `tx_sum:${userId}`;

  await redis.pipeline()
    .incr(countKey)
    .expire(countKey, 60) // Ventana de tiempo de 1 minuto
    .incrbyfloat(sumKey, amount)
    .expire(sumKey, 60)
    .exec();
};

module.exports = { getUserContext, updateContext };