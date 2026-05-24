const BASE_URL = process.env.STORE_API_BASE;
const API_KEY = process.env.STORE_API_KEY;

module.exports = async function handler(req, res) {
  try {
    if (!BASE_URL || !API_KEY) {
      return res.status(500).json({
        status: "error",
        message: "Missing environment variables",
      });
    }

    const { action, reference, phone } = req.query;

    let endpoint = "";
    let method = "GET";
    let body = null;

    if (action === "store") endpoint = "/store";

    if (action === "balance") endpoint = "/wallet/balance";

    if (action === "transactions") {
      const page = req.query.page || 1;
      const limit = req.query.limit || 20;
      endpoint = `/wallet/transactions?page=${page}&limit=${limit}`;
    }

    if (action === "products") endpoint = "/products";

    if (action === "orders") {
      const status = req.query.status || "";
      const page = req.query.page || 1;
      const limit = req.query.limit || 50;

      endpoint = `/orders?page=${page}&limit=${limit}`;

      if (status) endpoint += `&status=${status}`;
    }

    setInterval(() => {
  const ordersPage = document.getElementById("orders");

  if (ordersPage && ordersPage.classList.contains("active")) {
    loadOrders();
  }
}, 10000);

    if (action === "order") {
      endpoint = `/orders/${reference}`;
    }

    if (action === "customers") {
      const q = req.query.q || "";
      endpoint = `/customers?limit=50&q=${encodeURIComponent(q)}`;
    }

    if (action === "customer") {
      endpoint = `/customers/${phone}`;
    }

    if (action === "place-order") {
      method = "POST";
      endpoint = "/orders";
      body = req.body;
    }

    if (!endpoint) {
      return res.status(400).json({
        status: "error",
        message: "Invalid action",
      });
    }

    const headers = {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    };

    if (method === "POST") {
      headers["X-Idempotency-Key"] = crypto.randomUUID();
    }

    const response = await fetch(BASE_URL + endpoint, {
      method,
      headers,
      body: body ? JSON.stringify(body) : null,
    });

    const data = await response.json();

    return res.status(response.status).json(data);
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};
