function emitSocketNotification(req, payload) {
  const io = req.app?.get('io');
  if (!io) return;
  io.emit('notification:new', {
    ...payload,
    createdAt: payload.createdAt || new Date().toISOString(),
  });
}

module.exports = { emitSocketNotification };
