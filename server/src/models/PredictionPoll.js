const mongoose = require('mongoose');

const pollOptionSchema = new mongoose.Schema({
  candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate' },
  displayName: { type: String, required: true, trim: true },
  photoUrl: { type: String, default: '' },
  manifesto: { type: String, default: '' },
});

const predictionPollSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    electionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Election' },
    options: { type: [pollOptionSchema], validate: [(v) => v.length >= 2, 'At least 2 options required'] },
    status: { type: String, enum: ['active', 'closed'], default: 'active' },
    closesAt: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

predictionPollSchema.index({ status: 1, createdAt: -1 });
predictionPollSchema.index({ electionId: 1 });

module.exports = mongoose.model('PredictionPoll', predictionPollSchema);
