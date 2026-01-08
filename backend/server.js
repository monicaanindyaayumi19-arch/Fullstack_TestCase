const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const store = require("./modules/store");
const { authMiddleware, requireRole, JWT_SECRET } = require("./modules/auth");

const { registerDocumentRoutes } = require("./modules/documents");
const { registerRequestRoutes } = require("./modules/requests");
const { registerNotificationRoutes } = require("./modules/notificationsRoutes");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;

// In-memory users (shared to store for admin notifications)
const users = [];
store.users = users;

// Helper
function findUserByEmail(email) {
  return users.find(u => u.email.toLowerCase() === String(email).toLowerCase());
}

/**
 * AUTH
 */
app.post("/auth/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ message: "name, email, password are required" });
    }

    if (findUserByEmail(email)) {
      return res.status(409).json({ message: "email already registered" });
    }

    const hashed = await bcrypt.hash(String(password), 10);
    const user = {
      id: String(Date.now() + Math.random()),
      name: String(name),
      email: String(email),
      passwordHash: hashed,
      role: (role || "USER").toString().toUpperCase() === "ADMIN" ? "ADMIN" : "USER",
      createdAt: new Date().toISOString()
    };

    users.push(user);
    res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
  } catch (e) {
    res.status(500).json({ message: "server error", error: String(e.message || e) });
  }
});

app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: "email and password required" });

    const user = findUserByEmail(email);
    if (!user) return res.status(401).json({ message: "invalid credentials" });

    const ok = await bcrypt.compare(String(password), user.passwordHash);
    if (!ok) return res.status(401).json({ message: "invalid credentials" });

    const token = jwt.sign(
      { sub: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ token });
  } catch (e) {
    res.status(500).json({ message: "server error", error: String(e.message || e) });
  }
});

// Protected
app.get("/me", authMiddleware, (req, res) => {
  const u = users.find(x => x.id === req.user.sub);
  if (!u) return res.status(404).json({ message: "user not found" });
  res.json({ id: u.id, name: u.name, email: u.email, role: u.role });
});

// Simple health
app.get("/", (req, res) => res.json({ ok: true, service: "DMS Backend" }));

/**
 * DMS ROUTES
 */
registerDocumentRoutes(app, authMiddleware);
registerRequestRoutes(app, authMiddleware, requireRole);
registerNotificationRoutes(app, authMiddleware);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
