import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Pool } from "pg";

const app = express();
app.use(express.json());
app.use(helmet());
app.use(morgan("combined"));
app.use(
  cors({
    origin: "*"
  })
);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const JWT_PRIVATE_KEY = process.env.JWT_PRIVATE_KEY || "dev-secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "15m";

app.post("/register", async (req, res) => {
  const { email, password, fullName, role } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password required" });
  }
  const client = await pool.connect();
  try {
    const existing = await client.query("SELECT id FROM users WHERE email=$1", [
      email
    ]);
    if (existing.rowCount) {
      return res.status(400).json({ message: "Email already in use" });
    }
    const hash = await bcrypt.hash(password, 10);
    const result = await client.query(
      `INSERT INTO users (email, password_hash, full_name, role, status)
       VALUES ($1, $2, $3, $4, 'active') RETURNING id, email, role`,
      [email, hash, fullName ?? null, role ?? "user"]
    );
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal error" });
  } finally {
    client.release();
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password required" });
  }
  const client = await pool.connect();
  try {
    const result = await client.query(
      "SELECT id, email, password_hash, role, status FROM users WHERE email=$1",
      [email]
    );
    if (!result.rowCount) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    if (user.status !== "active") {
      return res.status(403).json({ message: "User not active" });
    }
    const payload = { sub: user.id, email: user.email, role: user.role };
    const token = jwt.sign(
      payload,
      JWT_PRIVATE_KEY as jwt.Secret,
      { expiresIn: JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"] }
    );
    return res.json({ accessToken: token });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal error" });
  } finally {
    client.release();
  }
});

app.get("/profile", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing token" });
  }
  const token = authHeader.substring(7);
  let payload: { sub?: string; email?: string; role?: string };
  try {
    payload = jwt.verify(token, JWT_PRIVATE_KEY) as typeof payload;
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
  const client = await pool.connect();
  try {
    const result = await client.query(
      "SELECT id, email, full_name, role, status FROM users WHERE id=$1",
      [payload.sub]
    );
    if (!result.rowCount) {
      return res.status(404).json({ message: "User not found" });
    }
    const user = result.rows[0] as { id: string; email: string; full_name: string; role: string; status: string };
    const merchantResult = await client.query(
      "SELECT id as merchant_id FROM merchants WHERE user_id=$1 LIMIT 1",
      [user.id]
    );
    const response: Record<string, unknown> = { ...user };
    if (merchantResult.rowCount) {
      response.merchant_id = merchantResult.rows[0].merchant_id;
    }
    return res.json(response);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal error" });
  } finally {
    client.release();
  }
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

const port = process.env.PORT || 4001;
app.listen(port, () => {
  console.log(`Auth service listening on ${port}`);
});

