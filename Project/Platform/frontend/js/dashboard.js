// ─────────────────────────────────────────────────────────────
// 🔧 Helper Functions (required for the dashboard to work)
// ─────────────────────────────────────────────────────────────
function getEl(id) {
  return document.getElementById(id);
}

function setText(el, text) {
  if (el) el.textContent = text;
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
  showAlert("⚠️ You are not logged in or user data is missing.");
  window.location.href = "index.html";
  throw new Error("Missing token or user ID");
}

(async () => {
  try {
    const headers = {
      "Authorization": `Bearer ${token}`,
    };

    const [pnlRes, dashRes, tradesRes] = await Promise.all([
      fetch(`http://45.225.135.194/api/trading/closed/${user.id}`, { headers }),
      fetch('http://45.225.135.194/api/trading/dashboard', { headers }),
      fetch(`http://45.225.135.194/api/trading/user/${user.id}/trades`, { headers }),
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
    setText(getEl("accountStatus"), "Active");
    setText(getEl("accountType"), accountType);
    setText(getEl("balance"), `$${balance.toFixed(2)}`);
    setText(getEl("equity"), `$${equity.toFixed(2)}`);
    setText(getEl("usedMargin"), `$${usedMargin.toFixed(2)}`);
    setText(getEl("freeMargin"), `$${freeMargin.toFixed(2)}`);
    setText(getEl("pnlTotal"), `$${pnlTotal.toFixed(2)}`);
    setText(getEl("bonus"), `$${bonus.toFixed(2)}`);
    setText(getEl("credit"), `$${credit.toFixed(2)}`);
    setText(getEl("totalBalance"), `$${totalBalance.toFixed(2)}`);

    const header = document.querySelector(".dashboard-header h1");
    if (header) {
      header.textContent = ` Welcome, ${user.username || ""}`;
    }

  } catch (err) {
    console.error("Dashboard load error:", err);
    showAlert("❌ Could not load dashboard. Redirecting to login.");
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

// Capitalizes first letter of status
function capitalize(str = "") {
  return typeof str === "string" && str.length
    ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
    : "";
}

transBtn?.addEventListener("click", async () => {
  showModal(transModal);
  transList.replaceChildren();
  const loading = document.createElement("p");
  setText(loading, "Loading transactions...");
  transList.appendChild(loading);

  try {
    const res = await fetch(`http://45.225.135.194/api/transactions/${user.id}`, {
      headers: {
        "Authorization": `Bearer ${token}`,
      }
    });
    if (!res.ok) throw new Error();
    const txs = await res.json();
    transList.replaceChildren();

    if (!txs.length) {
      const none = document.createElement("p");
      setText(none, "No transactions found.");
      transList.appendChild(none);
    } else {
      txs.forEach(tx => {
        const item = document.createElement("div");
        item.className = `transaction-item ${tx.status}`;

        const info = document.createElement("div");
        const date = new Date(tx.date || tx.createdAt).toLocaleDateString();
        const coin = tx.coin?.toUpperCase() || "";

        if (tx.type === "withdrawal") {
          const requested = tx.withdrawDetails?.requested ?? tx.amount;
          const fee = tx.withdrawDetails?.fee ?? tx.fee ?? 0;
          const net = tx.withdrawDetails?.net ?? tx.net ?? (requested - fee);

          setText(info,
            `WITHDRAWAL | Requested: $${requested.toFixed(2)} | Fee: $${fee.toFixed(2)} | Net: $${net.toFixed(2)} ${coin} — ${date}`);
        } else {
          setText(info,
            `${tx.type.toUpperCase()} | $${parseFloat(tx.amount).toFixed(2)} ${coin} — ${date}`);
        }

        item.appendChild(info);

        const status = document.createElement("span");
        status.className = `transaction-status ${tx.status}`;
        setText(status, capitalize(tx.status));
        item.appendChild(status);

        if (tx.status === "pending" && tx.type === "withdrawal") {
          const btn = document.createElement("button");
          btn.className = "cancel-withdraw-btn";
          setText(btn, "Cancel Withdrawal");
          btn.dataset.txid = tx._id;
          item.appendChild(btn);
        }

        transList.appendChild(item);
      });
    }
  } catch (err) {
    console.error("Transaction load error:", err);
    transList.replaceChildren();
    const error = document.createElement("p");
    setText(error, "Error loading transactions.");
    transList.appendChild(error);
  }
});

closeTrans?.addEventListener("click", () => hideModal(transModal));

// Handle withdrawal cancellations
document.addEventListener("click", async (e) => {
  if (!e.target.classList.contains("cancel-withdraw-btn")) return;

  const btn = e.target;
  const txId = btn.dataset.txid;

  const confirmed = await showCancelModal(`Cancel withdrawal request ID ${txId}?`);
  if (!confirmed) return;

  try {
    const res = await fetch(`http://45.225.135.194/api/transactions/cancel/${txId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.msg || result.error);

    // Refetch updated user data from backend
    const updated = await fetch(`http://45.225.135.194/api/trading/dashboard`, {
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
    setText(span, "Canceled");
    span.className = "transaction-status canceled";
    row.classList.replace("pending", "canceled");
    btn.remove();

    showAlert("✅ Withdrawal canceled and refunded.");
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
    eth:  "0x4181005D926fd87FbA5d2C165282B0fD6bCD85cF",
    usdt: "0x4181005D926fd87FbA5d2C165282B0fD6bCD85cF"
  };

  openDepBtn?.addEventListener("click", () => {
    depInfoEl && (depInfoEl.style.display = "none");
    showModal(depModal);
  });
  closeDepBtn?.addEventListener("click", () => hideModal(depModal));

  genDepBtn?.addEventListener("click", () => {
    const coin = depCoinEl.value;
    const addr = depositAddresses[coin];
    setText(depAddrEl, `Address: ${addr}`);
    depQREl.replaceChildren();
    new QRCode(depQREl, { text: addr, width: 200, height: 200 });
    depInfoEl.style.display = "block";

    fetch("http://45.225.135.194/api/transactions/deposit", {
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
    if (!tx) return showAlert("Enter a transaction hash.");

    try {
      const res = await fetch("http://45.225.135.194/api/transactions/verify", {
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
      showAlert(`✅ Deposit verified! $${data.amount.toFixed(2)} credited.`);
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

let rates = { btc: 0, eth: 0, usdt: 1 };

async function fetchRates() {
  try {
    const [btc, eth] = await Promise.all([
      fetch("https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT").then(r => r.json()),
      fetch("https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT").then(r => r.json())
    ]);
    rates.btc = parseFloat(btc.price);
    rates.eth = parseFloat(eth.price);
  } catch (err) {
    console.error("Rate fetch error:", err);
    setText(rateEl, "Price per coin: error");
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

  setText(rateEl, `1 ${coin.toUpperCase()} = $${r.toFixed(2)}`);
  setText(convEl, `You receive: ${net.toFixed(6)} ${coin.toUpperCase()}`);
  setText(feeEl, `Commission 4%: ${fee.toFixed(6)} ${coin.toUpperCase()} (~$${feeUSD.toFixed(2)})`);
  setText(sumEl, `After fee: ${net.toFixed(6)} ${coin.toUpperCase()} (~$${netUSD.toFixed(2)})`);
}

openWdrBtn?.addEventListener("click", async () => {
  await fetchRates();
  setText(wdrAvailEl, `Available: $${(user.balance || 0).toFixed(2)}`);
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

  if (!amount || !addr) return showAlert("Complete all fields.");
  if (amount > (user.balance || 0)) return showAlert("Amount exceeds balance.");

  const rate = rates[coin];
  if (!rate) return showAlert("Exchange rate not available.");

  const coinAmt = amount / rate;
  const fee = coinAmt * 0.04;
  const net = coinAmt - fee;
  const netUSD = amount - (fee * rate); // ← this is what user receives

  try {
    const res = await fetch("http://45.225.135.194/api/transactions/withdrawal", {
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

    showAlert(`✅ Withdrawal submitted! You will receive $${netUSD.toFixed(2)}.`);

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

const menus = {
  main: {
    text: `👋 Welcome to the chat help desk!<br>Please enter the number of what you want to know more about:<br><br>
1) Deposit<br>2) Withdraw<br>3) Trading and trades history<br>4) Transaction History<br>5) Verification<br>6) Security<br>7) About the company`,
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
    text: `💰 Deposit Help:<br><br>
1) How to deposit<br>2) Why I don't see my deposit<br>3) How long does it take<br>4) Where does my deposit go<br>5) Back`,
    options: {
      "1": "💡 To deposit: Dashboard → Deposit → Choose coin → Send → Add TXID → Done.",
      "2": "🕵️ Check the TXID. If it's on-chain but not showing, contact support@helpdesk.com.",
      "3": "⏱️ Deposits usually take 10–60 mins, depending on the network.",
      "4": "📥 It goes into cold wallet for bigger security.",
      "5": "main"
    }
  },

  withdraw: {
    text: `💸 Withdraw Help:<br><br>
1) How to withdraw<br>2) Pending withdrawal<br>3) Canceled withdrawal<br>4) Withdrawal fees<br>5) Back`,
    options: {
      "1": "💸 Dashboard → Withdraw → Choose coin → Paste address → Confirm → Wait.",
      "2": "⏳ Could be security checks or blockchain delay for more information contact support@helpdesk.com",
      "3": "🚫 Usually invalid info or flagged.",
      "4": "📉 Flat 4% fee on withdrawal.",
      "5": "main"
    }
  },

  trading: {
    text: `📈 Trading Help:<br><br>
1) How to trade<br>2) See trade history<br>3) What is CFD<br>4) Back`,
    options: {
      "1": "🧪 Deposit → Set size/leverage → Click Buy/Sell.",
      "2": "📜 Dashboard → Trading tab → Scroll down.",
      "3": "🌀 CFD stands for Contract for Difference, which = financial derivative.",
      "4": "main"
    }
  },

  transactions: {
    text: `📜 Transaction Help:<br><br>
1) How to view<br>2) Canceled transaction<br>3) Fees<br>4) Back`,
    options: {
      "1": "🔍 Dashboard → Transaction History = all your activity.",
      "2": "🚫 Security or network errors.",
      "3": "💸 Deposits: network only. Withdrawals: 4%. No hidden fees.",
      "4": "main"
    }
  },

  verification: {
    text: `🧾 Verification Help:<br><br>
1) How to verify<br>2) Student account meaning<br>3) Account types<br>4) Back`,
    options: {
      "1": "📤 Upload ID + proof of address in Profile → Scrol down to Verification.",
      "2": "🎓 Student = Minimum investment of 250 USDT. Limited access.",
      "3": "🆚 Standard = basic. Premium = fancy tools and bragging rights for more info contact finance@desk.com.",
      "4": "main"
    }
  },

  security: {
    text: `🔐 Security Help:<br><br>
1) Change password<br>2) Change email<br>3) Protect my funds<br>4) Back`,
    options: {
      "1": "🔑 Profile → Change Password.",
      "2": "📧 Profile → Change Email.",
      "3": "🛡️ Funds held in secure off network vaults.",
      "4": "main"
    }
  },

  about: {
    text: `🏢 Company Info:<br><br>
1) Where are you located?<br>2) Are you regulated?<br>3) Data privacy<br>4) Back`,
    options: {
      "1": "📍 We're registered in The United Kingdon.",
      "2": "✅ AML/KYC compliant.",
      "3": "🔒 GDPR compliant. Your data is encrypted.",
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
    setTimeout(() => showMessage(menus[next].text), 300);
  } else if (typeof next === "string") {
    setTimeout(() => showMessage(next), 300);
  } else {
    const intentReply = getResponse(input);
    if (intentReply.includes("🤖 Sorry")) {
      showMessage("🤖 Invalid option. Try again or use keywords.");
    } else {
      showMessage(intentReply);
    }
  }
}

el.sendBtn?.addEventListener("click", handleInput);
el.input?.addEventListener("keypress", (e) => {
  if (e.key === "Enter") handleInput();
});

el.icon?.addEventListener("click", () => {
  el.window.classList.toggle("hidden");
  if (el.prompt) el.prompt.style.display = "none";
  if (!el.messages.innerHTML.includes("Welcome")) {
    currentMenu = "main";
    showMessage(menus.main.text);
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
