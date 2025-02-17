const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);

// In your server.js
const io = new Server(server, {
  cors: {
    origin: [
      "https://thinwatcher.vercel.app", // Your production domain
      "http://localhost:5173", // Keep for local development
    ],
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

const clients = new Map();

// Configuration
const OFFLINE_TIMEOUT = 20000;
const CLEANUP_INTERVAL = 10000;
const PORT = 3001;

app.use(express.json());

// Status update endpoint
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
app.get("/api/clients", (req, res) => {
  res.json(
    Array.from(clients.entries()).map(([id, data]) => ({
      clientId: id,
      status: data,
    }))
  );
});

// Client removal endpoint
app.delete("/api/clients/:clientId", (req, res) => {
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
app.post("/api/terminate", (req, res) => {
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
  socket.emit("initial-data", Array.from(clients.entries()));
});

server.listen(PORT, () => {
  console.log("Monitoring server running on port " + PORT);
});
