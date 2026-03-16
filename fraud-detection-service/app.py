from fastapi import FastAPI
from pydantic import BaseModel
import joblib
import numpy as np
import os


class FraudCheckRequest(BaseModel):
  amount: float
  merchant_risk_score: float
  hour: int
  day_of_week: int
  user_txn_count_1h: int
  user_txn_sum_24h: float
  is_cross_border: bool


class FraudCheckResponse(BaseModel):
  fraud_probability: float
  risk_level: str
  recommendation: str


app = FastAPI(title="Fraud Detection Service")

MODEL_PATH = os.getenv("MODEL_PATH", "models/fraud_model.pkl")

if os.path.exists(MODEL_PATH):
  model = joblib.load(MODEL_PATH)
else:
  model = None


def risk_bucket(p: float) -> str:
  if p < 0.2:
    return "low"
  if p < 0.5:
    return "medium"
  if p < 0.8:
    return "high"
  return "critical"


def recommendation_from_prob(p: float) -> str:
  if p < 0.5:
    return "approve"
  if p < 0.8:
    return "review"
  return "block"


@app.post("/fraud-check", response_model=FraudCheckResponse)
def fraud_check(req: FraudCheckRequest):
  if model is None:
    p = 0.1
  else:
    x = np.array(
      [
        [
          req.amount,
          req.merchant_risk_score,
          req.hour,
          req.day_of_week,
          req.user_txn_count_1h,
          req.user_txn_sum_24h,
          int(req.is_cross_border),
        ]
      ]
    )
    p = float(model.predict_proba(x)[0, 1])

  level = risk_bucket(p)
  rec = recommendation_from_prob(p)
  return FraudCheckResponse(
    fraud_probability=p, risk_level=level, recommendation=rec
  )


@app.get("/health")
def health():
  return {"status": "ok"}

