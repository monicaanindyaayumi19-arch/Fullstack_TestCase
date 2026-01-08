require("dotenv").config();
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

// ===== In-memory DB (sementara) =====
const users = []; // { id, name, email, password, role, createdAt }

function signToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, email: user.email },
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
    const token = auth.slice("Bearer ".length);
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    if (req.user.role !== role) return res.status(403).json({ message: "Forbidden" });
    next();
  };
}

function validateEmail(email) {
  return typeof email === "string" && email.includes("@");
}

// ===== Health =====
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Backend running" });
});

// ===== Register =====
app.post("/auth/register", (req, res) => {
  const { name, email, password, role } = req.body || {};

  if (!name || String(name).length < 2) return res.status(400).json({ message: "Name min 2 chars" });
  if (!validateEmail(email)) return res.status(400).json({ message: "Invalid email" });
  if (!password || String(password).length < 6) return res.status(400).json({ message: "Password min 6 chars" });

  const exists = users.find((u) => u.email.toLowerCase() === String(email).toLowerCase());
  if (exists) return res.status(409).json({ message: "Email already used" });

  const newUser = {
    id: String(Date.now()),
    name: String(name),
    email: String(email),
    password: String(password), // nanti ganti bcrypt + DB
    role: role === "ADMIN" ? "ADMIN" : "USER",
    createdAt: new Date().toISOString()
  };

  users.push(newUser);

  res.json({ id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role });
});

// ===== Login =====
app.post("/auth/login", (req, res) => {
  const { email, password } = req.body || {};

  if (!validateEmail(email)) return res.status(400).json({ message: "Invalid email" });
  if (!password) return res.status(400).json({ message: "Password required" });

  const user = users.find((u) => u.email.toLowerCase() === String(email).toLowerCase());
  if (!user || user.password !== String(password)) return res.status(401).json({ message: "Invalid credentials" });

  const token = signToken(user);

  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role }
  });
});

// ===== Protected route =====
app.get("/me", authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

// ===== Admin only test =====
app.get("/admin/ping", authMiddleware, requireRole("ADMIN"), (req, res) => {
  res.json({ ok: true, message: "Hello Admin" });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
