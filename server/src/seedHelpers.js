const { v4: uuidv4 } = require('uuid');
const Vote = require('./models/Vote');
const PredictionPoll = require('./models/PredictionPoll');
const PollVote = require('./models/PollVote');
const PollComment = require('./models/PollComment');
const ElectionDiscussion = require('./models/ElectionDiscussion');
const Announcement = require('./models/Announcement');
const { enrichCandidates } = require('./utils/candidateEnrichment');

/** Weighted pick from [{ id, weight }] */
function pickWeighted(options) {
  const total = options.reduce((s, o) => s + o.weight, 0);
  let r = Math.random() * total;
  for (const o of options) {
    r -= o.weight;
    if (r <= 0) return o.id;
  }
  return options[options.length - 1].id;
}

function daysAgo(days, hoursOffset = 0) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(d.getHours() - hoursOffset);
  return d;
}

async function upsertCandidate(electionId, position, user, profile) {
  const Candidate = require('./models/Candidate');
  const data = {
    electionId,
    positionId: position._id,
    userId: user._id,
    displayName: user.fullName,
    manifesto: profile.manifesto,
    tagline: profile.tagline,
    bio: profile.bio,
    whyRunning: profile.whyRunning,
    inspiration: profile.inspiration,
    goals: profile.goals,
    experience: profile.experience,
    speech: profile.speech,
    socialLinks: profile.socialLinks || {},
    profileComplete: true,
    isActive: true,
  };
  return Candidate.findOneAndUpdate(
    { electionId, positionId: position._id, userId: user._id },
    data,
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
}

async function seedElectionVotes(election, positions, candidates, voters, weightsByPosition) {
  await Vote.deleteMany({ electionId: election._id });

  const byPosition = new Map();
  for (const c of candidates) {
    const key = String(c.positionId);
    if (!byPosition.has(key)) byPosition.set(key, []);
    byPosition.get(key).push(c);
  }

  const participating = voters.slice(0, Math.max(2, Math.ceil(voters.length * 0.88)));
  let total = 0;

  for (let vi = 0; vi < participating.length; vi += 1) {
    const voter = participating[vi];
    const receipt = uuidv4();
    const castBase = daysAgo(5 - (vi % 6), vi % 8);

    for (const position of positions) {
      const cands = byPosition.get(String(position._id)) || [];
      if (!cands.length) continue;

      const weightMap = weightsByPosition[position.title] || {};
      const options = cands.map((c) => ({
        id: String(c._id),
        weight: weightMap[String(c._id)] ?? 1,
      }));
      const chosenId = pickWeighted(options);
      const chosen = cands.find((c) => String(c._id) === chosenId) || cands[0];

      await Vote.create({
        userId: voter._id,
        electionId: election._id,
        positionId: position._id,
        candidateId: chosen._id,
        receiptToken: receipt,
        castAt: new Date(castBase.getTime() + Math.random() * 3600000),
        ipAddress: '127.0.0.1',
        faceMatchScore: 0.88 + Math.random() * 0.11,
      });
      total += 1;
    }
  }

  return total;
}

async function rebuildDemoPolls(election, admin, endTime) {
  const titles = [
    'Who will lead the Student Council 2026?',
    'President or Vice President — who wins?',
    'Which candidate has the strongest manifesto?',
    'IT Faculty Rep — who earns your prediction?',
  ];

  const existing = await PredictionPoll.find({ title: { $in: titles } }).select('_id');
  const ids = existing.map((p) => p._id);
  if (ids.length) {
    await PollVote.deleteMany({ pollId: { $in: ids } });
    await PollComment.deleteMany({ pollId: { $in: ids } });
    await PredictionPoll.deleteMany({ _id: { $in: ids } });
  }

  const allCandidates = await require('./models/Candidate').find({
    electionId: election._id,
    isActive: true,
  });
  const enriched = await enrichCandidates(allCandidates);
  const president = allCandidates.filter((c) => {
    const e = enriched.find((x) => String(x._id) === String(c._id));
    return e?.positionTitle === 'President';
  });
  const exec = allCandidates.filter((c) => {
    const e = enriched.find((x) => String(x._id) === String(c._id));
    return e?.positionTitle === 'President' || e?.positionTitle === 'Vice President';
  });
  const itCands = allCandidates.filter((c) => {
    const e = enriched.find((x) => String(x._id) === String(c._id));
    return e?.positionTitle === 'IT Faculty Representative';
  });

  const toOptions = (list) => enriched
    .filter((e) => list.some((c) => String(c._id) === String(e._id)))
    .map((c) => ({
      candidateId: c._id,
      displayName: c.displayName,
      photoUrl: c.photoUrl || '',
      manifesto: c.manifesto || '',
    }));

  const polls = [];
  if (president.length >= 2) {
    polls.push(await PredictionPoll.create({
      title: titles[0],
      description: 'Public opinion poll — predict who will lead the Student Council. NOT an official vote.',
      electionId: election._id,
      status: 'active',
      closesAt: endTime,
      createdBy: admin._id,
      options: toOptions(president),
    }));
  }
  if (exec.length >= 2) {
    polls.push(await PredictionPoll.create({
      title: titles[1],
      description: 'Predict which executive candidate will receive more community support.',
      electionId: election._id,
      status: 'active',
      closesAt: endTime,
      createdBy: admin._id,
      options: toOptions(exec).map((o) => {
        const c = enriched.find((e) => String(e._id) === String(o.candidateId));
        const role = c?.positionTitle === 'President' ? 'President' : 'VP';
        return { ...o, displayName: `${o.displayName} (${role})` };
      }),
    }));
  }
  if (enriched.length >= 3) {
    polls.push(await PredictionPoll.create({
      title: titles[2],
      description: 'Which campaign pitch resonates most? Share your prediction before election day.',
      electionId: election._id,
      status: 'active',
      closesAt: endTime,
      createdBy: admin._id,
      options: toOptions(allCandidates.slice(0, 4)),
    }));
  }
  if (itCands.length >= 2) {
    polls.push(await PredictionPoll.create({
      title: titles[3],
      description: 'IT students — who do you think will represent the faculty best?',
      electionId: election._id,
      status: 'active',
      closesAt: endTime,
      createdBy: admin._id,
      options: toOptions(itCands),
    }));
  }

  return polls;
}

async function seedPollActivity(polls, voters, admin) {
  const commentBodies = [
    'Samir\'s leadership experience really shows — strong platform on governance.',
    'Adil has my prediction vote. Transparency agenda is exactly what we need.',
    'The manifestos this year are incredibly detailed. Hard to choose!',
    'Amith\'s wellbeing focus could make a real difference for students.',
    'Ranjana\'s IT lab access plan is practical and achievable.',
    'James brings fresh ideas — love the industry mentorship proposal.',
    'Polls are heating up! Remember these are predictions, not official ballots.',
    'Mr Sapkota\'s capstone project leadership gives him an edge IMO.',
    'Great to see contested races across every position this year.',
    'Voted in the poll — exciting to see live charts update instantly.',
    'Priya\'s cross-faculty events idea won me over for VP prediction.',
    'Who else is watching the live results scoreboard? So intense!',
  ];

  let voteCount = 0;
  let commentCount = 0;

  for (const poll of polls) {
    const optionIds = poll.options.map((o) => o._id);
    const votersForPoll = voters.slice(0, Math.min(voters.length, 10 + Math.floor(Math.random() * 5)));

    for (let i = 0; i < votersForPoll.length; i += 1) {
      const voter = votersForPoll[i];
      const optionId = optionIds[i % optionIds.length];
      try {
        await PollVote.create({
          pollId: poll._id,
          optionId,
          userId: voter._id,
          voterKey: `seed-${poll._id}-${voter._id}`,
        });
        voteCount += 1;
      } catch {
        /* duplicate voter key — skip */
      }
    }

    // Guest / anonymous-style predictions
    for (let g = 0; g < 8; g += 1) {
      try {
        await PollVote.create({
          pollId: poll._id,
          optionId: optionIds[g % optionIds.length],
          voterKey: `seed-guest-${poll._id}-${g}`,
          ipHash: `demo-${g}`,
        });
        voteCount += 1;
      } catch {
        /* skip */
      }
    }

    const authors = [admin, ...voters].slice(0, 6);
    for (let c = 0; c < 4; c += 1) {
      const author = authors[(c + poll._id.toString().charCodeAt(0)) % authors.length];
      await PollComment.create({
        pollId: poll._id,
        userId: author._id,
        authorName: author.fullName,
        content: commentBodies[(c + voteCount) % commentBodies.length],
      });
      commentCount += 1;
    }
  }

  return { voteCount, commentCount };
}

async function seedDiscussions(election, participants) {
  await ElectionDiscussion.deleteMany({ electionId: election._id });

  const messages = [
    { user: participants.admin, body: 'Welcome to the election discussion forum. Share your thoughts respectfully — all posts are public and moderated.' },
    { user: participants.voters[0], body: 'Adil\'s transparency platform is compelling. Excited to see a contested President race this year!' },
    { user: participants.voters[1], body: 'Mr Samir Sapkota brings real project leadership experience — his governance plan is thorough.' },
    { user: participants.voters[2], body: 'Ranjana\'s IT advocacy on lab access is exactly what our faculty needs. Strong communicator!' },
    { user: participants.voters[3], body: 'The VP race between Amith and Priya is close — both have great wellbeing initiatives.' },
    { user: participants.voters[4], body: 'James Chen\'s industry mentorship idea for IT students is brilliant. Hope he gains traction.' },
    { user: participants.voters[5], body: 'Remember: discussion here is public. Official voting happens through My Ballots only.' },
    { user: participants.voters[6], body: 'Fatima\'s Treasurer manifesto on budget transparency is detailed and practical.' },
    { user: participants.voters[7], body: 'Live results are updating in real time — the scoreboard makes it feel like a real championship!' },
    { user: participants.admin, body: 'Reminder: candidate profiles, speeches, and manifestos are on each election hub page.' },
    { user: participants.voters[8], body: 'Sofia made a great point at the forum — cross-faculty collaboration matters.' },
    { user: participants.voters[9], body: 'Who\'s verified their vote receipt? I checked mine and it confirmed on the ledger.' },
    { user: participants.voters[10], body: 'Prediction polls are fun but don\'t forget to cast your official ballot before the deadline.' },
    { user: participants.voters[11], body: 'Samir vs Adil for President is the race to watch. Both strong leaders.' },
    { user: participants.voters[0], body: 'The AI insights panel summarised sentiment really well — impressive feature!' },
    { user: participants.voters[2], body: 'Liam\'s Treasurer experience with student clubs shows he can manage budgets responsibly.' },
    { user: participants.voters[4], body: 'Voting closes in two weeks — make sure your OTP login works before the last day.' },
    { user: participants.voters[1], body: 'Great turnout so far! Over 85% of eligible voters have already cast ballots in the demo.' },
    { user: participants.admin, body: 'Questions about the process? Visit Help or use the chat assistant anytime.' },
    { user: participants.voters[6], body: 'Chen Wei asked about international student representation — important topic for council.' },
  ];

  for (const m of messages) {
    await ElectionDiscussion.create({
      electionId: election._id,
      userId: m.user._id,
      authorName: m.user.fullName,
      body: m.body,
      createdAt: daysAgo(Math.floor(Math.random() * 4), Math.floor(Math.random() * 12)),
    });
  }

  return messages.length;
}

async function seedAnnouncements(election, admin, voterCount) {
  await Announcement.deleteMany({ electionId: election._id });
  const items = [
    {
      title: 'VU Student Council Election 2026 — Voting Now Open',
      body: 'Ballots are open for President, Vice President, IT Faculty Representative, and Treasurer. Sign in with your VU email and OTP to cast your official vote. Live results and prediction polls are available on the home page.',
    },
    {
      title: 'Contested races — every position has multiple candidates',
      body: 'This year features competitive races including Mr Samir Sapkota and Adil Ahnaf for President. Review candidate profiles, speeches, and manifestos before you vote.',
    },
    {
      title: 'Verify your ballot with your receipt token',
      body: 'After voting you receive a unique receipt. Use Verify Receipt on the home page to confirm your ballot was recorded without revealing your choices.',
    },
  ];

  for (let i = 0; i < items.length; i += 1) {
    await Announcement.create({
      ...items[i],
      electionId: election._id,
      sentBy: admin._id,
      recipientCount: voterCount,
      sentAt: daysAgo(i),
    });
  }

  return items.length;
}

module.exports = {
  upsertCandidate,
  seedElectionVotes,
  rebuildDemoPolls,
  seedPollActivity,
  seedDiscussions,
  seedAnnouncements,
  daysAgo,
};
