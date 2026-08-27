const crypto = require('crypto');
const config = require('../config');

function generateReceipt(userId, electionId) {
  const raw = `${userId}:${electionId}:${Date.now()}`;
  const hex = crypto.createHmac('sha256', config.receiptSecret).update(raw).digest('hex');
  const year = new Date().getFullYear();
  return `VR-${year}-${hex.substring(0, 8).toUpperCase()}`;
}

module.exports = { generateReceipt };
