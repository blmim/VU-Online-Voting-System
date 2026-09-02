const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const sharp = require('sharp');
const config = require('../config');
const User = require('../models/User');
const Election = require('../models/Election');
const Position = require('../models/Position');
const Candidate = require('../models/Candidate');
const CandidateApplication = require('../models/CandidateApplication');
const Vote = require('../models/Vote');
const AuditLog = require('../models/AuditLog');

const SELFIE_DIR = path.join(__dirname, '../../uploads/selfies');
const DEFAULT_PASSWORD = 'Test@12345';
const DEMO_ELECTION_TITLE = 'VU Demo Election (Auto-Generated)';

const FIRST_NAMES = [
  'Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Sam', 'Jamie',
  'Avery', 'Quinn', 'Blake', 'Drew', 'Skyler', 'Reese', 'Cameron', 'Logan',
];

const LAST_NAMES = [
  'Nguyen', 'Patel', 'Chen', 'Singh', 'Kim', 'Williams', 'Brown', 'Garcia',
  'Lee', 'Martinez', 'Khan', 'Ali', 'Sharma', 'Tran', 'Wilson', 'Taylor',
];

const MANIFESTOS = [
  'Stronger student voice and transparent campus governance.',
  'Better lab access, mentoring, and faculty advocacy.',
  'Events, wellbeing programs, and cross-faculty collaboration.',
  'Sustainability initiatives and inclusive campus spaces.',
  'Academic support, career pathways, and peer networks.',
];

function isTestGeneratorEnabled() {
  return config.allowTestGenerator;
}

async function ensureReferenceSelfie(user) {
  if (user.referenceSelfiePath) {
    const full = path.join(__dirname, '../..', user.referenceSelfiePath);
    if (fs.existsSync(full)) return user.referenceSelfiePath;
  }

  if (!fs.existsSync(SELFIE_DIR)) fs.mkdirSync(SELFIE_DIR, { recursive: true });

  const filename = `ref_${user.studentId}_seed.jpg`;
  const filepath = path.join(SELFIE_DIR, filename);
  const hue = parseInt(user.studentId.slice(-2), 10) * 3 || 120;

  await sharp({
    create: { width: 128, height: 128, channels: 3, background: { r: 40, g: 80 + hue, b: 160 } },
  })
    .jpeg({ quality: 85 })
    .toFile(filepath);

  const relativePath = `uploads/selfies/${filename}`;
  user.referenceSelfiePath = relativePath;
  await user.save();
  return relativePath;
}

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomFullName() {
  return `${randomItem(FIRST_NAMES)} ${randomItem(LAST_NAMES)}`;
}

async function generateUniqueStudentId() {
  for (let attempt = 0; attempt < 200; attempt += 1) {
    const suffix = String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
    const studentId = `S8${suffix}`;
    const exists = await User.findOne({ studentId });
    if (!exists) return studentId;
  }
  throw new Error('Could not generate unique student ID');
}

async function createSingleTestVoter(passwordHash) {
  const hash = passwordHash || (await bcrypt.hash(DEFAULT_PASSWORD, 12));
  const studentId = await generateUniqueStudentId();
  const email = `s${studentId.slice(1).toLowerCase()}@live.vu.edu.au`;
  const fullName = randomFullName();

  const user = await User.create({
    studentId,
    email,
    fullName,
    passwordHash: hash,
    role: 'voter',
    faculty: 'IT',
    department: 'Computer Science',
    year: Math.floor(Math.random() * 3) + 1,
    isVerified: true,
  });

  await ensureReferenceSelfie(user);
  return {
    user,
    record: {
      studentId: user.studentId,
      email: user.email,
      fullName: user.fullName,
      password: DEFAULT_PASSWORD,
    },
  };
}

async function generateTestVoters(count, adminUserId, ipAddress) {
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 12);
  const created = [];

  for (let i = 0; i < count; i += 1) {
    const { record } = await createSingleTestVoter(passwordHash);
    created.push(record);
  }

  await AuditLog.appendLog({
    event: 'TEST_VOTERS_GENERATED',
    userId: adminUserId,
    ipAddress,
    metadata: { count: created.length, studentIds: created.map((u) => u.studentId) },
  });

  return { users: created, password: DEFAULT_PASSWORD };
}

async function pickVotersForCandidates(count) {
  const existing = await User.find({ role: 'voter', isVerified: true }).limit(count * 2);
  const picked = [...existing];
  const usedIds = new Set(picked.map((u) => u._id.toString()));

  while (picked.length < count) {
    const { user } = await createSingleTestVoter();
    if (!usedIds.has(user._id.toString())) {
      usedIds.add(user._id.toString());
      picked.push(user);
    }
  }

  return picked.slice(0, count);
}

