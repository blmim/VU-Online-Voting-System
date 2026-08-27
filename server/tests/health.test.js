const request = require('supertest');
const { createApp } = require('../src/app');
const { startMemoryMongo, stopMemoryMongo } = require('./helpers/memoryMongo');

let mongoServer;
let app;

beforeAll(async () => {
  mongoServer = await startMemoryMongo();
  app = createApp();
});

afterAll(async () => {
  await stopMemoryMongo(mongoServer);
});

describe('Health endpoint', () => {
  it('returns ok status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
