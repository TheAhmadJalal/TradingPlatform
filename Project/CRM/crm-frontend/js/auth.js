/* =====================================================================
   auth.js — CRM session guard
   ---------------------------------------------------------------------
   Include this on EVERY CRM page, immediately after js/config.js and
   before the page's own script:

     <script src="js/config.js"></script>
     <script src="js/auth.js"></script>
     <script src="js/clients.js"></script>

   It does three things:
     1. Redirects to login.html if there is no stored session.
     2. Wraps window.fetch so every CRM API call carries the bearer token —
        which is why the existing page scripts needed no changes.
     3. Signs the operator out on any 401 from the API (expired session,
        deactivated account, revoked token).
   ===================================================================== */

(function () {
  "use strict";

  var TOKEN_KEY = "crm-token";
  var USER_KEY = "crm-user";
  var LOGIN_PAGE = "login.html";

  // ── session storage ────────────────────────────────────────────────
  var CrmAuth = {
    getToken: function () {
      try {
        return localStorage.getItem(TOKEN_KEY);
      } catch (e) {
        return null;
      }
    },

    getUser: function () {
      try {
        return JSON.parse(localStorage.getItem(USER_KEY) || "null");
      } catch (e) {
        return null;
      }
    },

    save: function (token, user) {
      try {
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(USER_KEY, JSON.stringify(user || {}));
      } catch (e) {
        console.warn("Could not persist the CRM session:", e);
      }
    },

    clear: function () {
      try {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      } catch (e) {
        /* ignore */
      }
    },

    /** Sign out and return to the login page, remembering where we were. */
    logout: function (reason) {
      CrmAuth.clear();
      var here = location.pathname.split("/").pop() || "dashboard.html";
      var qs = "?next=" + encodeURIComponent(here);
      if (reason) qs += "&reason=" + encodeURIComponent(reason);
      location.replace(LOGIN_PAGE + qs);
    }
  };

  window.CrmAuth = CrmAuth;

  var onLoginPage = /login\.html$/i.test(location.pathname);

  // ── fetch wrapper: attach the token, catch 401s ────────────────────
  var nativeFetch = window.fetch.bind(window);

  window.fetch = function (input, init) {
    var url = typeof input === "string" ? input : (input && input.url) || "";
    var isCrmApi = /\/(crm-api|api)\//.test(url);
    var token = CrmAuth.getToken();

    if (isCrmApi && token) {
      init = init || {};
      var headers = new Headers(init.headers || (typeof input === "object" && input.headers) || {});
      if (!headers.has("Authorization")) headers.set("Authorization", "Bearer " + token);
      init = Object.assign({}, init, { headers: headers });
    }

    return nativeFetch(input, init).then(function (res) {
      // Never bounce off the login page itself — it needs to show the error.
      if (res.status === 401 && isCrmApi && !onLoginPage) {
        CrmAuth.logout("expired");
      }
      return res;
    });
  };

  // ── guard: no token means no CRM ───────────────────────────────────
  if (!onLoginPage && !CrmAuth.getToken()) {
    CrmAuth.logout();
    return;
  }

  // ── sidebar: signed-in operator + sign-out button ──────────────────
  // Styles are injected here rather than added to each page's stylesheet,
  // so every CRM page picks them up from this one file.
  var SESSION_CSS =
    ".crm-session{margin-top:auto;padding-top:18px;border-top:1px solid rgba(255,255,255,.14)}" +
    ".crm-session-user{font-size:13px;font-weight:600;color:#fff;word-break:break-word}" +
    ".crm-session-role{font-size:11px;text-transform:uppercase;letter-spacing:.08em;" +
    "color:#9aa4ae;margin-top:2px}" +
    ".crm-logout{margin-top:12px;width:100%;padding:9px 12px;border:1px solid rgba(255,255,255,.28);" +
    "border-radius:8px;background:transparent;color:#e0e0e0;font-size:13px;font-weight:600;" +
    "cursor:pointer;transition:background .2s,color .2s}" +
    ".crm-logout:hover{background:#fff;color:#111}" +
    "body.dark-mode .crm-logout{border-color:#444}" +
    "body.dark-mode .crm-logout:hover{background:#eee;color:#111}";

  function injectCss() {
    if (document.getElementById("crm-session-css")) return;
    var style = document.createElement("style");
    style.id = "crm-session-css";
    style.textContent = SESSION_CSS;
    document.head.appendChild(style);
  }

  function decorateSidebar() {
    var sidebar = document.querySelector(".sidebar");
    if (!sidebar || onLoginPage || sidebar.querySelector(".crm-session")) return;

    injectCss();
    var user = CrmAuth.getUser() || {};

    var box = document.createElement("div");
    box.className = "crm-session";

    var who = document.createElement("div");
    who.className = "crm-session-user";
    who.textContent = user.name || user.email || "Signed in";

    var role = document.createElement("div");
    role.className = "crm-session-role";
    role.textContent = user.role || "";

    var out = document.createElement("button");
    out.type = "button";
    out.className = "crm-logout";
    out.textContent = "Sign out";
    out.addEventListener("click", function () {
      CrmAuth.clear();
      location.replace(LOGIN_PAGE);
    });

    box.appendChild(who);
    if (user.role) box.appendChild(role);
    box.appendChild(out);
    sidebar.appendChild(box);
  }

  if (!onLoginPage) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", decorateSidebar);
    } else {
      decorateSidebar();
    }

    // Confirm with the server that the stored token is still good. A token
    // can be valid-looking but belong to a deactivated account.
    nativeFetch(API_URL + "/crm-api/auth/me", {
      headers: { Authorization: "Bearer " + CrmAuth.getToken() }
    })
      .then(function (res) {
        if (res.status === 401) {
          CrmAuth.logout("expired");
          return null;
        }
        return res.json();
      })
      .then(function (data) {
        if (data && data.success && data.user) {
          CrmAuth.save(CrmAuth.getToken(), data.user); // refresh cached name/role
        }
      })
      .catch(function () {
        /* offline — let the page try to load with the stored token */
      });
  }
})();
