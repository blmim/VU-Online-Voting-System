require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const sharp = require('sharp');
const User = require('./models/User');
const Election = require('./models/Election');
const Position = require('./models/Position');
const Candidate = require('./models/Candidate');
const config = require('./config');

const SELFIE_DIR = path.join(__dirname, '../uploads/selfies');

async function ensureReferenceSelfie(user) {
  if (user.referenceSelfiePath) {
    const full = path.join(__dirname, '..', user.referenceSelfiePath);
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

async function seed() {
  await mongoose.connect(config.mongoUri);

  const adminId = (process.env.ADMIN_STUDENT_ID || 'S8139428').toUpperCase();
  const adminEmail = (process.env.ADMIN_EMAIL || 's8139428@live.vu.edu.au').toLowerCase();
  const adminPass = process.env.ADMIN_PASSWORD || 'Admin@12345';
  const voterPass = process.env.VOTER_PASSWORD || 'Voter@12345';

  let admin = await User.findOne({ studentId: adminId });
  if (!admin) {
    admin = await User.create({
      studentId: adminId,
      email: adminEmail,
      fullName: 'Mr Samir Sapkota',
      passwordHash: await bcrypt.hash(adminPass, 12),
      role: 'admin',
      faculty: 'IT',
      department: 'Computer Science',
      year: 3,
      isVerified: true,
    });
    console.log('Admin created:', adminEmail);
  } else {
    admin.role = 'admin';
    admin.email = adminEmail;
    admin.fullName = 'Mr Samir Sapkota';
    admin.passwordHash = await bcrypt.hash(adminPass, 12);
    admin.isVerified = true;
    admin.faculty = admin.faculty || 'IT';
    admin.department = admin.department || 'Computer Science';
    admin.year = admin.year || 3;
    await admin.save();
    console.log('Admin updated:', adminEmail);
  }
  await ensureReferenceSelfie(admin);

  const team = [
    { studentId: 'S8114083', email: 's8114083@live.vu.edu.au', fullName: 'Adil Ahnaf', year: 2 },
    { studentId: 'S8072671', email: 's8072671@live.vu.edu.au', fullName: 'Amith Hassan', year: 2 },
    { studentId: 'S8116502', email: 's8116502@live.vu.edu.au', fullName: 'Ranjana Nepal', year: 2 },
  ];

  const voters = [];
  for (const m of team) {
    let user = await User.findOne({ studentId: m.studentId });
    if (!user) {
      user = await User.create({
        ...m,
        passwordHash: await bcrypt.hash(voterPass, 12),
        role: 'voter',
        isVerified: true,
        faculty: 'IT',
        department: 'Computer Science',
      });
      console.log('Voter created:', m.email);
    } else {
      user.passwordHash = await bcrypt.hash(voterPass, 12);
      user.role = 'voter';
      user.isVerified = true;
      user.fullName = m.fullName;
      user.faculty = user.faculty || 'IT';
      user.department = user.department || 'Computer Science';
      user.year = m.year;
      await user.save();
    }
    await ensureReferenceSelfie(user);
    voters.push(user);
  }

  const startTime = new Date();
  startTime.setDate(startTime.getDate() - 1);
  const endTime = new Date();
  endTime.setDate(endTime.getDate() + 14);
  const applicationDeadline = new Date();
  applicationDeadline.setDate(applicationDeadline.getDate() + 7);
  const now = new Date();
  const status = startTime <= now && endTime > now ? 'active' : 'published';

  const totalEligible = await User.countDocuments({ role: 'voter', isVerified: true });

  const election = await Election.findOneAndUpdate(
    { title: 'VU Student Council Election 2026' },
    {
      title: 'VU Student Council Election 2026',
      description: 'Demo campus election for student representative roles.',
      status,
      startTime,
      endTime,
      applicationDeadline,
      allowCandidateApplications: true,
      createdBy: admin._id,
      totalEligibleVoters: totalEligible,
      settings: {
        showLiveResultsPublic: true,
        requireSelfieVerification: true,
        sendVoteConfirmationEmail: true,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const positions = [
    {
      title: 'President',
      description: 'Lead student council representation and campus initiatives.',
      order: 1,
      seats: 1,
      eligibility: {},
    },
    {
      title: 'Vice President',
      description: 'Support council operations and student engagement activities.',
      order: 2,
      seats: 1,
      eligibility: {},
    },
    {
      title: 'IT Faculty Representative',
      description: 'Represent IT students in academic and campus matters.',
      order: 3,
      seats: 1,
      eligibility: { faculties: ['IT'], requireVerified: true },
    },
  ];

  const positionDocs = [];
  for (const position of positions) {
    const doc = await Position.findOneAndUpdate(
      { electionId: election._id, title: position.title },
      { electionId: election._id, ...position },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    positionDocs.push(doc);
  }

  const demoCandidates = [
    { positionTitle: 'President', user: voters[0], manifesto: 'Transparency, inclusion, and stronger student voice on campus.' },
    { positionTitle: 'Vice President', user: voters[1], manifesto: 'Events, wellbeing programs, and cross-faculty collaboration.' },
    { positionTitle: 'IT Faculty Representative', user: voters[2], manifesto: 'Better lab access, mentoring, and IT student advocacy.' },
  ];

  for (const entry of demoCandidates) {
    const position = positionDocs.find((p) => p.title === entry.positionTitle);
    if (!position) continue;

    const existing = await Candidate.findOne({
      electionId: election._id,
      positionId: position._id,
      userId: entry.user._id,
    });

    if (!existing) {
      await Candidate.create({
        electionId: election._id,
        positionId: position._id,
        userId: entry.user._id,
        displayName: entry.user.fullName,
        manifesto: entry.manifesto,
        isActive: true,
      });
      console.log('Demo candidate:', entry.user.fullName, '—', entry.positionTitle);
    }
  }

  console.log('Demo election ready:', election.title, `(${status})`);
  console.log('Seed complete');
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
