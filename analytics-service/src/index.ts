import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import { WebSocketServer } from "ws";
import http from "http";

const app = express();
app.use(express.json());
app.use(helmet());
app.use(morgan("combined"));
app.use(
  cors({
    origin: "*"
  })
);

type TxPoint = { timestamp: number; count: number };

const metrics = {
  totalRevenue: 0,
  fraudRate: 0,
  txPerMinute: [] as TxPoint[],
  totalTx: 0,
  fraudTx: 0
};

function recordTransaction(amount: number, isFraud: boolean) {
  metrics.totalTx += 1;
  metrics.totalRevenue += amount;
  if (isFraud) metrics.fraudTx += 1;
  metrics.fraudRate = metrics.totalTx
    ? metrics.fraudTx / metrics.totalTx
    : 0;
  const now = Date.now();
  const minuteBucket = Math.floor(now / 60000) * 60000;
  const last = metrics.txPerMinute[metrics.txPerMinute.length - 1];
  if (last && last.timestamp === minuteBucket) {
    last.count += 1;
  } else {
    metrics.txPerMinute.push({ timestamp: minuteBucket, count: 1 });
  }
  if (metrics.txPerMinute.length > 100) {
    metrics.txPerMinute.shift();
  }
}

// Simple HTTP endpoint used by payment-service (or others) to push events.
app.post("/events/payment-completed", (req, res) => {
  const { amount, isFraud } = req.body;
  recordTransaction(Number(amount || 0), Boolean(isFraud));
  broadcastMetrics();
  return res.status(204).send();
});

app.get("/metrics", (_req, res) => {
  res.json(metrics);
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/metrics-ws" });

function broadcastMetrics() {
  const payload = JSON.stringify(metrics);
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(payload);
    }
  });
}

wss.on("connection", (ws) => {
  ws.send(JSON.stringify(metrics));
});

const port = process.env.PORT || 4004;
server.listen(port, () => {
  console.log(`Analytics service listening on ${port}`);
});

