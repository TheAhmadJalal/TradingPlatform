/* =====================================================================
   settings.js — CRM account settings
   ---------------------------------------------------------------------
   Change your own password, and (admins only) create further operators.

   Both forms previously just showed an alert saying the action had
   succeeded without calling anything. They now talk to
   /crm-api/auth/change-password and /crm-api/auth/users. The token is
   attached automatically by js/auth.js.
   ===================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  // ── dark mode (unchanged behaviour) ────────────────────────────────
  const darkButton = document.getElementById("darkModeButton");
  if (darkButton) {
    if (localStorage.getItem("crm-dark-mode") === "true") {
      document.body.classList.add("dark-mode");
      darkButton.textContent = "Disable Dark Mode";
    }
    darkButton.addEventListener("click", () => {
      const isDark = document.body.classList.toggle("dark-mode");
      darkButton.textContent = isDark ? "Disable Dark Mode" : "Enable Dark Mode";
      localStorage.setItem("crm-dark-mode", isDark);
    });
  }

  const me = (window.CrmAuth && CrmAuth.getUser()) || {};

  const whoami = document.getElementById("whoami");
  if (whoami) {
    whoami.textContent = me.email
      ? `Signed in as ${me.name || me.email} (${me.email}) — ${me.role || "agent"}.`
      : "Signed in.";
  }

  /** Shows an inline result under a form instead of a browser alert. */
  function setStatus(el, message, kind) {
    el.textContent = message;
    el.className = "form-status" + (kind ? " is-" + kind : "");
  }

  async function postJson(path, body) {
    const res = await fetch(API_URL + path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    let data = {};
    try {
      data = await res.json();
    } catch (e) {
      /* non-JSON body — describeFailure() turns it into something readable */
    }
    return { res, data };
  }

  /**
   * Produce a message the operator can act on.
   *
   * Without this, any response that isn't JSON (a 404 HTML page, a proxy
   * error) collapsed into a vague "could not do it" — which is exactly what
   * happened when the backend was still running without the newer routes.
   */
  function describeFailure(res, data, fallback) {
    if (data && data.message) return data.message;

    if (res.status === 404) {
      return (
        "This endpoint is missing on the server (404). The CRM backend is " +
        "probably running an older build — restart it and try again."
      );
    }
    if (res.status === 502 || res.status === 503 || res.status === 504) {
      return "The CRM backend is not responding (HTTP " + res.status + ").";
    }
    return fallback + " (HTTP " + res.status + ")";
  }

  // ═══ CHANGE PASSWORD ══════════════════════════════════════════════
  const passwordForm = document.getElementById("passwordForm");
  const pwStatus = document.getElementById("pwStatus");
  const pwSubmit = document.getElementById("pwSubmit");

  passwordForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const currentEl = document.getElementById("currentPassword");
    const newEl = document.getElementById("newPassword");
    const confirmEl = document.getElementById("confirmPassword");

    const current = currentEl.value;
    const newPass = newEl.value;
    const confirm = confirmEl.value;

    if (!current || !newPass || !confirm) {
      return setStatus(pwStatus, "Please fill in all three fields.", "error");
    }
    if (newPass !== confirm) {
      return setStatus(pwStatus, "The new passwords do not match.", "error");
    }
    if (newPass.length < 8) {
      return setStatus(pwStatus, "The new password must be at least 8 characters.", "error");
    }
    if (newPass === current) {
      return setStatus(pwStatus, "The new password must differ from the current one.", "error");
    }

    pwSubmit.disabled = true;
    pwSubmit.textContent = "Updating…";
    setStatus(pwStatus, "", null);

    try {
      const { res, data } = await postJson("/crm-api/auth/change-password", {
        currentPassword: current,
        newPassword: newPass
      });

      if (!res.ok || !data.success) {
        throw new Error(describeFailure(res, data, "Could not update the password."));
      }

      // The server issues a fresh token so this change doesn't sign us out.
      if (data.token) CrmAuth.save(data.token, me);

      passwordForm.reset();
      setStatus(pwStatus, "Password updated. Use it the next time you sign in.", "ok");
    } catch (err) {
      console.error("Password change failed:", err);
      setStatus(
        pwStatus,
        err instanceof TypeError ? "Cannot reach the server. Please try again." : err.message,
        "error"
      );
    } finally {
      pwSubmit.disabled = false;
      pwSubmit.textContent = "Update Password";
    }
  });

  // ═══ ADMIN: CREATE OPERATOR + LIST ════════════════════════════════
  if (me.role !== "admin") return; // section stays hidden; API enforces it too

  document.getElementById("adminOnly").hidden = false;

  const createForm = document.getElementById("createUserForm");
  const userStatus = document.getElementById("userStatus");
  const userSubmit = document.getElementById("userSubmit");
  const operatorList = document.getElementById("operatorList");

  const esc = (s) =>
    String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));

  async function loadOperators() {
    try {
      const res = await fetch(API_URL + "/crm-api/auth/users");
      let data = {};
      try {
        data = await res.json();
      } catch (e) {
        /* non-JSON — handled below */
      }
      if (!res.ok || !data.success) {
        throw new Error(describeFailure(res, data, "Could not load the operator list."));
      }

      operatorList.innerHTML = data.users
        .map((u) => {
          const last = u.lastLoginAt
            ? new Date(u.lastLoginAt).toLocaleString()
            : "never signed in";
          return `<div class="operator-row">
                    <div>
                      <strong>${esc(u.name)}</strong>
                      <span class="operator-email">${esc(u.email)}</span>
                    </div>
                    <div class="operator-meta">
                      <span class="operator-role">${esc(u.role)}</span>
                      <span>${esc(last)}</span>
                    </div>
                  </div>`;
        })
        .join("");
    } catch (err) {
      operatorList.textContent =
        err instanceof TypeError ? "Cannot reach the server." : err.message;
    }
  }

  createForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("newUsername").value.trim();
    const email = document.getElementById("newEmail").value.trim();
    const password = document.getElementById("newUserPassword").value;
    const role = document.getElementById("newUserRole").value;

    if (!name || !email || !password) {
      return setStatus(userStatus, "Please fill in all fields.", "error");
    }
    if (password.length < 8) {
      return setStatus(userStatus, "The password must be at least 8 characters.", "error");
    }

    userSubmit.disabled = true;
    userSubmit.textContent = "Creating…";
    setStatus(userStatus, "", null);

    try {
      const { res, data } = await postJson("/crm-api/auth/users", {
        name, email, password, role
      });

      if (!res.ok || !data.success) {
        throw new Error(describeFailure(res, data, "Could not create the operator."));
      }

      createForm.reset();
      setStatus(userStatus, `Operator "${data.user.name}" created (${data.user.role}).`, "ok");
      loadOperators();
    } catch (err) {
      console.error("Create operator failed:", err);
      setStatus(
        userStatus,
        err instanceof TypeError ? "Cannot reach the server. Please try again." : err.message,
        "error"
      );
    } finally {
      userSubmit.disabled = false;
      userSubmit.textContent = "Create Operator";
    }
  });

  loadOperators();
});
