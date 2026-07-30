document.addEventListener('DOMContentLoaded', () => {
  // ELEMENT SELECTORS
  const loginBtn = document.getElementById('loginBtn');
  const registerBtn = document.getElementById('registerBtn');
  const getStartedBtn = document.getElementById('getStartedBtn');

  const loginModal = document.getElementById('loginModal');
  const registerModal = document.getElementById('registerModal');
  const resetPasswordModal = document.getElementById('resetPasswordModal');

  const loginClose = document.getElementById('loginClose');
  const registerClose = document.getElementById('registerClose');
  const resetClose = document.getElementById('resetClose');

  const backToTopBtn = document.getElementById("backToTop");

  // MODAL OPEN/CLOSE LOGIC
  loginBtn?.addEventListener('click', () => loginModal.style.display = 'block');
  registerBtn?.addEventListener('click', () => registerModal.style.display = 'block');
  getStartedBtn?.addEventListener('click', () => registerModal.style.display = 'block');

  loginClose?.addEventListener('click', () => loginModal.style.display = 'none');
  registerClose?.addEventListener('click', () => registerModal.style.display = 'none');
  resetClose?.addEventListener('click', () => resetPasswordModal.style.display = 'none');

  window.addEventListener('click', e => {
    if (e.target === loginModal) loginModal.style.display = 'none';
    if (e.target === registerModal) registerModal.style.display = 'none';
    if (e.target === resetPasswordModal) resetPasswordModal.style.display = 'none';
  });

  // SWITCH MODALS
  document.getElementById('switchToRegister')?.addEventListener('click', e => {
    e.preventDefault();
    loginModal.style.display = 'none';
    registerModal.style.display = 'block';
  });

  // From Reset Password Modal to Login
document.getElementById('switchToLoginFromReset')?.addEventListener('click', e => {
  e.preventDefault();
  resetPasswordModal.style.display = 'none';
  loginModal.style.display = 'block';
});

  document.getElementById('switchToLogin')?.addEventListener('click', e => {
    e.preventDefault();
    registerModal.style.display = 'none';
    loginModal.style.display = 'block';
  });

  document.getElementById('switchToReset')?.addEventListener('click', e => {
    e.preventDefault();
    loginModal.style.display = 'none';
    resetPasswordModal.style.display = 'block';
  });

  // BACK TO TOP BUTTON
  window.addEventListener("scroll", () => {
    if (window.scrollY > 300) {
      backToTopBtn.style.display = "block";
    } else {
      backToTopBtn.style.display = "none";
    }
  });

  backToTopBtn?.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  // SCROLL REVEAL
  const revealElements = document.querySelectorAll('.scroll-reveal');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      entry.target.classList.toggle('revealed', entry.isIntersecting);
    });
  }, { threshold: 0.1 });

  revealElements.forEach(el => observer.observe(el));

  // REGISTER LOGIC
  const registerSubmitBtn = document.getElementById("registerSubmitBtn");
  registerSubmitBtn?.addEventListener("click", async () => {
    const fullName = document.getElementById("fullName").value.trim();
    const email = document.getElementById("registerEmail").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const password = document.getElementById("registerPassword").value;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9]{8,15}$/;

    if (!fullName || !email || !password || !phone) {
      return showAlert("⚠️ Please fill in all fields.");
    }
    if (!emailRegex.test(email)) {
      return showAlert("❌ Please enter a valid email address.");
    }
    if (!phoneRegex.test(phone)) {
      return showAlert("❌ Please enter a valid phone number (8–15 digits).");
    }
    if (password.length < 5) {
      return showAlert("❌ Password must be at least 5 characters.");
    }

    const userData = { username: fullName, email, password, phone };

    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.msg || data.error);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      registerModal.style.display = "none";
      window.location.href = "dashboard.html";
    } catch (err) {
      console.error("Register Error:", err);
      showAlert("❌ " + err.message);
    }
  });

  // LOGIN LOGIC
  const loginSubmitBtn = document.getElementById("loginSubmitBtn");
  loginSubmitBtn?.addEventListener("click", login);

  const loginForm = document.getElementById('loginForm');
  loginForm?.addEventListener('submit', e => {
    e.preventDefault();
    login();
  });

  async function login() {
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.msg || data.error);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      loginModal.style.display = "none";
      setTimeout(() => (window.location.href = "dashboard.html"), 200);
    } catch (err) {
      console.error("Login Error:", err);
      showAlert("❌ " + err.message);
    }
  }
  //RESET PASS LOGIC 
  document.getElementById('resetSubmitBtn').addEventListener('click', async function () {
  const email = document.getElementById('resetEmail').value;

  if (!email) {
    showAlert('Please enter your email.');
    return;
  }

  try {
const response = await fetch(`${API_URL}/api/auth/request-password-reset`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ email })
});

    const result = await response.json();

    if (response.ok) {
      showAlert('Reset link sent. Go check your email. Or your spam folder, probably.');
    } else {
      showAlert(result.message || 'Something went wrong. It usually does.');
    }
  } catch (err) {
    console.error('Error:', err);
    showAlert('Network error. Are you even online?');
  }
});

  // TICKER FETCHING
  const symbols = [
  'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT',
  'DOGEUSDT', 'TONUSDT', 'ADAUSDT', 'AVAXUSDT', 'SHIBUSDT',
  'DOTUSDT', 'TRXUSDT', 'LINKUSDT', 'MATICUSDT', 'WIFUSDT',
  'WBTCUSDT', 'ICPUSDT', 'UNIUSDT', 'LTCUSDT', 'NEARUSDT',
  'BCHUSDT', 'PEPEUSDT', 'LEOUSDT', 'DAIUSDT', 'STETHUSDT',
  'APTUSDT', 'ETCUSDT', 'CROUSDT', 'MNTUSDT', 'RNDRUSDT',
  'FDUSDUSDT', 'OKBUSDT', 'ARBUSDT', 'IMXUSDT', 'STXUSDT',
  'HBARUSDT', 'TIAUSDT', 'MKRUSDT', 'TAOUSDT', 'VETUSDT',
  'INJUSDT', 'XLMUSDT', 'WUSDT', 'GRTUSDT', 'LDOUSDT',
  'FRAXUSDT', 'OPUSDT', 'XMRUSDT', 'FTMUSDT', 'BSVUSDT',
  'RUNEUSDT', 'USDDUSDT', 'ENSUSDT', 'SEIUSDT', 'SANDUSDT',
  'AAVEUSDT', 'EGLDUSDT', 'THETAUSDT', 'FLOWUSDT', 'AXSUSDT',
  'XTZUSDT', 'QNTUSDT', 'BITUSDT', 'GALAUSDT', 'NEOUSDT',
  'KASUSDT', 'ORDIUSDT', 'EOSUSDT', 'FETUSDT', 'KCSUSDT',
  'USDPUSDT', 'ZECUSDT', 'TUSDUSDT', 'PAXGUSDT', 'IOTAUSDT',
  'CHZUSDT', 'XAUTUSDT', 'BTTCUSDT', 'SNXUSDT', 'BATUSDT',
  'GTUSDT', 'KAVAUSDT', 'CRVUSDT', 'MINAUSDT', 'SUIUSDT',
  'APEUSDT', 'LUNCUSDT', 'CSPRUSDT', 'DYDXUSDT', 'GUSDUSDT',
  'NXMUSDT', 'COMPUSDT', 'ASTRUSDT', 'ZILUSDT', '1INCHUSDT',
  'FLRUSDT', 'ANKRUSDT', 'GMXUSDT', 'JASMYUSDT', 'WAXPUSDT'
];

  function fetchPrices() {
    fetch('https://api.binance.com/api/v3/ticker/24hr')
      .then(res => res.json())
      .then(data => {
        const prices = {};
        data.forEach(item => {
          if (symbols.includes(item.symbol)) {
            const price = parseFloat(item.lastPrice).toFixed(2);
            const change = parseFloat(item.priceChangePercent).toFixed(2);
            prices[item.symbol] = { price, change };
          }
        });
        updateTicker('ticker-row-top', prices);
      })
      .catch(err => console.error(err));
  }

  function updateTicker(id, prices) {
    const row = document.getElementById(id);
    row.innerHTML = '';
    symbols.forEach(symbol => {
      const { price, change } = prices[symbol] || {};
      const colorClass = change >= 0 ? 'green' : 'red';
      const item = document.createElement('div');
      item.className = 'ticker-item';
      item.innerHTML = `${symbol.replace('USDT', '')} $${price} <span class="${colorClass}">(${change}%)</span>`;
      row.appendChild(item);
    });
  }

  fetchPrices();
  setInterval(fetchPrices, 5000);
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
  
}


