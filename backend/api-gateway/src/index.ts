import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { createProxyMiddleware } from "http-proxy-middleware";
import jwt from "jsonwebtoken";

const app = express();
app.use(helmet());
app.use(morgan("combined"));
app.use(
  cors({
    origin: "*"
  })
);

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100
});
app.use(limiter);

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://auth-service:4001";
const PAYMENT_SERVICE_URL =
  process.env.PAYMENT_SERVICE_URL || "http://payment-service:4002";
const FRAUD_SERVICE_URL =
  process.env.FRAUD_SERVICE_URL || "http://fraud-detection-service:8000";
const ANALYTICS_SERVICE_URL =
  process.env.ANALYTICS_SERVICE_URL || "http://analytics-service:4004";
const NOTIFICATION_SERVICE_URL =
  process.env.NOTIFICATION_SERVICE_URL || "http://notification-service:4005";

const JWT_PUBLIC_KEY = process.env.JWT_PUBLIC_KEY;

function authMiddleware(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing token" });
  }
  const token = authHeader.substring(7);
  try {
    if (!JWT_PUBLIC_KEY) {
      const decoded = jwt.decode(token);
      (req as any).user = decoded;
      return next();
    }
    const decoded = jwt.verify(token, JWT_PUBLIC_KEY);
    (req as any).user = decoded;
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}

// Public auth routes (strip /auth prefix so auth service receives /login, /register, etc.)
app.use(
  "/auth",
  createProxyMiddleware({
    target: AUTH_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { "^/auth": "" }
  })
);

// Protected routes
app.use(
  "/payments",
  authMiddleware,
  createProxyMiddleware({
    target: PAYMENT_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { "^/payments": "" }
  })
);

app.use(
  "/fraud",
  authMiddleware,
  createProxyMiddleware({
    target: FRAUD_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { "^/fraud": "" }
  })
);

app.use(
  "/analytics",
  authMiddleware,
  createProxyMiddleware({
    target: ANALYTICS_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { "^/analytics": "" }
  })
);

app.use(
  "/notifications",
  authMiddleware,
  createProxyMiddleware({
    target: NOTIFICATION_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { "^/notifications": "" }
  })
);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`API Gateway listening on ${port}`);
});

