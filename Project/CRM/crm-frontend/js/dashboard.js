document.addEventListener("DOMContentLoaded", async () => {
  // ✅ Load total client count
  try {
    const res = await fetch(`${API_URL}/crm-api/clients/count`);
    const data = await res.json();
    document.getElementById("clientsCount").textContent = data.count || 0;
  } catch (err) {
    console.error("Error fetching client count:", err);
    document.getElementById("clientsCount").textContent = "N/A";
  }

  // ✅ Load total deposits and withdrawals
  try {
    const res = await fetch(`${API_URL}/crm-api/transactions/summary`);
    const data = await res.json();
    document.getElementById("depositsTotal").textContent = `$${parseFloat(data.totalDeposits).toFixed(2)}`;
    document.getElementById("withdrawalsTotal").textContent = `$${parseFloat(data.totalWithdrawals).toFixed(2)}`;
  } catch (err) {
    console.error("Error fetching transaction summary:", err);
    document.getElementById("depositsTotal").textContent = "N/A";
    document.getElementById("withdrawalsTotal").textContent = "N/A";
  }

  // 🌙 Dark Mode toggle
  const button = document.getElementById("darkModeButton");
  const prefersDark = localStorage.getItem("crm-dark-mode") === "true";

  if (prefersDark) {
    document.body.classList.add("dark-mode");
    button.textContent = "Disable Dark Mode";
  }

  button.addEventListener("click", () => {
    const isDark = document.body.classList.toggle("dark-mode");
    button.textContent = isDark ? "Disable Dark Mode" : "Enable Dark Mode";
    localStorage.setItem("crm-dark-mode", isDark);
  });
});

