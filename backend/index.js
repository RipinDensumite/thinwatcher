require("dotenv").config();

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const { body, validationResult } = require("express-validator");
const sqlite3 = require("sqlite3").verbose();
const { open } = require("sqlite");
const path = require("path");

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

// Apply CORS middleware to Express
app.use(
  cors({
    origin: [process.env.CORS_ORIGIN_PROD, process.env.CORS_ORIGIN_DEV],
    methods: ["GET", "POST", "DELETE", "PUT"],
    allowedHeaders: ["Content-Type", "Authorization", "x-api-key"],
    credentials: true,
  })
);

const clients = new Map();

// Configuration from environment variables
const OFFLINE_TIMEOUT = parseInt(process.env.OFFLINE_TIMEOUT, 10);
const CLEANUP_INTERVAL = parseInt(process.env.CLEANUP_INTERVAL, 10);
const PORT = process.env.PORT || 3001; // Fallback to 3001 if PORT is not set
const API_KEY = process.env.API_KEY; // Load API key from environment variables
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key"; // JWT secret for authentication

// Database setup
let db;
async function setupDatabase() {
  // Open the database
  db = await open({
    filename: path.join(__dirname, "database.db"),
    driver: sqlite3.Database,
  });

  // Create users table if it doesn't exist
  await db.exec(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  console.log("SQLite database connected");
}

// Initialize database
setupDatabase().catch((err) => {
  console.error("Database setup error:", err);
  process.exit(1);
});

// Middleware to check API key
function apiKeyAuth(req, res, next) {
  const apiKey = req.headers["x-api-key"]; // Get API key from request headers

  if (apiKey === API_KEY) {
    next(); // API key is valid, proceed to the next middleware/route
  } else {
    res.status(401).json({ error: "Unauthorized: Invalid API key" }); // API key is invalid
  }
}

// JWT Authentication middleware
const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await db.get(
      "SELECT id, username, email, role FROM users WHERE id = ?",
      decoded.userId
    );

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    res.status(401).json({ message: "Please authenticate" });
  }
};

// Admin role check middleware
const adminAuth = async (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

app.use(express.json());

// Validation middleware
const registerValidation = [
  body("username")
    .trim()
    .isLength({ min: 3 })
    .withMessage("Username must be at least 3 characters"),
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
];

const loginValidation = [
  body("username").trim().notEmpty().withMessage("Username is required"),
  body("password").notEmpty().withMessage("Password is required"),
];

// AUTH ROUTES
// Register user
app.post("/api/auth/register", registerValidation, async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, email, password } = req.body;

  try {
    // Check if any users exist in the database
    const existingUsers = await db.get("SELECT COUNT(*) as count FROM users");
    const isFirstUser = existingUsers.count === 0;

    // Check if user already exists
    const existingUser = await db.get(
      "SELECT * FROM users WHERE username = ? OR email = ?",
      [username, email]
    );
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user - first user becomes admin
    const result = await db.run(
      "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)",
      [username, email, hashedPassword, isFirstUser ? "admin" : "user"]
    );

    // Get the inserted user
    const user = await db.get(
      "SELECT id, username, email, role FROM users WHERE id = ?",
      result.lastID
    );

    // Create JWT token
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: "1h",
    });

    res.status(201).json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        isFirstUser: isFirstUser,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Add a new endpoint to check if registration is allowed
app.get("/api/auth/can-register", async (req, res) => {
  try {
    const existingUsers = await db.get("SELECT COUNT(*) as count FROM users");
    if(existingUsers.count === 0){
      return res.json({ canRegister: true });
    }else {
      return res.json({ canRegister: false });
    }
  } catch (error) {
    console.error("Registration check error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Login user
app.post("/api/auth/login", loginValidation, async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, password } = req.body;

  try {
    // Check if user exists
    const user = await db.get(
      "SELECT * FROM users WHERE username = ?",
      username
    );
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Create JWT token
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get user profile (protected route)
app.get("/api/auth/profile", auth, async (req, res) => {
  try {
    // User information is already available from the auth middleware
    res.json(req.user);
  } catch (error) {
    console.error("Profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Logout (optional - can be handled on client side)
app.post("/api/auth/logout", auth, (req, res) => {
  res.json({ message: "Logged out successfully" });
});

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

// Client data endpoint - protected with both API key and JWT auth
app.get("/api/clients", auth, apiKeyAuth, (req, res) => {
  res.json(
    Array.from(clients.entries()).map(([id, data]) => ({
      clientId: id,
      status: data,
    }))
  );
});

// Client removal endpoint - protected with JWT auth and admin role
app.delete("/api/clients/:clientId", auth, adminAuth, (req, res) => {
  const clientId = req.params.clientId;

  if (clients.has(clientId)) {
    clients.delete(clientId);
    io.emit("client-removed", clientId);
    res.sendStatus(200);
  } else {
    res.status(404).json({ error: "Client not found" });
  }
});

// Client existence check - keep it public
app.get("/api/check-client/:clientId", (req, res) => {
  const exists = clients.has(req.params.clientId);
  res.json({ exists });
});

// Session termination - protected with both API key and JWT auth
app.post("/api/terminate", auth, apiKeyAuth, (req, res) => {
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

// Admin user management endpoints
// Get all users (admin only)
app.get("/api/admin/users", auth, adminAuth, async (req, res) => {
  try {
    const users = await db.all(
      "SELECT id, username, email, role, created_at FROM users"
    );
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update user role (admin only)
app.put("/api/admin/users/:id/role", auth, adminAuth, async (req, res) => {
  const { role } = req.body;
  const userId = req.params.id;

  if (!["admin", "user"].includes(role)) {
    return res.status(400).json({ message: "Invalid role" });
  }

  try {
    await db.run("UPDATE users SET role = ? WHERE id = ?", [role, userId]);
    const updatedUser = await db.get(
      "SELECT id, username, email, role FROM users WHERE id = ?",
      userId
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(updatedUser);
  } catch (error) {
    console.error("Error updating user role:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete user (admin only)
app.delete("/api/admin/users/:id", auth, adminAuth, async (req, res) => {
  const userId = req.params.id;

  try {
    const result = await db.run("DELETE FROM users WHERE id = ?", userId);

    if (result.changes === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// WebSocket initialization
io.on("connection", (socket) => {
  const apiKey = socket.handshake.query.apiKey;
  const authToken = socket.handshake.query.token;

  // Verify API key first
  if (apiKey !== API_KEY) {
    console.log("Unauthorized WebSocket connection attempt - Invalid API key");
    socket.disconnect(true); // Disconnect unauthorized clients
    return;
  }

  // Now verify JWT token if provided
  if (authToken) {
    try {
      jwt.verify(authToken, JWT_SECRET);
      console.log("Authenticated WebSocket connection");
    } catch (error) {
      console.log("Invalid JWT token in WebSocket connection");
      socket.disconnect(true);
      return;
    }
  } else {
    console.log("Authorized WebSocket connection (API key only)");
  }

  socket.emit("initial-data", Array.from(clients.entries()));
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
