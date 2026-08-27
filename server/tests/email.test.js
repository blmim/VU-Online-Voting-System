const request = require('supertest');
const mongoose = require('mongoose');
const { createApp } = require('../src/app');
const { startMemoryMongo, stopMemoryMongo } = require('./helpers/memoryMongo');

jest.mock('../src/services/emailService', () => ({
  sendEmail: jest.fn().mockResolvedValue({ success: true }),
  sendTemplate: jest.fn().mockResolvedValue({ success: true }),
  templates: {},
}));

const emailService = require('../src/services/emailService');
const { makeTestSelfie } = require('./helpers');

let mongoServer;
let app;
let validSelfie;

beforeAll(async () => {
  mongoServer = await startMemoryMongo();
  app = createApp();
  validSelfie = await makeTestSelfie({ faceCount: 1 });
});

afterAll(async () => {
  await stopMemoryMongo(mongoServer);
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('SMTP coverage on auth routes', () => {
  it('sends registration OTP on register', async () => {
    const res = await request(app).post('/api/auth/register').send({
      studentId: 'S8114083',
      email: 's8114083@live.vu.edu.au',
      password: 'Test@12345',
      fullName: 'Adil Ahnaf',
      faculty: 'IT',
      department: 'Computer Science',
      year: 2,
      selfie: validSelfie,
    });
    expect(res.status).toBe(201);
    expect(emailService.sendTemplate).toHaveBeenCalledWith(
      's8114083@live.vu.edu.au',
      'otp',
      expect.any(String),
      'registration'
    );
  });

  it('sends welcome email after OTP verification', async () => {
    const OtpToken = require('../src/models/OtpToken');
    const { hashOtp } = require('../src/utils/otp');

    const reg = await request(app).post('/api/auth/register').send({
      studentId: 'S8114099',
      email: 's8114099@live.vu.edu.au',
      password: 'Test@12345',
      fullName: 'Test Voter',
      selfie: validSelfie,
    });
    expect(reg.status).toBe(201);

    await OtpToken.findOneAndUpdate(
      { userId: new mongoose.Types.ObjectId(String(reg.body.userId)), purpose: 'register' },
      { hash: hashOtp('654321') }
    );
    jest.clearAllMocks();

    const res = await request(app).post('/api/auth/verify-otp').send({
      userId: reg.body.userId,
      otp: '654321',
    });
    expect(res.status).toBe(200);
    expect(emailService.sendTemplate).toHaveBeenCalledWith(
      's8114099@live.vu.edu.au',
      'registrationWelcome',
      'Test Voter'
    );
  });

  it('sends password reset email on forgot-password', async () => {
    await request(app).post('/api/auth/register').send({
      studentId: 'S8114083',
      email: 's8114083@live.vu.edu.au',
      password: 'Test@12345',
      fullName: 'Adil Ahnaf',
      selfie: validSelfie,
    });
    jest.clearAllMocks();

    const res = await request(app).post('/api/auth/forgot-password').send({
      email: 's8114083@live.vu.edu.au',
      studentId: 'S8114083',
    });
    expect(res.status).toBe(200);
    expect(emailService.sendTemplate).toHaveBeenCalledWith(
      's8114083@live.vu.edu.au',
      'passwordReset',
      expect.any(String),
      'Adil Ahnaf'
    );
  });

  it('resends OTP via resend-otp endpoint', async () => {
    const reg = await request(app).post('/api/auth/register').send({
      studentId: 'S8114077',
      email: 's8114077@live.vu.edu.au',
      password: 'Test@12345',
      fullName: 'Resend Test',
      selfie: validSelfie,
    });
    jest.clearAllMocks();

    const res = await request(app).post('/api/auth/resend-otp').send({
      userId: reg.body.userId,
      purpose: 'register',
    });
    expect(res.status).toBe(200);
    expect(emailService.sendTemplate).toHaveBeenCalledWith(
      's8114077@live.vu.edu.au',
      'otp',
      expect.any(String),
      'registration'
    );
  });
});

describe('SMTP coverage on transactional routes', () => {
  it('notifies applicant and admin on candidate application', async () => {
    const User = require('../src/models/User');
    const Election = require('../src/models/Election');
    const Position = require('../src/models/Position');
    const bcrypt = require('bcryptjs');
    const { signToken } = require('../src/middleware/auth');

    const passwordHash = await bcrypt.hash('Test@12345', 12);
    const [voter, admin] = await Promise.all([
      User.create({
        studentId: 'S8115001',
        email: 's8115001@live.vu.edu.au',
        fullName: 'Applicant Tester',
        passwordHash,
        isVerified: true,
        faculty: 'IT',
        year: 2,
      }),
      User.create({
        studentId: 'S8115002',
        email: 's8115002@live.vu.edu.au',
        fullName: 'Admin Tester',
        passwordHash,
        role: 'admin',
        isVerified: true,
      }),
    ]);

    const election = await Election.create({
      title: 'Application Test Election',
      status: 'published',
      startTime: new Date(Date.now() + 86400000),
      endTime: new Date(Date.now() + 172800000),
      allowCandidateApplications: true,
    });
    const position = await Position.create({
      electionId: election._id,
      title: 'President',
      eligibility: { faculties: ['IT'] },
    });

    const token = signToken(voter);
    jest.clearAllMocks();

    const res = await request(app)
      .post('/api/applications')
      .set('Authorization', `Bearer ${token}`)
      .send({
        electionId: election._id.toString(),
        positionId: position._id.toString(),
        manifesto: 'Test manifesto',
      });

    expect(res.status).toBe(201);
    expect(emailService.sendTemplate).toHaveBeenCalledWith(
      voter.email,
      'applicationSubmitted',
      'Application Test Election',
      'President'
    );
    expect(emailService.sendTemplate).toHaveBeenCalledWith(
      admin.email,
      'adminNewApplication',
      'Applicant Tester',
      'S8115001',
      'Application Test Election',
      'President'
    );
  });

  it('sends vote confirmation after casting a vote', async () => {
    const User = require('../src/models/User');
    const Election = require('../src/models/Election');
    const Position = require('../src/models/Position');
    const Candidate = require('../src/models/Candidate');
    const bcrypt = require('bcryptjs');
    const { signToken } = require('../src/middleware/auth');
    const fs = require('fs');
    const path = require('path');

    const passwordHash = await bcrypt.hash('Test@12345', 12);
    const refDir = path.join(__dirname, '../uploads/selfies');
    fs.mkdirSync(refDir, { recursive: true });
    const refPath = path.join(refDir, 'ref_S8115101.jpg');
    fs.writeFileSync(refPath, Buffer.from(validSelfie.split(',')[1], 'base64'));

    const voter = await User.create({
      studentId: 'S8115101',
      email: 's8115101@live.vu.edu.au',
      fullName: 'Vote Email Tester',
      passwordHash,
      isVerified: true,
      faculty: 'IT',
      year: 2,
      referenceSelfiePath: 'uploads/selfies/ref_S8115101.jpg',
    });

    const election = await Election.create({
      title: 'Vote Email Election',
      status: 'active',
      startTime: new Date(Date.now() - 3600000),
      endTime: new Date(Date.now() + 86400000),
      settings: { sendVoteConfirmationEmail: true, requireSelfieVerification: false },
    });
    const position = await Position.create({ electionId: election._id, title: 'President' });
    const candidate = await Candidate.create({
      electionId: election._id,
      positionId: position._id,
      userId: voter._id,
      displayName: 'Vote Email Tester',
      isActive: true,
    });

    const token = signToken(voter);
    jest.clearAllMocks();

    const res = await request(app)
      .post('/api/votes')
      .set('Authorization', `Bearer ${token}`)
      .send({
        electionId: election._id.toString(),
        selections: [{ positionId: position._id.toString(), candidateId: candidate._id.toString() }],
      });

    expect(res.status).toBe(201);
    expect(emailService.sendTemplate).toHaveBeenCalledWith(
      voter.email,
      'voteConfirmation',
      'Vote Email Election',
      expect.any(String)
    );
  });
});
