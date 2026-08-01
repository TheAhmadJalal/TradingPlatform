/* =====================================================================
   testimonials-data.js — the single list of client testimonials
   ---------------------------------------------------------------------
   Both the home page and testimonials.html render from this array, so the
   two can never drift apart.

   Only the bits that are NOT translated live here (name, initials, photo
   number). The role, quote and gain are i18n keys — tm.<n>role,
   tm.<n>quote and tm.<n>gain — defined under BOTH "en" and "fr" in
   js/i18n-pages.js.

   TO ADD A TESTIMONIAL
     1. add a row below with the next number
     2. add tm.<n>role / tm.<n>quote / tm.<n>gain to js/i18n-pages.js (en + fr)
     3. drop assets/testimonials/testimonial-<n>.jpg (optional — falls back
        to the initials avatar)
   ===================================================================== */

var TESTIMONIALS = [
  { n: 1,  name: "Sophie D.",       initials: "SD" },
  { n: 2,  name: "Marc L.",         initials: "ML" },
  { n: 3,  name: "Isabelle M.",     initials: "IM" },
  { n: 4,  name: "Jean-Pierre R.",  initials: "JR" },
  { n: 5,  name: "Claire V.",       initials: "CV" },
  { n: 6,  name: "Thomas B.",       initials: "TB" },
  { n: 7,  name: "Nathalie G.",     initials: "NG" },
  { n: 8,  name: "Philippe C.",     initials: "PC" },
  { n: 9,  name: "Carine T.",       initials: "CT" },
  { n: 10, name: "Alain S.",        initials: "AS" }
];

window.TESTIMONIALS = TESTIMONIALS;
