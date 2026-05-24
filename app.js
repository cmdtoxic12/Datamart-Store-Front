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
  return await res.json();
}

function showPage(id) {
  document.querySelectorAll(".page").forEach(page => {
    page.classList.remove("active");
  });

  document.getElementById(id).classList.add("active");

  if (id === "orders") loadOrders();
  if (id === "products") loadProducts();
  if (id === "wallet") loadBalance();
  if (id === "customers") loadCustomers();
}

async function loadDashboard() {
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
}

let ordersChart;

async function loadAnalytics() {

  const data = await api("orders");

  const orders =
    data.data?.orders ||
    data.data ||
    [];

  const completed =
    orders.filter(o => o.status === "completed").length;

  const pending =
    orders.filter(o => o.status === "pending").length;

  const failed =
    orders.filter(o => o.status === "failed").length;

  const refunded =
    orders.filter(o => o.status === "refunded").length;

  const ctx =
    document.getElementById("ordersChart");

  if (ordersChart) {
    ordersChart.destroy();
  }

  ordersChart = new Chart(ctx, {
    type: "doughnut",

    data: {
      labels: [
        "Completed",
        "Pending",
        "Failed",
        "Refunded"
      ],

      datasets: [{
        data: [
          completed,
          pending,
          failed,
          refunded
        ],

        backgroundColor: [
          "#22c55e",
          "#eab308",
          "#ef4444",
          "#3b82f6"
        ],

        borderWidth: 0
      }]
    },

    options: {
      responsive: true,

      plugins: {
        legend: {
          labels: {
            color: "white"
          }
        }
      }
    }
  });
}

async function loadBalance() {
  const data = await api("balance");
  const wallet = data.data || {};

  document.getElementById("depositBalance").textContent =
    `${wallet.deposit?.currency || "GHS"} ${wallet.deposit?.balance || 0}`;

  document.getElementById("availableEarnings").textContent =
    `${wallet.earnings?.currency || "GHS"} ${wallet.earnings?.availableBalance || 0}`;

  document.getElementById("pendingBalance").textContent =
    `${wallet.earnings?.currency || "GHS"} ${wallet.earnings?.pendingBalance || 0}`;
}

async function loadOrders() {
  const status = document.getElementById("orderStatus")?.value || "";
  const data = await api("orders", { status });

  const orders = data.data?.orders || data.data || data.orders || [];

  const tbody = document.getElementById("ordersTable");
  tbody.innerHTML = "";

  orders.forEach(order => {
    tbody.innerHTML += `
      <tr>
        <td>${order.reference || order.id || "N/A"}</td>
        <td>${order.phoneNumber || "N/A"}</td>
        <td>${order.network || "N/A"}</td>
        <td>${order.capacity || "N/A"}GB</td>
        <td>GHS ${order.price || 0}</td>
        <td>${order.status || "N/A"}</td>
      </tr>
    `;
  });
}

async function loadProducts() {
  const data = await api("products");
  const products = data.data || data.products || [];

  const grid = document.getElementById("productsGrid");
  grid.innerHTML = "";

  products.forEach(product => {
    grid.innerHTML += `
      <div class="card">
        <h3>${product.name || product.network || "Product"}</h3>
        <p>${product.capacity || ""}GB</p>
        <small>GHS ${product.price || product.amount || "N/A"}</small>
      </div>
    `;
  });
}

async function loadCustomers() {
  const q = document.getElementById("customerSearch")?.value || "";
  const data = await api("customers", { q });

  const customers = data.data?.customers || data.data || data.customers || [];

  const tbody = document.getElementById("customersTable");
  tbody.innerHTML = "";

  customers.forEach(customer => {
    tbody.innerHTML += `
      <tr>
        <td>${customer.name || "N/A"}</td>
        <td>${customer.phone || customer.phoneNumber || "N/A"}</td>
        <td>${customer.email || "N/A"}</td>
      </tr>
    `;
  });
}

async function trackOrder() {

  const reference =
    document.getElementById("trackReference")
    .value
    .trim();

  if (!reference) {
    alert("Enter order reference");
    return;
  }

  const response = await api("order", { reference });

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
        <span class="badge ${statusClass}">
          ${order.status}
        </span>
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
          <p>${new Date(order.placedAt).toLocaleString()}</p>
        </div>

        <div>
          <small>Completed At</small>
          <p>
            ${
              order.completedAt
                ? new Date(order.completedAt).toLocaleString()
                : "Pending"
            }
          </p>
        </div>

        <button onclick='downloadReceipt(${JSON.stringify(order)})'>
  Download Receipt
</button>

      </div>

    </div>
  `;
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
Payment: ${order.paymentStatus}

Placed At: ${new Date(order.placedAt).toLocaleString()}
Completed At: ${
    order.completedAt
      ? new Date(order.completedAt).toLocaleString()
      : "Pending"
  }

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

    if (ordersPage.classList.contains("active")) {
      loadOrders();
    }
  }, 10000);
}

startLiveOrders();


async function refreshAll() {
  await loadDashboard();
  await loadBalance();
  await loadAnalytics();
}

refreshAll();
  
