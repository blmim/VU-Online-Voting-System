const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

/** Shared MMS bootstrap — Windows hosts often need >10s to spawn mongod. */
async function startMemoryMongo(opts = {}) {
  const mongoServer = await MongoMemoryServer.create({
    instance: {
      launchTimeout: opts.launchTimeout ?? 120000,
    },
  });
  await mongoose.connect(mongoServer.getUri());
  return mongoServer;
}

async function stopMemoryMongo(mongoServer) {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
}

module.exports = { startMemoryMongo, stopMemoryMongo };
