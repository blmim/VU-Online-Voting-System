const mongoose = require('mongoose');

const pollCommentSchema = new mongoose.Schema(
  {
    pollId: { type: mongoose.Schema.Types.ObjectId, ref: 'PredictionPoll', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    authorName: { type: String, required: true, trim: true, maxlength: 80 },
    content: { type: String, required: true, trim: true, maxlength: 2000 },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'PollComment', default: null },
    isReported: { type: Boolean, default: false },
  },
  { timestamps: true }
);

pollCommentSchema.index({ pollId: 1, createdAt: -1 });
pollCommentSchema.index({ parentId: 1 });

module.exports = mongoose.model('PollComment', pollCommentSchema);
