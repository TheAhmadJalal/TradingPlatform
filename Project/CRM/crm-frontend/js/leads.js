/* =====================================================================
   leads.js — CRM leads list
   Reads the leads created by the public signup form on the platform
   (Platform/backend/routes/leads.js → POST /api/leads).
   ===================================================================== */

document.addEventListener("DOMContentLoaded", async () => {
  // ── dark mode (same behaviour as the other CRM pages) ──────────────
  const darkButton = document.getElementById("darkModeButton");
  if (darkButton) {
    if (localStorage.getItem("crm-dark-mode") === "true") {
      document.body.classList.add("dark-mode");
      darkButton.textContent = "Disable Dark Mode";
    }
    darkButton.addEventListener("click", () => {
      const isDark = document.body.classList.toggle("dark-mode");
      localStorage.setItem("crm-dark-mode", isDark);
      darkButton.textContent = isDark ? "Disable Dark Mode" : "Enable Dark Mode";
    });
  }

  const tableBody = document.getElementById("leadsTableBody");
  const searchInput = document.getElementById("leadSearch");
  const statusFilter = document.getElementById("statusFilter");
  const refreshBtn = document.getElementById("refreshLeads");
  const summaryEl = document.getElementById("leadSummary");

  const STATUSES = ["new", "contacted", "converted", "rejected"];
  let allLeads = [];

  const esc = (s) =>
    String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));

  // ── data ───────────────────────────────────────────────────────────
  async function loadLeads() {
    tableBody.innerHTML = "<tr><td colspan='8'>Loading leads…</td></tr>";
    try {
      const res = await fetch(`${API_URL}/crm-api/leads`);
      if (!res.ok) throw new Error(res.statusText);
      const data = await res.json();
      allLeads = Array.isArray(data) ? data : [];
      renderSummary(allLeads);
      applyFilters();
    } catch (err) {
      console.error("Failed to load leads", err);
      tableBody.innerHTML = "<tr><td colspan='8'>Error loading leads.</td></tr>";
    }
  }

  // ── rendering ──────────────────────────────────────────────────────
  function renderSummary(list) {
    const counts = { total: list.length, new: 0, contacted: 0, converted: 0, rejected: 0 };
    list.forEach((l) => {
      if (counts[l.status] !== undefined) counts[l.status]++;
    });

    const tile = (label, value) =>
      `<div class="lead-tile">
         <span class="lead-tile-value">${value}</span>
         <span class="lead-tile-label">${label}</span>
       </div>`;

    summaryEl.innerHTML =
      tile("Total", counts.total) +
      tile("New", counts.new) +
      tile("Contacted", counts.contacted) +
      tile("Converted", counts.converted) +
      tile("Rejected", counts.rejected);
  }

  function renderLeads(list) {
    tableBody.innerHTML = "";

    if (!list.length) {
      tableBody.innerHTML = "<tr><td colspan='8'>No leads found.</td></tr>";
      return;
    }

    list.forEach((lead) => {
      const row = document.createElement("tr");
      const received = lead.createdAt ? new Date(lead.createdAt).toLocaleString() : "—";
      const repeat =
        lead.submissions > 1
          ? `<span class="lead-repeat" title="Submitted the form ${lead.submissions} times">×${lead.submissions}</span>`
          : "";

      const options = STATUSES.map(
        (s) =>
          `<option value="${s}"${s === lead.status ? " selected" : ""}>${
            s.charAt(0).toUpperCase() + s.slice(1)
          }</option>`
      ).join("");

      row.innerHTML = `
        <td>${esc(received)}</td>
        <td>${esc(lead.fullName)}${repeat}</td>
        <td class="lead-email"><a href="mailto:${esc(lead.email)}">${esc(lead.email)}</a></td>
        <td class="lead-phone"><a href="tel:${esc(lead.phone)}">${esc(lead.phone)}</a></td>
        <td>${esc((lead.language || "").toUpperCase())}</td>
        <td>${esc(lead.source || "website")}</td>
        <td>
          <select class="lead-status" data-id="${lead._id}" data-status="${esc(lead.status)}">
            ${options}
          </select>
        </td>
        <td>
          <textarea class="lead-notes" rows="2" data-id="${lead._id}"
                    placeholder="Follow-up notes…">${esc(lead.notes || "")}</textarea>
        </td>
      `;

      tableBody.appendChild(row);
    });
  }

  function applyFilters() {
    const q = searchInput.value.trim().toLowerCase();
    const status = statusFilter.value;

    const filtered = allLeads.filter((l) => {
      if (status && l.status !== status) return false;
      if (!q) return true;
      return [l.fullName, l.email, l.phone, l.source, l.notes]
        .some((v) => String(v || "").toLowerCase().includes(q));
    });

    renderLeads(filtered);
  }

  // ── updates ────────────────────────────────────────────────────────
  async function patchLead(id, body, el) {
    try {
      const res = await fetch(`${API_URL}/crm-api/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.message || "Update failed");

      // keep the local copy in step so filters/search stay accurate
      const local = allLeads.find((l) => l._id === id);
      if (local) Object.assign(local, body);
      renderSummary(allLeads);

      if (el) {
        const flag = document.createElement("span");
        flag.className = "lead-saved";
        flag.textContent = "saved";
        el.insertAdjacentElement("afterend", flag);
        setTimeout(() => flag.remove(), 1500);
      }
    } catch (err) {
      console.error("Lead update failed:", err);
      alert("Could not update the lead. Please try again.");
      loadLeads();
    }
  }

  tableBody.addEventListener("change", (e) => {
    if (e.target.classList.contains("lead-status")) {
      const el = e.target;
      el.dataset.status = el.value;           // repaint the pill colour
      patchLead(el.dataset.id, { status: el.value }, el);
    }
  });

  // Save notes when the operator leaves the field, not on every keystroke
  tableBody.addEventListener("focusout", (e) => {
    if (!e.target.classList.contains("lead-notes")) return;
    const el = e.target;
    const local = allLeads.find((l) => l._id === el.dataset.id);
    if (local && (local.notes || "") === el.value) return;   // unchanged
    patchLead(el.dataset.id, { notes: el.value }, el);
  });

  searchInput.addEventListener("input", applyFilters);
  statusFilter.addEventListener("change", applyFilters);
  refreshBtn.addEventListener("click", loadLeads);

  await loadLeads();
});
