
// Enable basic dark mode toggle on page load
document.addEventListener("DOMContentLoaded", async () => {
  const darkButton = document.getElementById("darkModeButton");
  if (darkButton) {
    const prefersDark = localStorage.getItem("crm-dark-mode") === "true";
    if (prefersDark) {
      document.body.classList.add("dark-mode");
      darkButton.textContent = "Disable Dark Mode";
    }

    darkButton.addEventListener("click", () => {
      const isDark = document.body.classList.toggle("dark-mode");
      localStorage.setItem("crm-dark-mode", isDark);
      darkButton.textContent = isDark ? "Disable Dark Mode" : "Enable Dark Mode";
    });
  }

  const tableBody = document.getElementById("transactionsTableBody");
  const searchInput = document.getElementById("transactionSearch");
  let allTransactions = [];

  const loadTransactions = async () => {
    try {
      const res = await fetch("http://localhost:5001/api/transactions");
      const data = await res.json();
      allTransactions = Array.isArray(data) ? data : [];
      renderTransactions(allTransactions);
    } catch (err) {
      console.error("Failed to load transactions", err);
      tableBody.innerHTML = "<tr><td colspan='7'>Error loading transactions.</td></tr>";
    }
  };

  const renderTransactions = (list) => {
    tableBody.innerHTML = "";

    if (list.length === 0) {
      tableBody.innerHTML = "<tr><td colspan='7'>No transactions found.</td></tr>";
      return;
    }

    list.forEach(tx => {
      const row = document.createElement("tr");
      const username = tx.userId?.username || "N/A";
      const accNum = tx.userId?.accountNumber || "N/A";
      const formattedDate = tx.date ? new Date(tx.date).toLocaleString() : "N/A";
      const isWithdrawal = tx.type?.toLowerCase() === "withdrawal";
      const isPending = tx.status?.toLowerCase() === "pending";

      const detailLabel = isWithdrawal ? "Address" : "Hash";
      const detailValue = isWithdrawal ? (tx.address || "N/A") : (tx.txHash || "N/A");

      const actionButtons = isWithdrawal && isPending
        ? `<div class="action-buttons" data-id="${tx._id}">
            <button class="approve-btn">Approve</button>
            <button class="cancel-btn">Cancel</button>
           </div>`
        : "";

      row.innerHTML = `
        <td>${tx.type}</td>
        <td>${accNum}</td>
        <td>${username}</td>
        <td>${(tx.coin || tx.currency || "-").toUpperCase()}</td>
        <td>${tx.amount ? parseFloat(tx.amount).toFixed(2) : "0.00"}</td>
        <td class="status-cell">${tx.status}</td>
        <td>
          <div><strong>${detailLabel}:</strong> <code style="font-size: 0.8em;">${detailValue}</code></div>
          <div><strong>Date:</strong> ${formattedDate}</div>
          ${actionButtons}
        </td>
      `;

      tableBody.appendChild(row);
    });
  };

  tableBody.addEventListener("click", async (e) => {
    if (e.target.classList.contains("approve-btn") || e.target.classList.contains("cancel-btn")) {
      const btn = e.target;
      const action = btn.classList.contains("approve-btn") ? "approve" : "cancel";
      const wrapper = btn.closest(".action-buttons");
      const id = wrapper.dataset.id;

      try {
        const res = await fetch(`http://localhost:5001/api/transactions/${id}/${action}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          }
        });
        const result = await res.json();

        if (result.success) {
          alert(`${action === "approve" ? "approved" : "canceled"} successfully.`);
          await loadTransactions(); // Refresh list
        } else {
          alert(result.message || "action failed");
        }
      } catch (err) {
        console.error(`Error during ${action}:`, err);
        alert("Request failed. Try again.");
      }
    }
  });

  searchInput.addEventListener("input", () => {
    const query = searchInput.value.toLowerCase();
    const filtered = allTransactions.filter(tx =>
      tx.userId?.username?.toLowerCase().includes(query) ||
      tx.userId?.accountNumber?.toLowerCase().includes(query) ||
      tx.type?.toLowerCase().includes(query) ||
      (tx.coin || tx.currency || "").toLowerCase().includes(query) ||
      tx.status?.toLowerCase().includes(query) ||
      tx.txHash?.toLowerCase().includes(query)
    );
    renderTransactions(filtered);
  });

  await loadTransactions();
});
