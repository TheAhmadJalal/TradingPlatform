const API_BASE    = `${API_URL}/api/trading`;
const user        = JSON.parse(localStorage.getItem('user') || '{}');

let positions     = [];
let closedTrades  = [];
let balance       = 0;
let currentPrice  = {};
let currentSymbol = 'BTCUSDT';
let socket;


function initTradingView(symbol) {
  document.getElementById('tv_chart_container').innerHTML = '';
  new TradingView.widget({
    container_id: 'tv_chart_container',
    width: '100%',
    height: 390,
    symbol: `BINANCE:${symbol}`,
    interval: '1',
    timezone: 'Etc/UTC',
    theme: 'Dark',
    style: '1',
    toolbar_bg: '#f1f3f6',
    withdateranges: true,
    hide_side_toolbar: false,
    allow_symbol_change: false,
    save_image: false,
    studies: [],
    overrides: {},
    studies_overrides: {},
    custom_css_url: '',
  });
}


async function loadDashboard() {
  const token = localStorage.getItem('token');
  if (!user.id || !token) return;

  try {
    const res = await fetch(`${API_BASE}/dashboard`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    if (!res.ok) throw new Error(res.statusText);
    const data = await res.json();

    balance      = data.balance   || 0;
    positions    = data.positions || [];
    closedTrades = data.history   || [];

    renderPositions();
    renderHistory();
    updateAccountSummary(data);
  } catch (err) {
    console.error('Dashboard load failed:', err);
    showAlert(tr('trade.loadFailed'));
  }
}

function updateAccountSummary(data) {
  let usedMargin = 0;
  let unrealisedPnL = 0;

  positions.forEach(t => {
    usedMargin += t.size / t.leverage;
    const current = currentPrice[t.instrument] || t.entry;
    const diff    = t.type === 'buy'
                  ? current - t.entry
                  : t.entry - current;
    const pnl = diff * 100 * (t.size / t.entry) * t.leverage;
    unrealisedPnL += pnl;
  });

  const realisedPnL = closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);

  const equity     = balance + unrealisedPnL;
  const freeMargin = equity - usedMargin;
  const pnlTotal   = realisedPnL + unrealisedPnL;

  document.getElementById('balance').textContent    = balance.toFixed(2);
  document.getElementById('equity').textContent     = equity.toFixed(2);
  document.getElementById('usedMargin').textContent = usedMargin.toFixed(2);
  document.getElementById('freeMargin').textContent = freeMargin.toFixed(2);
  document.getElementById('pnlTotal').textContent   = pnlTotal.toFixed(2);
}

