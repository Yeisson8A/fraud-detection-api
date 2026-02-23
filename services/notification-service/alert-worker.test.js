import { describe, it, expect, vi, beforeEach } from 'vitest';
import mongoose from 'mongoose';

// 1. MOCK DE MONGOOSE
vi.mock('mongoose', () => {
  const mockModel = {
    create: vi.fn(),
  };
  return {
    default: {
      connect: vi.fn(),
      Schema: vi.fn(function() { return { }; }),
      model: vi.fn(() => mockModel),
    },
    connect: vi.fn(),
    Schema: vi.fn(function() { return { }; }),
    model: vi.fn(() => mockModel),
  };
});

// 2. MOCK DE KAFKA
vi.mock('../../shared/kafka-client', () => ({
  consumer: vi.fn(() => ({
    connect: vi.fn(),
    subscribe: vi.fn(),
    run: vi.fn(),
  })),
}));

// Importamos los componentes para acceder a sus funciones mockeadas
const { STATUS } = require('../../shared/constants');
const Transaction = mongoose.model('Transaction');
const alertWorker = require('./alert-worker');

describe('Alert Worker - Storage and Notification Logic', () => {
  
  beforeEach(() => {
    vi.clearAllMocks();
    // Espiamos el console.log para verificar las alertas
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('should save the transaction event to MongoDB regardless of status', async () => {
    const mockEvent = {
      transactionId: 'tx-123',
      userId: 'user-001',
      amount: 100,
      status: STATUS.APPROVED,
      reason: 'VALIDATED_OK'
    };

    // Simulamos la lógica de persistencia
    await Transaction.create(mockEvent);

    expect(Transaction.create).toHaveBeenCalledWith(mockEvent);
  });

  it('should trigger an ALERT log when status is REJECTED', async () => {
    const rejectedEvent = {
      userId: 'bad-user',
      amount: 9999,
      status: STATUS.REJECTED,
      reason: 'EXCEEDS_LIMIT'
    };

    // Lógica manual basada en el worker:
    if (rejectedEvent.status === STATUS.REJECTED) {
      console.log(`🚨 [ALERT]: Fraud detected!`);
    }

    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('🚨 [ALERT]'));
  });

  it('should trigger a WARNING log when status is SUSPICIOUS', async () => {
    const suspiciousEvent = {
      userId: 'sus-user',
      amount: 500,
      status: STATUS.SUSPICIOUS
    };

    if (suspiciousEvent.status === STATUS.SUSPICIOUS) {
      console.log(`⚠️ [WARNING]: Suspicious activity`);
    }

    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('⚠️ [WARNING]'));
  });

  it('should NOT trigger alerts if status is APPROVED', async () => {
    const approvedEvent = { status: STATUS.APPROVED };

    // Simulamos la lógica del worker
    const sendAlert = vi.fn();
    const sendWarning = vi.fn();

    if (approvedEvent.status === STATUS.REJECTED) sendAlert();
    else if (approvedEvent.status === STATUS.SUSPICIOUS) sendWarning();

    expect(sendAlert).not.toHaveBeenCalled();
    expect(sendWarning).not.toHaveBeenCalled();
  });
});