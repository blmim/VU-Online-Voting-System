const request = require('supertest');
const bcrypt = require('bcryptjs');
const { createApp } = require('../src/app');
const { startMemoryMongo, stopMemoryMongo } = require('./helpers/memoryMongo');
const User = require('../src/models/User');
const Election = require('../src/models/Election');
const Position = require('../src/models/Position');
const Candidate = require('../src/models/Candidate');
const CandidateApplication = require('../src/models/CandidateApplication');
const Vote = require('../src/models/Vote');
const { signToken } = require('../src/middleware/auth');
const { aggregateLiveResults } = require('../src/services/resultsService');

jest.mock('../src/services/emailService', () => ({
  sendEmail: jest.fn().mockResolvedValue({ success: true }),
  sendTemplate: jest.fn().mockResolvedValue({ success: true }),
  templates: {},
}));

let mongoServer;
let app;
let adminUser;
let voterUser;
let election;
let position;
let candidate;

beforeAll(async () => {
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

  const startTime = new Date();
  startTime.setDate(startTime.getDate() - 1);
  const endTime = new Date();
  endTime.setDate(endTime.getDate() + 14);

  election = await Election.create({
    title: 'Live Results Test Election',
    status: 'active',
    startTime,
    endTime,
    settings: { showLiveResultsPublic: true },
  });

  position = await Position.create({
    electionId: election._id,
    title: 'President',
    seats: 1,
    order: 1,
  });

  candidate = await Candidate.create({
    electionId: election._id,
    positionId: position._id,
    userId: adminUser._id,
    displayName: 'Test Candidate',
    isActive: true,
  });

  await Vote.create({
    userId: voterUser._id,
    electionId: election._id,
    positionId: position._id,
    candidateId: candidate._id,
  });
});

afterAll(async () => {
  await stopMemoryMongo(mongoServer);
});

describe('Live results aggregation', () => {
  it('counts votes when electionId is passed as a string', async () => {
    const results = await aggregateLiveResults(election._id.toString());

    expect(results.turnoutPct).toBeGreaterThan(0);
    expect(results.positions).toHaveLength(1);
    expect(results.positions[0].candidates).toHaveLength(1);
    expect(results.positions[0].candidates[0].voteCount).toBe(1);
    expect(results.positions[0].candidates[0].votePct).toBe(100);
  });

  it('returns candidate vote data from the live results API', async () => {
    const res = await request(app).get(`/api/results/live/${election._id}`);

    expect(res.status).toBe(200);
    expect(res.body.turnoutPct).toBeGreaterThan(0);
    expect(res.body.positions[0].candidates[0].displayName).toBe('Test Candidate');
    expect(res.body.positions[0].candidates[0].voteCount).toBe(1);
  });
});

describe('Application approval', () => {
  it('approves a pending application even when a candidate record already exists', async () => {
    const applicant = await User.create({
      studentId: 'S8114999',
      email: 's8114999@live.vu.edu.au',
      fullName: 'Pending Applicant',
      passwordHash: await bcrypt.hash('Voter@12345', 12),
      role: 'voter',
      isVerified: true,
    });

    const application = await CandidateApplication.create({
      electionId: election._id,
      positionId: position._id,
      applicantId: applicant._id,
      status: 'pending',
      manifesto: 'Ready to serve',
    });

    await Candidate.create({
      electionId: election._id,
      positionId: position._id,
      userId: applicant._id,
      displayName: applicant.fullName,
      applicationId: application._id,
    });

    const token = signToken(adminUser);
    const res = await request(app)
      .post(`/api/applications/${application._id}/approve`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.application.status).toBe('approved');
    expect(res.body.candidate.displayName).toBe('Pending Applicant');
  });
});
