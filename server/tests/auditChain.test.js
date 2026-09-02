const AuditLog = require('../src/models/AuditLog');
const { startMemoryMongo, stopMemoryMongo } = require('./helpers/memoryMongo');

let mongoServer;

beforeAll(async () => {
  mongoServer = await startMemoryMongo();
});

afterAll(async () => {
  await stopMemoryMongo(mongoServer);
});

describe('Audit log hash chain', () => {
  it('links entries with consistent previousHash and entryHash', async () => {
    const first = await AuditLog.appendLog({ event: 'USER_LOGIN', ipAddress: '127.0.0.1' });
    const second = await AuditLog.appendLog({ event: 'VOTE_CAST', ipAddress: '127.0.0.1' });

    expect(first.previousHash).toBe('GENESIS');
    expect(first.entryHash).toBeTruthy();
    expect(second.previousHash).toBe(first.entryHash);
    expect(second.entryHash).toBeTruthy();
    expect(second.entryHash).not.toBe(first.entryHash);
  });

  it('stores occurredAt used in the hash payload', async () => {
    const fixed = new Date('2026-06-09T12:00:00.000Z');
    const log = await AuditLog.appendLog({
      event: 'OTP_VERIFIED',
      occurredAt: fixed,
      ipAddress: '10.0.0.1',
    });

    expect(log.occurredAt.toISOString()).toBe(fixed.toISOString());
  });
});
