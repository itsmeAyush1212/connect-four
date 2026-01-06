"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const database_1 = require("./config/database");
const kafka_1 = require("./config/kafka");
const socketHandler_1 = require("./websocket/socketHandler");
const leaderboardController_1 = require("./controllers/leaderboardController");
const gameController_1 = require("./controllers/gameController");
dotenv_1.default.config();
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
    },
});
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// API Routes
app.get('/api/leaderboard', leaderboardController_1.getLeaderboard);
app.get('/api/player/:username/stats', leaderboardController_1.getPlayerStats);
app.get('/api/player/:username/history', leaderboardController_1.getGameHistory);
app.get('/api/stats', gameController_1.getGameStats);
app.get('/api/game/:gameId', gameController_1.getGameById);
// Initialize services
const initializeServices = async () => {
    try {
        await (0, database_1.connectDatabase)();
        await (0, kafka_1.initKafka)();
        const socketHandler = new socketHandler_1.SocketHandler(io);
        await socketHandler.initialize();
        console.log('✅ All services initialized');
    }
    catch (error) {
        console.error('❌ Service initialization failed:', error);
        process.exit(1);
    }
};
// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('⏸ Shutting down gracefully...');
    await (0, kafka_1.disconnectKafka)();
    httpServer.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});
// Start server
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    initializeServices();
});
