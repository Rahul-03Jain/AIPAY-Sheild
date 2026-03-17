import type { NextApiRequest, NextApiResponse } from "next";
import http from "http";

const BACKEND_HOST = "127.0.0.1";
const BACKEND_PORT = 8080;

function proxyPost(path: string, body: object): Promise<{ status: number; data: object }> {
  return new Promise((resolve, reject) => {
    const bodyStr = JSON.stringify(body);
    const req = http.request(
      {
        hostname: BACKEND_HOST,
        port: BACKEND_PORT,
        path,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(bodyStr),
        },
        timeout: 15000,
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => { data += chunk; });
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode || 500, data: data ? JSON.parse(data) : {} });
          } catch {
            resolve({ status: res.statusCode || 500, data: {} });
          }
        });
      }
    );
    req.on("error", reject);
    req.on("timeout", () => { req.destroy(); reject(new Error("timeout")); });
    req.write(bodyStr);
    req.end();
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }
  const body = req.body && typeof req.body === "object" ? req.body : {};
  try {
    const { status, data } = await proxyPost("/auth/register", body);
    res.status(status).json(data);
  } catch (err) {
    console.error("Register proxy error:", err);
    res.status(502).json({
      message:
        "Cannot reach the server. Start the backend (API Gateway + Auth + Postgres) and try again.",
    });
  }
}
