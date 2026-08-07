const crypto = require("crypto");

const BASE_URL = process.env.STORE_API_BASE;
const API_KEY = process.env.STORE_API_KEY;

module.exports = async function handler(req, res) {
  // CORS preflight (optional, same-origin usually)
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(204).end();
  }

  try {
    if (!BASE_URL || !API_KEY) {
      return res.status(500).json({
        status: "error",
        message:
          "Missing environment variables. Set STORE_API_BASE and STORE_API_KEY in Vercel Project Settings → Environment Variables.",
      });
    }

    const { action, reference, phone } = req.query || {};

    let endpoint = "";
    let method = "GET";
    let body = null;

    if (action === "store") endpoint = "/store";
    else if (action === "balance") endpoint = "/wallet/balance";
    else if (action === "transactions") {
      const page = req.query.page || 1;
      const limit = req.query.limit || 20;
      endpoint = `/wallet/transactions?page=${page}&limit=${limit}`;
    } else if (action === "products") endpoint = "/products";
    else if (action === "orders") {
      const status = req.query.status || "";
      const page = req.query.page || 1;
      const limit = req.query.limit || 50;
      endpoint = `/orders?page=${page}&limit=${limit}`;
      if (status) endpoint += `&status=${encodeURIComponent(status)}`;
    } else if (action === "order") {
      if (!reference) {
        return res.status(400).json({ status: "error", message: "reference is required" });
      }
      endpoint = `/orders/${encodeURIComponent(reference)}`;
    } else if (action === "customers") {
      const q = req.query.q || "";
      endpoint = `/customers?limit=50&q=${encodeURIComponent(q)}`;
    } else if (action === "customer") {
      if (!phone) {
        return res.status(400).json({ status: "error", message: "phone is required" });
      }
      endpoint = `/customers/${encodeURIComponent(phone)}`;
    } else if (action === "place-order") {
      method = "POST";
      endpoint = "/orders";
      body = req.body;
    } else {
      return res.status(400).json({
        status: "error",
        message: "Invalid or missing action",
      });
    }

    const headers = {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    if (method === "POST") {
      headers["X-Idempotency-Key"] = crypto.randomUUID();
    }

    const upstream = await fetch(BASE_URL.replace(/\/$/, "") + endpoint, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const text = await upstream.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return res.status(upstream.status || 502).json({
        status: "error",
        message: "Upstream returned non-JSON",
        detail: text.slice(0, 300),
      });
    }

    return res.status(upstream.status).json(data);
  } catch (error) {
    console.error("datamart proxy error:", error);
    return res.status(500).json({
      status: "error",
      message: error.message || "Internal server error",
    });
  }
};
