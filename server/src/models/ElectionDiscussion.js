const mongoose = require('mongoose');

const electionDiscussionSchema = new mongoose.Schema(
  {
    electionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Election', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    authorName: { type: String, required: true, trim: true, maxlength: 80 },
    body: { type: String, required: true, trim: true, maxlength: 2000 },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'ElectionDiscussion', default: null },
    isReported: { type: Boolean, default: false },
  },
  { timestamps: true }
);

electionDiscussionSchema.index({ electionId: 1, createdAt: -1 });
electionDiscussionSchema.index({ parentId: 1 });

module.exports = mongoose.model('ElectionDiscussion', electionDiscussionSchema);
