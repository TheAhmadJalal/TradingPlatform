// ─────────────────────────────────────────────────────────────
// 🔧 Helper Functions (required for the dashboard to work)
// ─────────────────────────────────────────────────────────────
function getEl(id) {
  return document.getElementById(id);
}

function setText(el, text) {
  if (el) el.textContent = text;
}

// Writes a translated string AND tags the element so a later language
// switch re-translates it automatically (only works for keys without vars).
function setI18nText(el, key) {
  if (!el) return;
  el.setAttribute("data-i18n", key);
  el.textContent = tr(key);
}

// Greeting is built from the username, so it can't use a plain data-i18n
// attribute — it is redrawn by the onLangChange hook at the bottom instead.
function renderWelcome() {
  const header = document.querySelector(".dashboard-header h1");
  if (!header) return;
  header.removeAttribute("data-i18n");
  header.textContent = tr("dash.welcomeUser", { name: user.username || "" });
}

function showModal(modal) {
  if (modal) modal.style.display = "flex";
}

function hideModal(modal) {
  if (modal) modal.style.display = "none";
}
// ─────────────────────────────────────────────────────────────
// DASHBOARD DATA FETCH & UI UPDATE
// ─────────────────────────────────────────────────────────────
const token = localStorage.getItem("token");
const user = JSON.parse(localStorage.getItem("user") || "{}");

// 🚨 Safety check before proceeding
if (!token || !user?.id) {
  showAlert(tr("alert.notLoggedIn"));
  window.location.href = "index.html";
  throw new Error("Missing token or user ID");
}

