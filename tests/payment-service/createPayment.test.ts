import request from "supertest";
import app from "../../../payment-service/src/index";

describe("Payment Service - create-payment", () => {
  it("rejects missing fields", async () => {
    const res = await request(app).post("/create-payment").send({});
    expect(res.status).toBe(400);
  });
});

