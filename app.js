async function api(action, params = {}, method = "GET", body = null) {
  const query = new URLSearchParams({ action, ...params });

  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(`/api/datamart?${query.toString()}`, options);
  const text = await res.text();

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(
      res.status === 404
        ? "API route not found (404). Redeploy with api/datamart.js + vercel.json, and set env vars."
        : `API returned non-JSON (HTTP ${res.status}): ${text.slice(0, 120)}`
    );
  }

  if (!res.ok && data?.status !== "success") {
    // still return body so callers can read message
  }

  return data;
}

function showLoader() {
  const loader = document.getElementById("loader");
  if (loader) loader.classList.add("active");
}

function hideLoader() {
  const loader = document.getElementById("loader");
  if (loader) loader.classList.remove("active");
}

function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.getElementById("toastBox").appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

function setActiveNav(id) {
  document.querySelectorAll(".sidebar button, .mobile-nav button").forEach((btn) => {
    btn.classList.remove("active");
  });

  document.querySelectorAll(`[onclick="showPage('${id}')"]`).forEach((btn) => {
    btn.classList.add("active");
  });
}

function showPage(id) {
  document.querySelectorAll(".page").forEach((page) => {
    page.classList.remove("active");
  });

  const page = document.getElementById(id);
  if (page) page.classList.add("active");

  setActiveNav(id);

  if (id === "orders") loadOrders();
  if (id === "products") loadProducts();
  if (id === "wallet") loadBalance();
  if (id === "customers") loadCustomers();
}

function updateDeliveryProgress(orders) {
  if (!orders || !orders.length) return;

  const completed = orders.find((o) => o.status === "completed");
  const pending = orders.find((o) => o.status === "pending");

  document.getElementById("lastDelivered").textContent = completed
    ? `✅ Last delivered: ${completed.reference || completed.id} — ${completed.capacity || ""}GB to ${completed.phoneNumber || "N/A"}`
    : "✅ Last delivered: None yet";

  document.getElementById("checkingNow").textContent = pending
    ? `🔄 Checking now: ${pending.reference || pending.id} — placed at ${pending.placedAt ? new Date(pending.placedAt).toLocaleTimeString() : "recently"}`
    : "🔄 Checking now: No pending order";

  document.getElementById("lastChecked").textContent =
    `Last checked: ${new Date().toLocaleTimeString()}`;
}

async function loadDashboard() {
  try {
    const data = await api("store");
    const store = data.data || {};

    document.getElementById("totalOrders").textContent =
      store.metrics?.totalOrders || 0;

    document.getElementById("totalRevenue").textContent =
      "GHS " + (store.metrics?.totalRevenue || 0);

    document.getElementById("totalCustomers").textContent =
      store.metrics?.totalCustomers || 0;

    document.getElementById("storeStatus").textContent =
      store.status || "Unknown";
  } catch (err) {
    console.error("loadDashboard:", err);
  }
}

let ordersChart;

async function loadAnalytics() {
  try {
    const data = await api("orders");

    const orders =
      data.data?.orders ||
      data.data?.items ||
      data.data?.results ||
      data.orders ||
      data.items ||
      data.results ||
      [];

    const completed = orders.filter((o) => o.status === "completed").length;
    const pending = orders.filter((o) => o.status === "pending").length;
    const failed = orders.filter((o) => o.status === "failed").length;
    const refunded = orders.filter((o) => o.status === "refunded").length;

    const ctx = document.getElementById("ordersChart");
    if (!ctx) return;

    if (ordersChart) ordersChart.destroy();

    ordersChart = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: ["Completed", "Pending", "Failed", "Refunded"],
        datasets: [
          {
            data: [completed, pending, failed, refunded],
            backgroundColor: ["#22c55e", "#eab308", "#ef4444", "#3b82f6"],
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: "white", padding: 16 },
          },
        },
      },
    });
  } catch (err) {
    console.error("loadAnalytics:", err);
  }
}

async function loadBalance() {
  try {
    const data = await api("balance");
    const wallet = data.data || {};

    document.getElementById("depositBalance").textContent =
      `${wallet.deposit?.currency || "GHS"} ${wallet.deposit?.balance || 0}`;

    document.getElementById("availableEarnings").textContent =
      `${wallet.earnings?.currency || "GHS"} ${wallet.earnings?.availableBalance || 0}`;

    document.getElementById("pendingBalance").textContent =
      `${wallet.earnings?.currency || "GHS"} ${wallet.earnings?.pendingBalance || 0}`;
  } catch (err) {
    console.error("loadBalance:", err);
  }
}

async function loadOrders() {
  try {
    const status = document.getElementById("orderStatus")?.value || "";
    const data = await api("orders", { status });

    const orders = data.data?.orders || data.data || data.orders || [];

    updateDeliveryProgress(orders);

    const tbody = document.getElementById("ordersTable");
    if (!tbody) return;
    tbody.innerHTML = "";

    orders.forEach((order) => {
      tbody.innerHTML += `
        <tr>
          <td>${order.reference || order.id || "N/A"}</td>
          <td>${order.phoneNumber || "N/A"}</td>
          <td>${order.network || "N/A"}</td>
          <td>${order.capacity || "N/A"}GB</td>
          <td>GHS ${order.price || 0}</td>
          <td><span class="badge ${order.status === "completed" ? "success" : order.status === "pending" ? "pending" : "failed"}">${order.status || "N/A"}</span></td>
        </tr>
      `;
    });
  } catch (err) {
    console.error("loadOrders:", err);
  }
}

