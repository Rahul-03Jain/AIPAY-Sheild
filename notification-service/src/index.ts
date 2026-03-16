import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import { WebSocketServer } from "ws";
import http from "http";
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

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  created_at: string;
};

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/ws" });

function broadcastNotification(notification: Notification) {
  const payload = JSON.stringify({ type: "notification", data: notification });
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(payload);
    }
  });
}

// Endpoint for other services (e.g., payment/fraud) to create alerts
app.post("/alerts/fraud", async (req, res) => {
  const { transaction_id, risk_level, fraud_score } = req.body;
  const client = await pool.connect();
  try {
    const result = await client.query(
      `INSERT INTO notifications (type, title, message, data)
       VALUES ('fraud_alert', 'Fraud Alert',
               $1,
               jsonb_build_object('transaction_id',$2,'risk_level',$3,'fraud_score',$4))
       RETURNING id, type, title, message, created_at`,
      [
        `Suspicious transaction detected (risk=${risk_level})`,
        transaction_id,
        risk_level,
        fraud_score
      ]
    );
    const notif: Notification = result.rows[0];
    broadcastNotification(notif);
    return res.status(201).json(notif);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Failed to create alert" });
  } finally {
    client.release();
  }
});

app.get("/notifications", async (_req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT id, type, title, message, created_at
       FROM notifications
       ORDER BY created_at DESC
       LIMIT 100`
    );
    return res.json(result.rows);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Failed to fetch notifications" });
  } finally {
    client.release();
  }
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

const port = process.env.PORT || 4005;
server.listen(port, () => {
  console.log(`Notification service listening on ${port}`);
});