function connectWebSocket(symbol) {
  if (socket) socket.close();
  socket = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@trade`);

  socket.onmessage = ({ data }) => {
    const tick = JSON.parse(data);
    currentPrice[symbol] = parseFloat(tick.p);
    document.getElementById('currentPriceDisplay').textContent = 
      `$${currentPrice[symbol].toFixed(2)}`;

    renderPositions();
    updateAccountSummary();
  };

  socket.onerror = e => console.error('WebSocket error', e);
  socket.onclose = () => console.log('WebSocket closed');
}

async function placeTrade(type) {
  const token = localStorage.getItem('token');
  if (!user.id || !token) return;

  const size = parseFloat(document.getElementById('tradeSize').value);
  const slRaw = document.getElementById('stopLoss').value;
  const tpRaw = document.getElementById('takeProfit').value;
  const lev = parseFloat(document.getElementById('leverageSelect').value);
  const entry = currentPrice[currentSymbol];

  const sl = slRaw.trim() === '' ? undefined : parseFloat(slRaw);
  const tp = tpRaw.trim() === '' ? undefined : parseFloat(tpRaw);

  if (!size || !entry) {
    return showAlert(tr('trade.enterSize'));
  }

  try {
    const res = await fetch(`${API_BASE}/place`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        instrument: currentSymbol,
        type: type.toLowerCase(),
        size,
        entry,
        sl,
        tp,
        leverage: lev
      })
    });

    if (!res.ok) throw await res.json();
    const { balance: newBal } = await res.json();
    balance = newBal;

    loadDashboard();
    initTradingView(currentSymbol);
    showAlert(tr('trade.placed'));
  } catch (err) {
    console.error('Place failed:', err);
    const msg =
      err.errors?.map(e => `${e.path}: ${e.msg}`).join(', ') ||
      err.msg || err.error || tr('trade.unknownError');
    showAlert(tr('trade.failed', { msg }));
  }
}


async function closeTrade(id) {
  const token = localStorage.getItem('token');
  if (!user.id || !token) return;

  try {
    const res = await fetch(`${API_BASE}/close`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        tradeId: id,
        closePrice: currentPrice[currentSymbol]
      })
    });
    if (!res.ok) throw await res.json();
    const { balance: newBal } = await res.json();
    balance = newBal;

    loadDashboard();
    showAlert(tr('trade.closed'));
  } catch (err) {
    console.error('Close failed:', err);
    showAlert(tr('trade.closeFailed', { msg: err.msg || err.error || err }));
  }
}

// "buy"/"sell" translated; anything else is shown as-is
function tradeTypeLabel(type) {
  const key   = `trade.type.${type}`;
  const label = tr(key);
  return label === key ? type : label;
}

function renderPositions() {
  document.getElementById('positions-cards').innerHTML =
    positions.map(t => {
      const current = currentPrice[t.instrument] || t.entry;
      const pnl     = calculatePnL(t);
      return `
        <div class="trade-card">
          <div><strong>${t.instrument}</strong> (${tradeTypeLabel(t.type)})</div>
          <div>${tr('trade.cardSize',    { v: t.size.toFixed(2) })}</div>
          <div>${tr('trade.cardEntry',   { v: t.entry.toFixed(2) })}</div>
          <div>${tr('trade.cardCurrent', { v: current.toFixed(2) })}</div>
          <div>${tr('trade.cardPnl',     { v: `${pnl>=0?'+':''}${pnl.toFixed(2)}` })}</div>
          <button onclick="closeTrade('${t._id}')">${tr('trade.close')}</button>
        </div>`;
    }).join('');
}

function renderHistory() {
  document.getElementById('history-cards').innerHTML =
    closedTrades.map(t => {
      const exitP = typeof t.close === 'number' ? t.close : t.entry;
      return `
        <div class="trade-card">
          <div><strong>${t.instrument}</strong> (${tradeTypeLabel(t.type)})</div>
          <div>${tr('trade.cardEntry', { v: t.entry.toFixed(2) })}</div>
          <div>${tr('trade.cardExit',  { v: exitP.toFixed(2) })}</div>
          <div>${tr('trade.cardPnl',   { v: `${t.pnl>=0?'+':''}${t.pnl.toFixed(2)}` })}</div>
          <div>${tr('trade.cardTime',  { v: new Date(t.closeTime).toLocaleString(getLang()) })}</div>
        </div>`;
    }).join('');
}

// Re-render the cards (they are built in JS) when the language changes
onLangChange(() => {
  renderPositions();
  renderHistory();
});

function calculatePnL(trade) {
  const current = currentPrice[trade.instrument] || trade.entry;
  const diff    = trade.type === 'buy'
                ? current - trade.entry
                : trade.entry - current;
  return +((diff * 100 * (trade.size / trade.entry) * trade.leverage).toFixed(2));
}

function switchAsset() {
  const sel = document.getElementById('instrumentSelect');
  currentSymbol = sel.value;
  connectWebSocket(currentSymbol);
  initTradingView(currentSymbol);
}

window.addEventListener('DOMContentLoaded', () => {
  ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT',
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
].forEach(sym => {
    const o = document.createElement('option');
    o.value = o.text = sym;
    document.getElementById('instrumentSelect').append(o);
  });
  document.getElementById('instrumentSelect').addEventListener('change', switchAsset);

  switchAsset();
  loadDashboard();
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