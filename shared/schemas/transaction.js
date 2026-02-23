// Usaremos Joi para validar que los datos del CSV sean correctos antes de enviarlos a Kafka
const Joi = require('joi');

const transactionSchema = Joi.object({
  transactionId: Joi.string().uuid().required(),
  userId: Joi.string().required(),
  amount: Joi.number().positive().required(),
  timestamp: Joi.date().iso().default(() => new Date().toISOString()),
  location: Joi.string().default('unknown'),
  // Los campos del dataset de Kaggle (simulados o mapeados)
  features: Joi.array().items(Joi.number()).optional() 
});

module.exports = { transactionSchema };