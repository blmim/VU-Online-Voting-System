require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const config = require('./config');
const { createApp } = require('./app');
const { startElectionCron } = require('./jobs/electionCron');
const { authorizeElectionJoin } = require('./utils/socketElectionAccess');

const app = createApp();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: config.clientUrl, methods: ['GET', 'POST'], credentials: true },
});
app.set('io', io);

io.on('connection', (socket) => {
  socket.on('join:election', async (payload) => {
    try {
      const result = await authorizeElectionJoin(socket, payload);
      if (!result.ok) {
        socket.emit('join:denied', {
          electionId: result.electionId || null,
          reason: result.reason,
        });
        return;
      }
      socket.join(result.room);
      socket.emit('join:ok', { electionId: result.electionId });
    } catch (err) {
      console.error('join:election error:', err.message);
      socket.emit('join:denied', { reason: 'error' });
    }
  });
});

async function start() {
  await mongoose.connect(config.mongoUri);
  console.log('MongoDB connected');
  startElectionCron(io);
  server.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
    console.log(`Swagger: http://localhost:${config.port}/api/docs`);
  });
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(
        `Port ${config.port} is already in use. Stop the other process or set PORT to a free port.`
      );
      process.exit(1);
    }
    throw err;
  });
}

process.on('unhandledRejection', (err) => {
  console.error('Unhandled promise rejection:', err);
});

if (require.main === module) {
  start().catch((err) => {
    console.error('Failed to start:', err);
    process.exit(1);
  });
}

module.exports = { app, server, start };
