require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { sequelize } = require('./models');

// Route Imports
const authRoutes = require('./routes/auth');
const groupRoutes = require('./routes/groups');
const noteRoutes = require('./routes/notes');
const sessionRoutes = require('./routes/sessions');
const discussionRoutes = require('./routes/discussions');
const progressRoutes = require('./routes/progress');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/discussions', discussionRoutes);
app.use('/api/progress', progressRoutes);

// Socket.IO setup
require('./sockets/presence')(io);

// Root Endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the StudyCircle API Server!' });
});

// Database Sync and Server Startup
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Sync models to local SQLite database
    await sequelize.sync();
    console.log('Database synced successfully.');

    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
  }
};

startServer();
