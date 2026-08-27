const request = require('supertest');
const bcrypt = require('bcryptjs');
const { createApp } = require('../src/app');
const { startMemoryMongo, stopMemoryMongo } = require('./helpers/memoryMongo');
const User = require('../src/models/User');
const Election = require('../src/models/Election');
const Position = require('../src/models/Position');
const Candidate = require('../src/models/Candidate');
const { signToken } = require('../src/middleware/auth');

jest.mock('../src/services/emailService', () => ({
  sendEmail: jest.fn().mockResolvedValue({ success: true }),
  sendTemplate: jest.fn().mockResolvedValue({ success: true }),
  templates: {},
}));

const emailService = require('../src/services/emailService');

let mongoServer;
let app;
let adminUser;
let voterUser;
let voterToken;
let election;
let position;
let candidate;

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
    referenceSelfiePath: 'selfies/test-reference.jpg',
  });

  voterToken = signToken(voterUser);

  const startTime = new Date();
  startTime.setDate(startTime.getDate() - 1);
  const endTime = new Date();
  endTime.setDate(endTime.getDate() + 14);

  election = await Election.create({
    title: 'Settings Test Election',
    description: 'Election for vote settings tests',
    status: 'active',
    startTime,
    endTime,
    createdBy: adminUser._id,
    settings: {
      showLiveResultsPublic: true,
      requireSelfieVerification: false,
      sendVoteConfirmationEmail: false,
    },
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
    manifesto: 'Test manifesto',
    isActive: true,
  });
});

afterAll(async () => {
  await stopMemoryMongo(mongoServer);
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Vote submission election settings', () => {
  it('allows voting without selfie when selfie verification is disabled', async () => {
    const res = await request(app)
      .post('/api/votes')
      .set('Authorization', `Bearer ${voterToken}`)
      .send({
        electionId: election._id.toString(),
        selections: [{ positionId: position._id.toString(), candidateId: candidate._id.toString() }],
      });

    expect(res.status).toBe(201);
    expect(res.body.receipt).toBeDefined();
    expect(emailService.sendTemplate).not.toHaveBeenCalledWith(
      voterUser.email,
      'voteConfirmation',
      expect.any(String),
      expect.any(String)
    );
  });

  it('requires selfie when selfie verification is enabled', async () => {
    const strictElection = await Election.create({
      title: 'Strict Selfie Election',
      status: 'active',
      startTime: election.startTime,
      endTime: election.endTime,
      createdBy: election.createdBy,
      settings: {
        requireSelfieVerification: true,
        sendVoteConfirmationEmail: true,
      },
    });

    const strictPosition = await Position.create({
      electionId: strictElection._id,
      title: 'Treasurer',
      seats: 1,
      order: 1,
    });

    const strictCandidate = await Candidate.create({
      electionId: strictElection._id,
      positionId: strictPosition._id,
      userId: adminUser._id,
      displayName: 'Strict Candidate',
      isActive: true,
    });

    const res = await request(app)
      .post('/api/votes')
      .set('Authorization', `Bearer ${voterToken}`)
      .send({
        electionId: strictElection._id.toString(),
        selections: [{
          positionId: strictPosition._id.toString(),
          candidateId: strictCandidate._id.toString(),
        }],
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/selfie required/i);
  });

  it('sends vote confirmation email when sendVoteConfirmationEmail is enabled', async () => {
    const emailElection = await Election.create({
      title: 'Email Confirmation Election',
      status: 'active',
      startTime: election.startTime,
      endTime: election.endTime,
      createdBy: election.createdBy,
      settings: {
        requireSelfieVerification: false,
        sendVoteConfirmationEmail: true,
      },
    });

    const emailPosition = await Position.create({
      electionId: emailElection._id,
      title: 'Secretary',
      seats: 1,
      order: 1,
    });

    const emailCandidate = await Candidate.create({
      electionId: emailElection._id,
      positionId: emailPosition._id,
      userId: adminUser._id,
      displayName: 'Email Candidate',
      isActive: true,
    });

    const res = await request(app)
      .post('/api/votes')
      .set('Authorization', `Bearer ${voterToken}`)
      .send({
        electionId: emailElection._id.toString(),
        selections: [{
          positionId: emailPosition._id.toString(),
          candidateId: emailCandidate._id.toString(),
        }],
      });

    expect(res.status).toBe(201);
    expect(res.body.receipt).toBeDefined();
    expect(res.body.confirmationEmailSent).toBe(true);
    expect(emailService.sendTemplate).toHaveBeenCalledWith(
      voterUser.email,
      'voteConfirmation',
      emailElection.title,
      res.body.receipt
    );
  });
});
