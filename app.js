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
  const reference = document.getElementById("trackReference").value.trim();

  if (!reference) {
    alert("Enter order reference");
    return;
  }

  const data = await api("order", { reference });

  document.getElementById("trackResult").textContent =
    JSON.stringify(data, null, 2);
}

document.getElementById("orderForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const body = {
    phoneNumber: document.getElementById("phoneNumber").value.trim(),
    network: document.getElementById("network").value,
    capacity: Number(document.getElementById("capacity").value),
  };

  const data = await api("place-order", {}, "POST", body);

  document.getElementById("placeOrderResult").textContent =
    JSON.stringify(data, null, 2);
});

async function refreshAll() {
  await loadDashboard();
  await loadBalance();
}

refreshAll();