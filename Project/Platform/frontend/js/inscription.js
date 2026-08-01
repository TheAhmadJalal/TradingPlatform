/* =====================================================================
   inscription.js — public signup / lead capture form
   ---------------------------------------------------------------------
   Posts to POST {API_URL}/api/leads, which stores a Lead the CRM picks up
   under its Leads tab. On success it shows the thank-you message, then
   sends the visitor to merci.html.
   ===================================================================== */

(function () {
  "use strict";

  var REDIRECT_TO = "merci.html";
  var REDIRECT_DELAY = 1600; // let the visitor read the thank-you first

  // Deliberately permissive: international numbers vary a lot, and this is
  // a lead form — a human will call the number anyway. The server applies
  // the same rule (routes/leads.js).
  var PHONE_RE = /^\+?[0-9\s().-]{8,25}$/;
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function init() {
    var form = document.getElementById("leadForm");
    if (!form) return;

    var submitBtn = document.getElementById("submitLead");
    var formError = document.getElementById("formError");
    var success = document.getElementById("formSuccess");

    var fields = {
      fullName: document.getElementById("fullName"),
      email: document.getElementById("email"),
      phone: document.getElementById("phone")
    };

    function errorEl(name) {
      return document.querySelector('[data-error-for="' + name + '"]');
    }

    function setError(name, key) {
      var input = fields[name];
      var el = errorEl(name);
      if (key) {
        input.classList.add("is-invalid");
        input.setAttribute("aria-invalid", "true");
        el.textContent = tr(key);
        el.dataset.i18n = key; // so it re-translates on a language switch
      } else {
        input.classList.remove("is-invalid");
        input.removeAttribute("aria-invalid");
        el.textContent = "";
        delete el.dataset.i18n;
        el.removeAttribute("data-i18n");
      }
    }

    function validate() {
      var ok = true;

      if (fields.fullName.value.trim().length < 2) {
        setError("fullName", "reg.errName");
        ok = false;
      } else {
        setError("fullName", null);
      }

      if (!EMAIL_RE.test(fields.email.value.trim())) {
        setError("email", "reg.errEmail");
        ok = false;
      } else {
        setError("email", null);
      }

      if (!PHONE_RE.test(fields.phone.value.trim())) {
        setError("phone", "reg.errPhone");
        ok = false;
      } else {
        setError("phone", null);
      }

      return ok;
    }

    // Clear a field's error as soon as the visitor starts correcting it
    Object.keys(fields).forEach(function (name) {
      fields[name].addEventListener("input", function () {
        if (fields[name].classList.contains("is-invalid")) setError(name, null);
        formError.textContent = "";
      });
    });

    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      formError.textContent = "";

      if (!validate()) {
        var firstBad = form.querySelector(".is-invalid");
        if (firstBad) firstBad.focus();
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = tr("reg.submitting");

      try {
        var res = await fetch(API_URL + "/api/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName: fields.fullName.value.trim(),
            email: fields.email.value.trim(),
            phone: fields.phone.value.trim(),
            website: document.getElementById("website").value, // honeypot
            language: typeof getLang === "function" ? getLang() : "fr",
            source: "website"
          })
        });

        var data = {};
        try {
          data = await res.json();
        } catch (parseErr) {
          /* empty or non-JSON body — handled by the !res.ok branch below */
        }

        if (!res.ok || !data.success) {
          throw new Error(data.msg || tr("reg.errGeneric"));
        }

        // Show the thank-you, then move to the confirmation page.
        form.hidden = true;
        success.hidden = false;
        success.scrollIntoView({ behavior: "smooth", block: "center" });

        setTimeout(function () {
          window.location.href = REDIRECT_TO;
        }, REDIRECT_DELAY);
      } catch (err) {
        console.error("Lead submit failed:", err);
        // TypeError from fetch means the request never reached the server
        formError.textContent =
          err instanceof TypeError ? tr("reg.errNetwork") : err.message;
        submitBtn.disabled = false;
        submitBtn.textContent = tr("reg.submit");
      }
    });

    // Keep the button label right if the language is switched mid-form
    if (typeof onLangChange === "function") {
      onLangChange(function () {
        if (!submitBtn.disabled) submitBtn.textContent = tr("reg.submit");
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
