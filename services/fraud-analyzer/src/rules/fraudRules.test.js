import { describe, it, expect } from 'vitest';
const { evaluateTransaction } = require('./fraudRules');
const { STATUS } = require('../../../../shared/constants');

describe('Fraud Rules Engine (Unit Tests)', () => {
  
  // Prueba del caso de éxito
  it('should approve a normal transaction when it passes all rules', () => {
    const transaction = { amount: 100 };
    const context = { recentCount: 1, averageAmount: 90 };
    
    const result = evaluateTransaction(transaction, context);
    
    expect(result.status).toBe(STATUS.APPROVED);
    expect(result.reason).toBe('VALIDATED_OK');
  });

  // Prueba Regla 1: Monto Máximo
  it('should reject transactions exceeding the hard limit (5000)', () => {
    const transaction = { amount: 5001 };
    const context = { recentCount: 0, averageAmount: 0 };
    
    const result = evaluateTransaction(transaction, context);
    
    expect(result.status).toBe(STATUS.REJECTED);
    expect(result.reason).toBe('EXCEEDS_SINGLE_TRANSACTION_LIMIT');
  });

  // Prueba Regla 2: Velocidad (Velocity Check)
  it('should reject if user makes more than 5 transactions in the window', () => {
    const transaction = { amount: 50 };
    const context = { recentCount: 6, averageAmount: 50 };
    
    const result = evaluateTransaction(transaction, context);
    
    expect(result.status).toBe(STATUS.REJECTED);
    expect(result.reason).toBe('VELOCITY_LIMIT_EXCEEDED');
  });

  it('should approve if user is at the limit (5 transactions)', () => {
    const transaction = { amount: 50 };
    const context = { recentCount: 5, averageAmount: 50 };
    
    const result = evaluateTransaction(transaction, context);
    
    expect(result.status).toBe(STATUS.APPROVED);
  });

  // Prueba Regla 3: Anomalía de Comportamiento
  it('should mark as suspicious when amount is 10x the historical average', () => {
    const transaction = { amount: 1001 }; // 1001 > 10 * 100
    const context = { recentCount: 1, averageAmount: 100 };
    
    const result = evaluateTransaction(transaction, context);
    
    expect(result.status).toBe(STATUS.SUSPICIOUS);
    expect(result.reason).toBe('ABNORMAL_SPENDING_PATTERN');
  });

  it('should not mark as suspicious if averageAmount is 0 (first transactions)', () => {
    const transaction = { amount: 1000 };
    const context = { recentCount: 1, averageAmount: 0 };
    
    const result = evaluateTransaction(transaction, context);
    
    expect(result.status).toBe(STATUS.APPROVED);
  });

});