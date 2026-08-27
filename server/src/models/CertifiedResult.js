const mongoose = require('mongoose');

const certifiedResultSchema = new mongoose.Schema(
  {
    electionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Election', required: true },
    positionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Position', required: true },
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true },
    finalVotes: { type: Number, required: true },
    isWinner: { type: Boolean, default: false },
    certifiedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

certifiedResultSchema.index({ electionId: 1, positionId: 1, candidateId: 1 }, { unique: true });

module.exports = mongoose.model('CertifiedResult', certifiedResultSchema);
