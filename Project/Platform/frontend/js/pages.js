(function () {
  "use strict";

  function init() {
    // ── mobile menu ──────────────────────────────────────────────
    var menuToggle = document.getElementById("menuToggle");
    var navLinks = document.getElementById("navLinks");
    var authButtons = document.getElementById("authButtons");

    if (menuToggle) {
      menuToggle.addEventListener("click", function () {
        if (navLinks) navLinks.classList.toggle("show");
        if (authButtons) authButtons.classList.toggle("show");
      });
    }

    // ── back to top ──────────────────────────────────────────────
    var backToTop = document.getElementById("backToTop");
    if (backToTop) {
      window.addEventListener("scroll", function () {
        backToTop.style.display = window.scrollY > 300 ? "flex" : "none";
      });

      backToTop.addEventListener("click", function () {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
