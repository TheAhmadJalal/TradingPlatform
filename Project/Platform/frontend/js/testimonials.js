/* =====================================================================
   testimonials.js — renders the client testimonial cards
   ---------------------------------------------------------------------
   Drop a container anywhere and it fills itself from js/testimonials-data.js:

     <div class="testi-grid" data-testimonials></div>

   Used by both testimonials.html and the home page, so the two stay in
   sync automatically. Requires (in this order):

     js/i18n.js  →  js/i18n-pages.js  →  js/testimonials-data.js  →  this

   PHOTOS
   Each avatar is declared without a file extension. This script tries the
   usual extensions in turn; the first that loads wins. If none exist the
   <img> is dropped and the initials circle underneath shows through, so
   the page still looks finished before any photo has been added.
   Files go in assets/testimonials/ as testimonial-1 … testimonial-10.
   ===================================================================== */

(function () {
  "use strict";

  var EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".avif"];
  var PHOTO_PATH = "assets/testimonials/testimonial-";

  // ── photo loading with extension fallback ──────────────────────────
  function attachPhoto(img) {
    var base = img.dataset.base;
    if (!base) return;

    var i = 0;

    function tryNext() {
      if (i >= EXTENSIONS.length) {
        img.remove(); // no photo available — keep the initials placeholder
        return;
      }
      img.src = base + EXTENSIONS[i++];
    }

    img.addEventListener("error", tryNext);
    img.addEventListener("load", function () {
      img.classList.add("is-loaded");
    });

    tryNext();
  }

  // ── card construction ──────────────────────────────────────────────
  function buildCard(t) {
    var card = document.createElement("article");
    card.className = "testi-card";

    var head = document.createElement("div");
    head.className = "testi-head";

    var avatar = document.createElement("div");
    avatar.className = "t-avatar";

    var initials = document.createElement("span");
    initials.className = "t-initials";
    initials.setAttribute("aria-hidden", "true");
    initials.textContent = t.initials;

    var photo = document.createElement("img");
    photo.className = "t-photo";
    photo.dataset.base = PHOTO_PATH + t.n;
    photo.alt = t.name;

    avatar.appendChild(initials);
    avatar.appendChild(photo);

    var meta = document.createElement("div");
    meta.className = "t-meta";

    var name = document.createElement("div");
    name.className = "t-name";
    name.textContent = t.name;

    var role = document.createElement("div");
    role.className = "t-role";
    role.setAttribute("data-i18n", "tm." + t.n + "role");

    meta.appendChild(name);
    meta.appendChild(role);
    head.appendChild(avatar);
    head.appendChild(meta);

    var stars = document.createElement("div");
    stars.className = "t-stars";
    stars.setAttribute("aria-hidden", "true");
    stars.textContent = "★★★★★";

    var quote = document.createElement("blockquote");
    quote.setAttribute("data-i18n", "tm." + t.n + "quote");

    var gain = document.createElement("div");
    gain.className = "t-gain";

    var gainLabel = document.createElement("span");
    gainLabel.className = "t-gain-label";
    gainLabel.setAttribute("data-i18n", "tm.gainLabel");

    var gainValue = document.createElement("span");
    gainValue.className = "t-gain-value";
    gainValue.setAttribute("data-i18n", "tm." + t.n + "gain");

    gain.appendChild(gainLabel);
    gain.appendChild(gainValue);

    card.appendChild(head);
    card.appendChild(stars);
    card.appendChild(quote);
    card.appendChild(gain);

    return card;
  }

  function render() {
    var containers = document.querySelectorAll("[data-testimonials]");
    if (!containers.length) return;

    var list = window.TESTIMONIALS || [];

    containers.forEach(function (container) {
      // "data-testimonials=3" renders only the first three
      var limit = parseInt(container.dataset.testimonials, 10);
      var items = isNaN(limit) ? list : list.slice(0, limit);

      var frag = document.createDocumentFragment();
      items.forEach(function (t) {
        frag.appendChild(buildCard(t));
      });

      container.replaceChildren(frag);
    });

    // The cards carry data-i18n attributes but were created after i18n.js
    // ran, so translate them now. Later language switches are picked up
    // automatically because the elements stay in the DOM.
    if (typeof window.applyI18n === "function") window.applyI18n();

    document.querySelectorAll(".t-photo[data-base]").forEach(attachPhoto);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", render);
  } else {
    render();
  }
})();
