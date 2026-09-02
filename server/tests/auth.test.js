const request = require('supertest');
const { createApp } = require('../src/app');
const { makeTestSelfie } = require('./helpers');
const { startMemoryMongo, stopMemoryMongo } = require('./helpers/memoryMongo');

let mongoServer;
let app;
let validSelfie;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  mongoServer = await startMemoryMongo();
  app = createApp();
  validSelfie = await makeTestSelfie({ faceCount: 1 });
});

afterAll(async () => {
  await stopMemoryMongo(mongoServer);
});

describe('Auth registration validation', () => {
  it('rejects invalid student ID', async () => {
    const res = await request(app).post('/api/auth/register').send({
      studentId: 'INVALID',
      email: 's8114083@live.vu.edu.au',
      password: 'Test@12345',
      fullName: 'Test User',
      selfie: validSelfie,
    });
    expect(res.status).toBe(400);
  });

  it('rejects selfie with no detectable face', async () => {
    const sharp = require('sharp');
    const noFaceBuf = await sharp({
      create: { width: 120, height: 120, channels: 3, background: { r: 10, g: 10, b: 10 } },
    }).jpeg().toBuffer();
    const noFace = `data:image/jpeg;base64,${noFaceBuf.toString('base64')}`;
    const res = await request(app).post('/api/auth/register').send({
      studentId: 'S8114084',
      email: 's8114084@live.vu.edu.au',
      password: 'Test@12345',
      fullName: 'No Face User',
      selfie: noFace,
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/face/i);
  });

  it('rejects selfie with multiple faces', async () => {
    const multiFace = await makeTestSelfie({ faceCount: 2 });
    const res = await request(app).post('/api/auth/register').send({
      studentId: 'S8114085',
      email: 's8114085@live.vu.edu.au',
      password: 'Test@12345',
      fullName: 'Multi Face User',
      selfie: multiFace,
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/multiple faces/i);
  });

  it('registers valid student', async () => {
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
    expect(res.body.userId).toBeDefined();
  });
});

describe('Forgot password validation', () => {
  it('rejects invalid VU email format', async () => {
    const res = await request(app).post('/api/auth/forgot-password').send({
      email: 'not-an-email',
      studentId: 'S8114083',
    });
    expect(res.status).toBe(400);
  });

  it('rejects invalid student ID format', async () => {
    const res = await request(app).post('/api/auth/forgot-password').send({
      email: 's8114083@live.vu.edu.au',
      studentId: 'BAD',
    });
    expect(res.status).toBe(400);
  });

  it('returns generic message for unknown account', async () => {
    const res = await request(app).post('/api/auth/forgot-password').send({
      email: 's9999999@live.vu.edu.au',
      studentId: 'S9999999',
    });
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/reset code/i);
    expect(res.body.userId).toBeUndefined();
  });

  it('issues reset code for registered user without leaking userId', async () => {
    const res = await request(app).post('/api/auth/forgot-password').send({
      email: 's8114083@live.vu.edu.au',
      studentId: 'S8114083',
    });
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/reset code/i);
    expect(res.body.userId).toBeUndefined();
  });
});

describe('Login password lockout', () => {
  const email = 's8114083@live.vu.edu.au';

  it('locks account after repeated wrong passwords', async () => {
    for (let i = 0; i < 2; i += 1) {
      const res = await request(app).post('/api/auth/login').send({
        email,
        password: 'WrongPassword1!',
      });
      expect(res.status).toBe(401);
    }

    const locked = await request(app).post('/api/auth/login').send({
      email,
      password: 'WrongPassword1!',
    });
    expect(locked.status).toBe(429);
    expect(locked.body.error).toMatch(/locked/i);
  });

  it('rejects further logins while locked even with correct password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email,
      password: 'Test@12345',
    });
    expect(res.status).toBe(429);
  });
});
