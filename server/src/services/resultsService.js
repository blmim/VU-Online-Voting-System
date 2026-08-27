const mongoose = require('mongoose');
const Vote = require('../models/Vote');
const Position = require('../models/Position');
const Candidate = require('../models/Candidate');
const User = require('../models/User');
const CertifiedResult = require('../models/CertifiedResult');
const Election = require('../models/Election');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

async function aggregateLiveResults(electionId) {
  const eid = new mongoose.Types.ObjectId(electionId);
  const pipeline = [
    { $match: { electionId: eid } },
    {
      $group: {
        _id: { positionId: '$positionId', candidateId: '$candidateId' },
        voteCount: { $sum: 1 },
      },
    },
    { $sort: { voteCount: -1 } },
  ];

  const raw = await Vote.aggregate(pipeline);
  const positions = await Position.find({ electionId: eid }).sort({ order: 1 });
  const candidates = await Candidate.find({ electionId: eid, isActive: true });

  const positionMap = {};
  positions.forEach((p) => {
    positionMap[p._id.toString()] = { ...p.toObject(), candidates: [], totalVotes: 0 };
  });

  raw.forEach((r) => {
    const posId = r._id.positionId.toString();
    const cand = candidates.find((c) => c._id.toString() === r._id.candidateId.toString());
    if (positionMap[posId] && cand) {
      positionMap[posId].candidates.push({
        candidateId: cand._id,
        displayName: cand.displayName,
        voteCount: r.voteCount,
      });
      positionMap[posId].totalVotes += r.voteCount;
    }
  });

  candidates.forEach((cand) => {
    const posId = cand.positionId.toString();
    if (!positionMap[posId]) return;
    const listed = positionMap[posId].candidates.some(
      (c) => c.candidateId.toString() === cand._id.toString()
    );
    if (!listed) {
      positionMap[posId].candidates.push({
        candidateId: cand._id,
        displayName: cand.displayName,
        voteCount: 0,
      });
    }
  });

  Object.values(positionMap).forEach((pos) => {
    pos.candidates.forEach((c) => {
      c.votePct = pos.totalVotes
        ? Math.round((c.voteCount / pos.totalVotes) * 10000) / 100
        : 0;
    });
    pos.candidates.sort((a, b) => b.voteCount - a.voteCount);
  });

  const uniqueVoters = await Vote.distinct('userId', { electionId: eid });
  const election = await Election.findById(eid);
  const totalEligible = election?.totalEligibleVoters || (await User.countDocuments({ role: 'voter', isVerified: true }));
  const turnoutPct = totalEligible
    ? Math.round((uniqueVoters.length / totalEligible) * 10000) / 100
    : 0;

  return {
    positions: Object.values(positionMap),
    uniqueVoterCount: uniqueVoters.length,
    totalEligibleVoters: totalEligible,
    turnoutPct,
    asOf: new Date().toISOString(),
  };
}

async function certifyElectionResults(electionId) {
  const election = await Election.findById(electionId);
  if (!election) throw new Error('Election not found');

  const live = await aggregateLiveResults(electionId);
  const positions = await Position.find({ electionId });

  for (const pos of live.positions) {
    const positionDoc = positions.find((p) => p._id.toString() === pos._id?.toString() || p.title === pos.title);
    const seats = positionDoc?.seats || 1;
    const sorted = [...pos.candidates].sort((a, b) => b.voteCount - a.voteCount);
    const winners = sorted.slice(0, seats).map((c) => c.candidateId.toString());

    for (const cand of pos.candidates) {
      await CertifiedResult.findOneAndUpdate(
        {
          electionId,
          positionId: positionDoc._id,
          candidateId: cand.candidateId,
        },
        {
          finalVotes: cand.voteCount,
          isWinner: winners.includes(cand.candidateId.toString()),
          certifiedAt: new Date(),
        },
        { upsert: true, new: true }
      );
    }
  }

  const reportsDir = path.join(__dirname, '../../uploads/reports');
  if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

  const pdfPath = path.join(reportsDir, `results_${electionId}.pdf`);
  const xlsxPath = path.join(reportsDir, `results_${electionId}.xlsx`);

  await generatePdfReport(election, live, pdfPath);
  await generateExcelReport(election, live, xlsxPath);

  election.status = 'certified';
  election.certifiedAt = new Date();
  election.pdfReportPath = `uploads/reports/results_${electionId}.pdf`;
  election.excelReportPath = `uploads/reports/results_${electionId}.xlsx`;
  await election.save();

  return { live, pdfPath, xlsxPath };
}

async function generatePdfReport(election, results, filepath) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);
    doc.fontSize(18).text('VU Online Voting — Certified Results', { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text(`Election: ${election.title}`);
    doc.text(`Certified: ${new Date().toISOString()}`);
    doc.text(`Turnout: ${results.turnoutPct}%`);
    doc.moveDown();

    results.positions.forEach((pos) => {
      doc.fontSize(12).text(`Position: ${pos.title}`, { underline: true });
      pos.candidates.forEach((c, i) => {
        doc.text(`  ${i + 1}. ${c.displayName} — ${c.voteCount} votes (${c.votePct}%)`);
      });
      doc.moveDown();
    });

    doc.end();
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

async function generateExcelReport(election, results, filepath) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Results');
  sheet.columns = [
    { header: 'Position', key: 'position', width: 25 },
    { header: 'Candidate', key: 'candidate', width: 25 },
    { header: 'Votes', key: 'votes', width: 10 },
    { header: 'Percentage', key: 'pct', width: 12 },
    { header: 'Winner', key: 'winner', width: 10 },
  ];

  const positions = await Position.find({ electionId: election._id });
  for (const pos of results.positions) {
    const positionDoc = positions.find((p) => p.title === pos.title);
    const seats = positionDoc?.seats || 1;
    const sorted = [...pos.candidates].sort((a, b) => b.voteCount - a.voteCount);
    const winnerIds = sorted.slice(0, seats).map((c) => c.candidateId.toString());

    pos.candidates.forEach((c) => {
      sheet.addRow({
        position: pos.title,
        candidate: c.displayName,
        votes: c.voteCount,
        pct: `${c.votePct}%`,
        winner: winnerIds.includes(c.candidateId.toString()) ? 'Yes' : 'No',
      });
    });
  }

  await workbook.xlsx.writeFile(filepath);
}

module.exports = { aggregateLiveResults, certifyElectionResults };