async function loadProducts() {
  try {
    const data = await api("products");
    const products = data.data || data.products || [];

    const grid = document.getElementById("productsGrid");
    if (!grid) return;
    grid.innerHTML = "";

    products.forEach((product) => {
      grid.innerHTML += `
        <div class="card">
          <h3>${product.name || product.network || "Product"}</h3>
          <p>${product.capacity || ""}GB</p>
          <small>GHS ${product.price || product.amount || "N/A"}</small>
        </div>
      `;
    });
  } catch (err) {
    console.error("loadProducts:", err);
  }
}

async function loadCustomers() {
  try {
    const q = document.getElementById("customerSearch")?.value || "";
    const data = await api("customers", { q });

    const customers = data.data?.customers || data.data || data.customers || [];

    const tbody = document.getElementById("customersTable");
    if (!tbody) return;
    tbody.innerHTML = "";

    customers.forEach((customer) => {
      tbody.innerHTML += `
        <tr>
          <td>${customer.name || "N/A"}</td>
          <td>${customer.phone || customer.phoneNumber || "N/A"}</td>
          <td>${customer.email || "N/A"}</td>
        </tr>
      `;
    });
  } catch (err) {
    console.error("loadCustomers:", err);
  }
}

async function trackOrder() {
  const reference = document.getElementById("trackReference").value.trim();

  if (!reference) {
    showToast("Enter order reference", "error");
    return;
  }

  try {
    showLoader();
    const response = await api("order", { reference });
    hideLoader();

    const order = response.data;
    const result = document.getElementById("trackResult");

    if (!order) {
      result.innerHTML = `
        <div class="card">
          <h3>Order Not Found</h3>
        </div>
      `;
      return;
    }

    const statusClass =
      order.status === "completed"
        ? "success"
        : order.status === "pending"
          ? "pending"
          : "failed";

    result.innerHTML = `
      <div class="track-card">
        <div class="track-header">
          <h2>Order Details</h2>
          <span class="badge ${statusClass}">${order.status}</span>
        </div>
        <div class="track-grid">
          <div>
            <small>Reference</small>
            <p>${order.reference}</p>
          </div>
          <div>
            <small>Phone Number</small>
            <p>${order.phoneNumber}</p>
          </div>
          <div>
            <small>Network</small>
            <p>${order.network}</p>
          </div>
          <div>
            <small>Bundle</small>
            <p>${order.capacity} GB</p>
          </div>
          <div>
            <small>Price</small>
            <p>GHS ${order.price}</p>
          </div>
          <div>
            <small>Placed At</small>
            <p>${order.placedAt ? new Date(order.placedAt).toLocaleString() : "N/A"}</p>
          </div>
          <div>
            <small>Completed At</small>
            <p>${order.completedAt ? new Date(order.completedAt).toLocaleString() : "Pending"}</p>
          </div>
        </div>
        <button class="receipt-btn" onclick='downloadReceipt(${JSON.stringify(order)})'>
          Download Receipt
        </button>
      </div>
    `;
  } catch (err) {
    hideLoader();
    console.error(err);
    showToast("Failed to track order", "error");
  }
}

function downloadReceipt(order) {
  const receipt = `
C-LICON DATA BANK
========================

ORDER RECEIPT

Reference: ${order.reference}
Phone: ${order.phoneNumber}
Network: ${order.network}
Bundle: ${order.capacity} GB
Price: GHS ${order.price}
Status: ${order.status}
Payment: ${order.paymentStatus || "N/A"}

Placed At: ${order.placedAt ? new Date(order.placedAt).toLocaleString() : "N/A"}
Completed At: ${order.completedAt ? new Date(order.completedAt).toLocaleString() : "Pending"}

Thank you for using C-LICON DATA BANK.
`;

  const blob = new Blob([receipt], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${order.reference}-receipt.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

let liveOrdersInterval = null;

function startLiveOrders() {
  if (liveOrdersInterval) clearInterval(liveOrdersInterval);

  liveOrdersInterval = setInterval(() => {
    const ordersPage = document.getElementById("orders");
    if (ordersPage && ordersPage.classList.contains("active")) {
      loadOrders();
    }
  }, 10000);
}

async function refreshAll() {
  showLoader();
  try {
    await Promise.all([
      loadDashboard(),
      loadBalance(),
      loadOrders(),
      loadAnalytics(),
    ]);
  } finally {
    hideLoader();
  }
}

document.getElementById("orderForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  try {
    showLoader();

    const body = {
      phoneNumber: document.getElementById("phoneNumber").value.trim(),
      network: document.getElementById("network").value,
      capacity: Number(document.getElementById("capacity").value),
    };

    const data = await api("place-order", {}, "POST", body);
    hideLoader();

    if (data.status === "success") {
      showToast("Order placed successfully ✅", "success");

      document.getElementById("placeOrderResult").innerHTML = `
        <div class="track-card">
          <h2>Order Successful</h2>
          <div class="track-grid">
            <div>
              <small>Reference</small>
              <p>${data.data.order.reference}</p>
            </div>
            <div>
              <small>Phone</small>
              <p>${data.data.order.phoneNumber}</p>
            </div>
            <div>
              <small>Network</small>
              <p>${data.data.order.network}</p>
            </div>
            <div>
              <small>Bundle</small>
              <p>${data.data.order.capacity} GB</p>
            </div>
            <div>
              <small>Price</small>
              <p>GHS ${data.data.order.price}</p>
            </div>
            <div>
              <small>Status</small>
              <p>${data.data.order.status}</p>
            </div>
          </div>
        </div>
      `;

      document.getElementById("orderForm").reset();
      refreshAll();
    } else {
      showToast(data.message || "Order failed", "error");
    }
  } catch (error) {
    hideLoader();
    console.error(error);
    showToast("Failed to place order", "error");
  }
});

// Init
startLiveOrders();
setActiveNav("dashboard");
refreshAll();
