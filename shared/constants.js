module.exports = {
  TOPICS: {
    TRANSACTION_PENDING: 'transaction-pending', // Transacciones nuevas
    TRANSACTION_PROCESSED: 'transaction-processed', // Resultado del análisis
    FRAUD_ALERTS: 'fraud-alerts' // Alertas críticas
  },
  STATUS: {
    PENDING: 'PENDING',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
    SUSPICIOUS: 'SUSPICIOUS'
  },
  GROUPS: {
    ANALYZER_GROUP: 'fraud-analyzer-group',
    NOTIFIER_GROUP: 'notifier-group'
  }
};