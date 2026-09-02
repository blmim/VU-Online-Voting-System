const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    electionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Election', required: true },
    positionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Position', required: true },
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true },
    receiptToken: { type: String },
    voteSelfiePath: { type: String },
    faceMatchScore: { type: Number },
    faceAnomalyFlag: { type: Boolean, default: false },
    castAt: { type: Date, default: Date.now },
    ipAddress: { type: String },
  },
  { timestamps: true }
);

voteSchema.index({ userId: 1, electionId: 1, positionId: 1 }, { unique: true });
voteSchema.index({ electionId: 1, positionId: 1, candidateId: 1 });

module.exports = mongoose.model('Vote', voteSchema);
