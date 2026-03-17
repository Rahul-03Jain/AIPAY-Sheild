import type { NextApiRequest, NextApiResponse } from "next";
import http from "http";

const BACKEND_HOST = "127.0.0.1";
const BACKEND_PORT = 8080;

function proxyRequest(
  path: string,
  method: string,
  body: object | undefined,
  authHeader: string | undefined
): Promise<{ status: number; data: object }> {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : "";
    const headers: Record<string, string> = {};
    if (bodyStr) {
      headers["Content-Type"] = "application/json";
      headers["Content-Length"] = String(Buffer.byteLength(bodyStr));
    }
    if (authHeader) headers["Authorization"] = authHeader;
    const req = http.request(
      {
        hostname: BACKEND_HOST,
        port: BACKEND_PORT,
        path: "/" + path.replace(/^\//, ""),
        method: method || "GET",
        headers,
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
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const path = (req.query.path as string[])?.join("/") || "";
  const method = (req.method || "GET").toUpperCase();
  const body = method !== "GET" && req.body && typeof req.body === "object" ? req.body : undefined;
  const authHeader = req.headers.authorization as string | undefined;
  try {
    const queryIndex = req.url?.indexOf("?") ?? -1;
    const queryString = queryIndex >= 0 ? req.url?.slice(queryIndex) ?? "" : "";
    const forwardedPath = `/${path.replace(/^\//, "")}${queryString}`;
    const { status, data } = await proxyRequest(forwardedPath, method, body, authHeader);
    res.status(status).json(data);
  } catch (err) {
    console.error("Backend proxy error:", err);
    res.status(502).json({ message: "Cannot reach the server." });
  }
}
