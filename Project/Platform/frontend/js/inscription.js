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
  var DOB_RE = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/;

  var MIN_AGE = 18;
  var MAX_AGE = 100;

  /**
   * Parses "09.11.1973" into a UTC Date, or null if it is not a real date.
   * Mirrors parseDateOfBirth() in backend/routes/leads.js — the server
   * re-checks everything, this is only for instant feedback.
   */
  function parseDob(value) {
    var m = String(value || "").trim().match(DOB_RE);
    if (!m) return null;

    var d = Number(m[1]);
    var mo = Number(m[2]);
    var y = Number(m[3]);
    var date = new Date(Date.UTC(y, mo - 1, d));

    // Rejects 31.02.1990 and friends, which JS would roll into March
    if (
      date.getUTCFullYear() !== y ||
      date.getUTCMonth() !== mo - 1 ||
      date.getUTCDate() !== d
    ) {
      return null;
    }
    return date;
  }

  function ageFromDob(dob) {
    var now = new Date();
    var age = now.getUTCFullYear() - dob.getUTCFullYear();
    var monthDiff = now.getUTCMonth() - dob.getUTCMonth();
    if (monthDiff < 0 || (monthDiff === 0 && now.getUTCDate() < dob.getUTCDate())) {
      age -= 1;
    }
    return age;
  }

  /** Date exactly `years` ago — used for the calendar's allowed range. */
  function yearsAgo(years) {
    var d = new Date();
    d.setFullYear(d.getFullYear() - years);
    return d;
  }

  function init() {
    var form = document.getElementById("leadForm");
    if (!form) return;

    var submitBtn = document.getElementById("submitLead");
    var formError = document.getElementById("formError");
    var success = document.getElementById("formSuccess");

    var fields = {
      fullName: document.getElementById("fullName"),
      email: document.getElementById("email"),
      phone: document.getElementById("phone"),
      dob: document.getElementById("dob")
    };

    // ── date-of-birth calendar ───────────────────────────────────────
    // flatpickr comes from a CDN. If it is blocked the field stays a plain
    // text input and DD.MM.YYYY can still be typed by hand — the form must
    // never become unusable because a third-party script failed.
    var picker = null;

    function buildPicker() {
      if (typeof window.flatpickr !== "function") return;
      if (picker) {
        picker.destroy();
        picker = null;
      }

      var lang = typeof getLang === "function" ? getLang() : "en";

      picker = window.flatpickr(fields.dob, {
        dateFormat: "d.m.Y",
        allowInput: true,          // typing is still allowed
        disableMobile: true,       // use our themed calendar, not the OS one
        monthSelectorType: "dropdown",
        minDate: yearsAgo(MAX_AGE),
        maxDate: yearsAgo(MIN_AGE), // under-18s simply cannot be selected
        defaultDate: fields.dob.value || null,
        locale: lang === "fr" ? "fr" : "default",
        onChange: function () {
          setError("dob", null);
        }
      });
    }

    buildPicker();

    // Rebuild on language switch so month/day names follow the site language
    if (typeof onLangChange === "function") {
      onLangChange(buildPicker);
    }

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

      var dobRaw = fields.dob.value.trim();
      var dob = parseDob(dobRaw);
      if (!dobRaw) {
        setError("dob", "reg.errDobRequired");
        ok = false;
      } else if (!dob) {
        setError("dob", "reg.errDob");
        ok = false;
      } else if (ageFromDob(dob) < MIN_AGE) {
        setError("dob", "reg.errDobUnder");
        ok = false;
      } else if (ageFromDob(dob) > MAX_AGE) {
        setError("dob", "reg.errDobRange");
        ok = false;
      } else {
        setError("dob", null);
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
            dateOfBirth: fields.dob.value.trim(),
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
