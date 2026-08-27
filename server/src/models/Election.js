const mongoose = require('mongoose');

const electionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    status: {
      type: String,
      enum: ['draft', 'published', 'active', 'closed', 'certified'],
      default: 'draft',
    },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    applicationDeadline: { type: Date },
    allowCandidateApplications: { type: Boolean, default: true },
    totalEligibleVoters: { type: Number, default: 0 },
    settings: {
      // Default private for new elections; seed/demo explicitly sets true for public live view
      showLiveResultsPublic: { type: Boolean, default: false },
      requireSelfieVerification: { type: Boolean, default: true },
      sendVoteConfirmationEmail: { type: Boolean, default: true },
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    closedAt: { type: Date },
    certifiedAt: { type: Date },
    reminderSentAt: { type: Date },
    pdfReportPath: { type: String },
    excelReportPath: { type: String },
  },
  { timestamps: true }
);

electionSchema.index({ title: 'text', description: 'text' });
electionSchema.index({ status: 1, startTime: 1, endTime: 1 });

module.exports = mongoose.model('Election', electionSchema);
