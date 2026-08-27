const request = require('supertest');
const bcrypt = require('bcryptjs');
const { createApp } = require('../src/app');
const { startMemoryMongo, stopMemoryMongo } = require('./helpers/memoryMongo');
const User = require('../src/models/User');
const Election = require('../src/models/Election');
const AuditLog = require('../src/models/AuditLog');
const { signToken } = require('../src/middleware/auth');

let mongoServer;
let app;
let adminUser;
let voterUser;
let secondVoter;
let adminToken;
let voterToken;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  mongoServer = await startMemoryMongo();
  app = createApp();

  adminUser = await User.create({
    studentId: 'S8139428',
    email: 's8139428@live.vu.edu.au',
    fullName: 'Primary Admin',
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

  secondVoter = await User.create({
    studentId: 'S8114084',
    email: 's8114084@live.vu.edu.au',
    fullName: 'Second Voter',
    passwordHash: await bcrypt.hash('Voter@12345', 12),
    role: 'voter',
    isVerified: false,
  });

  adminToken = signToken(adminUser);
  voterToken = signToken(voterUser);
});

afterAll(async () => {
  await stopMemoryMongo(mongoServer);
});

describe('Admin promotion endpoints', () => {
  it('lists current administrators', async () => {
    const res = await request(app)
      .get('/api/admin/users/admins')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.admins).toHaveLength(1);
    expect(res.body.admins[0].studentId).toBe('S8139428');
  });

  it('rejects promote for non-admin', async () => {
    const res = await request(app)
      .post(`/api/admin/users/${voterUser._id}/promote`)
      .set('Authorization', `Bearer ${voterToken}`);

    expect(res.status).toBe(403);
  });

  it('promotes a voter to admin without removing existing admins', async () => {
    const res = await request(app)
      .post(`/api/admin/users/${voterUser._id}/promote`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe('admin');
    expect(res.body.message).toMatch(/administrator/i);

    const adminsRes = await request(app)
      .get('/api/admin/users/admins')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(adminsRes.body.admins).toHaveLength(2);
    expect(adminsRes.body.admins.map((a) => a.studentId).sort()).toEqual(['S8114083', 'S8139428']);

    const log = await AuditLog.findOne({ event: 'USER_PROMOTED_TO_ADMIN' }).sort({ occurredAt: -1 });
    expect(log).toBeTruthy();
    expect(log.metadata.targetStudentId).toBe('S8114083');
  });

  it('rejects promoting someone who is already admin', async () => {
    const res = await request(app)
      .post(`/api/admin/users/${voterUser._id}/promote`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/already an administrator/i);
  });

  it('warns when promoting an unverified user', async () => {
    const res = await request(app)
      .post(`/api/admin/users/${secondVoter._id}/promote`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe('admin');
    expect(res.body.warning).toMatch(/verification/i);
  });
});

describe('Admin election search (UC-08)', () => {
  beforeAll(async () => {
    await Election.create({
      title: 'Faculty Council Search Test',
      description: 'Election for admin search demo',
      status: 'active',
      startTime: new Date(Date.now() - 86400000),
      endTime: new Date(Date.now() + 86400000 * 14),
      createdBy: adminUser._id,
    });
  });

  it('returns elections matching admin search query', async () => {
    const res = await request(app)
      .get('/api/elections/search')
      .query({ q: 'Faculty Council' })
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.elections.length).toBeGreaterThanOrEqual(1);
    expect(res.body.elections[0].title).toMatch(/Faculty Council/i);
  });
});
