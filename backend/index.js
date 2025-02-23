require("dotenv").config();

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

// Configure CORS origins from environment variables
const io = new Server(server, {
  cors: {
    origin: [
      process.env.CORS_ORIGIN_PROD, // Production domain
      process.env.CORS_ORIGIN_DEV, // Local development domain
    ],
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

const clients = new Map();

// Configuration from environment variables
const OFFLINE_TIMEOUT = parseInt(process.env.OFFLINE_TIMEOUT, 10);
const CLEANUP_INTERVAL = parseInt(process.env.CLEANUP_INTERVAL, 10);
const PORT = process.env.PORT || 3001; // Fallback to 3001 if PORT is not set
const API_KEY = process.env.API_KEY; // Load API key from environment variables

// Middleware to check API key
function apiKeyAuth(req, res, next) {
  const apiKey = req.headers["x-api-key"]; // Get API key from request headers

  if (apiKey === API_KEY) {
    next(); // API key is valid, proceed to the next middleware/route
  } else {
    res.status(401).json({ error: "Unauthorized: Invalid API key" }); // API key is invalid
  }
}

app.use(express.json());

// Apply API key middleware to protected endpoints
app.delete("/api/clients/ctest", (req, res) => {
  res.sendStatus(200);
});

app.post("/api/status", (req, res) => {
  const { clientId, users, sessions, os } = req.body;
  const clientData = {
    isOnline: true,
    os,
    users,
    sessions,
    lastUpdated: new Date(),
  };

  clients.set(clientId, clientData);
  io.emit("update", { clientId, status: clientData });
  res.sendStatus(200);
});

// Offline detection cleanup
setInterval(() => {
  const now = Date.now();
  clients.forEach((client, clientId) => {
    if (client.isOnline && now - client.lastUpdated > OFFLINE_TIMEOUT) {
      client.isOnline = false;
      client.users = [];
      client.sessions = [];
      io.emit("update", { clientId, status: client });
    }
  });
}, CLEANUP_INTERVAL);

// Client data endpoint
app.get("/api/clients", apiKeyAuth, (req, res) => {
  res.json(
    Array.from(clients.entries()).map(([id, data]) => ({
      clientId: id,
      status: data,
    }))
  );
});

// Client removal endpoint
app.delete("/api/clients/:clientId", apiKeyAuth, (req, res) => {
  const clientId = req.params.clientId;

  if (clients.has(clientId)) {
    clients.delete(clientId);
    io.emit("client-removed", clientId);
    res.sendStatus(200);
  } else {
    res.status(404).json({ error: "Client not found" });
  }
});

// Client existence check
app.get("/api/check-client/:clientId", (req, res) => {
  const exists = clients.has(req.params.clientId);
  res.json({ exists });
});

// Session termination
app.post("/api/terminate", apiKeyAuth, (req, res) => {
  const { clientId, sessionId } = req.body;
  const client = clients.get(clientId);

  if (client) {
    client.terminateCommand = {
      action: "logoff",
      sessionId,
      timestamp: new Date(),
    };
    io.emit("terminate", { clientId, sessionId });
    res.sendStatus(200);
  } else {
    res.status(404).send("Client not found");
  }
});

// WebSocket initialization
io.on("connection", (socket) => {
  const apiKey = socket.handshake.query.apiKey;

  if (apiKey !== API_KEY) {
    console.log("Unauthorized WebSocket connection attempt");
    socket.disconnect(true); // Disconnect unauthorized clients
    return;
  }

  console.log("Authorized WebSocket connection");
  socket.emit("initial-data", Array.from(clients.entries()));
});

server.listen(PORT, () => {
  console.log(`Monitoring server running on port ${PORT}`);
});