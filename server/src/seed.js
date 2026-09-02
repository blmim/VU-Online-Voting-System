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
const {
  upsertCandidate,
  seedElectionVotes,
  rebuildDemoPolls,
  seedPollActivity,
  seedDiscussions,
  seedAnnouncements,
  daysAgo,
} = require('./seedHelpers');

const SELFIE_DIR = path.join(__dirname, '../uploads/selfies');

const CORE_TEAM = [
  { studentId: 'S8114083', email: 's8114083@live.vu.edu.au', fullName: 'Adil Ahnaf', year: 2 },
  { studentId: 'S8072671', email: 's8072671@live.vu.edu.au', fullName: 'Amith Hassan', year: 2 },
  { studentId: 'S8116502', email: 's8116502@live.vu.edu.au', fullName: 'Ranjana Nepal', year: 2 },
];

const EXTRA_VOTERS = [
  { studentId: 'S8121001', email: 's8121001@live.vu.edu.au', fullName: 'Priya Sharma', year: 2, faculty: 'Business' },
  { studentId: 'S8121002', email: 's8121002@live.vu.edu.au', fullName: 'James Chen', year: 3, faculty: 'IT' },
  { studentId: 'S8121003', email: 's8121003@live.vu.edu.au', fullName: 'Fatima Al-Rashid', year: 2, faculty: 'Health' },
  { studentId: 'S8121004', email: 's8121004@live.vu.edu.au', fullName: 'Liam O\'Brien', year: 1, faculty: 'Business' },
  { studentId: 'S8121005', email: 's8121005@live.vu.edu.au', fullName: 'Sofia Martinez', year: 2, faculty: 'Arts' },
  { studentId: 'S8121006', email: 's8121006@live.vu.edu.au', fullName: 'Chen Wei', year: 3, faculty: 'IT' },
  { studentId: 'S8121007', email: 's8121007@live.vu.edu.au', fullName: 'Aisha Khan', year: 2, faculty: 'Health' },
  { studentId: 'S8121008', email: 's8121008@live.vu.edu.au', fullName: 'Noah Thompson', year: 1, faculty: 'IT' },
  { studentId: 'S8121009', email: 's8121009@live.vu.edu.au', fullName: 'Emma Wilson', year: 3, faculty: 'Business' },
  { studentId: 'S8121010', email: 's8121010@live.vu.edu.au', fullName: 'Marcus Johnson', year: 2, faculty: 'Arts' },
  { studentId: 'S8121011', email: 's8121011@live.vu.edu.au', fullName: 'Yuki Tanaka', year: 2, faculty: 'IT' },
  { studentId: 'S8121012', email: 's8121012@live.vu.edu.au', fullName: 'Olivia Brown', year: 1, faculty: 'Health' },
];

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
    create: { width: 128, height: 128, channels: 3, background: { r: 40, g: 80 + (hue % 100), b: 160 } },
  })
    .jpeg({ quality: 85 })
    .toFile(filepath);

  const relativePath = `uploads/selfies/${filename}`;
  user.referenceSelfiePath = relativePath;
  await user.save();
  return relativePath;
}

async function upsertVoter(member, voterPass) {
  let user = await User.findOne({ studentId: member.studentId });
  const base = {
    studentId: member.studentId,
    email: member.email,
    fullName: member.fullName,
    passwordHash: await bcrypt.hash(voterPass, 12),
    role: 'voter',
    isVerified: true,
    faculty: member.faculty || 'IT',
    department: member.department || 'Computer Science',
    year: member.year || 2,
  };

  if (!user) {
    user = await User.create(base);
    console.log('Voter created:', member.email);
  } else {
    Object.assign(user, base);
    await user.save();
    console.log('Voter updated:', member.email);
  }

  await ensureReferenceSelfie(user);
  return user;
}

