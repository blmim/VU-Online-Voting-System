const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  body: { type: String, required: true },
  electionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Election' },
  recipientCount: { type: Number, default: 0 },
  sentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sentAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Announcement', announcementSchema);
