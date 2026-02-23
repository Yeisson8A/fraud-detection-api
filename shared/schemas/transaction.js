const Joi = require('joi');

const transactionSchema = Joi.object({
  // userId y amount son obligatorios para poder procesar
  userId: Joi.string().required(),
  amount: Joi.number().positive().required(),
  
  // Estos campos pueden ser opcionales o generados por la API
  transactionId: Joi.string().optional(), // <--- CAMBIA DE .required() A .optional()
  location: Joi.string().allow('', null).optional(),
  features: Joi.array().items(Joi.number()).optional(),
  timestamp: Joi.date().optional()
}).unknown(true); // .unknown(true) permite que lleguen campos extra sin fallar

module.exports = { transactionSchema };