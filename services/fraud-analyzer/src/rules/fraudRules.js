const { STATUS } = require('../../../shared/constants');

/**
 * Motor de reglas de fraude
 * @param {Object} transaction - Datos de la transacción
 * @param {Object} context - Datos históricos (vienen de Redis)
 */
const evaluateTransaction = (transaction, context) => {
  const { amount } = transaction;
  const { recentCount, averageAmount } = context;

  // REGLA 1: Monto excesivo (Hard Limit)
  // Basado en el dataset de Kaggle, montos muy altos son anómalos.
  if (amount > 5000) {
    return { 
      status: STATUS.REJECTED, 
      reason: 'EXCEEDS_SINGLE_TRANSACTION_LIMIT' 
    };
  }

  // REGLA 2: Velocidad de transacciones (Velocity Check)
  // Si el usuario ha hecho más de 5 transacciones en el último minuto (ventana de Redis).
  if (recentCount > 5) {
    return { 
      status: STATUS.REJECTED, 
      reason: 'VELOCITY_LIMIT_EXCEEDED' 
    };
  }

  // REGLA 3: Desviación del comportamiento (Anomalía)
  // Si la transacción actual es 10 veces mayor que su promedio histórico.
  if (averageAmount > 0 && amount > averageAmount * 10) {
    return { 
      status: STATUS.SUSPICIOUS, 
      reason: 'ABNORMAL_SPENDING_PATTERN' 
    };
  }

  // Si pasa todas las reglas
  return { 
    status: STATUS.APPROVED, 
    reason: 'VALIDATED_OK' 
  };
};

module.exports = { evaluateTransaction };