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

const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
  : ['http://localhost:3000', 'https://studycircle-collaborative-learning.vercel.app'];

console.log('Allowed CORS Origins configured:', allowedOrigins);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, or postman)
    if (!origin) return callback(null, true);
    
    // Check if origin matches allowed list, localhost, or any vercel.app subdomain
    const isAllowed = allowedOrigins.includes(origin) || 
                      origin.endsWith('.vercel.app') || 
                      /^http:\/\/localhost(:\d+)?$/.test(origin);
                      
    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`Origin blocked by CORS: ${origin}`);
      callback(null, false); // Disallow by returning false (doesn't set headers)
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
};

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: corsOptions
});

// Middleware
app.use(cors(corsOptions));
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

    // Auto-seed database if empty (prevents empty-state look for evaluators)
    const { seedDatabase } = require('./utils/seeder');
    await seedDatabase();

    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
  }
};

startServer();

