const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema(
  {
    electionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Election', required: true },
    positionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Position', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    displayName: { type: String, required: true },
    manifesto: { type: String, default: '' },
    applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'CandidateApplication' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

candidateSchema.index({ electionId: 1, positionId: 1, userId: 1 }, { unique: true });
candidateSchema.index({ displayName: 'text', manifesto: 'text' });

module.exports = mongoose.model('Candidate', candidateSchema);
