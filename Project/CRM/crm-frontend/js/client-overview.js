document.addEventListener("DOMContentLoaded", () => {
  // DARK MODE TOGGLE
  const darkButton = document.getElementById("darkModeButton");
  if (darkButton) {
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
  }

  // PARSE ACCOUNT NUMBER FROM URL
  const queryParams = new URLSearchParams(window.location.search);
  let acc = queryParams.get("acc");
  if (!acc) {
    alert("No account number provided in URL.");
    return;
  }

  // DEFINE STATE VARIABLES
  let clientList = [];
  let currentIndex = -1;
  let clientId = null;

  // FETCH ALL CLIENT ACCOUNTS FOR NEXT/PREV NAVIGATION
  async function fetchAllClients() {
    const res = await fetch(`${API_URL}/api/clients`);
    const data = await res.json();
    clientList = data.map(c => c.accountNumber);
    currentIndex = clientList.findIndex(id => id === acc);
  }

  // LOAD INDIVIDUAL CLIENT DATA
async function loadClient() {
  const res = await fetch(`${API_URL}/api/clients/${acc}`);
  const client = await res.json();
  clientId = client._id;
  currentClient = client; // ✅ Store client globally so status dropdown can use it
  renderClient(client);
}


  // RENDER CLIENT DATA TO DOM
  function renderClient(client) {
    const setText = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    // Populate basic info fields
    setText("clientName", client.username || "-");
    document.getElementById("accountNumber").value = client.accountNumber || "";
    setText("firstName", client.firstName || "-");
    setText("lastName", client.lastName || "-");
    setText("email", client.email || "-");
    setText("phone", client.phone || "-");
    setText("country", client.country || "-");

    // Financial stats
    setText("balance", `$${parseFloat(client.balance || 0).toFixed(2)}`);
    setText("equity", `$${parseFloat(client.equity || 0).toFixed(2)}`);
    setText("usedMargin", `$${parseFloat(client.usedMargin || 0).toFixed(2)}`);
    setText("freeMargin", `$${parseFloat(client.freeMargin || 0).toFixed(2)}`);
    setText("pnlTotal", `$${parseFloat(client.pnlTotal || 0).toFixed(2)}`);

    // Other info
    setText("status", client.status || "New");
    setText("accountType", client.accountType || "-");
    setText("password", "********");
    setText("documentsCount", Array.isArray(client.documents) ? client.documents.length : 0);
    setText("transactions", client.transactions || 0);
    setText("openedTrades", client.openedTrades || 0);
    setText("closedTrades", client.closedTrades || 0);
    setText("metaAccountNumber", client.accountNumber || "-");
    setText("metaCreatedAt", new Date(client.createdAt).toLocaleString() || "-");

    // Clear comment input and load history
    const commentInput = document.getElementById("clientComment");
    if (commentInput) commentInput.value = "";

    renderComments(client.comments || []);
  }

  // RENDER COMMENT HISTORY
  function renderComments(comments) {
    const history = document.getElementById("commentHistory");
    if (!history) return;
    history.innerHTML = "";
    comments.slice().reverse().forEach((entry) => {
      const div = document.createElement("div");
      div.className = "comment-entry";
      const time = new Date(entry.timestamp || entry.createdAt || Date.now()).toLocaleString();
      div.textContent = `${time} — ${entry.text}`;
      history.appendChild(div);
    });
  }

  // SAVE COMMENT BUTTON ACTION
  const saveButton = document.getElementById("saveCommentButton");
  if (saveButton) {
    saveButton.addEventListener("click", async () => {
      const comment = document.getElementById("clientComment")?.value.trim();
      if (!comment) return alert("Comment cannot be empty");
      const res = await fetch(`${API_URL}/api/clients/${acc}/comment`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment })
      });
      const updatedComments = await res.json();
      document.getElementById("clientComment").value = "";
      renderComments(updatedComments);
    });
  }

  // LOAD TRADE COUNTS (open/closed)
  async function loadTradeCounts() {
    const res = await fetch(`${API_URL}/api/clients/${acc}/trade-counts`);
    const data = await res.json();
    document.getElementById("openedTrades").textContent = data.openedTrades || 0;
    document.getElementById("closedTrades").textContent = data.closedTrades || 0;
  }

  // LOAD TRANSACTION COUNT
  async function loadTransactionCount() {
    const res = await fetch(`${API_URL}/api/clients/${acc}/transaction-count`);
    const data = await res.json();
    document.getElementById("transactions").textContent = data.transactionCount || 0;
  }

  // NAVIGATE TO NEXT CLIENT
  document.getElementById("nextClient")?.addEventListener("click", () => {
    if (clientList.length === 0) return;
    currentIndex = (currentIndex + 1) % clientList.length;
    acc = clientList[currentIndex];
    window.location.href = `client-overview.html?acc=${acc}`;
  });

  // NAVIGATE TO PREVIOUS CLIENT
  document.getElementById("prevClient")?.addEventListener("click", () => {
    if (clientList.length === 0) return;
    currentIndex = (currentIndex - 1 + clientList.length) % clientList.length;
    acc = clientList[currentIndex];
    window.location.href = `client-overview.html?acc=${acc}`;
  });

  // INITIALIZE FULL CLIENT VIEW
  async function loadEverything() {
    await fetchAllClients();
    await loadClient();
    await loadTradeCounts();
    await loadTransactionCount();
  }

  loadEverything();

  // OPEN TRADE MODAL
  document.getElementById("addTradeBtn")?.addEventListener("click", () => {
    openModal();
  });

  // TRADE MODAL ELEMENTS
  const tradeModal = document.getElementById("tradeModal");
  const saveTradeBtn = document.getElementById("saveTradeBtn");
  const cancelModalBtn = document.getElementById("cancelModalBtn");
  const instrumentInput = document.getElementById("instrumentInput");
  const typeInput = document.getElementById("typeInput");
  const sizeInput = document.getElementById("sizeInput");
  const entryInput = document.getElementById("entryInput");
  const closeInput = document.getElementById("closeInput");
  const leverageInput = document.getElementById("leverageInput");
  const pnlInput = document.getElementById("pnlInput");
  const btcHint = document.getElementById("btcAmountHint");

  // FETCH MARKET PRICE FOR INSTRUMENT
  async function fetchMarketPrice(symbol = "BTCUSDT") {
    try {
      const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`);
      const data = await response.json();
      return parseFloat(data.price);
    } catch (err) {
      console.error("Error fetching market price:", err);
      return 0;
    }
  }

  // LOAD LIST OF TRADABLE INSTRUMENTS
  async function populateInstruments() {
    try {
      const res = await fetch("https://api.binance.com/api/v3/ticker/price");
      const data = await res.json();
      const usdtPairs = data.filter(item => item.symbol.endsWith("USDT") && !item.symbol.includes("DOWN") && !item.symbol.includes("UP")).slice(0, 100);
      instrumentInput.innerHTML = "";
      usdtPairs.forEach(({ symbol }) => {
        const opt = document.createElement("option");
        opt.value = symbol;
        opt.textContent = symbol;
        instrumentInput.appendChild(opt);
      });
    } catch (err) {
      console.error("Error loading instrument list:", err);
    }
  }

  // OPEN TRADE MODAL WITH DEFAULTS
  async function openModal() {
    typeInput.value = "buy";
    leverageInput.value = 1;
    sizeInput.value = 1000;
    await populateInstruments();
    instrumentInput.value = "BTCUSDT";
    const currentPrice = await fetchMarketPrice("BTCUSDT");
    entryInput.value = currentPrice;
    closeInput.value = currentPrice;
    updatePNL();
    tradeModal.style.display = "flex";
  }

  // CALCULATE PNL BASED ON USER INPUT
  function updatePNL() {
    const entry = parseFloat(entryInput.value);
    const close = parseFloat(closeInput.value);
    const usdSize = parseFloat(sizeInput.value);
    const leverage = Math.max(1, parseFloat(leverageInput.value) || 1);
    const direction = typeInput.value === "buy" ? 1 : -1;
    if (isNaN(entry) || isNaN(close) || isNaN(usdSize)) return;
    const sizeBTC = usdSize / entry;
    const pnl = (close - entry) * sizeBTC * leverage * direction;
    pnlInput.value = pnl.toFixed(2);
    const symbol = instrumentInput.value.replace("USDT", "");
    btcHint.textContent = `≈ ${sizeBTC.toFixed(6)} ${symbol}`;
  }

  // REVERSE CALCULATE ENTRY FROM GIVEN PNL
  function updateEntryFromPNL() {
    const pnl = parseFloat(pnlInput.value);
    const close = parseFloat(closeInput.value);
    const usdSize = parseFloat(sizeInput.value);
    const leverage = Math.max(1, parseFloat(leverageInput.value) || 1);
    const direction = typeInput.value === "buy" ? 1 : -1;
    if (isNaN(pnl) || isNaN(close) || isNaN(usdSize)) return;
    const sizeBTC = usdSize / close;
    const entry = close - (pnl / (sizeBTC * leverage)) * direction;
    entryInput.value = entry.toFixed(2);
  }

  // BIND INPUT EVENTS FOR TRADE FORM
  instrumentInput.addEventListener("change", async () => {
    const symbol = instrumentInput.value;
    const price = await fetchMarketPrice(symbol);
    entryInput.value = price;
    closeInput.value = price;
    updatePNL();
  });
  entryInput.addEventListener("input", updatePNL);
  closeInput.addEventListener("input", updatePNL);
  sizeInput.addEventListener("input", updatePNL);
  typeInput.addEventListener("change", () => {
    updatePNL();
    updateEntryFromPNL();
  });
  pnlInput.addEventListener("input", updateEntryFromPNL);
  leverageInput.addEventListener("input", () => {
    if (parseFloat(leverageInput.value) < 1) leverageInput.value = 1;
    updatePNL();
  });
  cancelModalBtn.onclick = () => tradeModal.style.display = "none";

  // SAVE TRADE TO SERVER
  saveTradeBtn.onclick = async () => {
    const entry = parseFloat(entryInput.value);
    const usdSize = parseFloat(sizeInput.value);
    const sizeBTC = usdSize / entry;
    const mockTrade = {
      userId: clientId,
      instrument: instrumentInput.value,
      type: typeInput.value,
      size: sizeBTC,
      entry: entry,
      close: parseFloat(closeInput.value),
      leverage: parseFloat(leverageInput.value),
      open: false,
      pnl: parseFloat(pnlInput.value),
      closeTime: new Date()
    };
    try {
      const res = await fetch(`${API_URL}/api/trades`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mockTrade)
      });
      if (!res.ok) throw new Error("Failed to submit trade");
      alert(`Mock ${mockTrade.type} trade created.`);
      tradeModal.style.display = "none";
      location.reload();
    } catch (err) {
      console.error(err);
      alert("Error submitting trade");
    }
  };

  // TRANSACTION MODAL CONTROLS
 // TRANSACTION MODAL CONTROLS
const transactionModal = document.getElementById("transactionModal");
const cancelTransactionBtn = document.getElementById("cancelTransactionBtn");

document.getElementById("addTransactionBtn")?.addEventListener("click", () => {
  transactionModal.style.display = "flex";
});

cancelTransactionBtn?.addEventListener("click", () => {
  transactionModal.style.display = "none";
});

// SUBMIT TRANSACTION FORM
document.getElementById("transactionForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;

  const data = {
    userId: clientId,
    type: form.type.value.toLowerCase(),
    amount: parseFloat(form.amount.value),
    coin: form.coin.value.toLowerCase(),
    status: form.status.value.toLowerCase(),
    date: form.date.value ? new Date(form.date.value) : undefined
  };

  console.log("Submitting data:", data);

  try {
    // 1. Save transaction to CRM backend only if type is NOT bonus or credit
    if (data.type !== "bonus" && data.type !== "credit") {
      const res = await fetch(`${API_URL}/api/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Transaction failed");
    }

    // 2. If type is bonus or credit and status is successful, update platform financials only (which will internally create the transaction)
    if ((data.type === "bonus" || data.type === "credit") && data.status === "successful") {
      await fetch(`${API_URL}/api/clients/update-financials`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: data.userId,
          [data.type]: data.amount
        }),
      });
    }

    alert("Transaction saved successfully.");
    transactionModal.style.display = "none";
    location.reload();
  } catch (err) {
    console.error(err);
    alert("Failed to save transaction.");
  }
});


  //VIEW DOCUMENTS
  document.getElementById("viewDocumentsBtn")?.addEventListener("click", async () => {
  const modal = document.getElementById("documentsModal");
  const list = document.getElementById("documentsListPopup");
  list.innerHTML = "Loading...";

  try {
    const res = await fetch(`${API_URL}/api/clients/${acc}/documents`);
    const data = await res.json();
    list.innerHTML = "";

    if (data.length === 0) {
      list.innerHTML = "<p>No documents uploaded.</p>";
    } else {
     renderDocuments(data);
    }
  } catch (err) {
    console.error("Failed to load documents", err);
    list.innerHTML = "<p>Error loading documents.</p>";
  }

  modal.style.display = "flex";

});

