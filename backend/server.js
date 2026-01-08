require("dotenv").config();
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

// ===== In-memory users (sementara) =====
const users = []; 
// { id, name, email, password, role, createdAt }

// ===== Helpers =====
function signToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing token" });
  }
  try {
    const token = auth.replace("Bearer ", "");
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    if (req.user.role !== role) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
}

// ===== Routes =====
app.get("/", (req, res) => {
  res.send("DMS Backend API");
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// ===== AUTH =====
app.post("/auth/register", (req, res) => {
  const { name, email, password, role } = req.body || {};

  if (!name || name.length < 2) {
    return res.status(400).json({ message: "Name min 2 chars" });
  }
  if (!email || !email.includes("@")) {
    return res.status(400).json({ message: "Invalid email" });
  }
  if (!password || password.length < 6) {
    return res.status(400).json({ message: "Password min 6 chars" });
  }

  const exists = users.find((u) => u.email === email);
  if (exists) {
    return res.status(409).json({ message: "Email already registered" });
  }

  const user = {
    id: String(Date.now()),
    name,
    email,
    password, // NOTE: nanti pakai bcrypt
    role: role === "ADMIN" ? "ADMIN" : "USER",
    createdAt: new Date().toISOString()
  };

  users.push(user);

  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  });
});

app.post("/auth/login", (req, res) => {
  const { email, password } = req.body || {};

  const user = users.find((u) => u.email === email);
  if (!user || user.password !== password) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = signToken(user);

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
});

// ===== PROTECTED =====
app.get("/me", authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

// ===== ADMIN ONLY =====
app.get("/admin/ping", authMiddleware, requireRole("ADMIN"), (req, res) => {
  res.json({ message: "Hello Admin" });
});

// ===== Start =====
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
