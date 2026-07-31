document.addEventListener("DOMContentLoaded", () => {
  const darkButton = document.getElementById("darkModeButton");
  const prefersDark = localStorage.getItem("crm-dark-mode") === "true";

  if (prefersDark) {
    document.body.classList.add("dark-mode");
    darkButton.textContent = "Disable Dark Mode";
  }

  darkButton.addEventListener("click", () => {
    const isDark = document.body.classList.toggle("dark-mode");
    darkButton.textContent = isDark ? "Disable Dark Mode" : "Enable Dark Mode";
    localStorage.setItem("crm-dark-mode", isDark);
  });

  const tbody = document.getElementById("clientsTableBody");
  let clients = [];

  async function loadClients() {
    try {
      const res = await fetch(`${API_URL}/crm-api/clients`);
      clients = await res.json();
      renderClients(clients);
    } catch (error) {
      console.error("Failed to load clients", error);
    }
  }

  function getLastCommentDate(comments) {
    if (!Array.isArray(comments) || comments.length === 0) return "—";
    const latest = comments.reduce((a, b) =>
      new Date(a.createdAt) > new Date(b.createdAt) ? a : b
    );
    return new Date(latest.createdAt).toLocaleDateString();
  }

  function getLastDate(comments) {
    if (!Array.isArray(comments) || comments.length === 0) return "1970-01-01";
    return comments.reduce((a, b) =>
      new Date(a.createdAt) > new Date(b.createdAt) ? a : b
    ).createdAt;
  }

  function renderClients(list) {
    tbody.innerHTML = "";
    list.forEach(client => {
      const createdAtDate = client.createdAt
        ? new Date(client.createdAt).toLocaleDateString()
        : "—";

      const row = document.createElement("tr");
      row.innerHTML = `
        <td><button class="open-btn" data-acc="${client.accountNumber}">OPEN</button></td>
        <td>${client.accountNumber || "-"}</td>
        <td>${client.firstName || "-"}</td>
        <td>${client.lastName || "-"}</td>
        <td>${client.email || "-"}</td>
        <td>${client.phone || "-"}</td>
        <td>${client.country || "-"}</td>
        <td>$${parseFloat(client.balance || 0).toFixed(2)}</td>
        <td>${client.status || "New"}</td>
        <td>${getLastCommentDate(client.comments)}</td>
        <td>${createdAtDate}</td>
      `;

      const openBtn = row.querySelector(".open-btn");
      openBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const acc = e.target.getAttribute("data-acc");
        window.location.href = `client-overview.html?acc=${acc}`;
      });

      tbody.appendChild(row);
    });
  }

  function sortClients(value) {
    const sorted = [...clients].sort((a, b) => {
      switch (value) {
        case "balance":
          return (parseFloat(b.balance) || 0) - (parseFloat(a.balance) || 0);
        case "country":
          return (a.country || "").localeCompare(b.country || "");
        case "status":
          return (a.status || "").localeCompare(b.status || "");
        case "lastComment":
          const lastA = new Date(getLastDate(a.comments));
          const lastB = new Date(getLastDate(b.comments));
          return lastB - lastA;
        case "createdAt":
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        default:
          return 0;
      }
    });

    renderClients(sorted);
  }

  document.getElementById("clientSearch").addEventListener("input", (e) => {
    const keyword = e.target.value.toLowerCase();
    const filtered = clients.filter(c =>
      c.firstName?.toLowerCase().includes(keyword) ||
      c.lastName?.toLowerCase().includes(keyword) ||
      c.email?.toLowerCase().includes(keyword) ||
      c.phone?.toLowerCase().includes(keyword) ||
      c.accountNumber?.toLowerCase().includes(keyword)
    );
    renderClients(filtered);
  });

  const dropdownTrigger = document.getElementById("sortTrigger");
  const dropdownOptions = document.getElementById("sortOptions");

  dropdownTrigger.addEventListener("click", () => {
    dropdownOptions.style.display =
      dropdownOptions.style.display === "block" ? "none" : "block";
  });

  dropdownOptions.querySelectorAll("li").forEach((option) => {
    option.addEventListener("click", () => {
      dropdownTrigger.textContent = option.textContent;
      dropdownOptions.style.display = "none";

      const value = option.getAttribute("data-value");
      sortClients(value);
    });
  });

  document.addEventListener("click", (e) => {
    if (!dropdownTrigger.contains(e.target) && !dropdownOptions.contains(e.target)) {
      dropdownOptions.style.display = "none";
    }
  });

  loadClients();
});


