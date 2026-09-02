const request = require('supertest');
const bcrypt = require('bcryptjs');
const { createApp } = require('../src/app');
const { startMemoryMongo, stopMemoryMongo } = require('./helpers/memoryMongo');
const User = require('../src/models/User');
const Election = require('../src/models/Election');
const Position = require('../src/models/Position');
const CandidateApplication = require('../src/models/CandidateApplication');
const { signToken } = require('../src/middleware/auth');

let mongoServer;
let app;
let adminUser;
let voterUser;
let voterToken;
let adminToken;
let election;
let position;

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
    isVerified: false,
    referenceSelfiePath: 'selfies/test-reference.jpg',
  });

  voterToken = signToken(voterUser);
  adminToken = signToken(adminUser);

  const startTime = new Date();
  startTime.setDate(startTime.getDate() - 1);
  const endTime = new Date();
  endTime.setDate(endTime.getDate() + 14);

  election = await Election.create({
    title: 'Notification Test Election',
    description: 'Election for notification tests',
    status: 'active',
    startTime,
    endTime,
    createdBy: adminUser._id,
  });

  position = await Position.create({
    electionId: election._id,
    title: 'President',
    seats: 1,
    order: 1,
  });

  await CandidateApplication.create({
    electionId: election._id,
    positionId: position._id,
    applicantId: voterUser._id,
    status: 'pending',
    manifesto: 'Test manifesto',
  });
});

afterEach(async () => {
  if (voterUser?._id) {
    await User.findByIdAndUpdate(voterUser._id, { isVerified: false });
  }
});

afterAll(async () => {
  await stopMemoryMongo(mongoServer);
});

describe('GET /api/notifications', () => {
  it('requires authentication', async () => {
    const res = await request(app).get('/api/notifications');
    expect(res.status).toBe(401);
  });

  it('returns voter notifications derived from account and applications', async () => {
    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${voterToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.notifications)).toBe(true);
    expect(res.body.unreadCount).toBe(res.body.notifications.length);

    const types = res.body.notifications.map((n) => n.id);
    expect(types).toContain('verification-pending');
    expect(types.some((id) => id.startsWith('application-pending-'))).toBe(true);
    expect(types.some((id) => id.startsWith('vote-reminder-'))).toBe(false);
  });

  it('includes vote reminders for verified eligible voters', async () => {
    await User.findByIdAndUpdate(voterUser._id, { isVerified: true });

    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${voterToken}`);

    expect(res.status).toBe(200);
    const types = res.body.notifications.map((n) => n.id);
    expect(types.some((id) => id.startsWith('vote-reminder-'))).toBe(true);
  });

  it('returns admin notifications for pending work', async () => {
    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    const ids = res.body.notifications.map((n) => n.id);
    expect(ids).toContain('admin-pending-applications');
    expect(ids).toContain('admin-unverified-users');
    expect(ids.some((id) => id.startsWith('admin-active-election-'))).toBe(true);
  });
});
