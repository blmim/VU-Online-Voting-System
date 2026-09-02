const mongoose = require('mongoose');

const pollVoteSchema = new mongoose.Schema(
  {
    pollId: { type: mongoose.Schema.Types.ObjectId, ref: 'PredictionPoll', required: true },
    optionId: { type: mongoose.Schema.Types.ObjectId, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    voterKey: { type: String, required: true },
    ipHash: { type: String },
  },
  { timestamps: true }
);

pollVoteSchema.index({ pollId: 1, voterKey: 1 }, { unique: true });
pollVoteSchema.index({ pollId: 1, optionId: 1 });

module.exports = mongoose.model('PollVote', pollVoteSchema);
