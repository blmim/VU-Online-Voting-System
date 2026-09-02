const request = require('supertest');
const bcrypt = require('bcryptjs');
const { createApp } = require('../src/app');
const { startMemoryMongo, stopMemoryMongo } = require('./helpers/memoryMongo');
const User = require('../src/models/User');
const { signToken } = require('../src/middleware/auth');

let mongoServer;
let app;
let adminUser;
let voterUser;
let adminToken;
let voterToken;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  mongoServer = await startMemoryMongo();
  app = createApp();

  adminUser = await User.create({
    studentId: 'S8139428',
    email: 's8139428@live.vu.edu.au',
    fullName: 'Admin User',
    passwordHash: await bcrypt.hash('Admin@12345', 12),
    role: 'admin',
    isVerified: true,
  });

  voterUser = await User.create({
    studentId: 'S8114083',
    email: 's8114083@live.vu.edu.au',
    fullName: 'Voter User',
    passwordHash: await bcrypt.hash('Voter@12345', 12),
    role: 'voter',
    isVerified: true,
  });

  adminToken = signToken(adminUser);
  voterToken = signToken(voterUser);
});

afterAll(async () => {
  await stopMemoryMongo(mongoServer);
});

describe('Admin generate voters endpoint', () => {
  it('returns 403 for non-admin voter', async () => {
    const res = await request(app)
      .post('/api/admin/generate/voters')
      .set('Authorization', `Bearer ${voterToken}`)
      .send({ count: 5 });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/admin/i);
  });

  it('returns 401 without authentication', async () => {
    const res = await request(app)
      .post('/api/admin/generate/voters')
      .send({ count: 5 });

    expect(res.status).toBe(401);
  });

  it('generates test voters for admin', async () => {
    const res = await request(app)
      .post('/api/admin/generate/voters')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ count: 3 });

    expect(res.status).toBe(201);
    expect(res.body.users).toHaveLength(3);
    expect(res.body.password).toBe('Test@12345');
    expect(res.body.users[0].studentId).toMatch(/^S8\d{6}$/i);
    expect(res.body.users[0].email).toMatch(/^s8\d{6}@live\.vu\.edu\.au$/i);
  });
});

describe('Admin generate status endpoint', () => {
  it('allows admin to check generator status', async () => {
    const res = await request(app)
      .get('/api/admin/generate/status')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(typeof res.body.enabled).toBe('boolean');
  });
});
