const mongoose = require('mongoose');

const anomalyReviewSchema = new mongoose.Schema(
  {
    voteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vote', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    electionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Election', required: true },
    referenceSelfiePath: { type: String },
    voteSelfiePath: { type: String },
    faceMatchScore: { type: Number },
    status: {
      type: String,
      enum: ['pending', 'cleared', 'flagged'],
      default: 'pending',
    },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewNotes: { type: String },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AnomalyReview', anomalyReviewSchema);
