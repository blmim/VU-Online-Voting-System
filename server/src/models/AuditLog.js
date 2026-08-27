const mongoose = require('mongoose');
const crypto = require('crypto');

const auditLogSchema = new mongoose.Schema(
  {
    event: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    electionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Election' },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    ipAddress: { type: String },
    previousHash: { type: String },
    entryHash: { type: String },
    occurredAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

auditLogSchema.index({ event: 1, occurredAt: -1 });
auditLogSchema.index({ electionId: 1 });

auditLogSchema.statics.appendLog = async function (data) {
  const last = await this.findOne().sort({ occurredAt: -1 }).select('entryHash');
  const previousHash = last?.entryHash || 'GENESIS';
  const occurredAt = data.occurredAt ? new Date(data.occurredAt) : new Date();
  const metadata = data.metadata ?? {};
  const payload = JSON.stringify({
    event: data.event,
    userId: data.userId?.toString(),
    electionId: data.electionId?.toString(),
    metadata,
    ipAddress: data.ipAddress,
    occurredAt: occurredAt.toISOString(),
    previousHash,
  });
  const entryHash = crypto.createHash('sha256').update(payload).digest('hex');
  return this.create({ ...data, metadata, previousHash, entryHash, occurredAt });
};

module.exports = mongoose.model('AuditLog', auditLogSchema);
