const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid'); // Para generar IDs únicos
const kafka = require('../../../../shared/kafka-client');
const { TOPICS, STATUS } = require('../../../../shared/constants');
const { transactionSchema } = require('../../../../shared/schemas/transaction');
const { sendTransactionEvent } = require('../kafka/producer');

// Inicializamos el productor de Kafka
const producer = kafka.producer();

const initProducer = async () => {
  await producer.connect();
  console.log('✅ Kafka Producer connected');
};
initProducer();

router.post('/', async (req, res) => {
  try {
    // 1. Validar los datos de entrada (Dataset Kaggle -> API)
    const { error, value } = transactionSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({ 
        error: 'Invalid transaction data', 
        details: error.details[0].message 
      });
    }

    // 2. Preparar el mensaje
    const transactionData = {
      ...value,
      transactionId: value.transactionId || uuidv4(),
      status: STATUS.PENDING,
      createdAt: new Date().toISOString()
    };

    // 3. Enviar a Kafka (Topic: transaction-pending)
    // Usamos el userId como 'key' para que todas las transacciones de un mismo 
    // usuario vayan a la misma partición y mantengan el orden.
    await sendTransactionEvent(transactionData);

    // 4. Responder al cliente de inmediato
    return res.status(202).json({
      message: 'Transaction received and is being processed',
      transactionId: transactionData.transactionId,
      status: STATUS.PENDING
    });

  } catch (err) {
    console.error('❌ Error producing message:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;