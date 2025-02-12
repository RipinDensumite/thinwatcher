const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
const clients = new Map();

// Configuration
const OFFLINE_TIMEOUT = 60000; // 1 minute
const CLEANUP_INTERVAL = 30000; // 30 seconds

app.use(express.json());

// Status update endpoint
app.post("/api/status", (req, res) => {
  const { clientId, users, sessions } = req.body;
  const clientData = {
    isOnline: true,
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

server.listen(3001, () => {
  console.log("Monitoring server running on port 3001");
});
