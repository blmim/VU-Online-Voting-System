const mongoose = require('mongoose');

const candidateApplicationSchema = new mongoose.Schema(
  {
    electionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Election', required: true },
    positionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Position', required: true },
    applicantId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    manifesto: { type: String, default: '' },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    rejectionReason: { type: String },
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate' },
  },
  { timestamps: true }
);

candidateApplicationSchema.index(
  { electionId: 1, positionId: 1, applicantId: 1 },
  { unique: true }
);

module.exports = mongoose.model('CandidateApplication', candidateApplicationSchema);
