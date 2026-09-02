const mongoose = require('mongoose');

const socialLinksSchema = new mongoose.Schema(
  {
    linkedin: { type: String, default: '' },
    twitter: { type: String, default: '' },
    instagram: { type: String, default: '' },
    website: { type: String, default: '' },
  },
  { _id: false }
);

const candidateSchema = new mongoose.Schema(
  {
    electionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Election', required: true },
    positionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Position', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    displayName: { type: String, required: true },
    manifesto: { type: String, default: '' },
    tagline: { type: String, default: '', maxlength: 160 },
    bio: { type: String, default: '', maxlength: 3000 },
    whyRunning: { type: String, default: '', maxlength: 2000 },
    inspiration: { type: String, default: '', maxlength: 1000 },
    goals: { type: String, default: '', maxlength: 2000 },
    experience: { type: String, default: '', maxlength: 2000 },
    speech: { type: String, default: '', maxlength: 4000 },
    socialLinks: { type: socialLinksSchema, default: () => ({}) },
    profileComplete: { type: Boolean, default: false },
    applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'CandidateApplication' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

candidateSchema.methods.computeProfileComplete = function computeProfileComplete() {
  return Boolean(
    this.tagline?.trim()
    && this.bio?.trim()
    && this.speech?.trim()
    && this.whyRunning?.trim()
  );
};

candidateSchema.index({ electionId: 1, positionId: 1, userId: 1 }, { unique: true });
candidateSchema.index({ displayName: 'text', manifesto: 'text' });

module.exports = mongoose.model('Candidate', candidateSchema);
