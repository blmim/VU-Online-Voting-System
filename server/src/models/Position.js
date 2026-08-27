const mongoose = require('mongoose');

const eligibilitySchema = new mongoose.Schema(
  {
    faculties: [{ type: String }],
    departments: [{ type: String }],
    years: [{ type: Number }],
    minYear: { type: Number },
    maxYear: { type: Number },
    requireVerified: { type: Boolean, default: true },
  },
  { _id: false }
);

const positionSchema = new mongoose.Schema(
  {
    electionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Election', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    seats: { type: Number, default: 1, min: 1 },
    order: { type: Number, default: 0 },
    eligibility: { type: eligibilitySchema, default: () => ({}) },
  },
  { timestamps: true }
);

positionSchema.index({ electionId: 1, title: 'text' });

module.exports = mongoose.model('Position', positionSchema);
