const bcrypt = require('bcryptjs');
const { startMemoryMongo, stopMemoryMongo } = require('./helpers/memoryMongo');
const { authorizeElectionJoin, normalizeJoinPayload } = require('../src/utils/socketElectionAccess');
const Election = require('../src/models/Election');
const User = require('../src/models/User');
const { signToken } = require('../src/middleware/auth');

let mongoServer;
let publicElection;
let privateElection;
let adminUser;
let voterUser;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  mongoServer = await startMemoryMongo();

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

  const startTime = new Date(Date.now() - 86400000);
  const endTime = new Date(Date.now() + 86400000 * 14);

  publicElection = await Election.create({
    title: 'Public Live Election',
    status: 'active',
    startTime,
    endTime,
    settings: { showLiveResultsPublic: true },
  });

  privateElection = await Election.create({
    title: 'Private Tallies Election',
    status: 'active',
    startTime,
    endTime,
    settings: { showLiveResultsPublic: false },
  });
});

afterAll(async () => {
  await stopMemoryMongo(mongoServer);
});

describe('normalizeJoinPayload', () => {
  it('accepts bare election id strings', () => {
    expect(normalizeJoinPayload(publicElection._id.toString())).toEqual({
      electionId: publicElection._id.toString(),
    });
  });

  it('extracts electionId from objects and ignores body token', () => {
    expect(normalizeJoinPayload({ electionId: 'abc', token: 'tok' })).toEqual({
      electionId: 'abc',
    });
  });
});

describe('authorizeElectionJoin', () => {
  const emptySocket = { handshake: { auth: {}, headers: {} } };

  it('allows unauthenticated join when live results are public', async () => {
    const result = await authorizeElectionJoin(emptySocket, publicElection._id.toString());
    expect(result.ok).toBe(true);
    expect(result.room).toBe(`election:${publicElection._id}`);
  });

  it('denies unauthenticated join when live results are private', async () => {
    const result = await authorizeElectionJoin(emptySocket, privateElection._id.toString());
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('forbidden');
  });

  it('allows admin join for private elections via handshake auth', async () => {
    const token = signToken(adminUser);
    const result = await authorizeElectionJoin(
      { handshake: { auth: { token }, headers: {} } },
      privateElection._id.toString()
    );
    expect(result.ok).toBe(true);
  });

  it('ignores JWT in join payload for private elections', async () => {
    const token = signToken(adminUser);
    const result = await authorizeElectionJoin(emptySocket, {
      electionId: privateElection._id.toString(),
      token,
    });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('forbidden');
  });

  it('denies voter join for private elections', async () => {
    const token = signToken(voterUser);
    const result = await authorizeElectionJoin(
      { handshake: { auth: { token }, headers: {} } },
      privateElection._id.toString()
    );
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('forbidden');
  });
});
