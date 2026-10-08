const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const authRoutes = require('./routes/auth');
const tripRoutes = require('./routes/trips');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/trips', tripRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'AirShare',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// Serve static frontend assets from client/dist in production
const clientDistPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientDistPath));

// Fallback all non-API routes to client/dist/index.html (Single Page App)
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(clientDistPath, 'index.html'), (err) => {
    if (err) {
      // If dist hasn't been built yet (e.g., in dev), return friendly status
      res.status(200).send(`
        <!DOCTYPE html>
        <html>
          <head><title>AirShare Backend</title></head>
          <body style="font-family: system-ui; max-width: 600px; margin: 40px auto; padding: 20px; line-height: 1.6;">
            <h2>✈️ AirShare Server is Running</h2>
            <p>API is active on <code>/api</code>.</p>
            <p>To view the React frontend in development mode, run <code>npm run client</code> or build with <code>npm run build</code>.</p>
          </body>
        </html>
      `);
    }
  });
});

// Connect to MongoDB and start server
const startServer = async () => {
  try {
    if (!MONGO_URI) {
      console.warn('⚠️ MONGO_URI is not set in environment variables! Server starting in offline mode.');
    } else {
      await mongoose.connect(MONGO_URI);
      console.log('✅ Connected to MongoDB Atlas successfully.');
    }

    app.listen(PORT, () => {
      console.log(`🚀 AirShare server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('❌ Failed to connect to MongoDB:', err.message);
    // Still start Express so health checks and clear error messages can be shown
    app.listen(PORT, () => {
      console.log(`⚠️ AirShare server running on port ${PORT} (Database connection pending)`);
    });
  }
};

startServer();