function candidateProfiles(admin, voterList) {
  const [adil, amith, ranjana, priya, james, fatima, liam] = voterList;
  return [
    {
      positionTitle: 'President',
      user: adil,
      manifesto: 'Transparency, inclusion, and a stronger student voice in every faculty decision.',
      tagline: 'Your voice, amplified.',
      bio: 'Second-year IT student passionate about student representation and digital innovation at VU Sydney.',
      whyRunning: 'Every student deserves a council that listens, publishes decisions openly, and delivers measurable outcomes.',
      inspiration: 'Student leaders who transformed our faculty lounge into a collaborative innovation hub.',
      goals: 'Expand mental health resources · Upgrade campus Wi-Fi · Launch a peer tech mentorship program',
      experience: '2025 — IT Society events coordinator\n2024 — Peer mentor for first-year students',
      speech: 'Fellow students, together we can build a council that listens, acts, and delivers. Vote for transparency.',
      socialLinks: { linkedin: 'https://linkedin.com' },
    },
    {
      positionTitle: 'President',
      user: admin,
      manifesto: 'Experienced leadership, accountable governance, and delivering results for every faculty.',
      tagline: 'Leadership with integrity.',
      bio: 'Project lead, election administrator, and capstone mentor with deep campus governance experience at VU Sydney.',
      whyRunning: 'I have led this platform from concept to production — I will bring the same rigour to student council.',
      inspiration: 'Watching students engage with secure digital democracy during our capstone deployment.',
      goals: 'Publish council minutes within 48 hours · Secure funding for student startups · Unify faculty representatives',
      experience: '2026 — NIT3003 Capstone Project Lead\n2025 — VU IT Society advisor\n2024 — Election systems consultant',
      speech: 'Students deserve leaders who combine vision with execution. I have proven both — let\'s win together.',
      socialLinks: { linkedin: 'https://linkedin.com', website: 'https://github.com/blmim/VU-Online-Voting-System' },
    },
    {
      positionTitle: 'Vice President',
      user: amith,
      manifesto: 'Events, wellbeing programs, and cross-faculty collaboration that brings our campus together.',
      tagline: 'Building bridges across faculties.',
      bio: 'Frontend developer and UX advocate dedicated to inclusive events and student wellbeing.',
      whyRunning: 'Our campus thrives when every faculty connects — I will champion cross-faculty programs.',
      inspiration: 'The multicultural festival showed me how powerful unity can be.',
      goals: 'Monthly wellbeing workshops · Inter-faculty sports days · Student feedback portal',
      experience: '2025 — Wellbeing ambassador\n2024 — Event volunteer lead',
      speech: 'Leadership is about listening first. I will ensure every voice shapes our events and programs.',
      socialLinks: { instagram: 'https://instagram.com' },
    },
    {
      positionTitle: 'Vice President',
      user: priya,
      manifesto: 'Inclusive events, mental health advocacy, and stronger business–IT collaboration.',
      tagline: 'Wellbeing for every student.',
      bio: 'Business student focused on student welfare, diversity initiatives, and sustainable campus events.',
      whyRunning: 'VP should champion students who feel unheard — especially across faculties.',
      inspiration: 'Peer support networks that helped me transition to university life.',
      goals: '24/7 wellbeing hotline partnership · Free exam-period breakfast program · Diversity celebration week',
      experience: '2025 — Business Society wellbeing officer\n2024 — Orientation week mentor',
      speech: 'I will make sure no student faces university alone. Vote for compassion and action.',
      socialLinks: { linkedin: 'https://linkedin.com' },
    },
    {
      positionTitle: 'IT Faculty Representative',
      user: ranjana,
      manifesto: 'Better lab access, industry mentoring, and strong IT student advocacy.',
      tagline: 'Tech skills for every IT student.',
      bio: 'Database specialist and testing lead focused on lab resources and academic support for IT students.',
      whyRunning: 'IT students deserve extended lab hours, industry mentors, and a strong voice in academic decisions.',
      inspiration: 'My mentor helped me land my first internship — I want that for everyone.',
      goals: 'Extended lab hours · Monthly industry talks · Peer coding support network',
      experience: '2025 — IT peer tutor\n2024 — Hackathon organiser',
      speech: 'From labs to lectures, I will fight for the resources IT students need to succeed.',
      socialLinks: { linkedin: 'https://linkedin.com' },
    },
    {
      positionTitle: 'IT Faculty Representative',
      user: james,
      manifesto: 'Cloud labs, open-source projects, and industry partnerships for IT students.',
      tagline: 'Code. Create. Collaborate.',
      bio: 'Third-year IT student specialising in cloud infrastructure and developer community building.',
      whyRunning: 'We need modern lab environments and real industry projects in the curriculum.',
      inspiration: 'Open-source contributors who taught me more than any textbook.',
      goals: 'Azure student credits · GitHub organisation for VU IT · Weekend hackathons',
      experience: '2025 — DevOps club founder\n2024 — AWS community builder',
      speech: 'IT at VU should be cutting-edge. I will push for tools and partnerships that matter.',
      socialLinks: { website: 'https://github.com' },
    },
    {
      positionTitle: 'Treasurer',
      user: fatima,
      manifesto: 'Transparent budgets, fair club funding, and financial literacy for all students.',
      tagline: 'Every dollar accounted for.',
      bio: 'Health faculty student with accounting experience and a passion for transparent student governance.',
      whyRunning: 'Students deserve to know where their fees and club funds go.',
      inspiration: 'Treasurers who published open budgets and restored trust in student organisations.',
      goals: 'Monthly budget reports · Club funding workshops · Emergency hardship micro-grants',
      experience: '2025 — Health Society treasurer\n2024 — Volunteer bookkeeper',
      speech: 'Trust starts with transparency. I will publish every council expenditure for students to review.',
      socialLinks: { linkedin: 'https://linkedin.com' },
    },
    {
      positionTitle: 'Treasurer',
      user: liam,
      manifesto: 'Efficient spending, sponsor partnerships, and sustainable funding for student clubs.',
      tagline: 'Smart finance, stronger clubs.',
      bio: 'Business student with experience managing club budgets and corporate sponsorship deals.',
      whyRunning: 'Council funds should stretch further through partnerships and smart planning.',
      inspiration: 'Business leaders who funded student initiatives without raising fees.',
      goals: 'Corporate sponsor program · Annual financial literacy week · Digital expense tracking',
      experience: '2025 — Business Society finance lead\n2024 — Events sponsorship coordinator',
      speech: 'I will maximise every dollar for student benefit. Vote for fiscal responsibility.',
      socialLinks: { linkedin: 'https://linkedin.com' },
    },
  ];
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

  const voters = [];
  for (const m of CORE_TEAM) {
    voters.push(await upsertVoter(m, voterPass));
  }
  for (const m of EXTRA_VOTERS) {
    voters.push(await upsertVoter(m, voterPass));
  }

  const startTime = daysAgo(1);
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
      description: 'Campus-wide election for President, Vice President, IT Faculty Representative, and Treasurer. Competitive races with live results, prediction polls, and community discussion.',
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
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  const positions = [
    {
      title: 'President',
      description: 'Lead student council representation and campus-wide initiatives.',
      order: 1,
      seats: 1,
      eligibility: {},
    },
    {
      title: 'Vice President',
      description: 'Support council operations, events, and student engagement.',
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
    {
      title: 'Treasurer',
      description: 'Manage council budgets, club funding, and financial transparency.',
      order: 4,
      seats: 1,
      eligibility: {},
    },
  ];

  const positionDocs = [];
  for (const position of positions) {
    const doc = await Position.findOneAndUpdate(
      { electionId: election._id, title: position.title },
      { electionId: election._id, ...position },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    positionDocs.push(doc);
  }

  const profiles = candidateProfiles(admin, voters);

  const candidateDocs = [];
  for (const entry of profiles) {
    const position = positionDocs.find((p) => p.title === entry.positionTitle);
    if (!position) continue;
    const doc = await upsertCandidate(election._id, position, entry.user, entry);
    candidateDocs.push(doc);
    console.log('Candidate:', entry.user.fullName, '—', entry.positionTitle);
  }

  // Remove duplicate candidate rows
  const allCands = await Candidate.find({ electionId: election._id });
  const seen = new Map();
  for (const c of allCands) {
    const key = `${c.positionId}-${c.userId}`;
    if (seen.has(key)) {
      await Candidate.deleteOne({ _id: c._id });
    } else {
      seen.set(key, c._id);
    }
  }

  const freshCandidates = await Candidate.find({ electionId: election._id, isActive: true });
  const presidentPos = positionDocs.find((p) => p.title === 'President');
  const vpPos = positionDocs.find((p) => p.title === 'Vice President');
  const itPos = positionDocs.find((p) => p.title === 'IT Faculty Representative');
  const treasPos = positionDocs.find((p) => p.title === 'Treasurer');

  const byUser = (user) => freshCandidates.find((c) => String(c.userId) === String(user._id));

  const voteWeights = {};
  if (presidentPos) {
    const adilC = byUser(voters[0]);
    const samirC = byUser(admin);
    if (adilC && samirC) {
      voteWeights.President = { [String(adilC._id)]: 0.44, [String(samirC._id)]: 0.56 };
    }
  }
  if (vpPos) {
    const amithC = byUser(voters[1]);
    const priyaC = byUser(voters[3]);
    if (amithC && priyaC) {
      voteWeights['Vice President'] = { [String(amithC._id)]: 0.52, [String(priyaC._id)]: 0.48 };
    }
  }
  if (itPos) {
    const ranjanaC = byUser(voters[2]);
    const jamesC = byUser(voters[4]);
    if (ranjanaC && jamesC) {
      voteWeights['IT Faculty Representative'] = { [String(ranjanaC._id)]: 0.54, [String(jamesC._id)]: 0.46 };
    }
  }
  if (treasPos) {
    const fatimaC = byUser(voters[5]);
    const liamC = byUser(voters[6]);
    if (fatimaC && liamC) {
      voteWeights.Treasurer = { [String(fatimaC._id)]: 0.49, [String(liamC._id)]: 0.51 };
    }
  }

  const voteTotal = await seedElectionVotes(election, positionDocs, freshCandidates, voters, voteWeights);
  console.log(`Seeded ${voteTotal} official votes (${Math.round((voteTotal / positionDocs.length / voters.length) * 100)}% avg turnout)`);

  const polls = await rebuildDemoPolls(election, admin, endTime);
  console.log(`Rebuilt ${polls.length} prediction polls`);

  const pollStats = await seedPollActivity(polls, voters, admin);
  console.log(`Poll activity: ${pollStats.voteCount} votes, ${pollStats.commentCount} comments`);

  const discussionCount = await seedDiscussions(election, { admin, voters });
  console.log(`Seeded ${discussionCount} discussion posts`);

  const announcementCount = await seedAnnouncements(election, admin, voters.length);
  console.log(`Seeded ${announcementCount} announcements`);

  // Additional elections for browse/search filters
  await Election.findOneAndUpdate(
    { title: 'VU Student Guild Election 2025' },
    {
      title: 'VU Student Guild Election 2025',
      description: 'Previous year guild election — certified results available.',
      status: 'certified',
      startTime: daysAgo(120),
      endTime: daysAgo(100),
      applicationDeadline: daysAgo(130),
      allowCandidateApplications: false,
      createdBy: admin._id,
      totalEligibleVoters: 42,
      certifiedAt: daysAgo(98),
      closedAt: daysAgo(99),
      settings: { showLiveResultsPublic: true, requireSelfieVerification: true, sendVoteConfirmationEmail: true },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  const upcomingStart = new Date();
  upcomingStart.setDate(upcomingStart.getDate() + 10);
  const upcomingEnd = new Date(upcomingStart);
  upcomingEnd.setDate(upcomingEnd.getDate() + 7);

  await Election.findOneAndUpdate(
    { title: 'Student Wellbeing Advisory Board 2026' },
    {
      title: 'Student Wellbeing Advisory Board 2026',
      description: 'Upcoming election for wellbeing board representatives — applications open soon.',
      status: 'published',
      startTime: upcomingStart,
      endTime: upcomingEnd,
      applicationDeadline: upcomingStart,
      allowCandidateApplications: true,
      createdBy: admin._id,
      totalEligibleVoters: totalEligible,
      settings: { showLiveResultsPublic: true, requireSelfieVerification: true, sendVoteConfirmationEmail: true },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  console.log('\n=== Demo credentials ===');
  console.log('Admin:', adminEmail, '/', adminPass);
  console.log('Voters: any s#######@live.vu.edu.au /', voterPass);
  console.log('Featured: Mr Samir Sapkota running for President');
  console.log('Demo election ready:', election.title, `(${status})`);
  console.log('Seed complete');
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
