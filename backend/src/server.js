const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const { config, validateEnvironmentVariables } = require('./config/app.config');
const { setupDatabase } = require('./config/database');
const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const { router: clientsRouter, initializeRoutes: initializeClientsRoutes } = require('./routes/clients.routes');
const ClientService = require('./services/client.service');
const ClientsController = require('./controllers/clients.controller');

// Validate environment variables before starting
validateEnvironmentVariables();

const app = express();
const server = http.createServer(app);

// Set up Socket.IO
const io = new Server(server, {
  cors: config.socket.cors,
  transports: config.socket.transports
});

// Initialize services and controllers
const clientService = new ClientService(io);
const clientsController = new ClientsController(clientService);

// Initialize client routes with controller
initializeClientsRoutes(clientsController);

// Apply CORS middleware
app.use(cors(config.cors));
app.use(express.json());

// Inject database connection into requests
let db;
app.use(async (req, res, next) => {
  if (!db) {
    db = await setupDatabase();
  }
  req.db = db;
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/clients', clientsRouter);
// Check frontend and backend communication
app.get("/api/ctest", (req,res) => {
  res.sendStatus(200);
})

// 404 handler for API routes
app.use('/api', (req, res) => {
  res.status(404).json({ message: 'API route not found' });
});

// Serve static files from the frontend build
const frontendPath = path.resolve(__dirname, '../../app/dist');
app.use(express.static(frontendPath));

// SPA support - serve index.html for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Socket connection handler
io.on('connection', (socket) => {
  clientService.handleSocketConnection(socket);
});

// Start server
server.listen(config.port, '0.0.0.0', () => {
  console.log(`Server running on port ${config.port}`);
});