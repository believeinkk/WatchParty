require('dotenv').config();
const express = require('express');
const http = require('http');
const next = require('next');
const { Server } = require('socket.io');
const connectDB = require('./lib/db');

// Set environment modes
const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0'; // Essential for Railway / Render container proxy binding
const port = parseInt(process.env.PORT || '3000', 10);

// Initialize Next.js application instance
const nextApp = next({ dev, hostname, port });
const handle = nextApp.getRequestHandler();

async function startServer() {
  try {
    // 1. Initialize MongoDB connection (non-blocking so server boots immediately)
    connectDB().catch((err) => {
      console.warn('[Database] Initial connection attempt deferred:', err.message);
    });

    // 2. Prepare Next.js application
    await nextApp.prepare();

    const app = express();
    const server = http.createServer(app);

    // Express CORS middleware to permit cross-origin requests
    app.use((req, res, next) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
      res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,Authorization');
      if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
      }
      next();
    });

    // 3. Setup Socket.io on the exact same HTTP server instance
    // Configure CORS to accept connections from ANY origin during debugging/production
    const io = new Server(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
      transports: ['websocket', 'polling'],
    });

    // Initialize modular Socket.io event handlers with RBAC & state management
    const setupSocketHandlers = require('./lib/socketHandlers');
    setupSocketHandlers(io);

    // Make io accessible to Express route handlers if needed
    app.set('io', io);

    // 4. API health check endpoint (Used by Render / Railway deployment health checks)
    app.get('/api/health', (req, res) => {
      res.json({
        status: 'online',
        timestamp: new Date().toISOString(),
        environment: dev ? 'development' : 'production',
        port,
      });
    });

    // 5. Let Next.js handle all other frontend pages and API routes
    app.all('/{*splat}', (req, res) => {
      return handle(req, res);
    });

    // 6. Listen on single unified port binding to 0.0.0.0
    server.listen(port, hostname, () => {
      console.log(`[Server] YouTube Watch Party running in ${dev ? 'development' : 'production'} mode on http://${hostname}:${port}`);
    });
  } catch (error) {
    console.error('[Server] Startup error:', error);
    process.exit(1);
  }
}

startServer();