async function generateTestCandidates(electionId, count, adminUserId, ipAddress, { asApplications = false } = {}) {
  const election = await Election.findById(electionId);
  if (!election) throw Object.assign(new Error('Election not found'), { status: 404 });
  if (!['published', 'active', 'draft'].includes(election.status)) {
    throw Object.assign(new Error('Election must be draft, published, or active'), { status: 400 });
  }

  const positions = await Position.find({ electionId }).sort({ order: 1 });
  if (positions.length === 0) {
    throw Object.assign(new Error('Election has no positions'), { status: 400 });
  }

  const voters = await pickVotersForCandidates(count);
  const results = [];

  for (let i = 0; i < count; i += 1) {
    const voter = voters[i];
    const position = positions[i % positions.length];

    const duplicate = await Candidate.findOne({
      electionId,
      positionId: position._id,
      userId: voter._id,
    });
    if (duplicate) continue;

    const manifesto = randomItem(MANIFESTOS);

    if (asApplications) {
      const app = await CandidateApplication.findOneAndUpdate(
        { electionId, positionId: position._id, applicantId: voter._id },
        {
          manifesto,
          status: 'approved',
          reviewedBy: adminUserId,
          reviewedAt: new Date(),
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      const candidate = await Candidate.create({
        electionId,
        positionId: position._id,
        userId: voter._id,
        displayName: voter.fullName,
        manifesto,
        applicationId: app._id,
        isActive: true,
      });

      app.candidateId = candidate._id;
      await app.save();

      results.push({
        displayName: candidate.displayName,
        position: position.title,
        studentId: voter.studentId,
      });
    } else {
      const candidate = await Candidate.create({
        electionId,
        positionId: position._id,
        userId: voter._id,
        displayName: voter.fullName,
        manifesto,
        isActive: true,
      });

      results.push({
        displayName: candidate.displayName,
        position: position.title,
        studentId: voter.studentId,
      });
    }
  }

  await AuditLog.appendLog({
    event: 'TEST_CANDIDATES_GENERATED',
    userId: adminUserId,
    electionId,
    ipAddress,
    metadata: { count: results.length, candidates: results },
  });

  return { candidates: results };
}

async function resetAndSeedDemoElection(adminUserId, ipAddress) {
  const existing = await Election.findOne({ title: DEMO_ELECTION_TITLE });
  if (existing) {
    await Vote.deleteMany({ electionId: existing._id });
    await Candidate.deleteMany({ electionId: existing._id });
    await CandidateApplication.deleteMany({ electionId: existing._id });
    await Position.deleteMany({ electionId: existing._id });
    await Election.deleteOne({ _id: existing._id });
  }

  const startTime = new Date();
  startTime.setDate(startTime.getDate() - 1);
  const endTime = new Date();
  endTime.setDate(endTime.getDate() + 14);
  const applicationDeadline = new Date();
  applicationDeadline.setDate(applicationDeadline.getDate() + 7);

  const totalEligible = await User.countDocuments({ role: 'voter', isVerified: true });

  const election = await Election.create({
    title: DEMO_ELECTION_TITLE,
    description: 'Auto-generated demo election for development and testing.',
    status: 'active',
    startTime,
    endTime,
    applicationDeadline,
    allowCandidateApplications: true,
    createdBy: adminUserId,
    totalEligibleVoters: totalEligible,
    settings: {
      showLiveResultsPublic: true,
      requireSelfieVerification: true,
      sendVoteConfirmationEmail: false,
    },
  });

  const positionDefs = [
    { title: 'President', description: 'Lead student council representation.', order: 1, seats: 1, eligibility: {} },
    { title: 'Vice President', description: 'Support council operations.', order: 2, seats: 1, eligibility: {} },
    {
      title: 'IT Faculty Representative',
      description: 'Represent IT students.',
      order: 3,
      seats: 1,
      eligibility: { faculties: ['IT'], requireVerified: true },
    },
  ];

  const positions = [];
  for (const def of positionDefs) {
    positions.push(await Position.create({ electionId: election._id, ...def }));
  }

  const { candidates } = await generateTestCandidates(
    election._id,
    positions.length,
    adminUserId,
    ipAddress
  );

  await AuditLog.appendLog({
    event: 'DEMO_ELECTION_RESET',
    userId: adminUserId,
    electionId: election._id,
    ipAddress,
    metadata: { title: election.title, candidateCount: candidates.length },
  });

  return {
    election: {
      id: election._id,
      title: election.title,
      status: election.status,
    },
    positions: positions.map((p) => p.title),
    candidates,
    password: DEFAULT_PASSWORD,
  };
}

module.exports = {
  isTestGeneratorEnabled,
  ensureReferenceSelfie,
  generateTestVoters,
  generateTestCandidates,
  resetAndSeedDemoElection,
  DEFAULT_PASSWORD,
  DEMO_ELECTION_TITLE,
};
