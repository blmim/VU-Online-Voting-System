require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const crypto = require('crypto');
const mongoose = require('mongoose');
const config = require('../src/config');
const AuditLog = require('../src/models/AuditLog');

async function validateAuditChain() {
  await mongoose.connect(config.mongoUri);
  const logs = await AuditLog.find().sort({ occurredAt: 1 });
  let previousHash = 'GENESIS';
  let index = 0;

  for (const log of logs) {
    const payload = JSON.stringify({
      event: log.event,
      userId: log.userId?.toString(),
      electionId: log.electionId?.toString(),
      metadata: log.metadata ?? {},
      ipAddress: log.ipAddress,
      occurredAt: log.occurredAt?.toISOString?.() || log.occurredAt,
      previousHash,
    });
    const expectedHash = crypto.createHash('sha256').update(payload).digest('hex');

    if (log.previousHash !== previousHash) {
      console.error(`Chain break at index ${index}: previousHash mismatch (id=${log._id})`);
      process.exitCode = 1;
      break;
    }
    if (log.entryHash !== expectedHash) {
      console.error(`Chain break at index ${index}: entryHash mismatch (id=${log._id})`);
      if (index === 0) {
        console.error(
          'Hint: entries created before the 9 Jun 2026 audit-chain fix are invalid. ' +
            'Clear audit_logs in MongoDB, then generate new entries via login/vote/admin actions.'
        );
      }
      process.exitCode = 1;
      break;
    }
    previousHash = log.entryHash;
    index += 1;
  }

  if (!process.exitCode) {
    console.log(`Audit chain OK — ${logs.length} entries validated`);
  }

  await mongoose.disconnect();
}

validateAuditChain().catch((err) => {
  console.error(err);
  process.exit(1);
});
