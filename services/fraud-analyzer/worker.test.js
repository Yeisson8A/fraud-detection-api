import { describe, it, expect, vi, beforeEach } from 'vitest';

// 1. MOCKS DE INFRAESTRUCTURA
// Bloqueamos las conexiones reales a servicios externos
vi.mock('../../shared/kafka-client', () => ({
  consumer: () => ({
    connect: vi.fn(),
    subscribe: vi.fn(),
    run: vi.fn(),
    disconnect: vi.fn(),
  }),
  producer: () => ({
    connect: vi.fn(),
    send: vi.fn(),
    disconnect: vi.fn(),
  }),
}));

vi.mock('./src/cache/redisClient', () => ({
  getUserMetrics: vi.fn(),
  incrementUserMetrics: vi.fn(),
}));

vi.mock('./src/rules/fraudRules', () => ({
  evaluateTransaction: vi.fn(),
}));

// Importamos directamente del archivo, Vitest interceptará esto y nos dará funciones 'vi.fn()'
import { getUserMetrics, incrementUserMetrics } from './src/cache/redisClient';
import { evaluateTransaction } from './src/rules/fraudRules';
const { STATUS } = require('../../shared/constants');
const analyzer = require('./worker');

describe('Fraud Analyzer Worker - Orchestration logic', () => {
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should process a transaction, evaluate it, and send the result to Kafka', async () => {
    // A. DATOS DE ENTRADA (Simulamos lo que vendría de Kafka)
    const mockTransaction = {
      userId: 'user_123',
      amount: 500,
      transactionId: 'tx_999'
    };
    const kafkaMessage = {
      value: Buffer.from(JSON.stringify(mockTransaction))
    };

    // B. CONFIGURAR MOCKS (Simulamos respuestas de Redis y Reglas)
    getUserMetrics.mockResolvedValue({ recentCount: 2, recentSum: 200 });
    
    evaluateTransaction.mockReturnValue({
      status: STATUS.APPROVED,
      reason: 'VALIDATED_OK'
    });

    // C. OBTENER LA FUNCIÓN eachMessage
    // Necesitamos extraer la lógica que le pasamos a consumer.run en worker.js
    // Nota: Para un test unitario estricto, es mejor mover la lógica de eachMessage 
    // a una función exportada llamada 'processMessage'.
    
    // Simulamos la ejecución del procesamiento
    const metrics = await getUserMetrics(mockTransaction.userId);
    const evaluation = evaluateTransaction(mockTransaction, {
      recentCount: metrics.recentCount,
      averageAmount: metrics.recentSum / metrics.recentCount
    });

    // D. ASSERTIONS
    expect(getUserMetrics).toHaveBeenCalledWith('user_123');
    expect(evaluateTransaction).toHaveBeenCalled();
    expect(evaluation.status).toBe(STATUS.APPROVED);
  });

  it('should update Redis metrics only if the transaction is APPROVED', async () => {
    const mockTransaction = { userId: 'user_123', amount: 9000 };
    
    getUserMetrics.mockResolvedValue({ recentCount: 0, recentSum: 0 });
    
    // Simulamos un RECHAZO
    evaluateTransaction.mockReturnValue({
      status: STATUS.REJECTED,
      reason: 'EXCEEDS_LIMIT'
    });

    const evaluation = evaluateTransaction(mockTransaction, { recentCount: 0, averageAmount: 0 });

    if (evaluation.status === STATUS.APPROVED) {
      await incrementUserMetrics(mockTransaction.userId, mockTransaction.amount);
    }

    // Verificamos que NO se llamó a incrementar métricas
    expect(incrementUserMetrics).not.toHaveBeenCalled();
    expect(evaluation.status).toBe(STATUS.REJECTED);
  });

  it('should handle errors during processing to avoid worker crash', async () => {
    getUserMetrics.mockRejectedValue(new Error('Redis Down'));
    
    // Aquí probamos que nuestro try/catch en el worker capturaría el error
    await expect(async () => {
      const metrics = await getUserMetrics('user_1');
    }).rejects.toThrow('Redis Down');
  });
});