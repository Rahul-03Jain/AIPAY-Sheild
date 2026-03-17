import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import { Pool } from "pg";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";

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

const FRAUD_SERVICE_URL =
  process.env.FRAUD_SERVICE_URL || "http://localhost:8000";
const CURRENCY_SERVICE_URL =
  process.env.CURRENCY_SERVICE_URL || "http://localhost:4006";
const ANALYTICS_SERVICE_URL =
  process.env.ANALYTICS_SERVICE_URL || "http://localhost:4004";
const NOTIFICATION_SERVICE_URL =
  process.env.NOTIFICATION_SERVICE_URL || "http://localhost:4005";

function transactionListQuery(filterColumn: "user_id" | "merchant_id") {
  return `SELECT t.id as transaction_id,
                 t.status,
                 t.transaction_reference,
                 t.original_amount,
                 t.original_currency,
                 t.converted_amount,
                 t.converted_currency,
                 t.payment_method,
                 t.fraud_score,
                 t.fraud_risk_level,
                 t.fraud_decision,
                 t.created_at,
                 t.updated_at,
                 t.completed_at,
                 m.name as merchant_name
          FROM transactions t
          LEFT JOIN merchants m ON m.id = t.merchant_id
          WHERE t.${filterColumn}=$1
          ORDER BY t.created_at DESC
          LIMIT $2 OFFSET $3`;
}
app.post("/create-payment", async (req, res) => {
  const {
    user_id,
    merchant_id,
    amount,
    currency,
    target_currency,
    payment_method,
    transaction_reference
  } = req.body;

  if (!user_id || !merchant_id || !amount || !currency || !payment_method) {
    return res.status(400).json({ message: "Missing required fields: user_id, merchant_id, amount, currency, payment_method" });
  }

  const client = await pool.connect();
  try {
    let convertedAmount: number;
    let rate: number;
    const toCurrency = target_currency ?? currency;
    try {
      const convRes = await axios.get(`${CURRENCY_SERVICE_URL}/convert`, {
        params: { from: currency, to: toCurrency, amount },
        timeout: 5000
      });
      convertedAmount = convRes.data.convertedAmount;
      rate = convRes.data.rate;
    } catch {
      convertedAmount = amount;
      rate = 1;
    }

    const transactionId = uuidv4();
    const result = await client.query(
      `INSERT INTO transactions (
        id, user_id, merchant_id, transaction_reference,
        original_amount, original_currency,
        converted_amount, converted_currency, exchange_rate,
        payment_method, status, created_at, updated_at
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'pending', now(), now()
      ) RETURNING *`,
      [
        transactionId,
        user_id,
        merchant_id,
        transaction_reference ?? null,
        amount,
        currency,
        convertedAmount,
        target_currency ?? currency,
        rate,
        payment_method
      ]
    );

    const txn = result.rows[0];
    const features = {
      amount: Number(txn.original_amount),
      merchant_risk_score: 0.1,
      hour: new Date().getUTCHours(),
      day_of_week: new Date().getUTCDay(),
      user_txn_count_1h: 0,
      user_txn_sum_24h: 0,
      is_cross_border: txn.original_currency !== txn.converted_currency
    };

    let fraud_probability = 0.1;
    let risk_level = "low";
    let recommendation = "approve";
    try {
      const fraudRes = await axios.post(`${FRAUD_SERVICE_URL}/fraud-check`, features, { timeout: 5000 });
      fraud_probability = fraudRes.data.fraud_probability;
      risk_level = fraudRes.data.risk_level;
      recommendation = fraudRes.data.recommendation;
    } catch {
      // Fallback when fraud service unavailable
    }

    let status = "pending";
    if (recommendation === "block") status = "blocked";

    await client.query(
      `UPDATE transactions
       SET fraud_score=$1, fraud_risk_level=$2, fraud_decision=$3, status=$4, updated_at=now()
       WHERE id=$5`,
      [fraud_probability, risk_level, recommendation, status, transactionId]
    );

    const paymentToken = uuidv4();

    if (recommendation === "block" || recommendation === "review") {
      try {
        await axios.post(
          `${NOTIFICATION_SERVICE_URL}/alerts/fraud`,
          { transaction_id: transactionId, risk_level, fraud_score: fraud_probability },
          { timeout: 3000 }
        );
      } catch {
        // Best effort
      }
    }

    return res.json({
      transaction_id: transactionId,
      status,
      converted_amount: txn.converted_amount,
      converted_currency: txn.converted_currency,
      fraud_score: fraud_probability,
      fraud_risk_level: risk_level,
      fraud_decision: recommendation,
      payment_token: paymentToken
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to create payment" });
  } finally {
    client.release();
  }
});

app.post("/confirm-payment", async (req, res) => {
  const { transaction_id } = req.body;
  if (!transaction_id) {
    return res.status(400).json({ message: "transaction_id required" });
  }
  const client = await pool.connect();
  try {
    const txRes = await client.query(
      "SELECT status FROM transactions WHERE id=$1",
      [transaction_id]
    );
    if (!txRes.rowCount) {
      return res.status(404).json({ message: "Transaction not found" });
    }
    const status = txRes.rows[0].status;
    if (status === "blocked") {
      return res.status(400).json({ message: "Transaction blocked" });
    }
    const txnRow = await client.query(
      "SELECT converted_amount, fraud_decision FROM transactions WHERE id=$1",
      [transaction_id]
    );
    await client.query(
      "UPDATE transactions SET status='captured', completed_at=now(), updated_at=now() WHERE id=$1",
      [transaction_id]
    );
    const amount = txnRow.rowCount ? Number(txnRow.rows[0].converted_amount) : 0;
    const isFraud = txnRow.rowCount && txnRow.rows[0].fraud_decision === "block";
    try {
      await axios.post(
        `${ANALYTICS_SERVICE_URL}/events/payment-completed`,
        { amount, isFraud: Boolean(isFraud) },
        { timeout: 3000 }
      );
    } catch {
      // Best effort
    }
    return res.json({
      transaction_id,
      status: "captured",
      message: "Payment successful"
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to confirm payment" });
  } finally {
    client.release();
  }
});

app.get("/transaction-status/:id", async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT t.id as transaction_id,
              t.status,
              t.transaction_reference,
              t.fraud_score,
              t.fraud_risk_level,
              t.fraud_decision,
              t.original_amount,
              t.original_currency,
              t.converted_amount,
              t.converted_currency,
              t.payment_method,
              t.created_at as timestamp,
              t.completed_at,
              m.name as merchant_name
       FROM transactions t
       LEFT JOIN merchants m ON m.id = t.merchant_id
       WHERE t.id=$1`,
      [id]
    );
    if (!result.rowCount) {
      return res.status(404).json({ message: "Transaction not found" });
    }
    return res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to fetch status" });
  } finally {
    client.release();
  }
});

app.get("/user-transactions", async (req, res) => {
  const { user_id, limit = 20, offset = 0 } = req.query;
  if (!user_id) {
    return res.status(400).json({ message: "user_id required" });
  }
  const client = await pool.connect();
  try {
    const result = await client.query(transactionListQuery("user_id"), [
      user_id,
      Number(limit),
      Number(offset)
    ]);
    return res.json(result.rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to fetch transactions" });
  } finally {
    client.release();
  }
});

app.get("/merchant-transactions", async (req, res) => {
  const { merchant_id, limit = 20, offset = 0 } = req.query;
  if (!merchant_id) {
    return res.status(400).json({ message: "merchant_id required" });
  }
  const client = await pool.connect();
  try {
    const result = await client.query(transactionListQuery("merchant_id"), [
      merchant_id,
      Number(limit),
      Number(offset)
    ]);
    return res.json(result.rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to fetch transactions" });
  } finally {
    client.release();
  }
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

const port = process.env.PORT || 4002;
app.listen(port, () => {
  console.log(`Payment service listening on ${port}`);
});