document.getElementById("closeDocumentsModal")?.addEventListener("click", () => {
  document.getElementById("documentsModal").style.display = "none";
});
function renderDocuments(documents) {
  const container = document.getElementById("documentsListPopup");
  container.innerHTML = "";

  if (!Array.isArray(documents) || documents.length === 0) {
    container.textContent = "No documents available.";
    return;
  }

  documents.forEach((doc, index) => {
    const filename = doc.filename || `Document_${index + 1}`;
    const base64 = doc.base64;
    const contentType = doc.contentType || "application/pdf";

    if (!base64) return;

    const wrapper = document.createElement("div");
    wrapper.style.marginBottom = "2rem";

    const title = document.createElement("strong");
    title.textContent = filename;
    wrapper.appendChild(title);

    const viewer = document.createElement("iframe");
    viewer.src = `data:${contentType};base64,${base64}`;
    viewer.style.width = "100%";
    viewer.style.height = "500px";
    viewer.style.border = "1px solid #ccc";
    wrapper.appendChild(viewer);

    container.appendChild(wrapper);
  });
}
// ========= EDIT CLIENT FIELDS =========
const modal = document.getElementById("editModal");
const input = document.getElementById("editInput");
const dropdown = document.getElementById("statusDropdown");
const label = document.getElementById("editLabel");
const saveEdit = document.getElementById("saveEdit");
const closeModal = modal.querySelector(".close");

