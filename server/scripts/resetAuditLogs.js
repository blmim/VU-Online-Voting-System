require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const config = require('../src/config');
const AuditLog = require('../src/models/AuditLog');

async function main() {
  await mongoose.connect(config.mongoUri);
  const result = await AuditLog.deleteMany({});
  console.log(`Cleared ${result.deletedCount} audit log entries`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
