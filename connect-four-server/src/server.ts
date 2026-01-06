import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDatabase } from './config/database';
import { ProducerService } from './kafka/producer';
import { SocketHandler } from './websocket/socketHandler';

let kafkaProducer: ProducerService | null = null;
import { getLeaderboard, getPlayerStats, getGameHistory } from './controllers/leaderboardController';
import { getGameStats, getGameById } from './controllers/gameController';

dotenv.config();

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      const allowedOrigins = (process.env.FRONTEND_URL || '').split(',').map(url => url.trim()).filter(Boolean);
      
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.get('/api/leaderboard', getLeaderboard);
app.get('/api/player/:username/stats', getPlayerStats);
app.get('/api/player/:username/history', getGameHistory);
app.get('/api/stats', getGameStats);
app.get('/api/game/:gameId', getGameById);

// Initialize services
const initializeServices = async () => {
  try {
    await connectDatabase();
    
    // Initialize Kafka Producer (optional - don't crash if it fails)
    try {
      kafkaProducer = new ProducerService();
      await kafkaProducer.initialize();
      console.log('Kafka initialized');
    } catch (kafkaError) {
      console.warn('Kafka initialization failed, continuing without Kafka:', kafkaError);
      // Don't exit - server can run without Kafka
    }

    try {
      const socketHandler = new SocketHandler(io);
      await socketHandler.initialize();
      console.log('Socket handler initialized');
    } catch (socketError) {
      console.warn('Socket initialization warning:', socketError);
    }

    console.log('Core services initialized');
  } catch (error) {
    console.error('Critical service initialization failed:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  if (kafkaProducer) {
    await kafkaProducer.disconnect();
  }
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Start server with EADDRINUSE handling and optional fallback
const START_PORT = Number(process.env.PORT) || (() => {
  console.warn('WARNING: PORT environment variable not set, using default 3001');
  return 3001;
})();
let attempts = 0;
const MAX_ATTEMPTS = 10;

const startServer = (port: number) => {
  const srv = httpServer.listen(port, () => {
    console.log(`Server running on port ${port}`);
    initializeServices();
  });

  srv.on('error', (err: any) => {
    if (err && err.code === 'EADDRINUSE') {
      attempts += 1;
      if (attempts <= MAX_ATTEMPTS) {
        const nextPort = port + 1;
        console.warn(`Port ${port} in use - trying port ${nextPort} (attempt ${attempts}/${MAX_ATTEMPTS})`);
        setTimeout(() => startServer(nextPort), 500);
      } else {
        console.error(`Could not bind to a port after ${MAX_ATTEMPTS} attempts. Exiting.`);
        process.exit(1);
      }
    } else {
      console.error('Server error:', err);
      process.exit(1);
    }
  });
};

startServer(START_PORT);

process.on('SIGTERM', async () => {
  console.log('SIGTERM received - shutting down gracefully...');
  if (kafkaProducer) {
    await kafkaProducer.disconnect();
  }
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});