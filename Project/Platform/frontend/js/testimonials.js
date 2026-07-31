(function () {
  "use strict";

  var EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".avif"];

  function attach(img) {
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

  function init() {
    document.querySelectorAll(".t-photo[data-base]").forEach(attach);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
