/* =====================================================================
   login.js — CRM sign-in
   Posts to /crm-api/auth/login, stores the session via CrmAuth, then
   sends the operator to the page they were trying to reach (or the
   dashboard).
   ===================================================================== */

document.addEventListener("DOMContentLoaded", function () {
  var form = document.getElementById("loginForm");
  var emailEl = document.getElementById("email");
  var passEl = document.getElementById("password");
  var btn = document.getElementById("loginBtn");
  var errorEl = document.getElementById("loginError");
  var noticeEl = document.getElementById("loginNotice");
  var pwToggle = document.getElementById("pwToggle");

  var params = new URLSearchParams(location.search);
  var next = params.get("next");
  var reason = params.get("reason");

  // Only allow returning to a local CRM page — never an absolute URL.
  var SAFE_NEXT = /^[a-z0-9-]+\.html$/i;
  var destination = next && SAFE_NEXT.test(next) && !/^login\.html$/i.test(next)
    ? next
    : "dashboard.html";

  if (reason === "expired") {
    noticeEl.textContent = "Your session expired. Please sign in again.";
    noticeEl.hidden = false;
  }

  // Already signed in? Skip straight through.
  if (window.CrmAuth && CrmAuth.getToken()) {
    location.replace(destination);
    return;
  }

  pwToggle.addEventListener("click", function () {
    var showing = passEl.type === "text";
    passEl.type = showing ? "password" : "text";
    pwToggle.textContent = showing ? "Show" : "Hide";
    pwToggle.setAttribute("aria-label", showing ? "Show password" : "Hide password");
    passEl.focus();
  });

  [emailEl, passEl].forEach(function (el) {
    el.addEventListener("input", function () {
      errorEl.textContent = "";
    });
  });

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    errorEl.textContent = "";

    var email = emailEl.value.trim();
    var password = passEl.value;

    if (!email || !password) {
      errorEl.textContent = "Please enter your email and password.";
      return;
    }

    btn.disabled = true;
    btn.textContent = "Signing in…";

    try {
      var res = await fetch(API_URL + "/crm-api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email, password: password })
      });

      var data = {};
      try {
        data = await res.json();
      } catch (parseErr) {
        /* handled below */
      }

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Sign in failed. Please try again.");
      }

      CrmAuth.save(data.token, data.user);
      location.replace(destination);
    } catch (err) {
      console.error("CRM login failed:", err);
      errorEl.textContent =
        err instanceof TypeError
          ? "Cannot reach the server. Check your connection and try again."
          : err.message;
      btn.disabled = false;
      btn.textContent = "Sign in";
      passEl.value = "";
      passEl.focus();
    }
  });
});
