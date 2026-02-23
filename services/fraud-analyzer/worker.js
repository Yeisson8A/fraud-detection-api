const path = require('path');
// Buscamos el .env subiendo niveles hasta la raíz del proyecto
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const kafka = require('../../shared/kafka-client');
const { TOPICS, GROUPS, STATUS } = require('../../shared/constants');
const { getUserMetrics, incrementUserMetrics } = require('./src/cache/redisClient');
const { evaluateTransaction } = require('./src/rules/fraudRules');

const consumer = kafka.consumer({ groupId: GROUPS.ANALYZER_GROUP });
const producer = kafka.producer();

const run = async () => {
  let connected = false;
  
  // Bucle de reintento para la conexión inicial
  while (!connected) {
    try {
      await consumer.connect();
      await producer.connect();
      console.log('✅ [Fraud Analyzer]: Connected to Kafka');
      connected = true;
    } catch (err) {
      console.error('❌ [Kafka]: Connection failed, retrying in 5 seconds...', err.message);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  // 1. Conectar consumidor y productor
  await consumer.connect();
  await producer.connect();

  // 2. Suscribirse al topic de transacciones pendientes
  await consumer.subscribe({ topic: TOPICS.TRANSACTION_PENDING, fromBeginning: false });

  console.log('🕵️‍♂️ Fraud Analyzer Worker is running...');

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const rawValue = message.value.toString();
      const transaction = JSON.parse(rawValue);
      const { userId, amount, transactionId } = transaction;

      try {
        // A. Obtener contexto histórico de Redis
        const metrics = await getUserMetrics(userId);

        // B. Evaluar reglas de fraude
        const evaluation = evaluateTransaction(transaction, {
          recentCount: metrics.recentCount,
          averageAmount: metrics.recentCount > 0 ? metrics.recentSum / metrics.recentCount : 0
        });

        // C. Si es aprobada, actualizar métricas en Redis para la próxima evaluación
        if (evaluation.status === STATUS.APPROVED) {
          await incrementUserMetrics(userId, amount);
        }

        // D. Preparar el resultado enriquecido
        const resultEvent = {
          ...transaction,
          status: evaluation.status,
          reason: evaluation.reason,
          analyzedAt: new Date().toISOString()
        };

        // E. Publicar resultado en Kafka (Topic: transaction-processed)
        await producer.send({
          topic: TOPICS.TRANSACTION_PROCESSED,
          messages: [
            {
              key: userId,
              value: JSON.stringify(resultEvent),
              headers: { analyzedBy: 'fraud-analyzer-v1' }
            }
          ]
        });

        console.log(`[${evaluation.status}] TX: ${transactionId} | User: ${userId} | Reason: ${evaluation.reason}`);

      } catch (error) {
        console.error(`❌ Error processing transaction ${transactionId}:`, error);
        // Aquí podrías enviar el mensaje a una Dead Letter Queue (DLQ)
      }
    },
  });
};

run().catch(console.error);

// Graceful Shutdown
const stop = async () => {
  await consumer.disconnect();
  await producer.disconnect();
  process.exit(0);
};

process.on('SIGINT', stop);
process.on('SIGTERM', stop);