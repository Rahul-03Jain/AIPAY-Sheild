import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(helmet());
app.use(morgan("combined"));
app.use(
  cors({
    origin: "*"
  })
);

// Simple in-memory FX rates for demo; in production you would persist and refresh from an external API.
const baseRates: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.8,
  INR: 83,
  JPY: 150
};

function getUsdRate(currency: string): number | null {
  return baseRates[currency.toUpperCase()] ?? null;
}

app.get("/convert", (req, res) => {
  const from = String(req.query.from || "").toUpperCase();
  const to = String(req.query.to || "").toUpperCase();
  const amount = Number(req.query.amount || 0);

  if (!from || !to || !amount || amount <= 0) {
    return res.status(400).json({ message: "Invalid params" });
  }

  const fromRate = getUsdRate(from);
  const toRate = getUsdRate(to);
  if (!fromRate || !toRate) {
    return res.status(400).json({ message: "Unsupported currency" });
  }

  const amountInUsd = amount / fromRate;
  const convertedAmount = amountInUsd * toRate;
  const rate = convertedAmount / amount;

  return res.json({
    from,
    to,
    amount,
    convertedAmount,
    rate
  });
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

const port = process.env.PORT || 4006;
app.listen(port, () => {
  console.log(`Currency service listening on ${port}`);
});