(async () => {
  try {
    const headers = {
      "Authorization": `Bearer ${token}`,
    };

    const [pnlRes, dashRes, tradesRes] = await Promise.all([
      fetch(`${API_URL}/api/trading/closed/${user.id}`, { headers }),
      fetch(`${API_URL}/api/trading/dashboard`, { headers }),
      fetch(`${API_URL}/api/trading/user/${user.id}/trades`, { headers }),
    ]);

    if (!pnlRes.ok || !dashRes.ok || !tradesRes.ok) {
      throw new Error("Failed to load dashboard data");
    }

    const { totalPnl: realisedPnl = 0 } = await pnlRes.json();
    const { balance = 0, accountType = "Standard", bonus = 0, credit = 0 } = await dashRes.json();
    const trades = await tradesRes.json();
    const openTrades = trades.filter(t => t.open);

    let unrealisedPnl = 0;
    let usedMargin = 0;

    // Calculate unrealised PnL & used margin
    await Promise.all(openTrades.map(async trade => {
      try {
        const r = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${trade.instrument.toUpperCase()}`);
        const { price } = await r.json();
        const current = parseFloat(price);
        const diff = trade.type === "buy"
          ? current - trade.entry
          : trade.entry - current;
        const pnl = (diff / trade.entry) * trade.size * trade.leverage;
        unrealisedPnl += pnl;
        usedMargin += trade.size / trade.leverage;
      } catch (err) {
        console.warn("Price fetch failed for one trade", err);
      }
    }));

    const equity = balance + unrealisedPnl;
    const freeMargin = equity - usedMargin;
    const pnlTotal = realisedPnl + unrealisedPnl;
    const totalBalance = balance + bonus + credit;

    // Update UI
    setText(getEl("accountNumber"), user.accountNumber || "N/A");
    setI18nText(getEl("accountStatus"), "dash.statusActive");
    setText(getEl("accountType"), accountType);
    setText(getEl("balance"), `$${balance.toFixed(2)}`);
    setText(getEl("equity"), `$${equity.toFixed(2)}`);
    setText(getEl("usedMargin"), `$${usedMargin.toFixed(2)}`);
    setText(getEl("freeMargin"), `$${freeMargin.toFixed(2)}`);
    setText(getEl("pnlTotal"), `$${pnlTotal.toFixed(2)}`);
    setText(getEl("bonus"), `$${bonus.toFixed(2)}`);
    setText(getEl("credit"), `$${credit.toFixed(2)}`);
    setText(getEl("totalBalance"), `$${totalBalance.toFixed(2)}`);

    renderWelcome();

  } catch (err) {
    console.error("Dashboard load error:", err);
    showAlert(tr("alert.dashboardFailed"));
    window.location.href = "index.html";
  }
})();

// ─────────────────────────────────────────────────────────────
// TRANSACTION HISTORY MODAL
// ─────────────────────────────────────────────────────────────
const transBtn   = getEl("openTransactionsBtn");
const transModal = getEl("transactionModal");
const closeTrans = getEl("closeTransactionModal");
const transList  = getEl("transactionList");

// Last payload from the API — kept so the list can be redrawn in the
// other language without re-fetching.
let lastTxs = null;

// Capitalizes first letter of status
function capitalize(str = "") {
  return typeof str === "string" && str.length
    ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
    : "";
}

// Translated labels, falling back to the raw value for unknown types/statuses
function txTypeLabel(type) {
  const key = `tx.type.${type}`;
  const label = tr(key);
  return label === key ? String(type).toUpperCase() : label;
}

function txStatusLabel(status) {
  const key = `tx.status.${status}`;
  const label = tr(key);
  return label === key ? capitalize(status) : label;
}

function renderTransactions(txs) {
  transList.replaceChildren();

  if (!txs || !txs.length) {
    const none = document.createElement("p");
    setText(none, tr("tx.none"));
    transList.appendChild(none);
    return;
  }

  txs.forEach(tx => {
    const item = document.createElement("div");
    item.className = `transaction-item ${tx.status}`;

    const info = document.createElement("div");
    const date = new Date(tx.date || tx.createdAt).toLocaleDateString(getLang());
    const coin = tx.coin?.toUpperCase() || "";
    const label = txTypeLabel(tx.type);

    if (tx.type === "withdrawal") {
      const requested = tx.withdrawDetails?.requested ?? tx.amount;
      const fee = tx.withdrawDetails?.fee ?? tx.fee ?? 0;
      const net = tx.withdrawDetails?.net ?? tx.net ?? (requested - fee);

      setText(info, tr("tx.withdrawalLine", {
        label,
        requested: requested.toFixed(2),
        fee: fee.toFixed(2),
        net: net.toFixed(2),
        coin,
        date
      }));
    } else {
      setText(info, tr("tx.simpleLine", {
        label,
        amount: parseFloat(tx.amount).toFixed(2),
        coin,
        date
      }));
    }

    item.appendChild(info);

    const status = document.createElement("span");
    status.className = `transaction-status ${tx.status}`;
    setText(status, txStatusLabel(tx.status));
    item.appendChild(status);

    if (tx.status === "pending" && tx.type === "withdrawal") {
      const btn = document.createElement("button");
      btn.className = "cancel-withdraw-btn";
      setText(btn, tr("tx.cancelWithdrawal"));
      btn.dataset.txid = tx._id;
      item.appendChild(btn);
    }

    transList.appendChild(item);
  });
}

transBtn?.addEventListener("click", async () => {
  showModal(transModal);
  transList.replaceChildren();
  const loading = document.createElement("p");
  setText(loading, tr("tx.loading"));
  transList.appendChild(loading);

  try {
    const res = await fetch(`${API_URL}/api/transactions/${user.id}`, {
      headers: {
        "Authorization": `Bearer ${token}`,
      }
    });
    if (!res.ok) throw new Error();
    lastTxs = await res.json();
    renderTransactions(lastTxs);
  } catch (err) {
    console.error("Transaction load error:", err);
    lastTxs = null;
    transList.replaceChildren();
    const error = document.createElement("p");
    setText(error, tr("tx.error"));
    transList.appendChild(error);
  }
});

closeTrans?.addEventListener("click", () => hideModal(transModal));

// Handle withdrawal cancellations
document.addEventListener("click", async (e) => {
  if (!e.target.classList.contains("cancel-withdraw-btn")) return;

  const btn = e.target;
  const txId = btn.dataset.txid;

  const confirmed = await showCancelModal(tr("tx.confirmCancel", { id: txId }));
  if (!confirmed) return;

  try {
    const res = await fetch(`${API_URL}/api/transactions/cancel/${txId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.msg || result.error);

    // Refetch updated user data from backend
    const updated = await fetch(`${API_URL}/api/trading/dashboard`, {
      headers: { "Authorization": `Bearer ${token}` },
    });

    if (updated.ok) {
      const { balance, equity, freeMargin, usedMargin = 0 } = await updated.json();
      user.balance = balance;
      user.equity = equity;
      user.freeMargin = freeMargin;
      user.usedMargin = usedMargin;
      localStorage.setItem("user", JSON.stringify(user));

      setText(getEl("balance"), `$${balance.toFixed(2)}`);
      setText(getEl("equity"), `$${equity.toFixed(2)}`);
      setText(getEl("freeMargin"), `$${freeMargin.toFixed(2)}`);
      setText(getEl("usedMargin"), `$${usedMargin.toFixed(2)}`);
    } else {
      console.warn("Could not refresh equity and margin data");
    }

    // Update UI status
    const row = btn.closest(".transaction-item");
    const span = row.querySelector("span");
    setI18nText(span, "tx.status.canceled");
    span.className = "transaction-status canceled";
    row.classList.replace("pending", "canceled");
    btn.remove();

    showAlert(tr("tx.canceledOk"));
  } catch (err) {
    console.error("Cancel error:", err);
    showAlert("❌ " + (err.msg || err.error || err.message));
  }
});



  // ─────────────────────────────────────────────────────────────
  // DEPOSIT MODAL LOGIC
  // ─────────────────────────────────────────────────────────────
  const openDepBtn  = getEl("openDepositBtn");
  const closeDepBtn = getEl("closeDepositBtn");
  const depModal    = getEl("depositModal");
  const depCoinEl   = getEl("depositCoin");
  const genDepBtn   = getEl("generateDepositBtn");
  const depInfoEl   = getEl("depositInfo");
  const depAddrEl   = getEl("depositAddress");
  const depQREl     = getEl("depositQR");
  const txHashEl    = getEl("transactionHash");
  const verDepBtn   = getEl("verifyDepositBtn");

  const depositAddresses = {
    btc:  "bc1q37zrfdsg3fc2j4y4pdtszp07365ajnwld56ak4",
    // ETH / USDT disabled for now — uncomment together with the matching
    // <option> rows in dashboard.html (deposit modal)
    // eth:  "0x4181005D926fd87FbA5d2C165282B0fD6bCD85cF",
    // usdt: "0x4181005D926fd87FbA5d2C165282B0fD6bCD85cF"
  };

  openDepBtn?.addEventListener("click", () => {
    depInfoEl && (depInfoEl.style.display = "none");
    showModal(depModal);
  });
  closeDepBtn?.addEventListener("click", () => hideModal(depModal));

  // Remembered so the "Address: …" line can be redrawn in the other language
  let lastDepositAddr = null;

  function renderDepositAddress() {
    if (!lastDepositAddr) return;
    setText(depAddrEl, tr("dep.addressLabel", { addr: lastDepositAddr }));
  }

  genDepBtn?.addEventListener("click", () => {
    const coin = depCoinEl.value;
    const addr = depositAddresses[coin];
    lastDepositAddr = addr;
    renderDepositAddress();
    depQREl.replaceChildren();
    new QRCode(depQREl, { text: addr, width: 200, height: 200 });
    depInfoEl.style.display = "block";

    fetch(`${API_URL}/api/transactions/deposit`, {
      method: "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ userId: user.id, coin, amount: 0, address: addr })
    }).catch(err => console.error("Deposit init error:", err));
  });

  txHashEl?.addEventListener("input", () => {
    verDepBtn.disabled = !txHashEl.value.trim();
  });

  verDepBtn?.addEventListener("click", async () => {
    const tx = txHashEl.value.trim();
    if (!tx) return showAlert(tr("dep.enterHash"));

    try {
      const res = await fetch(`${API_URL}/api/transactions/verify`, {
        method: "POST",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: user.id, coin: depCoinEl.value, txHash: tx })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.msg || data.error);

      user.balance = data.newBalance;
      localStorage.setItem("user", JSON.stringify(user));
      showAlert(tr("dep.verified", { amount: data.amount.toFixed(2) }));
    } catch (err) {
      console.error("Verify error:", err);
      showAlert("❌ " + err.message);
    }
  });

// ─────────────────────────────────────────────────────────────
// WITHDRAWAL MODAL LOGIC
// ─────────────────────────────────────────────────────────────
const openWdrBtn  = getEl("openWithdrawBtn");
const closeWdrBtn = getEl("closeWithdrawBtn");
const wdrModal    = getEl("withdrawModal");
const wdrAvailEl  = getEl("withdrawAvailable");
const wdrCoinEl   = getEl("withdrawCoin");
const wdrAmtEl    = getEl("withdrawAmount");
const feeEl       = getEl("feeBreakdown");
const sumEl       = getEl("totalSummary");
const rateEl      = getEl("coinRate");
const convEl      = getEl("convertedCoin");
const wdrAddrEl   = getEl("withdrawAddress");
const subWdrBtn   = getEl("submitWithdrawalBtn");

// ETH / USDT disabled for now — uncomment together with the matching
// <option> rows in dashboard.html (withdraw modal)
let rates = {
  btc: 0,
  // eth: 0,
  // usdt: 1
};

async function fetchRates() {
  try {
    const [btc] = await Promise.all([
      fetch("https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT").then(r => r.json()),
      // fetch("https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT").then(r => r.json())
    ]);
    rates.btc = parseFloat(btc.price);
    // rates.eth = parseFloat(eth.price);
  } catch (err) {
    console.error("Rate fetch error:", err);
    setText(rateEl, tr("wdr.priceError"));
  }
  updateSummary();
}

function updateSummary() {
  const amt = parseFloat(wdrAmtEl.value) || 0;
  const coin = wdrCoinEl.value;
  const r = rates[coin] || 0;
  if (!amt || !r) {
    [feeEl, sumEl, convEl, rateEl].forEach(el => setText(el, "--"));
    return;
  }
  const coinAmt = amt / r;
  const fee = coinAmt * 0.04;
  const net = coinAmt - fee;
  const feeUSD = fee * r;
  const netUSD = amt - feeUSD;

  const COIN = coin.toUpperCase();
  setText(rateEl, tr("wdr.rate",       { coin: COIN, price: r.toFixed(2) }));
  setText(convEl, tr("wdr.receive",    { coin: COIN, amount: net.toFixed(6) }));
  setText(feeEl,  tr("wdr.commission", { coin: COIN, amount: fee.toFixed(6), usd: feeUSD.toFixed(2) }));
  setText(sumEl,  tr("wdr.afterFee",   { coin: COIN, amount: net.toFixed(6), usd: netUSD.toFixed(2) }));
}

// Only meaningful once the modal has been opened at least once
let wdrOpened = false;

function renderAvailable() {
  if (!wdrOpened) return;
  setText(wdrAvailEl, tr("wdr.available", { amount: (user.balance || 0).toFixed(2) }));
}

openWdrBtn?.addEventListener("click", async () => {
  await fetchRates();
  wdrOpened = true;
  renderAvailable();
  showModal(wdrModal);
});

closeWdrBtn?.addEventListener("click", () => {
  hideModal(wdrModal);
  wdrAmtEl.value = "";
  updateSummary();
});

wdrCoinEl?.addEventListener("change", updateSummary);
wdrAmtEl?.addEventListener("input", updateSummary);

[wdrAmtEl, wdrAddrEl].forEach(el =>
  el?.addEventListener("input", () => {
    const amt = parseFloat(wdrAmtEl.value);
    const addr = wdrAddrEl.value.trim();
    subWdrBtn.disabled = !(amt > 0 && addr.length > 5);
  })
);

subWdrBtn?.addEventListener("click", async () => {
  const amount = parseFloat(wdrAmtEl.value);
  const addr   = wdrAddrEl.value.trim();
  const coin   = wdrCoinEl.value;

  if (!amount || !addr) return showAlert(tr("wdr.completeFields"));
  if (amount > (user.balance || 0)) return showAlert(tr("wdr.exceedsBalance"));

  const rate = rates[coin];
  if (!rate) return showAlert(tr("wdr.noRate"));

  const coinAmt = amount / rate;
  const fee = coinAmt * 0.04;
  const net = coinAmt - fee;
  const netUSD = amount - (fee * rate); // ← this is what user receives

  try {
    const res = await fetch(`${API_URL}/api/transactions/withdrawal`, {
      method: "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${token}`,
      },
body: JSON.stringify({
  userId: user.id,
  coin,
  address: addr,
  amount: amount,        // Full withdrawal request ($16.05)
  fee: fee * rate,       // $0.64
  net: netUSD            // What they’ll receive: $15.41
})
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.msg || data.error);

    showAlert(tr("wdr.submitted", { amount: netUSD.toFixed(2) }));

    // ⬅️ Deduct full amount (not just net) from balance
    user.balance -= amount;
    localStorage.setItem("user", JSON.stringify(user));
  } catch (err) {
    console.error("Withdrawal error:", err);
    showAlert("❌ " + err.message);
  }
});
// ─────────────────────────────────────────────────────────────
// 🍔 Mobile Hamburger Toggle
// ─────────────────────────────────────────────────────────────
document.getElementById('menuToggle').addEventListener('click', function () {
  document.getElementById('dropdownMenu').classList.toggle('show');

});


// ==============================
// 💬 Simple Modular Chatbot Brain
// ==============================

const $ = (id) => document.getElementById(id);

const el = {
  icon: $("chatbot-icon"),
  window: $("chatbot-window"),
  prompt: $("chatbot-prompt"),
  close: $("close-chatbot"),
  input: $("chat-input"),
  sendBtn: $("send-chat"),
  messages: $("chat-messages")
};

let currentMenu = "main";
let chatGreeted = false;

// Every menu/answer is an i18n key (see js/i18n.js). An option value is
// either the name of another menu ("main", "deposit", …) or an answer key.
const menus = {
  main: {
    textKey: "chat.main",
    options: {
      "1": "deposit",
      "2": "withdraw",
      "3": "trading",
      "4": "transactions",
      "5": "verification",
      "6": "security",
      "7": "about"
    }
  },

  deposit: {
    textKey: "chat.deposit",
    options: {
      "1": "chat.deposit.a1",
      "2": "chat.deposit.a2",
      "3": "chat.deposit.a3",
      "4": "chat.deposit.a4",
      "5": "main"
    }
  },

  withdraw: {
    textKey: "chat.withdraw",
    options: {
      "1": "chat.withdraw.a1",
      "2": "chat.withdraw.a2",
      "3": "chat.withdraw.a3",
      "4": "chat.withdraw.a4",
      "5": "main"
    }
  },

  trading: {
    textKey: "chat.trading",
    options: {
      "1": "chat.trading.a1",
      "2": "chat.trading.a2",
      "3": "chat.trading.a3",
      "4": "main"
    }
  },

  transactions: {
    textKey: "chat.transactions",
    options: {
      "1": "chat.transactions.a1",
      "2": "chat.transactions.a2",
      "3": "chat.transactions.a3",
      "4": "main"
    }
  },

  verification: {
    textKey: "chat.verification",
    options: {
      "1": "chat.verification.a1",
      "2": "chat.verification.a2",
      "3": "chat.verification.a3",
      "4": "main"
    }
  },

  security: {
    textKey: "chat.security",
    options: {
      "1": "chat.security.a1",
      "2": "chat.security.a2",
      "3": "chat.security.a3",
      "4": "main"
    }
  },

  about: {
    textKey: "chat.about",
    options: {
      "1": "chat.about.a1",
      "2": "chat.about.a2",
      "3": "chat.about.a3",
      "4": "main"
    }
  }
};

function showMessage(text, sender = "bot") {
  const msg = document.createElement("div");
  msg.className = sender === "user" ? "user-msg" : "bot-msg";
  msg.innerHTML = text;
  el.messages.appendChild(msg);
  el.messages.scrollTop = el.messages.scrollHeight;
}

function handleInput() {
  const input = el.input.value.trim();
  if (!input) return;

  showMessage(input, "user");
  el.input.value = "";

  const menu = menus[currentMenu];
  const next = menu.options?.[input];

  if (typeof next === "string" && menus[next]) {
    currentMenu = next;
    setTimeout(() => showMessage(tr(menus[next].textKey)), 300);
  } else if (typeof next === "string") {
    setTimeout(() => showMessage(tr(next)), 300);
  } else {
    showMessage(tr("chat.invalid"));
  }
}

el.sendBtn?.addEventListener("click", handleInput);
el.input?.addEventListener("keypress", (e) => {
  if (e.key === "Enter") handleInput();
});

el.icon?.addEventListener("click", () => {
  el.window.classList.toggle("hidden");
  if (el.prompt) el.prompt.style.display = "none";
  if (!chatGreeted) {
    chatGreeted = true;
    currentMenu = "main";
    showMessage(tr(menus.main.textKey));
  }
});

el.close?.addEventListener("click", () => {
  el.window.classList.add("hidden");
});

window.addEventListener("DOMContentLoaded", () => {
  if (el.prompt) {
    setTimeout(() => {
      el.prompt.style.display = "none";
    }, 10000);
  }
});
//===================================================================================//
//  CUSTOM POPUP ALERT
//==================================================================================//
function showAlert(message) {
  const alertBox = document.getElementById('customAlert');
  const alertMessage = document.getElementById('alertMessage');
  alertMessage.textContent = message;
  alertBox.classList.add('show');
  alertBox.classList.remove('hidden');
}

function closeAlert() {
  const alertBox = document.getElementById('customAlert');
  alertBox.classList.remove('show');
  setTimeout(() => alertBox.classList.add('hidden'), 300); // Let it fade out
  window.location.reload();
}


//===================================================================================//
//  cancel wd popup 
//==================================================================================//
function showCancelModal(message) {
  return new Promise((resolve) => {
    const modal = document.getElementById('cancelModal');
    const msg = document.getElementById('cancelModalMessage');
    const confirmBtn = document.getElementById('cancelModalConfirm');
    const denyBtn = document.getElementById('cancelModalDeny');

    msg.textContent = message;
    modal.classList.add('show');
    modal.classList.remove('hidden');

    // Clean up old listeners
    const confirmClone = confirmBtn.cloneNode(true);
    const denyClone = denyBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(confirmClone, confirmBtn);
    denyBtn.parentNode.replaceChild(denyClone, denyBtn);

    confirmClone.addEventListener('click', () => {
      modal.classList.remove('show');
      modal.classList.add('hidden');
      resolve(true);
    });

    denyClone.addEventListener('click', () => {
      modal.classList.remove('show');
      modal.classList.add('hidden');
      resolve(false);
    });
  });
}


//===================================================================================//
//  LANGUAGE SWITCH — redraw everything this file builds in JS
//  (plain data-i18n elements are handled by js/i18n.js itself)
//==================================================================================//
onLangChange(() => {
  renderWelcome();
  if (lastTxs) renderTransactions(lastTxs);
  renderDepositAddress();
  renderAvailable();
  if (wdrOpened) updateSummary();
});
