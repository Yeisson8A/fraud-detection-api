const kafka = require('../../../../shared/kafka-client');
const { TOPICS } = require('../../../../shared/constants');

const producer = kafka.producer({
  // Idempotencia: evita mensajes duplicados si hay un reintento de red
  allowAutoTopicCreation: true,
  transactionalId: 'fraud-producer-v1',
});

/**
 * Conecta el productor al cluster de Kafka
 */
const connectProducer = async () => {
  try {
    await producer.connect();
    console.log('✅ [Kafka Producer]: Connected to broker');
  } catch (error) {
    console.error('❌ [Kafka Producer]: Connection error:', error);
    process.exit(1); // Si no hay Kafka, esta API no puede cumplir su contrato
  }
};

/**
 * Desconecta el productor (útil para Graceful Shutdown)
 */
const disconnectProducer = async () => {
  await producer.disconnect();
  console.log('🛑 [Kafka Producer]: Disconnected');
};

/**
 * Lógica de envío centralizada
 * @param {Object} transaction - Datos de la transacción validada
 */
const sendTransactionEvent = async (transaction) => {
  try {
    await producer.send({
      topic: TOPICS.TRANSACTION_PENDING,
      messages: [
        {
          key: transaction.userId, // Particionamiento por usuario
          value: JSON.stringify(transaction),
          headers: {
            source: 'producer-api',
            version: '1.0',
          }
        },
      ],
    });
  } catch (error) {
    console.error('❌ [Kafka Producer]: Error sending event:', error);
    throw error; // Re-lanzamos para que la ruta pueda responder 500
  }
};

module.exports = {
  connectProducer,
  disconnectProducer,
  sendTransactionEvent,
};