let currentField = "";
let currentClient = null; // ✅ Declare this so status dropdown can access updated values

document.querySelectorAll(".edit-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    currentField = btn.dataset.field;
    label.textContent = `Edit ${currentField.charAt(0).toUpperCase() + currentField.slice(1)}`;
    input.style.display = "none";
    dropdown.style.display = "none";

    if (currentField === "status") {
      dropdown.style.display = "block";
      if (currentClient) {
        dropdown.value = currentClient.status || "New";
      } else {
        dropdown.value = "New";
      }
    } else {
      input.style.display = "block";
      input.type = currentField === "password" ? "password" : "text";
      input.value = currentField === "password"
        ? ""
        : document.getElementById(currentField)?.textContent.trim() || "";
    }

    modal.style.display = "flex";
  });
});

closeModal.addEventListener("click", () => {
  modal.style.display = "none";
});

saveEdit.addEventListener("click", async () => {
  const newValue = currentField === "status" ? dropdown.value : input.value.trim();
  if (!newValue) return alert("Value cannot be empty.");

  const body = {};
  body[currentField] = newValue;

  try {
    const res = await fetch(`${API_URL}/api/clients/${acc}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error("Update failed");
    alert("Field updated successfully.");
    modal.style.display = "none";
    await loadClient(); // Ensure latest values are reflected and assigned to currentClient
  } catch (err) {
    console.error("Failed to update client field:", err);
    alert("Failed to update. Check console for details.");
  }
});
document.getElementById("viewTransactionsBtn")?.addEventListener("click", async () => {
  const modal = document.getElementById("transactionsModal");
  const list = document.getElementById("transactionsList");
  list.innerHTML = "Loading...";

  try {
    const res = await fetch(`${API_URL}/api/transactions/user/${clientId}`);
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      list.innerHTML = "<p>No transactions found for this client.</p>";
    } else {
      list.innerHTML = "";
      data.forEach(tx => {
        const div = document.createElement("div");
        div.className = "transaction-entry";
        div.innerHTML = `
          <p><strong>Type:</strong> ${tx.type}</p>
          <p><strong>Coin:</strong> ${tx.coin}</p>
          <p><strong>Amount:</strong> ${tx.amount}</p>
          <p><strong>Status:</strong> ${tx.status}</p>
          <p><strong>Date:</strong> ${new Date(tx.date).toLocaleString()}</p>
          <hr/>
        `;
        list.appendChild(div);
      });
    }
  } catch (err) {
    console.error("Failed to fetch transactions:", err);
    list.innerHTML = "<p>Error loading transactions.</p>";
  }

  modal.style.display = "flex";
});

document.getElementById("closeTransactionsModal")?.addEventListener("click", () => {
  document.getElementById("transactionsModal").style.display = "none";
});
//VIEW TRADES MODULE 
// Open the modal and load trades
document.getElementById("viewTradesBtn").addEventListener("click", async () => {
  const modal = document.getElementById("tradesModal");
  modal.style.display = "flex";

  const userId = "68667374f1c41fc404523f03"; // 🔁 Replace with dynamic user ID if needed
  await loadTradesForUser(userId);
});

// Close the modal
document.getElementById("closeTradesModal").addEventListener("click", () => {
  document.getElementById("tradesModal").style.display = "none";
});

// Close modal on outside click
window.addEventListener("click", (e) => {
  const modal = document.getElementById("tradesModal");
  if (e.target === modal) {
    modal.style.display = "none";
  }
});

// Load trades function
async function loadTradesForUser(userId) {
  const container = document.getElementById("tradesList");
  container.innerHTML = "<p>Loading trades...</p>";

  try {
    const res = await fetch(`${API_URL}/api/trades/user/${clientId}`);
    if (!res.ok) throw new Error("Failed to fetch trades");

    const trades = await res.json();
    if (!Array.isArray(trades) || trades.length === 0) {
      container.innerHTML = "<p>No trades found.</p>";
      return;
    }

    container.innerHTML = "";
    trades.forEach(trade => {
      const div = document.createElement("div");
      div.className = "trade-card";
      div.innerHTML = `
        <p><strong>Instrument:</strong> ${trade.instrument}</p>
        <p><strong>Type:</strong> ${trade.type}</p>
        <p><strong>Size:</strong> ${trade.size}</p>
        <p><strong>Entry:</strong> ${trade.entry}</p>
        <p><strong>Close:</strong> ${trade.close}</p>
        <p><strong>Leverage:</strong> ${trade.leverage}x</p>
        <p><strong>Status:</strong> ${trade.open ? "Open" : "Closed"}</p>
        <p><strong>PNL:</strong> ${typeof trade.pnl === "number" ? trade.pnl.toFixed(2) : "-"}</p>
        <p><strong>Created:</strong> ${new Date(trade.createdAt).toLocaleString()}</p>
        <hr />
      `;
      container.appendChild(div);
    });

  } catch (err) {
    console.error("❌ Error loading trades:", err);
    container.innerHTML = "<p>Error loading trades.</p>";
  }
}
});
